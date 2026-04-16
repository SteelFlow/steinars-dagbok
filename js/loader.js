const container = document.getElementById('entries-container');
const entryNav = document.getElementById('entry-nav');

function slugFromPath(path) {
  return path.replace(/^.*[/\\]/, '').replace(/\.md$/, '');
}

async function loadRegister() {
  const res = await fetch('register.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Kunne ikke laste register.json: ${res.status}`);
  const { entries } = await res.json();
  const now = new Date();
  return entries.filter(({ publisert }) => !publisert || new Date(publisert) <= now);
}

async function loadEntry(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`Kunne ikke laste ${path}: ${r.status}`);
  return r.text();
}

async function showSingle(entries, slug) {
  const idx = entries.findIndex(e => slugFromPath(e.path) === slug);
  if (idx === -1) {
    container.innerHTML = `<p style="text-align:center;padding:3rem;font-family:'VT323',monospace;color:var(--gold);font-size:1.4rem;">Innlegg ikke funnet. <a href="#" onclick="location.hash='';return false;">← Tilbake</a></p>`;
    return;
  }

  const prev = entries[idx - 1];
  const next = entries[idx + 1];

  const text = await loadEntry(entries[idx].path);

  const dagLabel = e => e.dag ?? parseInt(slugFromPath(e.path).match(/(\d+)$/)?.[1], 10);

  entryNav.innerHTML = `
    <div>${prev ? `<a href="#${slugFromPath(prev.path)}">← DAG ${dagLabel(prev)}</a>` : ''}</div>
    <div>${next ? `<a href="#${slugFromPath(next.path)}">DAG ${dagLabel(next)} →</a>` : ''}</div>`;
  entryNav.hidden = false;

  container.innerHTML = renderEntry(text, slug);
}

async function showAll(entries) {
  entryNav.innerHTML = '';
  entryNav.hidden = true;
  const resultater = await Promise.allSettled(entries.map(({ path }) => loadEntry(path)));

  resultater
    .filter(r => r.status === 'rejected')
    .forEach(r => console.error(r.reason));

  const rendered = resultater
    .filter(r => r.status === 'fulfilled')
    .map((r, i) => renderEntry(r.value, slugFromPath(entries[i].path)));

  container.innerHTML = rendered.join('\n') || '<p>Ingen innlegg å vise.</p>';
}

async function route() {
  container.innerHTML = '<div class="loading">Laster dagboken ▌</div>';
  try {
    const entries = await loadRegister();
    const hash = location.hash.slice(1);
    if (hash) {
      await showSingle(entries, hash);
    } else {
      await showAll(entries);
    }
  } catch (err) {
    container.innerHTML = `
      <div style="
        font-family:'VT323',monospace;
        color:#c0392b;
        font-size:1.3rem;
        padding:2rem;
        text-align:center;
        letter-spacing:1px;
      ">
        ⚠ Feil ved lasting av dagbok:<br><br>
        ${err.message}<br><br>
        <span style="color:#888;font-size:1rem;">
          Merk: fetch() krever en lokal webserver.<br>
        </span>
      </div>`;
  }
}

window.addEventListener('hashchange', route);
route();
