async function loadStars(){
  try{
    const res = await fetch('events.json');
    if(!res.ok) throw new Error('Network response was not ok');
    const events = await res.json();
    renderList(events);
  }catch(err){
    const container = document.getElementById('starred-section') || document.body;
    container.innerHTML = `<p class="empty">无法加载 starred 列表：${err.message}</p>`;
    console.error(err);
  }
}

function renderList(events){
  const list = document.getElementById('starred-list');
  if(!list) return;
  list.innerHTML = '';
  if(!events || events.length === 0){
    list.innerHTML = '<li class="empty">没有收藏的仓库。</li>';
    return;
  }

  events.forEach(evt => {
    const r = evt.repo || {};
    const li = document.createElement('li');
    li.className = 'star-item';

    const title = document.createElement('div');
    title.className = 'row';

    const link = document.createElement('a');
    link.href = r.html_url || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = r.name || 'unknown';

    const stats = document.createElement('div');
    stats.className = 'repo-stats';
    stats.textContent = `⭐ ${r.stargazers_count || 0}`;

    title.appendChild(link);
    title.appendChild(stats);

    const desc = document.createElement('div');
    desc.textContent = r.description || '';

    const meta = document.createElement('div');
    meta.className = 'meta';
    const lang = r.language ? `<span class="pill">${r.language}</span>` : '';
    const when = evt.starred_at ? ` • 收藏于 ${new Date(evt.starred_at).toLocaleDateString()}` : '';
    meta.innerHTML = `${lang}${when}`;

    li.appendChild(title);
    if(r.description) li.appendChild(desc);
    li.appendChild(meta);

    list.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', loadStars);
