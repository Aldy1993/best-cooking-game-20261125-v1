// Warung Senja — food icons, all drawn in code with canvas paths.
// One clear job: drawIngredient(ctx, id, x, y, size) draws any ingredient
// or cooked item centred at (x, y). No image files anywhere in the game.

function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawRice(ctx, x, y, s, cooked) {
  ellipse(ctx, x, y + s * 0.16, s * 0.42, s * 0.26, cooked ? '#f2c14e' : '#fdf6e3');
  ellipse(ctx, x - s * 0.1, y - s * 0.05, s * 0.3, s * 0.22, cooked ? '#f7cd6a' : '#fffdf4');
  ctx.fillStyle = cooked ? '#d98e2b' : '#d9c9a3';
  for (const [dx, dy] of [[-0.2, 0.1], [0.05, -0.12], [0.22, 0.08], [-0.02, 0.2]]) {
    circle(ctx, x + dx * s, y + dy * s, s * 0.035, cooked ? '#b96a1b' : '#c9b183');
  }
  if (cooked) {
    ctx.fillStyle = '#e2572b';
    for (const [dx, dy] of [[-0.15, -0.05], [0.18, 0.12]]) {
      circle(ctx, x + dx * s, y + dy * s, s * 0.05, '#e2572b');
    }
  }
}

function drawEgg(ctx, x, y, s, cooked) {
  ctx.fillStyle = cooked ? '#f7e8c8' : '#fffdf4';
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.42, s * 0.34, 0.3, 0, Math.PI * 2);
  ctx.fill();
  circle(ctx, x + s * 0.05, y, s * 0.18, cooked ? '#e8941a' : '#ffb62e');
  circle(ctx, x + s * 0.02, y - s * 0.03, s * 0.09, '#ffd97a');
  if (cooked) {
    ctx.strokeStyle = '#c47b12';
    ctx.lineWidth = s * 0.03;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.4, -0.4, 1.1);
    ctx.stroke();
  }
}

function drawNoodles(ctx, x, y, s, cooked) {
  ctx.strokeStyle = cooked ? '#e8a13c' : '#f2d38a';
  ctx.lineWidth = s * 0.09;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x, y + (i - 1) * s * 0.16, s * 0.3, Math.PI * (0.15 + i * 0.1), Math.PI * (0.85 + i * 0.1));
    ctx.stroke();
  }
  if (cooked) {
    ctx.fillStyle = '#7fb069';
    circle(ctx, x - s * 0.25, y - s * 0.2, s * 0.05, '#7fb069');
    circle(ctx, x + s * 0.28, y + s * 0.15, s * 0.05, '#7fb069');
  }
}

function drawChicken(ctx, x, y, s, cooked) {
  const meat = cooked ? '#a55a1e' : '#f2a65e';
  ellipse(ctx, x - s * 0.05, y + s * 0.05, s * 0.34, s * 0.26, meat);
  ctx.strokeStyle = '#f7ead0';
  ctx.lineWidth = s * 0.08;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + s * 0.22, y - s * 0.08);
  ctx.lineTo(x + s * 0.42, y - s * 0.28);
  ctx.stroke();
  circle(ctx, x + s * 0.45, y - s * 0.3, s * 0.07, '#f7ead0');
  if (cooked) {
    ctx.strokeStyle = '#5d2f0d';
    ctx.lineWidth = s * 0.03;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.3, y - s * 0.05);
    ctx.lineTo(x - s * 0.15, y + s * 0.12);
    ctx.moveTo(x - s * 0.1, y - s * 0.15);
    ctx.lineTo(x + s * 0.05, y + s * 0.05);
    ctx.stroke();
  }
}

function drawChili(ctx, x, y, s) {
  ctx.strokeStyle = '#d9381e';
  ctx.lineWidth = s * 0.16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, y + s * 0.2);
  ctx.quadraticCurveTo(x, y + s * 0.32, x + s * 0.32, y - s * 0.18);
  ctx.stroke();
  ctx.strokeStyle = '#4e9a3d';
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.3, y - s * 0.18);
  ctx.lineTo(x + s * 0.42, y - s * 0.3);
  ctx.stroke();
}

function drawCucumber(ctx, x, y, s) {
  for (const [dx, dy] of [[-0.18, 0.08], [0.16, -0.1]]) {
    circle(ctx, x + dx * s, y + dy * s, s * 0.2, '#2f7d32');
    circle(ctx, x + dx * s, y + dy * s, s * 0.14, '#cde8a8');
    circle(ctx, x + dx * s, y + dy * s, s * 0.05, '#8fbf6a');
  }
}

function drawCracker(ctx, x, y, s) {
  ctx.fillStyle = '#f0a04b';
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r = s * (i % 2 === 0 ? 0.4 : 0.32);
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d97e1f';
  for (const [dx, dy] of [[-0.12, -0.08], [0.14, 0.1], [0.02, -0.18]]) {
    circle(ctx, x + dx * s, y + dy * s, s * 0.04, '#d97e1f');
  }
}

function drawTea(ctx, x, y, s) {
  ctx.fillStyle = 'rgba(214, 138, 44, 0.9)';
  ctx.fillRect(x - s * 0.22, y - s * 0.18, s * 0.44, s * 0.42);
  ctx.fillStyle = '#f6e7c8';
  ctx.fillRect(x - s * 0.22, y - s * 0.18, s * 0.44, s * 0.08);
  ctx.strokeStyle = '#c96f1e';
  ctx.lineWidth = s * 0.05;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.1, y - s * 0.2);
  ctx.lineTo(x + s * 0.22, y - s * 0.44);
  ctx.stroke();
  circle(ctx, x - s * 0.08, y + s * 0.05, s * 0.05, '#fff3d6');
  circle(ctx, x + s * 0.1, y + s * 0.16, s * 0.04, '#fff3d6');
}

// A small plate disc under a food icon, used on plates and tickets.
export function drawPlateDisc(ctx, x, y, r) {
  circle(ctx, x, y, r, '#f4ede1');
  circle(ctx, x, y, r * 0.72, '#e4d7bf');
  ctx.strokeStyle = '#c9b18c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawIngredient(ctx, id, x, y, size) {
  const s = size;
  switch (id) {
    case 'nasi': drawRice(ctx, x, y, s, false); break;
    case 'nasi_masak': drawRice(ctx, x, y, s, true); break;
    case 'telur': drawEgg(ctx, x, y, s, false); break;
    case 'telur_masak': drawEgg(ctx, x, y, s, true); break;
    case 'mie': drawNoodles(ctx, x, y, s, false); break;
    case 'mie_masak': drawNoodles(ctx, x, y, s, true); break;
    case 'ayam': drawChicken(ctx, x, y, s, false); break;
    case 'ayam_masak': drawChicken(ctx, x, y, s, true); break;
    case 'cabai': drawChili(ctx, x, y, s); break;
    case 'timun': drawCucumber(ctx, x, y, s); break;
    case 'kerupuk': drawCracker(ctx, x, y, s); break;
    case 'teh': drawTea(ctx, x, y, s); break;
    default:
      circle(ctx, x, y, s * 0.3, '#cccccc');
  }
}
