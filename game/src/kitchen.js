// Warung Senja — the kitchen: stations, their layout, interactions and
// drawing. One clear job: the room the cook works in and what each station
// does when the cook reaches it.

import {
  INGREDIENTS, INGREDIENT_BY_ID, COOKED_ID, DISHES,
  displayName, dishForPlate,
} from './recipes.js';
import { drawIngredient, drawPlateDisc } from './food.js';
import { servePlate } from './orders.js';

export const LAYOUT = {
  bins: INGREDIENTS.map((ing, i) => ({
    id: ing.id, x: 16 + i * 156, y: 190, w: 148, h: 96,
  })),
  wok1: { x: 16, y: 306, w: 280, h: 142 },
  wok2: { x: 312, y: 306, w: 280, h: 142 },
  grill: { x: 608, y: 306, w: 280, h: 142 },
  trash: { x: 904, y: 306, w: 136, h: 142 },
  menu: { x: 1056, y: 306, w: 208, h: 142 },
  plates: [0, 1, 2].map((i) => ({ x: 40 + i * 260, y: 458, w: 240, h: 142 })),
  pass: { x: 860, y: 458, w: 404, h: 142 },
  floorY: 652,
};

function rectContains(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function stationAt(x, y) {
  for (const bin of LAYOUT.bins) {
    if (rectContains(bin, x, y)) return { type: 'bin', id: bin.id, rect: bin };
  }
  if (rectContains(LAYOUT.wok1, x, y)) return { type: 'wok', index: 0, rect: LAYOUT.wok1 };
  if (rectContains(LAYOUT.wok2, x, y)) return { type: 'wok', index: 1, rect: LAYOUT.wok2 };
  if (rectContains(LAYOUT.grill, x, y)) return { type: 'grill', rect: LAYOUT.grill };
  if (rectContains(LAYOUT.trash, x, y)) return { type: 'trash', rect: LAYOUT.trash };
  for (let i = 0; i < LAYOUT.plates.length; i++) {
    if (rectContains(LAYOUT.plates[i], x, y)) return { type: 'plate', index: i, rect: LAYOUT.plates[i] };
  }
  if (rectContains(LAYOUT.pass, x, y)) return { type: 'pass', rect: LAYOUT.pass };
  return null;
}

function stationCenterX(station) {
  return station.rect.x + station.rect.w / 2;
}

export function approachX(station) {
  return Math.max(60, Math.min(1220, stationCenterX(station)));
}

// ---- cooking stations ------------------------------------------------

function cookStation(state, st, kind) {
  const ing = INGREDIENT_BY_ID[st.item];
  if (!st.item) {
    const carry = state.carry;
    if (!carry || carry.kind !== 'raw') {
      state.toast(kind === 'wok'
        ? 'Wok butuh bahan mentah: nasi, telur, atau mie'
        : 'Panggangan butuh ayam mentah', 'bad');
      state.sfx.error();
      return;
    }
    const def = INGREDIENT_BY_ID[carry.id];
    if (def.cook !== kind) {
      state.toast(kind === 'wok'
        ? `${def.name} tidak dimasak di wok`
        : `${def.name} tidak dipanggang di sini`, 'bad');
      state.sfx.error();
      return;
    }
    st.item = carry.id;
    st.t = 0;
    st.dur = def.cookTime;
    st.done = false;
    st.burnt = false;
    st.burnT = 0;
    state.carry = null;
    state.sfx.cookStart();
    return;
  }
  if (!st.done) {
    state.toast(`Masih dimasak… ${Math.ceil(st.dur - st.t)} dtk lagi`, 'info');
    return;
  }
  if (state.carry) {
    state.toast('Tangan penuh — kosongkan dulu', 'bad');
    state.sfx.error();
    return;
  }
  if (st.burnt) {
    state.carry = { kind: 'burnt', id: st.item };
    state.toast('Gosong! Buang ke tempat sampah', 'bad');
  } else {
    state.carry = { kind: 'cooked', id: COOKED_ID[st.item] };
    state.sfx.pickup();
  }
  st.item = null;
  st.t = 0;
  st.done = false;
  st.burnt = false;
  st.burnT = 0;
}

export function updateCooking(state, dt) {
  const stations = [...state.woks, state.grill];
  for (const st of stations) {
    if (!st.item) continue;
    st.t += dt;
    if (!st.done && st.t >= st.dur) {
      st.done = true;
      st.burnT = 0;
      state.sfx.done();
      state.toast(`${displayName(st.item)} matang!`, 'good');
    } else if (st.done && !st.burnt) {
      st.burnT += dt;
      if (st.burnT > 4) {
        st.burnt = true;
        state.toast(`${displayName(st.item)} gosong di atas api!`, 'bad');
        state.sfx.error();
      }
    }
  }
  state.steamTimer -= dt;
  if (state.steamTimer <= 0) {
    state.steamTimer = 0.28;
    for (const st of stations) {
      if (!st.item) continue;
      const rect = st === state.grill ? LAYOUT.grill
        : st === state.woks[0] ? LAYOUT.wok1 : LAYOUT.wok2;
      state.particles.steam(rect.x + rect.w / 2, rect.y + 52);
    }
  }
}

// ---- interaction -----------------------------------------------------

function plateAction(state, index) {
  const plate = state.plates[index];
  const carry = state.carry;
  if (carry && carry.kind === 'plate') {
    state.toast('Sudah membawa piring — antar dulu', 'bad');
    state.sfx.error();
    return;
  }
  if (carry && (carry.kind === 'raw' || carry.kind === 'cooked')) {
    if (carry.kind === 'burnt') {
      state.toast('Makanan gosong tidak bisa disajikan', 'bad');
      state.sfx.error();
      return;
    }
    if (carry.kind === 'raw') {
      const def = INGREDIENT_BY_ID[carry.id];
      if (def.cook) {
        state.toast(`${def.name} harus dimasak dulu!`, 'bad');
        state.sfx.error();
        return;
      }
    }
    if (plate.items.length >= 4) {
      state.toast('Piring sudah penuh', 'bad');
      state.sfx.error();
      return;
    }
    plate.items.push(carry.id);
    state.carry = null;
    state.sfx.chop();
    const dish = dishForPlate(plate.items);
    if (dish) state.toast(`${dish.name} lengkap — antar ke meja saji!`, 'good');
    return;
  }
  if (carry && carry.kind === 'burnt') {
    state.toast('Makanan gosong tidak bisa disajikan', 'bad');
    state.sfx.error();
    return;
  }
  if (!carry) {
    if (plate.items.length === 0) {
      state.toast('Piring kosong — isi dulu', 'info');
      return;
    }
    plate.held = true;
    state.carry = { kind: 'plate', index };
    state.sfx.pickup();
  }
}

function passAction(state) {
  const carry = state.carry;
  if (!carry) {
    state.toast('Ambil piring yang sudah lengkap, lalu antar ke sini', 'info');
    return;
  }
  if (carry.kind !== 'plate') {
    state.toast('Yang diantar itu piring, bukan bahan mentah', 'bad');
    state.sfx.error();
    return;
  }
  const plate = state.plates[carry.index];
  const result = servePlate(state, plate.items);
  plate.items = [];
  plate.held = false;
  state.carry = null;
  state.passFlash = 1;
  state.sfx.serve();
  state.sfx.coin();
  state.particles.sparkle(LAYOUT.pass.x + LAYOUT.pass.w / 2, LAYOUT.pass.y + 60);
  state.toast(result.text, result.matched ? 'good' : 'info');
  if (state.coins >= state.target && state.screen === 'playing') {
    state.toast(`Target ${state.target} koin tercapai!`, 'good');
  }
}

function trashAction(state) {
  const carry = state.carry;
  if (!carry) {
    state.toast('Tidak ada yang dibuang', 'info');
    return;
  }
  if (carry.kind === 'plate') {
    const plate = state.plates[carry.index];
    plate.items = [];
    plate.held = false;
    state.toast('Piring dikosongkan', 'info');
  } else {
    state.toast(`${displayName(carry.id)} dibuang`, 'info');
  }
  state.carry = null;
  state.sfx.chop();
}

export function interact(state, station) {
  if (!station) return;
  switch (station.type) {
    case 'bin': {
      if (state.carry) {
        state.toast('Tangan penuh — selesaikan dulu yang dibawa', 'bad');
        state.sfx.error();
        return;
      }
      state.carry = { kind: 'raw', id: station.id };
      state.sfx.pickup();
      break;
    }
    case 'wok': cookStation(state, state.woks[station.index], 'wok'); break;
    case 'grill': cookStation(state, state.grill, 'grill'); break;
    case 'plate': plateAction(state, station.index); break;
    case 'pass': passAction(state); break;
    case 'trash': trashAction(state); break;
    default: break;
  }
}

// Serve the best complete plate without carrying it (Space / S key).
export function serveBestPlate(state) {
  let best = -1;
  for (let i = 0; i < state.plates.length; i++) {
    const dish = dishForPlate(state.plates[i].items);
    if (!dish) continue;
    if (state.orders.some((o) => o.dishId === dish.id)) { best = i; break; }
    if (best < 0) best = i;
  }
  if (best < 0) {
    state.toast('Belum ada piring lengkap untuk diantar', 'info');
    return;
  }
  const plate = state.plates[best];
  const result = servePlate(state, plate.items);
  plate.items = [];
  plate.held = false;
  if (state.carry && state.carry.kind === 'plate' && state.carry.index === best) state.carry = null;
  state.passFlash = 1;
  state.sfx.serve();
  state.sfx.coin();
  state.particles.sparkle(LAYOUT.pass.x + LAYOUT.pass.w / 2, LAYOUT.pass.y + 60);
  state.toast(result.text, result.matched ? 'good' : 'info');
}

// ---- drawing ----------------------------------------------------------

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCounterTop(ctx, x, y, w, h) {
  ctx.fillStyle = '#7a4a2b';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#a06a3f';
  roundRect(ctx, x, y, w, 12, 6);
  ctx.fill();
}

function drawBin(ctx, bin, highlight) {
  const ing = INGREDIENT_BY_ID[bin.id];
  ctx.fillStyle = highlight ? '#3d2b1f' : '#2e2118';
  roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 10);
  ctx.fill();
  ctx.strokeStyle = highlight ? '#ffd166' : '#5a4030';
  ctx.lineWidth = highlight ? 3 : 2;
  roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 10);
  ctx.stroke();
  drawIngredient(ctx, bin.id, bin.x + bin.w / 2, bin.y + 34, 44);
  ctx.fillStyle = '#f4e8d8';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ing.name, bin.x + bin.w / 2, bin.y + 74);
  ctx.fillStyle = '#c9a98c';
  ctx.font = '11px "Trebuchet MS", sans-serif';
  ctx.fillText(ing.cook ? `wok ${ing.cookTime} dtk` : 'langsung', bin.x + bin.w / 2, bin.y + 90);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(bin.x + bin.w - 14, bin.y + 14, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#241a15';
  ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
  ctx.fillText(ing.key, bin.x + bin.w - 14, bin.y + 18);
}

function drawCooker(ctx, rect, st, label, kind) {
  ctx.fillStyle = '#2e2118';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 2;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.stroke();
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + 58;
  if (kind === 'wok') {
    ctx.fillStyle = '#1c1c22';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 62, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#33333d';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 52, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    if (st.item) drawIngredient(ctx, st.done ? COOKED_ID[st.item] : st.item, cx, cy - 4, 40);
  } else {
    ctx.fillStyle = '#3a3a42';
    ctx.fillRect(cx - 62, cy - 22, 124, 44);
    ctx.strokeStyle = '#1c1c22';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - 62, cy - 16 + i * 9);
      ctx.lineTo(cx + 62, cy - 16 + i * 9);
      ctx.stroke();
    }
    if (st.item) {
      drawIngredient(ctx, st.done ? COOKED_ID[st.item] : st.item, cx, cy - 4, 40);
      if (!st.done) {
        ctx.fillStyle = '#ff9f1c';
        for (const fx of [-40, 0, 40]) {
          ctx.beginPath();
          ctx.moveTo(cx + fx - 8, cy + 26);
          ctx.quadraticCurveTo(cx + fx, cy + 6, cx + fx + 8, cy + 26);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }
  if (st.item && !st.done) {
    const frac = Math.min(1, st.t / st.dur);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, 58, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(st.dur - st.t)} dtk`, cx, rect.y + 124);
  } else if (st.item && st.done) {
    ctx.fillStyle = st.burnt ? '#ff5a3c' : '#7ee081';
    ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(st.burnt ? 'GOSONG!' : 'MATANG — AMBIL!', cx, rect.y + 124);
  }
  ctx.fillStyle = '#c9a98c';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, rect.y + 18);
}

function drawPlate(ctx, rect, plate, index) {
  ctx.fillStyle = '#2e2118';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.strokeStyle = plate.held ? '#ffd166' : '#5a4030';
  ctx.lineWidth = plate.held ? 3 : 2;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.stroke();
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + 58;
  drawPlateDisc(ctx, cx, cy, 52);
  const n = plate.items.length;
  plate.items.forEach((id, i) => {
    const off = n === 1 ? 0 : (i - (n - 1) / 2) * 34;
    drawIngredient(ctx, id, cx + off, cy + (i % 2 === 0 ? -6 : 8), 30);
  });
  const dish = dishForPlate(plate.items);
  ctx.fillStyle = dish ? '#7ee081' : '#c9a98c';
  ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    dish ? `✓ ${dish.name}` : (n === 0 ? `Piring ${index + 1} — kosong` : `Piring ${index + 1} — ${n} bahan`),
    cx, rect.y + rect.h - 12,
  );
}

function drawPass(ctx, rect, flash) {
  ctx.fillStyle = flash > 0 ? '#5a3d1e' : '#2e2118';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.strokeStyle = flash > 0 ? '#ffd166' : '#5a4030';
  ctx.lineWidth = flash > 0 ? 3 : 2;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.stroke();
  const cx = rect.x + 90;
  const cy = rect.y + 62;
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(cx, cy, 26, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(cx - 30, cy - 2, 60, 8);
  ctx.fillStyle = '#ff9f1c';
  ctx.beginPath();
  ctx.arc(cx + 32, cy + 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4e8d8';
  ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MEJA SAJI', rect.x + 150, rect.y + 56);
  ctx.fillStyle = '#c9a98c';
  ctx.font = '14px "Trebuchet MS", sans-serif';
  ctx.fillText('Klik piring lengkap, lalu klik lonceng — atau tekan Spasi', rect.x + 150, rect.y + 82);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.fillText('RING THE BELL • SERVE', rect.x + 150, rect.y + 110);
}

function drawMenu(ctx, rect) {
  ctx.fillStyle = '#2e2118';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 2;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MENU', rect.x + 12, rect.y + 20);
  DISHES.forEach((dish, i) => {
    const y = rect.y + 42 + i * 20;
    ctx.fillStyle = '#f4e8d8';
    ctx.font = '12px "Trebuchet MS", sans-serif';
    ctx.fillText(dish.name, rect.x + 12, y);
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'right';
    ctx.fillText(`${dish.price} koin`, rect.x + rect.w - 10, y);
    ctx.textAlign = 'left';
  });
}

export function drawKitchen(ctx, state) {
  const W = 1280;
  const H = 720;
  // Wall + floor
  const wall = ctx.createLinearGradient(0, 0, 0, 180);
  wall.addColorStop(0, '#2f5d50');
  wall.addColorStop(1, '#24443a');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 58, W, 122);
  ctx.fillStyle = '#3a6b5c';
  for (let x = 0; x < W; x += 64) ctx.fillRect(x, 168, 64, 4);
  ctx.fillStyle = '#8a5a34';
  for (let y = 606; y < H; y += 26) {
    for (let x = ((y / 26) % 2) * 40; x < W; x += 80) ctx.fillRect(x, y, 78, 24);
  }
  ctx.fillStyle = '#7a4a2b';
  ctx.fillRect(0, 600, W, 6);

  // Section labels
  ctx.fillStyle = '#e8d9c0';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('BAHAN DI ATAS MEJA', 16, 182);
  ctx.fillText('KOMPOR & PANGGANGAN', 16, 298);
  ctx.fillText('PIRING & SAJI', 16, 450);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#c9a98c';
  ctx.fillText('Klik stasiun — koki berjalan ke sana', 1264, 182);

  // Ingredient bins
  for (const bin of LAYOUT.bins) {
    const hover = state.hover && state.hover.type === 'bin' && state.hover.id === bin.id;
    drawBin(ctx, bin, hover);
  }
  // Cooking row
  drawCooker(ctx, LAYOUT.wok1, state.woks[0], 'WOK 1  (Q)', 'wok');
  drawCooker(ctx, LAYOUT.wok2, state.woks[1], 'WOK 2  (W)', 'wok');
  drawCooker(ctx, LAYOUT.grill, state.grill, 'PANGGANGAN  (E)', 'grill');
  // Trash
  const tr = LAYOUT.trash;
  ctx.fillStyle = '#2e2118';
  roundRect(ctx, tr.x, tr.y, tr.w, tr.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 2;
  roundRect(ctx, tr.x, tr.y, tr.w, tr.h, 10);
  ctx.stroke();
  ctx.fillStyle = '#6b6b72';
  ctx.fillRect(tr.x + 38, tr.y + 42, 60, 52);
  ctx.fillStyle = '#4a4a52';
  ctx.fillRect(tr.x + 30, tr.y + 34, 76, 12);
  ctx.fillStyle = '#c9a98c';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAMPAH', tr.x + tr.w / 2, tr.y + tr.h - 12);
  drawMenu(ctx, LAYOUT.menu);
  // Plates + pass
  state.plates.forEach((plate, i) => drawPlate(ctx, LAYOUT.plates[i], plate, i));
  drawPass(ctx, LAYOUT.pass, state.passFlash);
}
