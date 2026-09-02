const USER = 'Zrr-JDI';
const API = `https://api.github.com/users/${USER}/starred?per_page=100`;
const MAX_PAGES = 10;

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Go: '#00ADD8',
  Rust: '#dea584', Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883', Swift: '#F05138',
  Kotlin: '#A97BFF', Ruby: '#701516', PHP: '#4F5D95', Dart: '#00B4AB', Lua: '#000080',
  Markdown: '#083fa1', Jupyter: '#DA5B0B', 'Jupyter Notebook': '#DA5B0B', Zig: '#ec915c',
  Scala: '#c22d40', Haskell: '#5e5086', Elixir: '#6e4a7e', Dockerfile: '#384d54',
};

const state = { events: [], query: '', language: '', sort: 'starred' };

const $ = (sel) => document.querySelector(sel);

async function loadStars() {
  const status = $('#status');
  status.textContent = '正在从 GitHub 获取最新数据…';

  let events = null;
  let source = 'GitHub API（实时）';
  try {
    events = await fetchFromGitHub();
  } catch (err) {
    console.warn('GitHub API unavailable, falling back to events.json', err);
  }

  if (!events) {
    try {
      const res = await fetch('events.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      events = await res.json();
      source = 'events.json（缓存快照）';
    } catch (err) {
      $('#starred-section').innerHTML = `<p class="empty">无法加载 starred 列表：${escapeHtml(err.message)}</p>`;
      status.textContent = '';
      return;
    }
  }

  state.events = normalize(events);
  $('#source').textContent = `数据来源：${source}`;
  status.textContent = '';
  populateLanguages();
  updateStats();
  render();
}

async function fetchFromGitHub() {
  const out = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(`${API}&page=${page}`, {
      headers: { Accept: 'application/vnd.github.star+json' },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const batch = await res.json();
    if (!Array.isArray(batch)) throw new Error('Unexpected API payload');
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

function normalize(events) {
  return events
    .map((evt) => {
      const r = evt.repo || {};
      return {
        starred_at: evt.starred_at || null,
        name: r.full_name || r.name || 'unknown',
        html_url: r.html_url || '#',
        description: r.description || '',
        language: r.language || '',
        stars: r.stargazers_count || 0,
        topics: Array.isArray(r.topics) ? r.topics.slice(0, 5) : [],
        archived: Boolean(r.archived),
        fork: Boolean(r.fork),
      };
    })
    .sort((a, b) => new Date(b.starred_at || 0) - new Date(a.starred_at || 0));
}

function populateLanguages() {
  const counts = new Map();
  for (const e of state.events) if (e.language) counts.set(e.language, (counts.get(e.language) || 0) + 1);
  const select = $('#language');
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [lang, n] of sorted) {
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = `${lang} (${n})`;
    select.appendChild(opt);
  }
}

function updateStats() {
  const total = state.events.reduce((s, e) => s + e.stars, 0);
  const langs = new Set(state.events.map((e) => e.language).filter(Boolean)).size;
  $('[data-stat="count"]').textContent = state.events.length.toLocaleString();
  $('[data-stat="stars"]').textContent = compact(total);
  $('[data-stat="languages"]').textContent = langs;
}

function filtered() {
  const q = state.query.trim().toLowerCase();
  let list = state.events.filter((e) => {
    if (state.language && e.language !== state.language) return false;
    if (!q) return true;
    return (
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.topics.some((t) => t.includes(q))
    );
  });
  if (state.sort === 'stars') list = [...list].sort((a, b) => b.stars - a.stars);
  else if (state.sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function render() {
  const list = $('#starred-list');
  list.innerHTML = '';
  const items = filtered();

  if (items.length === 0) {
    list.innerHTML = `<li class="empty">${state.events.length ? '没有匹配的仓库。' : '没有收藏的仓库。'}</li>`;
    return;
  }

  const groupByMonth = state.sort === 'starred';
  let currentMonth = null;
  let i = 0;

  for (const e of items) {
    if (groupByMonth) {
      const m = monthKey(e.starred_at);
      if (m !== currentMonth) {
        currentMonth = m;
        const h = document.createElement('li');
        h.className = 'month';
        h.innerHTML = m ? `<b>${m.split(' ')[0]}</b> ${m.split(' ')[1]}` : '未知时间';
        list.appendChild(h);
      }
    }
    list.appendChild(renderItem(e, i++));
  }
}

function renderItem(e, index) {
  const li = document.createElement('li');
  li.className = 'star-item';
  li.style.setProperty('--i', Math.min(index, 20));

  const [owner, repo] = e.name.includes('/') ? e.name.split('/') : ['', e.name];
  const badges = [e.archived && 'archived', e.fork && 'fork'].filter(Boolean)
    .map((b) => `<span class="badge">${b}</span>`).join('');

  const langColor = LANG_COLORS[e.language] || '#8a90a2';
  const when = e.starred_at
    ? `<time datetime="${e.starred_at}">收藏于 ${new Date(e.starred_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</time>`
    : '';
  const topics = e.topics.length
    ? `<span class="topics">${e.topics.map((t) => `<span class="topic">${escapeHtml(t)}</span>`).join('')}</span>`
    : '';

  li.innerHTML = `
    <div class="row">
      <a class="repo-name" href="${escapeAttr(e.html_url)}" target="_blank" rel="noopener noreferrer">
        ${owner ? `<span class="owner">${escapeHtml(owner)}/</span>` : ''}${escapeHtml(repo)}
      </a>
      ${badges}
    </div>
    <div class="repo-stats" title="${e.stars.toLocaleString()} stars">★ ${compact(e.stars)}</div>
    ${e.description ? `<p class="desc">${escapeHtml(e.description)}</p>` : ''}
    <div class="meta">
      ${e.language ? `<span class="pill" style="--lang:${langColor}">${escapeHtml(e.language)}</span>` : ''}
      ${when}
      ${topics}
    </div>
  `;
  return li;
}

function monthKey(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()} ${String(d.getMonth() + 1).padStart(2, '0')}月`;
}

function compact(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s);
}

function bind() {
  $('#search').addEventListener('input', (ev) => { state.query = ev.target.value; render(); });
  $('#language').addEventListener('change', (ev) => { state.language = ev.target.value; render(); });
  $('#sort').addEventListener('change', (ev) => { state.sort = ev.target.value; render(); });
}

document.addEventListener('DOMContentLoaded', () => { bind(); loadStars(); });
