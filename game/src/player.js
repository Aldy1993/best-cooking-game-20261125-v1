// Warung Senja — the cook: walks the floor, carries one thing at a time.
// One clear job: movement + carrying + the chef's drawing.

import { LAYOUT } from './kitchen.js';
import { drawIngredient } from './food.js';
import { displayName } from './recipes.js';

const WALK_SPEED = 430;

export function updateCook(state, dt) {
  const cook = state.cook;
  const dx = cook.targetX - cook.x;
  if (Math.abs(dx) > 4) {
    const step = Math.sign(dx) * WALK_SPEED * dt;
    cook.x += Math.abs(step) > Math.abs(dx) ? dx : step;
    cook.moving = true;
    cook.bob += dt * 14;
  } else {
    cook.x = cook.targetX;
    cook.moving = false;
  }
  if (cook.pending && Math.abs(cook.x - cook.targetX) <= 4) {
    const action = cook.pending;
    cook.pending = null;
    action();
  }
}

export function carryLabel(carry) {
  if (!carry) return null;
  if (carry.kind === 'plate') return 'Piring';
  return displayName(carry.id) + (carry.kind === 'burnt' ? ' (gosong)' : '');
}

export function drawCook(ctx, state) {
  const cook = state.cook;
  const x = cook.x;
  const y = LAYOUT.floorY;
  const bob = cook.moving ? Math.sin(cook.bob) * 3 : 0;
  ctx.save();
  ctx.translate(x, y + bob);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 34 - bob, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs
  ctx.fillStyle = '#2b2b33';
  ctx.fillRect(-14, 12, 11, 22);
  ctx.fillRect(3, 12, 11, 22);
  // Body / apron
  ctx.fillStyle = '#f4ede1';
  ctx.beginPath();
  ctx.moveTo(-20, -14);
  ctx.quadraticCurveTo(0, -20, 20, -14);
  ctx.lineTo(16, 14);
  ctx.lineTo(-16, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3f7d6b';
  ctx.fillRect(-16, -2, 32, 16);
  // Arms
  ctx.strokeStyle = '#f4ede1';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-16, -8);
  ctx.lineTo(-26, 6);
  ctx.moveTo(16, -8);
  ctx.lineTo(26, 6);
  ctx.stroke();
  // Head
  ctx.fillStyle = '#f2c48d';
  ctx.beginPath();
  ctx.arc(0, -28, 15, 0, Math.PI * 2);
  ctx.fill();
  // Toque
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-8, -40, 9, 0, Math.PI * 2);
  ctx.arc(0, -44, 10, 0, Math.PI * 2);
  ctx.arc(8, -40, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-15, -42, 30, 6);
  // Face
  ctx.fillStyle = '#241a15';
  ctx.beginPath();
  ctx.arc(-5, -29, 1.8, 0, Math.PI * 2);
  ctx.arc(5, -29, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#241a15';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -24, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Carried item above the head
  if (state.carry) {
    const label = carryLabel(state.carry);
    if (state.carry.kind === 'plate') {
      const plate = state.plates[state.carry.index];
      ctx.fillStyle = '#f4ede1';
      ctx.beginPath();
      ctx.ellipse(0, -58, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      plate.items.forEach((id, i) => {
        drawIngredient(ctx, id, (i - (plate.items.length - 1) / 2) * 16, -64, 18);
      });
    } else {
      drawIngredient(ctx, state.carry.id, 0, -60, 34);
      if (state.carry.kind === 'burnt') {
        ctx.fillStyle = '#ff5a3c';
        ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GOSONG', 0, -82);
      }
    }
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, -96);
  }
  ctx.restore();
}
