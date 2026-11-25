// Warung Senja — particles: steam over the woks, sparkles on a serve,
// confetti on a win. One clear job: spawn, update and draw short-lived
// effects; the game logic never depends on them.

export function createParticles() {
  const list = [];

  function steam(x, y) {
    list.push({
      kind: 'steam', x: x + (Math.random() - 0.5) * 30, y,
      vy: -26 - Math.random() * 18, vx: (Math.random() - 0.5) * 8,
      life: 0, max: 1.1 + Math.random() * 0.5, size: 5 + Math.random() * 5,
    });
  }

  function sparkle(x, y, color = '#ffd166') {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      list.push({
        kind: 'spark', x, y,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 30,
        life: 0, max: 0.6 + Math.random() * 0.4,
        size: 2 + Math.random() * 3, color,
      });
    }
  }

  function confetti(x, y) {
    const colors = ['#ff6b35', '#ffd166', '#7fb069', '#4ecdc4', '#ef476f'];
    for (let i = 0; i < 90; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 180 + Math.random() * 260;
      list.push({
        kind: 'confetti', x: x + (Math.random() - 0.5) * 300, y,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        life: 0, max: 1.6 + Math.random() * 0.8,
        size: 4 + Math.random() * 4,
        color: colors[i % colors.length],
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 10,
      });
    }
  }

  function update(dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life += dt;
      if (p.life >= p.max) {
        list.splice(i, 1);
        continue;
      }
      if (p.kind === 'confetti') p.vy += 320 * dt;
      p.x += (p.vx ?? 0) * dt;
      p.y += p.vy * dt;
      if (p.vr) p.rot += p.vr * dt;
    }
  }

  function draw(ctx) {
    for (const p of list) {
      const t = 1 - p.life / p.max;
      if (p.kind === 'steam') {
        ctx.globalAlpha = 0.35 * t;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.6 - t * 0.6), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'spark') {
        ctx.globalAlpha = t;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * t + 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = Math.min(1, t * 2);
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  return { steam, sparkle, confetti, update, draw, count: () => list.length };
}
