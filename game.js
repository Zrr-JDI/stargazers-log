(() => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas || !window.ARCADE_GAMES) return;
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('game-score');
  const bestEl = document.getElementById('game-best');
  const livesEl = document.getElementById('game-lives');
  const nameEl = document.getElementById('game-name');
  const overlay = document.getElementById('game-overlay');
  const overlayTitle = document.getElementById('game-overlay-title');
  const overlayText = document.getElementById('game-overlay-text');
  const startBtn = document.getElementById('game-start');
  const toggleBtn = document.getElementById('game-toggle');
  const panel = document.getElementById('game-panel');
  const grid = document.getElementById('game-grid');
  const countEl = document.getElementById('game-count');

  const GAMES = window.ARCADE_GAMES;
  const W = 640, H = 360;
  const BEST_PREFIX = 'stargazers-log.best.';
  const LAST_KEY = 'stargazers-log.last-game';

  const state = { game: null, running: false, score: 0, best: 0, lives: 0, maxLives: 0, last: 0, raf: 0, dpr: 1, elapsed: 0, keys: new Set(), swipe: null };

  const KEY_MAP = {
    ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown',
    a: 'ArrowLeft', d: 'ArrowRight', w: 'ArrowUp', s: 'ArrowDown',
    A: 'ArrowLeft', D: 'ArrowRight', W: 'ArrowUp', S: 'ArrowDown',
    ' ': 'Space', Enter: 'Enter', Escape: 'Escape', r: 'r', R: 'r',
  };

  /* ---------- helpers exposed to games ---------- */
  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function fillRound(x, y, w, h, r, color) { roundRect(x, y, w, h, r); ctx.fillStyle = color; ctx.fill(); }
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
  function text(str, x, y, { size = 14, color = '#eceef3', align = 'center', weight = 500, font = 'Inter, system-ui, sans-serif', baseline = 'middle' } = {}) {
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(str, x, y);
  }
  function background(top = '#0e1120', bottom = '#0b0d12') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  function starfield(t) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 40; i++) {
      const x = (i * 97 + 31) % W;
      const y = (i * 53 + t * 12 * (1 + (i % 3))) % H;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const particles = [];
  function burst(x, y, color, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const s = 60 + Math.random() * 80;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, color });
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 200 * dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
  }
  function drawParticles() {
    for (const q of particles) {
      ctx.globalAlpha = Math.max(0, q.life / 0.5);
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x - 1.5, q.y - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  const api = {
    W, H, ctx, keys: state.keys,
    colors: { gold: '#f5c451', gold2: '#ffd166', blue: '#7aa2ff', red: '#fb7185', green: '#4ade80', purple: '#c084fc', text: '#eceef3', muted: '#8a90a2' },
    roundRect, fillRound, drawStar, text, background, starfield, rand, randInt, clamp, shuffle, burst,
    addScore(n = 1) { state.score += n; updateHud(); },
    setScore(n) { state.score = n; updateHud(); },
    get score() { return state.score; },
    get lives() { return state.lives; },
    loseLife(n = 1) {
      state.lives -= n;
      updateHud();
      if (state.lives <= 0) { gameOver(); return true; }
      return false;
    },
    end(message) { gameOver(message); },
    get running() { return state.running; },
    get elapsed() { return state.elapsed; },
  };

  /* ---------- engine ---------- */
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
    livesEl.hidden = state.maxLives === 0;
    livesEl.textContent = '♥'.repeat(Math.max(0, state.lives)) + '♡'.repeat(Math.max(0, state.maxLives - state.lives));
  }

  function showOverlay(title, txt, button) {
    overlayTitle.textContent = title;
    overlayText.textContent = txt;
    startBtn.textContent = button;
    overlay.hidden = false;
  }

  function loadBest(id) { return Number(localStorage.getItem(BEST_PREFIX + id) || 0); }

  function select(id, { autofocus = true } = {}) {
    const game = GAMES.find((g) => g.id === id) || GAMES[0];
    if (state.running) stopLoop();
    state.game = game;
    state.running = false;
    state.score = 0;
    state.best = loadBest(game.id);
    state.maxLives = game.lives || 0;
    state.lives = state.maxLives;
    particles.length = 0;
    state.keys.clear();
    localStorage.setItem(LAST_KEY, game.id);
    nameEl.textContent = `${game.icon} ${game.name}`;
    canvas.setAttribute('aria-label', `${game.name} 游戏画布`);
    for (const b of grid.children) b.classList.toggle('active', b.dataset.id === game.id);
    updateHud();
    showOverlay(`${game.icon} ${game.name}`, game.desc, '开始游戏');
    game.start(api);
    drawFrame();
    if (autofocus) canvas.focus();
  }

  function start() {
    const game = state.game;
    state.score = 0;
    state.lives = state.maxLives;
    state.elapsed = 0;
    particles.length = 0;
    state.keys.clear();
    updateHud();
    game.start(api);
    overlay.hidden = true;
    state.running = true;
    state.last = performance.now();
    cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(loop);
    canvas.focus();
  }

  function stopLoop() {
    state.running = false;
    cancelAnimationFrame(state.raf);
  }

  function gameOver(message) {
    if (!state.running) return;
    stopLoop();
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(BEST_PREFIX + state.game.id, String(state.best));
    }
    state.keys.clear();
    updateHud();
    showOverlay(message || '游戏结束', `本局得分 ${state.score} · 最高 ${state.best}`, '再来一局');
    drawFrame();
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    state.game.draw(ctx, api);
    drawParticles();
  }

  function loop(now) {
    if (!state.running) return;
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    state.elapsed += dt;
    state.game.update(dt, api);
    updateParticles(dt);
    if (state.running) {
      drawFrame();
      state.raf = requestAnimationFrame(loop);
    }
  }

  /* ---------- input ---------- */
  function forwardKey(key, down) {
    if (down) state.keys.add(key); else state.keys.delete(key);
    if (state.running && state.game.key) state.game.key(key, down, api);
  }

  canvas.addEventListener('keydown', (ev) => {
    const key = KEY_MAP[ev.key];
    if (!key) return;
    ev.preventDefault();
    if (!state.running) {
      if (key === 'Space' || key === 'Enter') start();
      return;
    }
    if (ev.repeat) return;
    forwardKey(key, true);
  });
  canvas.addEventListener('keyup', (ev) => {
    const key = KEY_MAP[ev.key];
    if (key) forwardKey(key, false);
  });
  canvas.addEventListener('blur', () => {
    for (const k of [...state.keys]) forwardKey(k, false);
  });

  function point(ev) {
    const rect = canvas.getBoundingClientRect();
    const src = ev.touches && ev.touches.length ? ev.touches[0] : ev.changedTouches && ev.changedTouches.length ? ev.changedTouches[0] : ev;
    return { x: ((src.clientX - rect.left) / rect.width) * W, y: ((src.clientY - rect.top) / rect.height) * H };
  }
  function pointer(type, ev, button = 0) {
    if (!state.running || !state.game.pointer) return;
    const p = point(ev);
    state.game.pointer(type, p.x, p.y, button, api);
  }

  canvas.addEventListener('mousedown', (ev) => { pointer('down', ev, ev.button); });
  canvas.addEventListener('mousemove', (ev) => { pointer('move', ev); });
  canvas.addEventListener('mouseup', (ev) => { pointer('up', ev, ev.button); });
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

  canvas.addEventListener('touchstart', (ev) => {
    if (!state.running) return;
    ev.preventDefault();
    const p = point(ev);
    state.swipe = { x: p.x, y: p.y, t: performance.now() };
    pointer('down', ev);
  }, { passive: false });
  canvas.addEventListener('touchmove', (ev) => {
    if (!state.running) return;
    ev.preventDefault();
    pointer('move', ev);
  }, { passive: false });
  canvas.addEventListener('touchend', (ev) => {
    if (!state.running) return;
    ev.preventDefault();
    const p = point(ev);
    const s = state.swipe;
    state.swipe = null;
    if (s) {
      const dx = p.x - s.x, dy = p.y - s.y;
      if (Math.hypot(dx, dy) > 28) {
        const key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
        forwardKey(key, true);
        setTimeout(() => forwardKey(key, false), 80);
      }
    }
    pointer('up', ev);
  }, { passive: false });

  startBtn.addEventListener('click', start);

  /* ---------- picker ---------- */
  for (const g of GAMES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'game-card';
    b.dataset.id = g.id;
    b.innerHTML = `<span class="game-card-icon">${g.icon}</span><span class="game-card-name">${g.name}</span>`;
    b.title = g.desc;
    b.addEventListener('click', () => select(g.id));
    grid.appendChild(b);
  }
  countEl.textContent = GAMES.length;

  toggleBtn.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggleBtn.setAttribute('aria-expanded', String(open));
    toggleBtn.textContent = open ? '收起小游戏 ▴' : `玩个小游戏（${GAMES.length} 款）▾`;
    if (open) {
      resize();
      drawFrame();
      canvas.focus();
    } else if (state.running) {
      gameOver();
    }
  });
  toggleBtn.textContent = `玩个小游戏（${GAMES.length} 款）▾`;

  window.addEventListener('resize', () => { if (!panel.hidden) { resize(); drawFrame(); } });

  resize();
  select(localStorage.getItem(LAST_KEY) || GAMES[0].id, { autofocus: false });
})();
