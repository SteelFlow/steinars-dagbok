marked.use({
  renderer: {
    image({ href, title, text }) {
      return `<div class="screenshot"><img src="${href}" alt="${text}"></div>`
        + (title ? `<div class="screenshot-caption">${title}</div>` : '');
    }
  }
});

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon !== -1) meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  });
  return { meta, body: match[2] };
}

function renderEntry(text) {
  const { meta, body } = parseFrontmatter(text);
  return `
    <article class="entry">
      <div class="entry-header">
        <div class="day-badge">DAG ${meta.dag || '?'}</div>
        <div class="entry-meta">
          <div class="entry-title">${meta.tittel || ''}</div>
          <div class="meta-tags">
            ${meta.biom ? `<span class="tag biome">${meta.biom}</span>` : ''}
            ${meta.koordinater ? `<span class="tag coords">${meta.koordinater}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="entry-body">${marked.parse(body)}</div>
    </article>`;
}
