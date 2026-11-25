// Warung Senja — HUD, order tickets, toasts and overlays.
// One clear job: everything drawn on top of the kitchen.

import { DISH_BY_ID } from './recipes.js';
import { drawIngredient } from './food.js';

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function drawHUD(ctx, state) {
  ctx.fillStyle = '#1d130d';
  ctx.fillRect(0, 0, 1280, 58);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(0, 58, 1280, 3);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
  ctx.fillText('WARUNG SENJA', 16, 26);
  ctx.fillStyle = '#c9a98c';
  ctx.font = '12px "Trebuchet MS", sans-serif';
  ctx.fillText('Twilight Wok Rush', 16, 46);
  // Shift timer, centre
  const low = state.shiftLeft <= 30 && state.screen === 'playing';
  ctx.textAlign = 'center';
  ctx.fillStyle = low && Math.floor(state.time * 2) % 2 === 0 ? '#ff5a3c' : '#f4e8d8';
  ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
  ctx.fillText(`⏱ ${fmtTime(state.shiftLeft)}`, 640, 34);
  ctx.fillStyle = '#c9a98c';
  ctx.font = '12px "Trebuchet MS", sans-serif';
  ctx.fillText(state.rush ? 'DINNER RUSH!' : 'SHIFT BERJALAN', 640, 52);
  // Coins + target
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
  ctx.fillText(`🪙 ${state.coins}`, 1050, 28);
  ctx.fillStyle = '#c9a98c';
  ctx.font = '12px "Trebuchet MS", sans-serif';
  ctx.fillText(`target ${state.target}`, 1050, 44);
  // Target progress bar
  const frac = Math.min(1, state.coins / state.target);
  ctx.fillStyle = '#3a2a22';
  ctx.fillRect(880, 48, 170, 8);
  ctx.fillStyle = '#7fb069';
  ctx.fillRect(880, 48, 170 * frac, 8);
  // Hearts
  ctx.font = '20px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < state.hearts ? '#ef476f' : '#4a3430';
    ctx.fillText('♥', 1080 + i * 26, 30);
  }
  // Combo
  if (state.combo >= 2) {
    ctx.fillStyle = '#ff9f1c';
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`COMBO x${(1 + 0.25 * Math.min(state.combo, 4)).toFixed(2).replace(/\.?0+$/, '')}`, 1264, 28);
  }
  if (state.sfx.muted) {
    ctx.fillStyle = '#c9a98c';
    ctx.font = '13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('🔇 bisu (M)', 1264, 48);
  }
}

export function drawTickets(ctx, state) {
  const y = 66;
  const h = 96;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8d9c0';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.fillText('PAPAN PESANAN', 16, y - 6);
  if (state.orders.length === 0) {
    ctx.fillStyle = '#c9a98c';
    ctx.font = '14px "Trebuchet MS", sans-serif';
    ctx.fillText('Belum ada pesanan — pelanggan segera datang…', 200, y + 44);
    return;
  }
  state.orders.forEach((order, i) => {
    const x = 16 + i * 308;
    const dish = DISH_BY_ID[order.dishId];
    const frac = Math.max(0, order.patience / order.patienceMax);
    const urgent = frac < 0.3;
    ctx.fillStyle = urgent && Math.floor(state.time * 3) % 2 === 0 ? '#5a2320' : '#f7ead0';
    ctx.beginPath();
    ctx.roundRect(x, y, 296, h, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#ff5a3c' : '#c9b18c';
    ctx.lineWidth = urgent ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(x, y, 296, h, 10);
    ctx.stroke();
    ctx.fillStyle = '#241a15';
    ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
    ctx.fillText(`#${order.id} ${dish.name}`, x + 12, y + 24);
    ctx.fillStyle = '#b8860b';
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
    ctx.fillText(`${dish.price} koin`, x + 284, y + 24);
    ctx.textAlign = 'left';
    dish.needs.forEach((need, j) => {
      drawIngredient(ctx, need, x + 28 + j * 44, y + 52, 34);
    });
    // Patience bar
    ctx.fillStyle = '#d8c9a8';
    ctx.fillRect(x + 12, y + h - 16, 272, 8);
    ctx.fillStyle = frac > 0.5 ? '#7fb069' : frac > 0.3 ? '#ff9f1c' : '#ff5a3c';
    ctx.fillRect(x + 12, y + h - 16, 272 * frac, 8);
    ctx.fillStyle = '#7a6a55';
    ctx.font = '11px "Trebuchet MS", sans-serif';
    ctx.fillText(`${Math.ceil(order.patience)} dtk`, x + 12, y + h - 22);
  });
}

export function drawToasts(ctx, state) {
  ctx.textAlign = 'center';
  state.toasts.forEach((toast, i) => {
    const alpha = Math.min(1, toast.life < 0.3 ? toast.life / 0.3 : (toast.max - toast.life) / 0.5);
    const y = 706 - i * 26;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
    const w = ctx.measureText(toast.text).width + 24;
    ctx.fillStyle = toast.kind === 'bad' ? 'rgba(120,30,20,0.92)'
      : toast.kind === 'good' ? 'rgba(30,90,50,0.92)' : 'rgba(30,25,20,0.92)';
    ctx.beginPath();
    ctx.roundRect(640 - w / 2, y - 18, w, 24, 12);
    ctx.fill();
    ctx.fillStyle = toast.kind === 'bad' ? '#ffb3a3' : toast.kind === 'good' ? '#b8f0c0' : '#f4e8d8';
    ctx.fillText(toast.text, 640, y);
    ctx.globalAlpha = 1;
  });
}

function overlayPanel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(20, 12, 8, 0.72)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#2e2118';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.stroke();
}

export function drawTitle(ctx, state) {
  overlayPanel(ctx, 290, 120, 700, 470);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 46px "Trebuchet MS", sans-serif';
  ctx.fillText('WARUNG SENJA', 640, 190);
  ctx.fillStyle = '#f4e8d8';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  ctx.fillText('Twilight Wok Rush', 640, 222);
  ctx.fillStyle = '#c9a98c';
  ctx.font = '16px "Trebuchet MS", sans-serif';
  ctx.fillText('Jalankan warung kaki lima melewati dinner rush 3 menit.', 640, 262);
  ctx.fillText('Ambil bahan, masak di wok & panggangan, rakit di piring,', 640, 288);
  ctx.fillText('lalu antar sebelum pelanggan kehabisan sabar.', 640, 314);
  ctx.fillStyle = '#f4e8d8';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.fillText('Klik stasiun untuk memasak  •  1–8 ambil bahan  •  Spasi antar pesanan', 640, 360);
  ctx.fillText('Q / W wok  •  E panggangan  •  P jeda  •  M suara', 640, 386);
  ctx.fillStyle = '#7ee081';
  ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
  ctx.fillText(`Target: ${state.target} koin dalam 3 menit — jangan sampai 3 pelanggan pergi!`, 640, 430);
  const blink = Math.floor(state.time * 1.6) % 2 === 0;
  if (blink) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
    ctx.fillText('▶  KLIK UNTUK MULAI SHIFT', 640, 500);
  }
  if (state.bestCoins > 0) {
    ctx.fillStyle = '#c9a98c';
    ctx.font = '14px "Trebuchet MS", sans-serif';
    ctx.fillText(`Rekor shift ini: ${state.bestCoins} koin`, 640, 540);
  }
}

export function drawResults(ctx, state) {
  const r = state.result;
  overlayPanel(ctx, 330, 110, 620, 500);
  ctx.textAlign = 'center';
  ctx.fillStyle = r.won ? '#7ee081' : '#ff9f8a';
  ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
  ctx.fillText(r.won ? 'SHIFT SELESAI — WARUNG TUTUP!' : 'WARUNG KEWALAHAN…', 640, 180);
  ctx.font = '44px "Trebuchet MS", sans-serif';
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < r.stars ? '#ffd166' : '#4a3430';
    ctx.fillText('★', 560 + i * 80, 250);
  }
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
  ctx.fillText(`🪙 ${r.coins} koin  (target ${state.target})`, 640, 310);
  ctx.fillStyle = '#f4e8d8';
  ctx.font = '17px "Trebuchet MS", sans-serif';
  ctx.fillText(`Pesanan tersaji: ${r.served}   •   Hangus: ${r.expired}   •   Combo terbaik: x${r.bestCombo}`, 640, 352);
  ctx.fillText(r.won
    ? 'Pelanggan pulang kenyang — warungmu laris malam ini!'
    : 'Terlalu banyak pelanggan pergi — coba lagi, atur rutenya!', 640, 390);
  const blink = Math.floor(state.time * 1.6) % 2 === 0;
  if (blink) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.fillText('▶  KLIK / TEKAN R UNTUK MAIN LAGI', 640, 470);
  }
  ctx.fillStyle = '#c9a98c';
  ctx.font = '14px "Trebuchet MS", sans-serif';
  ctx.fillText('Warung Senja — Twilight Wok Rush', 640, 560);
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20, 12, 8, 0.6)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 40px "Trebuchet MS", sans-serif';
  ctx.fillText('JEDA  —  P untuk lanjut', 640, 360);
}
