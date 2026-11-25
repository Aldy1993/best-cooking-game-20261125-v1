// Warung Senja — Twilight Wok Rush: bootstrap, game loop and input.
// One clear job: own the state, run the shift, route keyboard + mouse.

import { makeRng } from './rng.js';
import { INGREDIENTS } from './recipes.js';
import { createSound } from './audio.js';
import { createParticles } from './particles.js';
import { spawnOrder, updateOrders } from './orders.js';
import {
  LAYOUT, stationAt, approachX, interact, serveBestPlate, updateCooking, drawKitchen,
} from './kitchen.js';
import { updateCook, drawCook } from './player.js';
import { drawHUD, drawTickets, drawToasts, drawTitle, drawResults, drawPaused } from './ui.js';
import { applyShot } from './shots.js';

export const SHIFT_SECONDS = 180;
export const TARGET_COINS = 400;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function newCooker() {
  return { item: null, t: 0, dur: 0, done: false, burnt: false, burnT: 0 };
}

function createState(seed) {
  const state = {
    screen: 'title',
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    coins: 0,
    target: TARGET_COINS,
    hearts: 3,
    combo: 0,
    bestCombo: 0,
    served: 0,
    expired: 0,
    bestCoins: 0,
    orders: [],
    orderSeq: 0,
    woks: [newCooker(), newCooker()],
    grill: newCooker(),
    plates: [
      { items: [], held: false },
      { items: [], held: false },
      { items: [], held: false },
    ],
    carry: null,
    cook: { x: 640, targetX: 640, pending: null, moving: false, bob: 0 },
    toasts: [],
    spawnTimer: 2,
    steamTimer: 0,
    rush: false,
    passFlash: 0,
    result: null,
    hover: null,
    rng: makeRng(seed),
    seed,
    sfx: createSound(),
    particles: createParticles(),
    toast(text, kind = 'info') {
      state.toasts.push({ text, kind, life: 0, max: 2.8 });
      if (state.toasts.length > 4) state.toasts.shift();
    },
    endShift(won) {
      if (state.screen !== 'playing') return;
      const stars = state.coins >= 700 ? 3 : state.coins >= 550 ? 2 : state.coins >= state.target ? 1 : 0;
      state.result = {
        won, stars, coins: state.coins,
        served: state.served, expired: state.expired, bestCombo: state.bestCombo,
      };
      state.bestCoins = Math.max(state.bestCoins, state.coins);
      state.screen = 'results';
      if (won) {
        state.sfx.win();
        state.particles.confetti(640, 200);
      } else {
        state.sfx.lose();
      }
    },
  };
  return state;
}

let state = createState(7);

function startShift(seed = 7) {
  const bestCoins = state.bestCoins;
  state = createState(seed);
  state.bestCoins = bestCoins;
  state.screen = 'playing';
  spawnOrder(state);
  state.spawnTimer = 13;
}

function draw() {
  ctx.clearRect(0, 0, 1280, 720);
  drawKitchen(ctx, state);
  drawCook(ctx, state);
  state.particles.draw(ctx);
  drawTickets(ctx, state);
  drawHUD(ctx, state);
  drawToasts(ctx, state);
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'results') drawResults(ctx, state);
  else if (state.screen === 'paused') drawPaused(ctx);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.time += dt;
  state.passFlash = Math.max(0, state.passFlash - dt * 1.5);
  for (let i = state.toasts.length - 1; i >= 0; i--) {
    state.toasts[i].life += dt;
    if (state.toasts[i].life >= state.toasts[i].max) state.toasts.splice(i, 1);
  }
  if (state.screen === 'playing') {
    state.shiftLeft -= dt;
    state.rush = state.shiftLeft <= 60;
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnOrder(state);
      state.spawnTimer = state.rush ? 8.5 : 13;
    }
    updateOrders(state, dt);
    if (state.screen === 'playing') {
      updateCooking(state, dt);
      updateCook(state, dt);
      state.particles.update(dt);
      if (state.shiftLeft <= 0) state.endShift(state.coins >= state.target);
    }
  } else if (state.screen === 'title' || state.screen === 'results') {
    state.particles.update(dt);
  }
  draw();
  requestAnimationFrame(tick);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 1280,
    y: ((event.clientY - rect.top) / rect.height) * 720,
  };
}

canvas.addEventListener('pointerdown', (event) => {
  state.sfx.unlock();
  const { x, y } = canvasPoint(event);
  if (state.screen === 'title') {
    startShift(7);
    return;
  }
  if (state.screen === 'results') {
    startShift(7);
    return;
  }
  if (state.screen === 'paused') {
    state.screen = 'playing';
    return;
  }
  const station = stationAt(x, y);
  if (station) {
    state.cook.targetX = approachX(station);
    state.cook.pending = () => interact(state, station);
  } else {
    state.cook.targetX = Math.max(40, Math.min(1240, x));
    state.cook.pending = null;
  }
});

canvas.addEventListener('pointermove', (event) => {
  const { x, y } = canvasPoint(event);
  state.hover = stationAt(x, y);
});

function binShortcut(index) {
  const ing = INGREDIENTS[index];
  if (!ing) return;
  interact(state, { type: 'bin', id: ing.id });
}

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === 'm') {
    const muted = state.sfx.toggleMute();
    state.toast(muted ? 'Suara dimatikan' : 'Suara dinyalakan', 'info');
    return;
  }
  if (state.screen === 'title' && (key === 'enter' || key === ' ')) {
    startShift(7);
    return;
  }
  if (state.screen === 'results' && (key === 'r' || key === 'enter' || key === ' ')) {
    startShift(7);
    return;
  }
  if (state.screen !== 'playing') return;
  if (key === 'p') {
    state.screen = 'paused';
    return;
  }
  if (key === 'r') {
    startShift(7);
    return;
  }
  if (key === ' ') {
    event.preventDefault();
    serveBestPlate(state);
    return;
  }
  if (key === 's') {
    serveBestPlate(state);
    return;
  }
  if (key === 'q') { interact(state, { type: 'wok', index: 0 }); return; }
  if (key === 'w') { interact(state, { type: 'wok', index: 1 }); return; }
  if (key === 'e') { interact(state, { type: 'grill' }); return; }
  const digit = Number.parseInt(key, 10);
  if (digit >= 1 && digit <= 8) binShortcut(digit - 1);
});

// Screenshot staging (?shot=cover|serve|rush|results&seed=N), as the kit's
// starter does: the same game code renders a fixed state for its screenshots.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const seed = Number.parseInt(params.get('seed') ?? '7', 10) || 7;
  startShift(seed);
  applyShot(state, shot);
  state.time = 12;
}

// Debug hook for automated play-testing: read-only state inspection.
window.__warung = { get state() { return state; }, startShift, version: 'warung-senja-1.0.0' };

requestAnimationFrame(tick);
