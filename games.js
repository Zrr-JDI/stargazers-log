/* Mini-game catalogue for game.js. Each game: { id, name, icon, desc, lives, start(api), update(dt, api), draw(ctx, api), key?(key, down, api), pointer?(type, x, y, button, api) } */
window.ARCADE_GAMES = (() => {
  const W = 640, H = 360;
  const G = [];

  /* 1. 接星星 */
  G.push((() => {
    let p, stars, spawn, t;
    return {
      id: 'catch', name: '接星星', icon: '⭐', lives: 3,
      desc: '← → 或 A/D 移动，鼠标/触摸也可以。接住 ⭐ 得 1 分，金色 ⭐ 得 5 分，漏掉 3 颗结束。',
      start() { p = { x: W / 2, target: W / 2, w: 84, h: 14 }; stars = []; spawn = 0; t = 0; },
      update(dt, a) {
        t += dt;
        if (a.keys.has('ArrowLeft')) p.target -= 520 * dt;
        if (a.keys.has('ArrowRight')) p.target += 520 * dt;
        p.target = a.clamp(p.target, p.w / 2, W - p.w / 2);
        p.x += (p.target - p.x) * Math.min(1, dt * 18);
        const interval = Math.max(0.35, 1.1 - t * 0.02);
        spawn += dt;
        while (spawn > interval) {
          spawn -= interval;
          const golden = Math.random() < 0.12;
          stars.push({ x: a.rand(20, W - 20), y: -16, r: golden ? 11 : 8, vy: 90 + Math.random() * 60 + t * 6, vx: a.rand(-20, 20), spin: Math.random() * 3, golden });
        }
        const py = H - 36;
        for (let i = stars.length - 1; i >= 0; i--) {
          const s = stars[i];
          s.y += s.vy * dt; s.x += s.vx * dt; s.spin += dt * 2;
          if (s.x < s.r || s.x > W - s.r) s.vx *= -1;
          if (s.y + s.r >= py && s.y - s.r <= py + p.h && Math.abs(s.x - p.x) <= p.w / 2 + s.r * 0.6) {
            a.addScore(s.golden ? 5 : 1);
            a.burst(s.x, py, s.golden ? a.colors.gold2 : a.colors.gold, s.golden ? 20 : 10);
            stars.splice(i, 1);
          } else if (s.y - s.r > H) {
            stars.splice(i, 1);
            a.burst(s.x, H - 4, a.colors.red, 8);
            if (a.loseLife()) return;
          }
        }
      },
      draw(ctx, a) {
        a.background(); a.starfield(t);
        for (const s of stars) a.drawStar(s.x, s.y, s.r, s.spin, s.golden ? a.colors.gold2 : a.colors.gold);
        ctx.save(); ctx.shadowColor = a.colors.blue; ctx.shadowBlur = 18;
        a.fillRound(p.x - p.w / 2, H - 36, p.w, p.h, 7, a.colors.blue); ctx.restore();
        a.fillRound(p.x - p.w / 2 + 8, H - 33, p.w - 16, 3, 2, 'rgba(255,255,255,0.35)');
      },
      pointer(type, x) { p.target = x; },
    };
  })());

  /* 2. 躲陨石 */
  G.push((() => {
    let p, rocks, spawn, t;
    return {
      id: 'dodge', name: '躲陨石', icon: '☄️', lives: 0,
      desc: '方向键 / WASD / 鼠标移动飞船，躲开坠落的陨石。存活越久分越高，碰到即结束。',
      start() { p = { x: W / 2, y: H - 60, tx: W / 2, ty: H - 60, r: 12 }; rocks = []; spawn = 0; t = 0; },
      update(dt, a) {
        t += dt;
        a.setScore(Math.floor(t * 10));
        const sp = 320 * dt;
        if (a.keys.has('ArrowLeft')) p.tx -= sp;
        if (a.keys.has('ArrowRight')) p.tx += sp;
        if (a.keys.has('ArrowUp')) p.ty -= sp;
        if (a.keys.has('ArrowDown')) p.ty += sp;
        p.tx = a.clamp(p.tx, p.r, W - p.r); p.ty = a.clamp(p.ty, p.r, H - p.r);
        p.x += (p.tx - p.x) * Math.min(1, dt * 16); p.y += (p.ty - p.y) * Math.min(1, dt * 16);
        spawn += dt;
        const interval = Math.max(0.12, 0.5 - t * 0.015);
        while (spawn > interval) {
          spawn -= interval;
          const r = a.rand(8, 22);
          rocks.push({ x: a.rand(0, W), y: -r, r, vy: a.rand(120, 220) + t * 8, vx: a.rand(-40, 40), rot: Math.random() * 6, vr: a.rand(-2, 2) });
        }
        for (let i = rocks.length - 1; i >= 0; i--) {
          const k = rocks[i];
          k.y += k.vy * dt; k.x += k.vx * dt; k.rot += k.vr * dt;
          if (k.y - k.r > H) { rocks.splice(i, 1); continue; }
          if (Math.hypot(k.x - p.x, k.y - p.y) < k.r + p.r - 4) {
            a.burst(p.x, p.y, a.colors.red, 24);
            a.end('撞上了！');
            return;
          }
        }
      },
      draw(ctx, a) {
        a.background('#120d1e', '#0b0d12'); a.starfield(t * 3);
        for (const k of rocks) {
          ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(k.rot);
          ctx.beginPath();
          for (let i = 0; i < 7; i++) { const ang = (i / 7) * Math.PI * 2; const rr = k.r * (0.75 + 0.25 * ((i * 7) % 3) / 2); ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
          ctx.closePath(); ctx.fillStyle = '#6b6f80'; ctx.fill(); ctx.strokeStyle = '#9aa0b3'; ctx.stroke(); ctx.restore();
        }
        ctx.save(); ctx.translate(p.x, p.y); ctx.shadowColor = a.colors.blue; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(0, -p.r - 4); ctx.lineTo(p.r, p.r); ctx.lineTo(0, p.r * 0.5); ctx.lineTo(-p.r, p.r); ctx.closePath();
        ctx.fillStyle = a.colors.blue; ctx.fill(); ctx.restore();
        a.text(`${t.toFixed(1)}s`, W - 14, 18, { align: 'right', color: a.colors.muted, size: 13 });
      },
      pointer(type, x, y) { p.tx = x; p.ty = y; },
    };
  })());

  /* 3. 贪吃蛇 */
  G.push((() => {
    const C = 20, COLS = W / C, ROWS = H / C;
    let snake, dir, next, food, acc, speed;
    const place = () => {
      let f;
      do { f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; } while (snake.some((s) => s.x === f.x && s.y === f.y));
      food = f;
    };
    return {
      id: 'snake', name: '贪吃蛇', icon: '🐍', lives: 0,
      desc: '方向键 / WASD 控制方向（手机上滑动）。吃到 ⭐ 变长得分，撞墙或撞到自己结束。',
      start() { snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }]; dir = { x: 1, y: 0 }; next = dir; acc = 0; speed = 8; place(); },
      key(k, down) {
        if (!down) return;
        const m = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }[k];
        if (m && !(m.x === -dir.x && m.y === -dir.y)) next = m;
      },
      update(dt, a) {
        acc += dt;
        if (acc < 1 / speed) return;
        acc = 0;
        dir = next;
        const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (h.x < 0 || h.y < 0 || h.x >= COLS || h.y >= ROWS || snake.some((s) => s.x === h.x && s.y === h.y)) { a.end('撞到了！'); return; }
        snake.unshift(h);
        if (h.x === food.x && h.y === food.y) { a.addScore(1); speed = Math.min(18, speed + 0.4); a.burst(food.x * C + C / 2, food.y * C + C / 2, a.colors.gold); place(); }
        else snake.pop();
      },
      draw(ctx, a) {
        a.background('#0b1410', '#0b0d12');
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        for (let x = 0; x <= W; x += C) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += C) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        a.drawStar(food.x * C + C / 2, food.y * C + C / 2, 8, 0, a.colors.gold);
        snake.forEach((s, i) => a.fillRound(s.x * C + 1, s.y * C + 1, C - 2, C - 2, 5, i === 0 ? '#86efac' : a.colors.green));
      },
    };
  })());

  /* 4. 打砖块 */
  G.push((() => {
    let p, ball, bricks, launched;
    const COLS = 10, ROWS = 5, BW = 58, BH = 18, OX = (W - COLS * (BW + 4)) / 2 + 2, OY = 40;
    const colors = ['#fb7185', '#f5c451', '#4ade80', '#7aa2ff', '#c084fc'];
    const serve = () => { ball = { x: p.x, y: H - 50, vx: 0, vy: 0, r: 6 }; launched = false; };
    return {
      id: 'breakout', name: '打砖块', icon: '🧱', lives: 3,
      desc: '← → 或鼠标移动挡板，空格 / 点击发球。打碎所有砖块！漏球 3 次结束。',
      start() {
        p = { x: W / 2, target: W / 2, w: 90, h: 12 };
        bricks = [];
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) bricks.push({ x: OX + c * (BW + 4), y: OY + r * (BH + 4), c: colors[r], alive: true });
        serve();
      },
      key(k, down) { if (down && (k === 'Space' || k === 'ArrowUp') && !launched) { launched = true; ball.vx = (Math.random() - 0.5) * 200; ball.vy = -300; } },
      pointer(type, x) { p.target = x; if (type === 'down' && !launched) { launched = true; ball.vx = (Math.random() - 0.5) * 200; ball.vy = -300; } },
      update(dt, a) {
        if (a.keys.has('ArrowLeft')) p.target -= 560 * dt;
        if (a.keys.has('ArrowRight')) p.target += 560 * dt;
        p.target = a.clamp(p.target, p.w / 2, W - p.w / 2);
        p.x += (p.target - p.x) * Math.min(1, dt * 20);
        if (!launched) { ball.x = p.x; return; }
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -1; }
        if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx *= -1; }
        if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -1; }
        const py = H - 30;
        if (ball.vy > 0 && ball.y + ball.r >= py && ball.y - ball.r <= py + p.h && Math.abs(ball.x - p.x) <= p.w / 2 + ball.r) {
          ball.y = py - ball.r;
          const off = (ball.x - p.x) / (p.w / 2);
          const sp = Math.min(520, Math.hypot(ball.vx, ball.vy) * 1.03);
          const ang = off * 1.1;
          ball.vx = Math.sin(ang) * sp; ball.vy = -Math.cos(ang) * sp;
        }
        if (ball.y - ball.r > H) { if (a.loseLife()) return; serve(); return; }
        for (const b of bricks) {
          if (!b.alive) continue;
          if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + BW && ball.y + ball.r > b.y && ball.y - ball.r < b.y + BH) {
            b.alive = false;
            a.addScore(1);
            a.burst(ball.x, ball.y, b.c, 10);
            const fromSide = ball.x < b.x || ball.x > b.x + BW;
            if (fromSide) ball.vx *= -1; else ball.vy *= -1;
            break;
          }
        }
        if (bricks.every((b) => !b.alive)) { a.addScore(20); a.end('全部打碎！'); }
      },
      draw(ctx, a) {
        a.background();
        for (const b of bricks) if (b.alive) a.fillRound(b.x, b.y, BW, BH, 4, b.c);
        ctx.save(); ctx.shadowColor = a.colors.blue; ctx.shadowBlur = 14; a.fillRound(p.x - p.w / 2, H - 30, p.w, p.h, 6, a.colors.blue); ctx.restore();
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
        if (!launched) a.text('空格 / 点击发球', W / 2, H / 2, { color: a.colors.muted });
      },
    };
  })());

  /* 5. 乒乒 */
  G.push((() => {
    let me, ai, ball, wait;
    const PW = 12, PH = 70;
    const serve = (dirX) => { ball = { x: W / 2, y: H / 2, vx: 260 * dirX, vy: (Math.random() - 0.5) * 240, r: 7 }; wait = 0.6; };
    return {
      id: 'pong', name: '乒乒', icon: '🏓', lives: 3,
      desc: '↑ ↓ 或 W/S 或鼠标控制左侧球拍。让电脑接不到球得分，自己漏球扣一条命。',
      start() { me = { y: H / 2, target: H / 2 }; ai = { y: H / 2 }; serve(1); },
      pointer(type, x, y) { me.target = y; },
      update(dt, a) {
        if (a.keys.has('ArrowUp')) me.target -= 420 * dt;
        if (a.keys.has('ArrowDown')) me.target += 420 * dt;
        me.target = a.clamp(me.target, PH / 2, H - PH / 2);
        me.y += (me.target - me.y) * Math.min(1, dt * 18);
        const aiSpeed = 200 + a.score * 15;
        const aiTarget = ball.vx > 0 ? ball.y : H / 2;
        ai.y += a.clamp(aiTarget - ai.y, -aiSpeed * dt, aiSpeed * dt);
        ai.y = a.clamp(ai.y, PH / 2, H - PH / 2);
        if (wait > 0) { wait -= dt; return; }
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -1; }
        if (ball.y > H - ball.r) { ball.y = H - ball.r; ball.vy *= -1; }
        const hit = (px, py) => Math.abs(ball.x - px) < PW / 2 + ball.r && Math.abs(ball.y - py) < PH / 2 + ball.r;
        if (ball.vx < 0 && hit(24, me.y)) { ball.vx = Math.abs(ball.vx) * 1.06; ball.vy += (ball.y - me.y) * 5; ball.x = 24 + PW / 2 + ball.r; }
        if (ball.vx > 0 && hit(W - 24, ai.y)) { ball.vx = -Math.abs(ball.vx) * 1.06; ball.vy += (ball.y - ai.y) * 5; ball.x = W - 24 - PW / 2 - ball.r; }
        if (ball.x > W + 20) { a.addScore(1); a.burst(W - 10, ball.y, a.colors.gold); serve(-1); }
        if (ball.x < -20) { a.burst(10, ball.y, a.colors.red); if (a.loseLife()) return; serve(1); }
      },
      draw(ctx, a) {
        a.background();
        ctx.setLineDash([8, 10]); ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
        a.fillRound(24 - PW / 2, me.y - PH / 2, PW, PH, 5, a.colors.blue);
        a.fillRound(W - 24 - PW / 2, ai.y - PH / 2, PW, PH, 5, a.colors.red);
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      },
    };
  })());

  /* 6. 飞翔小鸟 */
  G.push((() => {
    let bird, pipes, spawn, t;
    const GAP = 110, PW = 56;
    const flap = () => { bird.vy = -300; };
    return {
      id: 'flappy', name: '飞翔小鸟', icon: '🐦', lives: 0,
      desc: '空格 / ↑ / 点击让小鸟上飞，穿过管道间隙得分，撞到管道或地面结束。',
      start() { bird = { x: 150, y: H / 2, vy: 0, r: 12 }; pipes = []; spawn = 1; t = 0; },
      key(k, down) { if (down && (k === 'Space' || k === 'ArrowUp')) flap(); },
      pointer(type) { if (type === 'down') flap(); },
      update(dt, a) {
        t += dt;
        bird.vy += 900 * dt; bird.y += bird.vy * dt;
        spawn += dt;
        if (spawn > 1.6) { spawn = 0; pipes.push({ x: W + PW, gapY: a.rand(70, H - 70 - GAP), passed: false }); }
        for (let i = pipes.length - 1; i >= 0; i--) {
          const p = pipes[i];
          p.x -= 170 * dt;
          if (!p.passed && p.x + PW < bird.x) { p.passed = true; a.addScore(1); }
          if (p.x + PW < -10) pipes.splice(i, 1);
          const inX = bird.x + bird.r > p.x && bird.x - bird.r < p.x + PW;
          if (inX && (bird.y - bird.r < p.gapY || bird.y + bird.r > p.gapY + GAP)) { a.burst(bird.x, bird.y, a.colors.gold, 20); a.end('撞到管道！'); return; }
        }
        if (bird.y + bird.r > H - 20 || bird.y < -40) { a.end('掉下去了！'); }
      },
      draw(ctx, a) {
        a.background('#0f1a2e', '#0b0d12'); a.starfield(t * 2);
        for (const p of pipes) {
          a.fillRound(p.x, -10, PW, p.gapY + 10, 6, a.colors.green);
          a.fillRound(p.x, p.gapY + GAP, PW, H - p.gapY - GAP, 6, a.colors.green);
        }
        ctx.fillStyle = '#233047'; ctx.fillRect(0, H - 20, W, 20);
        ctx.save(); ctx.translate(bird.x, bird.y); ctx.rotate(a.clamp(bird.vy / 600, -0.5, 0.8));
        ctx.beginPath(); ctx.arc(0, 0, bird.r, 0, Math.PI * 2); ctx.fillStyle = a.colors.gold; ctx.fill();
        ctx.beginPath(); ctx.arc(5, -3, 3, 0, Math.PI * 2); ctx.fillStyle = '#1a1400'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(10, 2); ctx.lineTo(20, 5); ctx.lineTo(10, 8); ctx.fillStyle = '#ff8a4c'; ctx.fill();
        ctx.restore();
      },
    };
  })());

  /* 7. 记忆翻牌 */
  G.push((() => {
    const ICONS = ['⭐', '🌙', '☀️', '🪐', '🚀', '🛸', '☄️', '🌈'];
    const COLS = 4, ROWS = 4, S = 72, GX = (W - COLS * (S + 10)) / 2 + 5, GY = (H - ROWS * (S + 10)) / 2 + 5;
    let cards, open, lock, moves, t;
    return {
      id: 'memory', name: '记忆翻牌', icon: '🃏', lives: 0,
      desc: '点击翻开两张牌，配对成功保留。用最少步数配齐 8 对，步数越少得分越高。',
      start(a) { cards = a.shuffle([...ICONS, ...ICONS]).map((icon) => ({ icon, up: false, done: false })); open = []; lock = 0; moves = 0; t = 0; },
      pointer(type, x, y, b, a) {
        if (type !== 'down' || lock > 0) return;
        const c = Math.floor((x - GX + 5) / (S + 10)), r = Math.floor((y - GY + 5) / (S + 10));
        if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
        const card = cards[r * COLS + c];
        if (card.up || card.done) return;
        card.up = true; open.push(card);
        if (open.length === 2) {
          moves++;
          if (open[0].icon === open[1].icon) {
            open.forEach((k) => { k.done = true; }); open = [];
            a.addScore(10);
            if (cards.every((k) => k.done)) { a.addScore(Math.max(0, 120 - moves * 4)); a.end('全部配对！'); }
          } else lock = 0.7;
        }
      },
      update(dt) {
        t += dt;
        if (lock > 0) { lock -= dt; if (lock <= 0) { open.forEach((k) => { k.up = false; }); open = []; } }
      },
      draw(ctx, a) {
        a.background('#14101e', '#0b0d12');
        cards.forEach((card, i) => {
          const x = GX + (i % COLS) * (S + 10), y = GY + Math.floor(i / COLS) * (S + 10);
          a.fillRound(x, y, S, S, 10, card.done ? 'rgba(74,222,128,0.18)' : card.up ? 'rgba(255,255,255,0.12)' : 'rgba(122,162,255,0.16)');
          if (card.up || card.done) a.text(card.icon, x + S / 2, y + S / 2 + 2, { size: 30 });
          else a.text('?', x + S / 2, y + S / 2, { size: 24, color: 'rgba(255,255,255,0.35)' });
        });
        a.text(`步数 ${moves}`, W - 14, 18, { align: 'right', color: a.colors.muted, size: 13 });
      },
    };
  })());

  /* 8. 2048 */
  G.push((() => {
    const N = 4, S = 74, GAP = 8, OX = (W - (N * S + (N - 1) * GAP)) / 2, OY = (H - (N * S + (N - 1) * GAP)) / 2;
    let grid;
    const COLORS = { 2: '#334155', 4: '#3f4d66', 8: '#f59e0b', 16: '#f97316', 32: '#ef4444', 64: '#dc2626', 128: '#eab308', 256: '#facc15', 512: '#fde047', 1024: '#a3e635', 2048: '#4ade80' };
    const empties = () => { const e = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!grid[r][c]) e.push([r, c]); return e; };
    const add = () => { const e = empties(); if (!e.length) return; const [r, c] = e[Math.floor(Math.random() * e.length)]; grid[r][c] = Math.random() < 0.9 ? 2 : 4; };
    const slide = (row, a) => {
      const v = row.filter(Boolean);
      for (let i = 0; i < v.length - 1; i++) if (v[i] === v[i + 1]) { v[i] *= 2; a.addScore(v[i]); v.splice(i + 1, 1); }
      while (v.length < N) v.push(0);
      return v;
    };
    const canMove = () => {
      if (empties().length) return true;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        if (c < N - 1 && grid[r][c] === grid[r][c + 1]) return true;
        if (r < N - 1 && grid[r][c] === grid[r + 1][c]) return true;
      }
      return false;
    };
    return {
      id: '2048', name: '2048', icon: '🔢', lives: 0,
      desc: '方向键 / WASD（手机滑动）合并相同数字，目标 2048！无法移动时结束。',
      start() { grid = Array.from({ length: N }, () => Array(N).fill(0)); add(); add(); },
      key(k, down, a) {
        if (!down) return;
        const before = JSON.stringify(grid);
        if (k === 'ArrowLeft') grid = grid.map((row) => slide(row, a));
        else if (k === 'ArrowRight') grid = grid.map((row) => slide([...row].reverse(), a).reverse());
        else if (k === 'ArrowUp' || k === 'ArrowDown') {
          for (let c = 0; c < N; c++) {
            let col = grid.map((row) => row[c]);
            col = k === 'ArrowUp' ? slide(col, a) : slide(col.reverse(), a).reverse();
            col.forEach((v, r) => { grid[r][c] = v; });
          }
        } else return;
        if (JSON.stringify(grid) !== before) add();
        if (grid.some((row) => row.includes(2048))) { a.end('达成 2048！'); return; }
        if (!canMove()) a.end('无法移动');
      },
      update() {},
      draw(ctx, a) {
        a.background('#101520', '#0b0d12');
        a.fillRound(OX - GAP, OY - GAP, N * S + (N + 1) * GAP, N * S + (N + 1) * GAP, 12, 'rgba(255,255,255,0.05)');
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const v = grid[r][c], x = OX + c * (S + GAP), y = OY + r * (S + GAP);
          a.fillRound(x, y, S, S, 8, v ? COLORS[v] || '#22c55e' : 'rgba(255,255,255,0.04)');
          if (v) a.text(String(v), x + S / 2, y + S / 2 + 1, { size: v >= 1024 ? 22 : v >= 128 ? 26 : 30, weight: 700, color: v <= 4 ? '#eceef3' : '#1a1400' });
        }
      },
    };
  })());

  /* 9. 反应测试 */
  G.push((() => {
    let phase, wait, t0, round, results;
    const ROUNDS = 5;
    const arm = (a) => { phase = 'wait'; wait = a.rand(1.2, 3.5); };
    return {
      id: 'reaction', name: '反应测试', icon: '⚡', lives: 3,
      desc: '屏幕变成金色的瞬间立刻点击（或按空格）。越快分越高，共 5 轮；抢跑扣一条命。',
      start(a) { round = 0; results = []; arm(a); },
      key(k, down, a) { if (down && k === 'Space') this.pointer('down', 0, 0, 0, a); },
      pointer(type, x, y, b, a) {
        if (type !== 'down') return;
        if (phase === 'wait') { a.burst(W / 2, H / 2, a.colors.red, 16); if (a.loseLife()) return; arm(a); }
        else if (phase === 'go') {
          const ms = Math.round(performance.now() - t0);
          results.push(ms);
          a.addScore(Math.max(5, Math.round(100 - ms / 6)));
          round++;
          if (round >= ROUNDS) { a.end(`平均 ${Math.round(results.reduce((s, v) => s + v, 0) / results.length)} ms`); return; }
          phase = 'result'; wait = 1;
        }
      },
      update(dt, a) {
        wait -= dt;
        if (wait <= 0) {
          if (phase === 'wait') { phase = 'go'; t0 = performance.now(); }
          else if (phase === 'result') arm(a);
        }
      },
      draw(ctx, a) {
        if (phase === 'go') { ctx.fillStyle = a.colors.gold; ctx.fillRect(0, 0, W, H); a.text('点！', W / 2, H / 2, { size: 64, weight: 700, color: '#1a1400' }); }
        else {
          a.background('#1a1020', '#0b0d12');
          a.text(phase === 'wait' ? '等待变色…' : `${results[results.length - 1]} ms`, W / 2, H / 2 - 10, { size: 40, weight: 700 });
          a.text(`第 ${round + 1} / ${ROUNDS} 轮`, W / 2, H / 2 + 36, { color: a.colors.muted });
        }
      },
    };
  })());

  /* 10. 打地鼠 */
  G.push((() => {
    const COLS = 3, ROWS = 3, S = 86, GX = (W - COLS * (S + 30)) / 2 + 15, GY = 34;
    let holes, timer, spawn;
    return {
      id: 'whack', name: '打地鼠', icon: '🐹', lives: 0,
      desc: '30 秒内点击冒出来的地鼠，越多越好！打到金色地鼠得 3 分。',
      start() { holes = Array.from({ length: 9 }, () => ({ up: 0, gold: false, hit: 0 })); timer = 30; spawn = 0; },
      pointer(type, x, y, b, a) {
        if (type !== 'down') return;
        holes.forEach((h, i) => {
          const hx = GX + (i % COLS) * (S + 30) + S / 2, hy = GY + Math.floor(i / COLS) * (S + 20) + S / 2;
          if (h.up > 0 && Math.hypot(x - hx, y - hy) < S / 2) { a.addScore(h.gold ? 3 : 1); a.burst(hx, hy, h.gold ? a.colors.gold : a.colors.green, 12); h.up = 0; h.hit = 0.3; }
        });
      },
      update(dt, a) {
        timer -= dt;
        if (timer <= 0) { a.end('时间到！'); return; }
        spawn += dt;
        const interval = Math.max(0.35, 0.9 - (30 - timer) * 0.015);
        if (spawn > interval) {
          spawn = 0;
          const free = holes.filter((h) => h.up <= 0);
          if (free.length) { const h = free[Math.floor(Math.random() * free.length)]; h.up = a.rand(0.7, 1.4); h.gold = Math.random() < 0.15; }
        }
        holes.forEach((h) => { if (h.up > 0) h.up -= dt; if (h.hit > 0) h.hit -= dt; });
      },
      draw(ctx, a) {
        a.background('#101a12', '#0b0d12');
        holes.forEach((h, i) => {
          const x = GX + (i % COLS) * (S + 30), y = GY + Math.floor(i / COLS) * (S + 20);
          ctx.beginPath(); ctx.ellipse(x + S / 2, y + S - 10, S / 2, 16, 0, 0, Math.PI * 2); ctx.fillStyle = '#1f2937'; ctx.fill();
          if (h.up > 0) {
            ctx.beginPath(); ctx.arc(x + S / 2, y + S / 2 + 6, S / 2 - 12, 0, Math.PI * 2); ctx.fillStyle = h.gold ? a.colors.gold : '#a16207'; ctx.fill();
            a.text(h.gold ? '🐹' : '🐹', x + S / 2, y + S / 2 + 8, { size: 34 });
          } else if (h.hit > 0) a.text('💥', x + S / 2, y + S / 2, { size: 32 });
        });
        a.text(`${Math.ceil(timer)}s`, W - 14, 18, { align: 'right', color: timer < 6 ? a.colors.red : a.colors.muted, size: 14 });
      },
    };
  })());

  /* 11. 小恐龙 */
  G.push((() => {
    let y, vy, obs, spawn, dist, speed, ground;
    const jump = () => { if (y >= ground - 1) vy = -520; };
    return {
      id: 'runner', name: '小恐龙', icon: '🦖', lives: 0,
      desc: '空格 / ↑ / 点击跳跃，躲开仙人掌。跑得越远分越高，速度会越来越快。',
      start() { ground = H - 60; y = ground; vy = 0; obs = []; spawn = 1; dist = 0; speed = 260; },
      key(k, down) { if (down && (k === 'Space' || k === 'ArrowUp')) jump(); },
      pointer(type) { if (type === 'down') jump(); },
      update(dt, a) {
        speed += dt * 8; dist += speed * dt; a.setScore(Math.floor(dist / 20));
        vy += 1400 * dt; y = Math.min(ground, y + vy * dt); if (y === ground) vy = 0;
        spawn -= dt;
        if (spawn <= 0) { spawn = a.rand(0.9, 1.8) * (260 / speed); obs.push({ x: W + 20, w: a.randInt(16, 30), h: a.randInt(28, 52) }); }
        for (let i = obs.length - 1; i >= 0; i--) {
          const o = obs[i]; o.x -= speed * dt;
          if (o.x + o.w < 0) { obs.splice(i, 1); continue; }
          const px = 90, pw = 30, ph = 40;
          if (px + pw - 6 > o.x && px + 6 < o.x + o.w && y > ground - o.h + 4) { a.burst(px + pw / 2, y - ph / 2, a.colors.red, 20); a.end('撞到仙人掌！'); return; }
        }
      },
      draw(ctx, a) {
        a.background('#0e1220', '#0b0d12'); a.starfield(dist / 40);
        ctx.fillStyle = '#233047'; ctx.fillRect(0, ground, W, H - ground);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(W, ground); ctx.stroke();
        for (const o of obs) a.fillRound(o.x, ground - o.h, o.w, o.h, 4, a.colors.green);
        a.fillRound(90, y - 40, 30, 40, 8, a.colors.gold);
        a.fillRound(112, y - 34, 6, 6, 3, '#1a1400');
        a.fillRound(94, y - 8, 8, 8, 2, a.colors.gold); a.fillRound(108, y - 8, 8, 8, 2, a.colors.gold);
      },
    };
  })());

  /* 12. 扫雷 */
  G.push((() => {
    const N = 9, MINES = 10, S = 36, OX = (W - N * S) / 2, OY = (H - N * S) / 2;
    let cells, first, done;
    const idx = (r, c) => r * N + c;
    const around = (r, c, fn) => { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, cc = c + dc; if ((dr || dc) && rr >= 0 && cc >= 0 && rr < N && cc < N) fn(rr, cc); } };
    const plant = (sr, sc) => {
      let n = 0;
      while (n < MINES) { const r = Math.floor(Math.random() * N), c = Math.floor(Math.random() * N); if (Math.abs(r - sr) <= 1 && Math.abs(c - sc) <= 1) continue; const cell = cells[idx(r, c)]; if (!cell.mine) { cell.mine = true; n++; } }
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { let k = 0; around(r, c, (rr, cc) => { if (cells[idx(rr, cc)].mine) k++; }); cells[idx(r, c)].n = k; }
    };
    const reveal = (r, c, a) => {
      const cell = cells[idx(r, c)];
      if (cell.open || cell.flag) return;
      cell.open = true;
      if (!cell.mine) a.addScore(1);
      if (cell.n === 0 && !cell.mine) around(r, c, (rr, cc) => reveal(rr, cc, a));
    };
    const COLORS = ['', '#7aa2ff', '#4ade80', '#fb7185', '#c084fc', '#f5c451', '#22d3ee', '#eceef3', '#8a90a2'];
    return {
      id: 'mines', name: '扫雷', icon: '💣', lives: 0,
      desc: '9×9 格 10 颗雷。左键翻开，右键（或长按）插旗。翻开所有安全格获胜！',
      start() { cells = Array.from({ length: N * N }, () => ({ mine: false, open: false, flag: false, n: 0 })); first = true; done = false; },
      pointer(type, x, y, b, a) {
        if (done) return;
        const c = Math.floor((x - OX) / S), r = Math.floor((y - OY) / S);
        if (c < 0 || r < 0 || c >= N || r >= N) return;
        if (type === 'down' && b === 2) { const cell = cells[idx(r, c)]; if (!cell.open) cell.flag = !cell.flag; return; }
        if (type === 'down' && b === 0) { this._press = { r, c, t: performance.now() }; return; }
        if (type === 'up' && this._press && b === 0) {
          const long = performance.now() - this._press.t > 450;
          const { r: pr, c: pc } = this._press; this._press = null;
          const cell = cells[idx(pr, pc)];
          if (long) { if (!cell.open) cell.flag = !cell.flag; return; }
          if (cell.flag || cell.open) return;
          if (first) { plant(pr, pc); first = false; }
          if (cell.mine) { cell.open = true; done = true; cells.forEach((k) => { if (k.mine) k.open = true; }); a.burst(OX + pc * S + S / 2, OY + pr * S + S / 2, a.colors.red, 24); a.end('踩到雷了！'); return; }
          reveal(pr, pc, a);
          if (cells.every((k) => k.mine || k.open)) { done = true; a.addScore(50); a.end('扫雷成功！'); }
        }
      },
      update() {},
      draw(ctx, a) {
        a.background('#101418', '#0b0d12');
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const cell = cells[idx(r, c)], x = OX + c * S, y = OY + r * S;
          a.fillRound(x + 1, y + 1, S - 2, S - 2, 5, cell.open ? (cell.mine ? 'rgba(251,113,133,0.35)' : 'rgba(255,255,255,0.05)') : 'rgba(122,162,255,0.18)');
          if (cell.open && cell.mine) a.text('💣', x + S / 2, y + S / 2 + 1, { size: 20 });
          else if (cell.open && cell.n) a.text(String(cell.n), x + S / 2, y + S / 2 + 1, { size: 17, weight: 700, color: COLORS[cell.n] });
          else if (cell.flag) a.text('🚩', x + S / 2, y + S / 2 + 1, { size: 18 });
        }
      },
    };
  })());

  /* 13. 井字棋 */
  G.push((() => {
    const S = 90, OX = (W - 3 * S) / 2, OY = (H - 3 * S) / 2;
    let board, turn, over, flash;
    const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const winner = (b) => { for (const [x, y, z] of LINES) if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x]; return b.every(Boolean) ? 'draw' : null; };
    const aiMove = () => {
      const empty = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      const tryWin = (mark) => empty.find((i) => { const b = [...board]; b[i] = mark; return winner(b) === mark; });
      let m = tryWin('O'); if (m === undefined) m = tryWin('X');
      if (m === undefined && !board[4] && Math.random() < 0.8) m = 4;
      if (m === undefined) m = empty[Math.floor(Math.random() * empty.length)];
      board[m] = 'O';
    };
    const newRound = () => { board = Array(9).fill(null); turn = 'X'; over = null; flash = 0; };
    return {
      id: 'tictactoe', name: '井字棋', icon: '⭕', lives: 3,
      desc: '你执 X，点击落子对战电脑。赢一局 +10，平局 +3，输一局扣一条命。',
      start() { newRound(); },
      pointer(type, x, y, b, a) {
        if (type !== 'down' || over || turn !== 'X') return;
        const c = Math.floor((x - OX) / S), r = Math.floor((y - OY) / S);
        if (c < 0 || r < 0 || c > 2 || r > 2 || board[r * 3 + c]) return;
        board[r * 3 + c] = 'X';
        over = winner(board);
        if (!over) { turn = 'O'; flash = 0.4; }
        else this._finish(a);
      },
      _finish(a) {
        if (over === 'X') a.addScore(10); else if (over === 'draw') a.addScore(3); else if (a.loseLife()) return;
        flash = 1.2;
      },
      update(dt, a) {
        if (flash > 0) {
          flash -= dt;
          if (flash <= 0) {
            if (over) newRound();
            else if (turn === 'O') { aiMove(); over = winner(board); if (over) this._finish(a); else turn = 'X'; }
          }
        }
      },
      draw(ctx, a) {
        a.background('#151020', '#0b0d12');
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 3;
        for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(OX + i * S, OY); ctx.lineTo(OX + i * S, OY + 3 * S); ctx.stroke(); ctx.beginPath(); ctx.moveTo(OX, OY + i * S); ctx.lineTo(OX + 3 * S, OY + i * S); ctx.stroke(); }
        ctx.lineWidth = 1;
        board.forEach((v, i) => { if (v) a.text(v, OX + (i % 3) * S + S / 2, OY + Math.floor(i / 3) * S + S / 2 + 2, { size: 52, weight: 700, color: v === 'X' ? a.colors.blue : a.colors.red }); });
        if (over) a.text(over === 'X' ? '你赢了！' : over === 'O' ? '电脑赢了' : '平局', W / 2, 24, { size: 18, weight: 600, color: a.colors.gold });
        else a.text(turn === 'X' ? '你的回合' : '电脑思考中…', W / 2, 24, { size: 14, color: a.colors.muted });
      },
    };
  })());

  /* 14. 数字华容道 */
  G.push((() => {
    const N = 4, S = 76, OX = (W - N * S) / 2, OY = (H - N * S) / 2;
    let tiles, moves;
    const blank = () => tiles.indexOf(0);
    const correct = () => tiles.filter((v, i) => v && v === i + 1).length;
    const tryMove = (i, a) => {
      const b = blank(), br = Math.floor(b / N), bc = b % N, r = Math.floor(i / N), c = i % N;
      if (Math.abs(br - r) + Math.abs(bc - c) !== 1) return;
      [tiles[b], tiles[i]] = [tiles[i], tiles[b]]; moves++;
      a.setScore(correct());
      if (correct() === 15) { a.addScore(Math.max(20, 200 - moves)); a.end('拼好了！'); }
    };
    return {
      id: 'slide', name: '数字华容道', icon: '🧩', lives: 0,
      desc: '点击空格旁的方块（或用方向键推动）把 1–15 按顺序排好。步数越少，完成奖励越高。',
      start(a) {
        tiles = [...Array(15).keys()].map((i) => i + 1).concat(0);
        for (let k = 0; k < 300; k++) {
          const b = blank(), br = Math.floor(b / N), bc = b % N;
          const nb = [[br - 1, bc], [br + 1, bc], [br, bc - 1], [br, bc + 1]].filter(([r, c]) => r >= 0 && c >= 0 && r < N && c < N);
          const [r, c] = nb[Math.floor(Math.random() * nb.length)];
          [tiles[b], tiles[r * N + c]] = [tiles[r * N + c], tiles[b]];
        }
        moves = 0; a.setScore(correct());
      },
      key(k, down, a) {
        if (!down) return;
        const b = blank(), br = Math.floor(b / N), bc = b % N;
        const d = { ArrowUp: [br + 1, bc], ArrowDown: [br - 1, bc], ArrowLeft: [br, bc + 1], ArrowRight: [br, bc - 1] }[k];
        if (d && d[0] >= 0 && d[1] >= 0 && d[0] < N && d[1] < N) tryMove(d[0] * N + d[1], a);
      },
      pointer(type, x, y, b, a) {
        if (type !== 'down') return;
        const c = Math.floor((x - OX) / S), r = Math.floor((y - OY) / S);
        if (c >= 0 && r >= 0 && c < N && r < N) tryMove(r * N + c, a);
      },
      update() {},
      draw(ctx, a) {
        a.background('#10141c', '#0b0d12');
        tiles.forEach((v, i) => {
          if (!v) return;
          const x = OX + (i % N) * S, y = OY + Math.floor(i / N) * S;
          a.fillRound(x + 3, y + 3, S - 6, S - 6, 10, v === i + 1 ? 'rgba(74,222,128,0.25)' : 'rgba(122,162,255,0.2)');
          a.text(String(v), x + S / 2, y + S / 2 + 1, { size: 26, weight: 700 });
        });
        a.text(`步数 ${moves}`, W - 14, 18, { align: 'right', color: a.colors.muted, size: 13 });
      },
    };
  })());

  /* 15. 太空射击 */
  G.push((() => {
    let ship, bullets, enemies, spawn, cool, firing, t;
    return {
      id: 'shooter', name: '太空射击', icon: '🚀', lives: 3,
      desc: '← → 或鼠标移动飞船，空格 / 按住鼠标射击。击落敌机得分，敌机冲到底部或撞到你会扣命。',
      start() { ship = { x: W / 2, target: W / 2 }; bullets = []; enemies = []; spawn = 0; cool = 0; firing = false; t = 0; },
      key(k, down) { if (k === 'Space') firing = down; },
      pointer(type, x) { ship.target = x; if (type === 'down') firing = true; if (type === 'up') firing = false; },
      update(dt, a) {
        t += dt;
        if (a.keys.has('ArrowLeft')) ship.target -= 480 * dt;
        if (a.keys.has('ArrowRight')) ship.target += 480 * dt;
        ship.target = a.clamp(ship.target, 20, W - 20);
        ship.x += (ship.target - ship.x) * Math.min(1, dt * 18);
        cool -= dt;
        if (firing && cool <= 0) { cool = 0.18; bullets.push({ x: ship.x, y: H - 50 }); }
        spawn += dt;
        const interval = Math.max(0.3, 1 - t * 0.02);
        if (spawn > interval) { spawn = 0; enemies.push({ x: a.rand(20, W - 20), y: -16, vy: a.rand(60, 110) + t * 3, vx: a.rand(-40, 40), r: 14 }); }
        for (let i = bullets.length - 1; i >= 0; i--) { bullets[i].y -= 520 * dt; if (bullets[i].y < -10) bullets.splice(i, 1); }
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i]; e.y += e.vy * dt; e.x += e.vx * dt;
          if (e.x < e.r || e.x > W - e.r) e.vx *= -1;
          let hit = false;
          for (let j = bullets.length - 1; j >= 0; j--) { if (Math.hypot(bullets[j].x - e.x, bullets[j].y - e.y) < e.r + 3) { bullets.splice(j, 1); hit = true; break; } }
          if (hit) { enemies.splice(i, 1); a.addScore(1); a.burst(e.x, e.y, a.colors.red, 14); continue; }
          if (e.y > H - 40 && Math.abs(e.x - ship.x) < 26 || e.y - e.r > H) { enemies.splice(i, 1); a.burst(e.x, Math.min(e.y, H - 4), a.colors.red, 16); if (a.loseLife()) return; }
        }
      },
      draw(ctx, a) {
        a.background('#0a0f1e', '#0b0d12'); a.starfield(t * 4);
        ctx.fillStyle = a.colors.gold; for (const b of bullets) a.fillRound(b.x - 2, b.y - 8, 4, 12, 2, a.colors.gold);
        for (const e of enemies) { ctx.save(); ctx.translate(e.x, e.y); ctx.beginPath(); ctx.moveTo(0, e.r); ctx.lineTo(e.r, -e.r * 0.7); ctx.lineTo(0, -e.r * 0.2); ctx.lineTo(-e.r, -e.r * 0.7); ctx.closePath(); ctx.fillStyle = a.colors.red; ctx.fill(); ctx.restore(); }
        ctx.save(); ctx.translate(ship.x, H - 36); ctx.shadowColor = a.colors.blue; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(16, 14); ctx.lineTo(0, 6); ctx.lineTo(-16, 14); ctx.closePath(); ctx.fillStyle = a.colors.blue; ctx.fill(); ctx.restore();
      },
    };
  })());

  /* 16. 迷宫 */
  G.push((() => {
    const C = 20, COLS = 31, ROWS = 17, OX = (W - COLS * C) / 2, OY = (H - ROWS * C) / 2;
    let walls, px, py, timer, acc;
    const gen = () => {
      walls = Array.from({ length: ROWS }, () => Array(COLS).fill(true));
      const carve = (r, c) => {
        walls[r][c] = false;
        const dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]].sort(() => Math.random() - 0.5);
        for (const [dr, dc] of dirs) { const rr = r + dr, cc = c + dc; if (rr > 0 && cc > 0 && rr < ROWS - 1 && cc < COLS - 1 && walls[rr][cc]) { walls[r + dr / 2][c + dc / 2] = false; carve(rr, cc); } }
      };
      carve(1, 1); px = 1; py = 1;
    };
    const move = (dx, dy, a) => {
      const nx = px + dx, ny = py + dy;
      if (walls[ny] && walls[ny][nx] === false) { px = nx; py = ny; }
      if (px === COLS - 2 && py === ROWS - 2) { a.addScore(10); a.burst(OX + px * C + C / 2, OY + py * C + C / 2, a.colors.gold, 20); timer += 15; gen(); }
    };
    return {
      id: 'maze', name: '迷宫', icon: '🌀', lives: 0,
      desc: '方向键 / WASD（手机滑动）从左上角走到右下角的 ⭐。每通关一个迷宫 +10 分并加 15 秒，倒计时结束为止。',
      start() { gen(); timer = 60; acc = 0; },
      key(k, down, a) {
        if (!down) return;
        const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
        if (d) { move(d[0], d[1], a); acc = -0.25; }
      },
      update(dt, a) {
        timer -= dt;
        if (timer <= 0) { a.end('时间到！'); return; }
        acc += dt;
        if (acc > 0.09) {
          acc = 0;
          if (a.keys.has('ArrowLeft')) move(-1, 0, a); else if (a.keys.has('ArrowRight')) move(1, 0, a);
          else if (a.keys.has('ArrowUp')) move(0, -1, a); else if (a.keys.has('ArrowDown')) move(0, 1, a);
        }
      },
      draw(ctx, a) {
        a.background('#0d1018', '#0b0d12');
        ctx.fillStyle = 'rgba(122,162,255,0.25)';
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (walls[r][c]) ctx.fillRect(OX + c * C, OY + r * C, C, C);
        a.drawStar(OX + (COLS - 2) * C + C / 2, OY + (ROWS - 2) * C + C / 2, 7, 0, a.colors.gold);
        a.fillRound(OX + px * C + 3, OY + py * C + 3, C - 6, C - 6, 5, a.colors.green);
        a.text(`${Math.ceil(timer)}s`, W - 14, 14, { align: 'right', color: timer < 10 ? a.colors.red : a.colors.muted, size: 13 });
      },
    };
  })());

  /* 17. 俄罗斯方块 */
  G.push((() => {
    const COLS = 10, ROWS = 18, C = 20, OX = (W - COLS * C) / 2, OY = 0;
    const SHAPES = [
      { c: '#22d3ee', m: [[1, 1, 1, 1]] }, { c: '#f5c451', m: [[1, 1], [1, 1]] }, { c: '#c084fc', m: [[0, 1, 0], [1, 1, 1]] },
      { c: '#4ade80', m: [[0, 1, 1], [1, 1, 0]] }, { c: '#fb7185', m: [[1, 1, 0], [0, 1, 1]] }, { c: '#7aa2ff', m: [[1, 0, 0], [1, 1, 1]] }, { c: '#fb923c', m: [[0, 0, 1], [1, 1, 1]] },
    ];
    let board, cur, acc, level, lines;
    const rot = (m) => m[0].map((_, i) => m.map((row) => row[i]).reverse());
    const fits = (m, x, y) => m.every((row, r) => row.every((v, c) => !v || (x + c >= 0 && x + c < COLS && y + r < ROWS && (y + r < 0 || !board[y + r][x + c]))));
    const spawn = () => { const s = SHAPES[Math.floor(Math.random() * SHAPES.length)]; cur = { m: s.m, c: s.c, x: 3, y: -1 }; };
    const lock = (a) => {
      cur.m.forEach((row, r) => row.forEach((v, c) => { if (v && cur.y + r >= 0) board[cur.y + r][cur.x + c] = cur.c; }));
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) if (board[r].every(Boolean)) { board.splice(r, 1); board.unshift(Array(COLS).fill(null)); cleared++; r++; }
      if (cleared) { a.addScore([0, 1, 3, 5, 8][cleared]); lines += cleared; level = 1 + Math.floor(lines / 8); }
      spawn();
      if (!fits(cur.m, cur.x, cur.y + 1)) a.end('堆满了！');
    };
    const drop = (a) => { if (fits(cur.m, cur.x, cur.y + 1)) cur.y++; else lock(a); };
    return {
      id: 'tetris', name: '俄罗斯方块', icon: '🟦', lives: 0,
      desc: '← → 移动，↑ 旋转，↓ 加速，空格直接落底（手机：左右/上滑动）。消行得分：1/3/5/8。',
      start() { board = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); acc = 0; level = 1; lines = 0; spawn(); },
      key(k, down, a) {
        if (!down) return;
        if (k === 'ArrowLeft' && fits(cur.m, cur.x - 1, cur.y)) cur.x--;
        else if (k === 'ArrowRight' && fits(cur.m, cur.x + 1, cur.y)) cur.x++;
        else if (k === 'ArrowUp') { const m = rot(cur.m); for (const dx of [0, -1, 1, -2, 2]) if (fits(m, cur.x + dx, cur.y)) { cur.m = m; cur.x += dx; break; } }
        else if (k === 'ArrowDown') drop(a);
        else if (k === 'Space') { while (fits(cur.m, cur.x, cur.y + 1)) cur.y++; lock(a); }
      },
      update(dt, a) {
        acc += dt;
        const speed = Math.max(0.1, 0.8 - (level - 1) * 0.08) / (a.keys.has('ArrowDown') ? 6 : 1);
        if (acc > speed) { acc = 0; drop(a); }
      },
      draw(ctx, a) {
        a.background();
        ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(OX, OY, COLS * C, ROWS * C);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.strokeRect(OX - 0.5, OY - 0.5, COLS * C + 1, ROWS * C + 1);
        board.forEach((row, r) => row.forEach((v, c) => { if (v) a.fillRound(OX + c * C + 1, OY + r * C + 1, C - 2, C - 2, 3, v); }));
        cur.m.forEach((row, r) => row.forEach((v, c) => { if (v && cur.y + r >= 0) a.fillRound(OX + (cur.x + c) * C + 1, OY + (cur.y + r) * C + 1, C - 2, C - 2, 3, cur.c); }));
        a.text(`等级 ${level}`, OX + COLS * C + 20, 20, { align: 'left', color: a.colors.muted, size: 13 });
        a.text(`行数 ${lines}`, OX + COLS * C + 20, 40, { align: 'left', color: a.colors.muted, size: 13 });
      },
    };
  })());

  /* 18. 戳泡泡 */
  G.push((() => {
    let bubbles, spawn, t;
    return {
      id: 'bubbles', name: '戳泡泡', icon: '🫧', lives: 3,
      desc: '点击上升的泡泡把它们戳破，小泡泡分更高。让泡泡飘出顶部会扣一条命。',
      start() { bubbles = []; spawn = 0; t = 0; },
      pointer(type, x, y, b, a) {
        if (type !== 'down') return;
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const q = bubbles[i];
          if (Math.hypot(x - q.x, y - q.y) < q.r + 6) { a.addScore(q.r < 18 ? 3 : q.r < 26 ? 2 : 1); a.burst(q.x, q.y, q.c, 12); bubbles.splice(i, 1); break; }
        }
      },
      update(dt, a) {
        t += dt; spawn += dt;
        const interval = Math.max(0.35, 1 - t * 0.02);
        if (spawn > interval) { spawn = 0; bubbles.push({ x: a.rand(30, W - 30), y: H + 30, r: a.rand(12, 34), vy: a.rand(50, 100) + t * 3, ph: Math.random() * 6, c: [a.colors.blue, a.colors.purple, a.colors.green, a.colors.gold][a.randInt(0, 3)] }); }
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const q = bubbles[i]; q.y -= q.vy * dt; q.ph += dt * 2; q.x += Math.sin(q.ph) * 30 * dt;
          if (q.y + q.r < 0) { bubbles.splice(i, 1); if (a.loseLife()) return; }
        }
      },
      draw(ctx, a) {
        a.background('#0b1220', '#0b0d12');
        for (const q of bubbles) {
          ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fillStyle = q.c + '33'; ctx.fill(); ctx.strokeStyle = q.c; ctx.lineWidth = 2; ctx.stroke();
          ctx.beginPath(); ctx.arc(q.x - q.r * 0.35, q.y - q.r * 0.35, q.r * 0.2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
        }
        ctx.lineWidth = 1;
      },
    };
  })());

  /* 19. 顶球 */
  G.push((() => {
    let p, ball;
    const serve = () => { ball = { x: W / 2, y: 80, vx: (Math.random() - 0.5) * 160, vy: 0, r: 10 }; };
    return {
      id: 'juggle', name: '顶球', icon: '🎾', lives: 3,
      desc: '← → 或鼠标移动挡板，把球不停顶起来。每顶一次 +1，球落地扣一条命。',
      start() { p = { x: W / 2, target: W / 2, w: 90, h: 12 }; serve(); },
      pointer(type, x) { p.target = x; },
      update(dt, a) {
        if (a.keys.has('ArrowLeft')) p.target -= 560 * dt;
        if (a.keys.has('ArrowRight')) p.target += 560 * dt;
        p.target = a.clamp(p.target, p.w / 2, W - p.w / 2);
        p.x += (p.target - p.x) * Math.min(1, dt * 20);
        ball.vy += 700 * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -1; }
        if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx *= -1; }
        if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -0.8; }
        const py = H - 30;
        if (ball.vy > 0 && ball.y + ball.r >= py && ball.y - ball.r <= py + p.h && Math.abs(ball.x - p.x) <= p.w / 2 + ball.r) {
          ball.y = py - ball.r; ball.vy = -Math.min(620, 420 + a.score * 6); ball.vx += (ball.x - p.x) * 4;
          a.addScore(1); a.burst(ball.x, py, a.colors.gold, 8);
        }
        if (ball.y - ball.r > H) { a.burst(ball.x, H - 4, a.colors.red, 14); if (a.loseLife()) return; serve(); }
      },
      draw(ctx, a) {
        a.background('#101a14', '#0b0d12');
        ctx.save(); ctx.shadowColor = a.colors.blue; ctx.shadowBlur = 14; a.fillRound(p.x - p.w / 2, H - 30, p.w, p.h, 6, a.colors.blue); ctx.restore();
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fillStyle = '#d9f99d'; ctx.fill();
      },
    };
  })());

  /* 20. 记忆序列 */
  G.push((() => {
    const PADS = [{ c: '#fb7185', x: 0, y: 0 }, { c: '#4ade80', x: 1, y: 0 }, { c: '#7aa2ff', x: 0, y: 1 }, { c: '#f5c451', x: 1, y: 1 }];
    const S = 130, OX = (W - 2 * S - 12) / 2, OY = (H - 2 * S - 12) / 2;
    let seq, pos, phase, lit, timer;
    const next = () => { seq.push(Math.floor(Math.random() * 4)); pos = 0; phase = 'show'; lit = -1; timer = 0.5; };
    return {
      id: 'simon', name: '记忆序列', icon: '🎵', lives: 0,
      desc: '看清四色方块的闪烁顺序，然后按同样顺序点击。每轮多一步，记错即结束。',
      start() { seq = []; next(); },
      pointer(type, x, y, b, a) {
        if (type !== 'down' || phase !== 'input') return;
        const i = PADS.findIndex((p) => x >= OX + p.x * (S + 12) && x < OX + p.x * (S + 12) + S && y >= OY + p.y * (S + 12) && y < OY + p.y * (S + 12) + S);
        if (i < 0) return;
        lit = i; timer = 0.25;
        if (i !== seq[pos]) { a.burst(OX + PADS[i].x * (S + 12) + S / 2, OY + PADS[i].y * (S + 12) + S / 2, a.colors.red, 20); a.end(`记错了，序列长度 ${seq.length}`); return; }
        pos++;
        if (pos === seq.length) { a.addScore(1); phase = 'pause'; timer = 0.8; }
      },
      update(dt) {
        timer -= dt;
        if (phase === 'show') {
          if (timer <= 0) {
            if (lit >= 0) { lit = -1; timer = 0.18; if (pos >= seq.length) { phase = 'input'; pos = 0; } }
            else { lit = seq[pos]; pos++; timer = Math.max(0.25, 0.55 - seq.length * 0.02); }
          }
        } else if (phase === 'pause') { if (timer <= 0) next(); }
        else if (timer <= 0) lit = -1;
      },
      draw(ctx, a) {
        a.background('#120f1c', '#0b0d12');
        PADS.forEach((p, i) => {
          const x = OX + p.x * (S + 12), y = OY + p.y * (S + 12);
          ctx.save(); if (lit === i) { ctx.shadowColor = p.c; ctx.shadowBlur = 30; }
          a.fillRound(x, y, S, S, 16, lit === i ? p.c : p.c + '55'); ctx.restore();
        });
        a.text(phase === 'show' ? '记住顺序…' : phase === 'input' ? `轮到你了 (${pos}/${seq.length})` : '正确！', W / 2, 18, { size: 14, color: a.colors.muted });
      },
    };
  })());

  /* 21. 十秒狂点 */
  G.push((() => {
    let timer, pulse;
    return {
      id: 'clicker', name: '十秒狂点', icon: '👆', lives: 0,
      desc: '10 秒内尽可能多地点击画布（或按空格）。看看你的手速有多快！',
      start() { timer = 10; pulse = 0; },
      key(k, down, a) { if (down && k === 'Space') { a.addScore(1); pulse = 0.15; } },
      pointer(type, x, y, b, a) { if (type === 'down') { a.addScore(1); pulse = 0.15; a.burst(x, y, a.colors.gold, 6); } },
      update(dt, a) { timer -= dt; pulse = Math.max(0, pulse - dt); if (timer <= 0) a.end(`${a.score} 次 / 10 秒`); },
      draw(ctx, a) {
        a.background('#1a1410', '#0b0d12');
        const r = 70 + pulse * 120;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.fillStyle = `rgba(245,196,81,${0.25 + pulse * 2})`; ctx.fill();
        a.text(String(a.score), W / 2, H / 2 + 4, { size: 56, weight: 700 });
        a.text(`${timer.toFixed(1)}s`, W / 2, H - 30, { size: 18, color: a.colors.muted });
      },
    };
  })());

  /* 22. 找不同色 */
  G.push((() => {
    let n, odd, hue, timer, round;
    const layout = () => { const S = Math.min(300 / n, 80); return { S, OX: (W - n * S) / 2, OY: (H - n * S) / 2 }; };
    const gen = () => { round++; n = Math.min(8, 2 + Math.floor(round / 2)); odd = Math.floor(Math.random() * n * n); hue = Math.floor(Math.random() * 360); };
    return {
      id: 'oddcolor', name: '找不同色', icon: '🎨', lives: 3,
      desc: '点击颜色略有不同的那个方块。越往后格子越多、差异越小；点错扣一条命，60 秒计时。',
      start() { round = 0; timer = 60; gen(); },
      pointer(type, x, y, b, a) {
        if (type !== 'down') return;
        const { S, OX, OY } = layout();
        const c = Math.floor((x - OX) / S), r = Math.floor((y - OY) / S);
        if (c < 0 || r < 0 || c >= n || r >= n) return;
        if (r * n + c === odd) { a.addScore(round); a.burst(OX + c * S + S / 2, OY + r * S + S / 2, a.colors.gold, 12); gen(); }
        else if (a.loseLife()) return;
      },
      update(dt, a) { timer -= dt; if (timer <= 0) a.end('时间到！'); },
      draw(ctx, a) {
        a.background('#0f1116', '#0b0d12');
        const { S, OX, OY } = layout();
        const diff = Math.max(4, 22 - round * 1.2);
        for (let i = 0; i < n * n; i++) {
          const l = i === odd ? 52 + diff * 0.5 : 52;
          a.fillRound(OX + (i % n) * S + 3, OY + Math.floor(i / n) * S + 3, S - 6, S - 6, 8, `hsl(${hue} 60% ${l}%)`);
        }
        a.text(`第 ${round} 关`, 14, 18, { align: 'left', color: a.colors.muted, size: 13 });
        a.text(`${Math.ceil(timer)}s`, W - 14, 18, { align: 'right', color: timer < 10 ? a.colors.red : a.colors.muted, size: 13 });
      },
    };
  })());

  return G;
})();
