# stargazers-log

我已星标的存储库的日志 — a live, searchable timeline of the repositories [@Zrr-JDI](https://github.com/Zrr-JDI) has starred.

## How it works

- `index.html` / `style.css` / `script.js` — a static page, deployed to GitHub Pages by `.github/workflows/deploy.yml`.
- On load the page fetches the starred list directly from the GitHub API (`/users/Zrr-JDI/starred`, with `starred_at` timestamps). If the API is unavailable or rate-limited, it falls back to `events.json`.
- `game.js` — a tiny canvas arcade engine (game picker, HUD, overlay, keyboard / mouse / touch + swipe input, per-game best scores in `localStorage`), collapsed behind the "玩个小游戏" button.
- `games.js` — the 22 mini-games plugged into that engine: 接星星, 躲陨石, 贪吃蛇, 打砖块, 乒乒, 飞翔小鸟, 记忆翻牌, 2048, 反应测试, 打地鼠, 小恐龙, 扫雷, 井字棋, 数字华容道, 太空射击, 迷宫, 俄罗斯方块, 戳泡泡, 顶球, 记忆序列, 十秒狂点, 找不同色. Each game is a plain object `{ id, name, icon, desc, lives, start, update, draw, key?, pointer? }`, so adding another one is a single entry.
- `.github/workflows/update-stars.yml` refreshes `events.json` every day (and on demand via *Run workflow*) so the fallback stays fresh.

Features: month-grouped timeline, search, language filter, sort by recency / stars / name, topic chips, and summary stats.

## Local preview

```bash
python3 -m http.server 8080
# open http://localhost:8080
```
