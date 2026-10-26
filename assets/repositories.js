(() => {
  'use strict';
  const cacheKey = 'joefiorica.repositories.v1';
  const cacheLifetime = 15 * 60 * 1000;
  const entries = new Map([...document.querySelectorAll('.repositories li')].map(item => [
    new URL(item.querySelector('a').href).pathname.slice(1).toLowerCase(), item,
  ]));
  if (!entries.size) return;

  const isDescription = value => value === null || (typeof value === 'string' && value.length <= 2000);
  function render(descriptions) {
    for (const [name, item] of entries) {
      const description = descriptions[name];
      let paragraph = item.querySelector('.repository-description');
      if (typeof description !== 'string' || !description) {
        paragraph?.remove();
        continue;
      }
      if (!paragraph) {
        paragraph = document.createElement('p');
        paragraph.className = 'repository-description';
        item.append(paragraph);
      }
      paragraph.textContent = description;
    }
  }

  let cached;
  try {
    const value = JSON.parse(localStorage.getItem(cacheKey));
    if (value && Number.isFinite(value.savedAt) && value.savedAt <= Date.now()
        && value.descriptions && typeof value.descriptions === 'object'
        && !Array.isArray(value.descriptions) && Object.values(value.descriptions).every(isDescription)) {
      cached = value;
    }
  } catch { /* Descriptions still load when storage is unavailable. */ }
  if (cached) {
    render(cached.descriptions);
    if (Date.now() - cached.savedAt < cacheLifetime) return;
  }

  async function refresh() {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    try {
      const descriptions = {};
      for (let page = 1; page <= 10; page++) {
        const response = await fetch(`https://api.github.com/users/JoeFiorica/repos?per_page=100&page=${page}`, {
          headers: { Accept: 'application/vnd.github+json' },
          credentials: 'omit',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Repository metadata unavailable');
        const repositories = await response.json();
        if (!Array.isArray(repositories)) throw new Error('Invalid repository metadata');
        for (const repository of repositories) {
          if (!repository || typeof repository.full_name !== 'string') continue;
          const name = repository.full_name.toLowerCase();
          if (entries.has(name) && isDescription(repository.description)) {
            descriptions[name] = repository.description;
          }
        }
        const complete = Object.keys(descriptions).length === entries.size
          || !/rel="next"/.test(response.headers.get('link') || '');
        if (complete) {
          render(descriptions);
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), descriptions }));
          } catch { /* The current visit still has fresh descriptions. */ }
          return;
        }
      }
    } catch { /* Keep cached descriptions or the always-available repository links. */ }
    finally { window.clearTimeout(timer); }
  }

  refresh();
})();
