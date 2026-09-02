(() => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('game-score');
  const bestEl = document.getElementById('game-best');
  const livesEl = document.getElementById('game-lives');
  const overlay = document.getElementById('game-overlay');
  const overlayTitle = document.getElementById('game-overlay-title');
  const overlayText = document.getElementById('game-overlay-text');
  const startBtn = document.getElementById('game-start');
  const toggleBtn = document.getElementById('game-toggle');
  const panel = document.getElementById('game-panel');

  const BEST_KEY = 'stargazers-log.best';
  const W = 640, H = 360;
  const MAX_LIVES = 3;

  const state = {
    running: false,
    score: 0,
    best: Number(localStorage.getItem(BEST_KEY) || 0),
    lives: MAX_LIVES,
    player: { x: W / 2, w: 84, h: 14, target: W / 2 },
    stars: [],
    particles: [],
    spawnTimer: 0,
    elapsed: 0,
    keys: { left: false, right: false },
    last: 0,
    raf: 0,
    dpr: 1,
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * state.dpr;
    canvas.height = H * state.dpr;
    canvas.style.height = `${rect.width * (H / W)}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function updateHud() {
    scoreEl.textContent = state.score;
    bestEl.textContent = state.best;
    livesEl.textContent = '♥'.repeat(state.lives) + '♡'.repeat(MAX_LIVES - state.lives);
  }

  function showOverlay(title, text, button) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    startBtn.textContent = button;
    overlay.hidden = false;
  }

  function reset() {
    state.score = 0;
    state.lives = MAX_LIVES;
    state.stars = [];
    state.particles = [];
    state.spawnTimer = 0;
    state.elapsed = 0;
    state.player.x = state.player.target = W / 2;
    updateHud();
  }

  function start() {
    reset();
    overlay.hidden = true;
    state.running = true;
    state.last = performance.now();
    cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(loop);
    canvas.focus();
  }

  function gameOver() {
    state.running = false;
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(BEST_KEY, String(state.best));
    }
    updateHud();
    showOverlay('游戏结束', `本局得分 ${state.score} · 最高 ${state.best}`, '再来一局');
    draw();
  }

  function spawnStar() {
    const golden = Math.random() < 0.12;
    state.stars.push({
      x: 20 + Math.random() * (W - 40),
      y: -16,
      r: golden ? 11 : 8,
      vy: 90 + Math.random() * 60 + state.elapsed * 6,
      vx: (Math.random() - 0.5) * 40,
      spin: Math.random() * Math.PI,
      golden,
    });
  }

  function burst(x, y, color, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const s = 60 + Math.random() * 80;
      state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, color });
    }
  }

  function update(dt) {
    state.elapsed += dt;
    const p = state.player;

    const speed = 520;
    if (state.keys.left) p.target -= speed * dt;
    if (state.keys.right) p.target += speed * dt;
    p.target = Math.max(p.w / 2, Math.min(W - p.w / 2, p.target));
    p.x += (p.target - p.x) * Math.min(1, dt * 18);

    const interval = Math.max(0.35, 1.1 - state.elapsed * 0.02);
    state.spawnTimer += dt;
    while (state.spawnTimer > interval) {
      state.spawnTimer -= interval;
      spawnStar();
    }

    const py = H - 36;
    for (let i = state.stars.length - 1; i >= 0; i--) {
      const s = state.stars[i];
      s.y += s.vy * dt;
      s.x += s.vx * dt;
      s.spin += dt * 2;
      if (s.x < s.r || s.x > W - s.r) s.vx *= -1;

      const caught = s.y + s.r >= py && s.y - s.r <= py + p.h && Math.abs(s.x - p.x) <= p.w / 2 + s.r * 0.6;
      if (caught) {
        state.score += s.golden ? 5 : 1;
        burst(s.x, py, s.golden ? '#ffd166' : '#f5c451', s.golden ? 20 : 10);
        state.stars.splice(i, 1);
        updateHud();
      } else if (s.y - s.r > H) {
        state.stars.splice(i, 1);
        state.lives -= 1;
        burst(s.x, H - 4, '#fb7185', 8);
        updateHud();
        if (state.lives <= 0) return gameOver();
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const q = state.particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 200 * dt;
      if (q.life <= 0) state.particles.splice(i, 1);
    }
  }

  function drawStar(x, y, r, rot, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0e1120');
    g.addColorStop(1, '#0b0d12');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 40; i++) {
      const x = (i * 97 + 31) % W;
      const y = (i * 53 + (state.elapsed * 12 * (1 + (i % 3)))) % H;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    for (const s of state.stars) drawStar(s.x, s.y, s.r, s.spin, s.golden ? '#ffd166' : '#f5c451');

    for (const q of state.particles) {
      ctx.globalAlpha = Math.max(0, q.life / 0.5);
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x - 1.5, q.y - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;

    const p = state.player;
    const py = H - 36;
    ctx.save();
    ctx.shadowColor = '#7aa2ff';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#7aa2ff';
    roundRect(p.x - p.w / 2, py, p.w, p.h, 7);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(p.x - p.w / 2 + 8, py + 3, p.w - 16, 3, 2);
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function loop(now) {
    if (!state.running) return;
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    update(dt);
    if (state.running) {
      draw();
      state.raf = requestAnimationFrame(loop);
    }
  }

  function pointerX(ev) {
    const rect = canvas.getBoundingClientRect();
    const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    return ((clientX - rect.left) / rect.width) * W;
  }

  canvas.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowLeft' || ev.key === 'a' || ev.key === 'A') { state.keys.left = true; ev.preventDefault(); }
    if (ev.key === 'ArrowRight' || ev.key === 'd' || ev.key === 'D') { state.keys.right = true; ev.preventDefault(); }
    if ((ev.key === ' ' || ev.key === 'Enter') && !state.running) { start(); ev.preventDefault(); }
  });
  canvas.addEventListener('keyup', (ev) => {
    if (ev.key === 'ArrowLeft' || ev.key === 'a' || ev.key === 'A') state.keys.left = false;
    if (ev.key === 'ArrowRight' || ev.key === 'd' || ev.key === 'D') state.keys.right = false;
  });
  canvas.addEventListener('blur', () => { state.keys.left = state.keys.right = false; });

  canvas.addEventListener('mousemove', (ev) => { if (state.running) state.player.target = pointerX(ev); });
  canvas.addEventListener('touchmove', (ev) => {
    if (state.running) { state.player.target = pointerX(ev); ev.preventDefault(); }
  }, { passive: false });
  canvas.addEventListener('touchstart', (ev) => {
    if (state.running) { state.player.target = pointerX(ev); ev.preventDefault(); }
  }, { passive: false });

  startBtn.addEventListener('click', start);

  toggleBtn.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggleBtn.setAttribute('aria-expanded', String(open));
    toggleBtn.textContent = open ? '收起小游戏 ▴' : '玩个小游戏 ▾';
    if (open) {
      resize();
      draw();
      canvas.focus();
    } else if (state.running) {
      gameOver();
    }
  });

  window.addEventListener('resize', () => { if (!panel.hidden) { resize(); draw(); } });

  resize();
  updateHud();
  showOverlay('接星星', '← → 或 A/D 移动，鼠标/触摸也可以。接住 ⭐ 得分，金色 ⭐ 5 分，漏掉 3 颗结束。', '开始游戏');
  draw();
})();
