const container = document.getElementById('entries-container');

async function loadAll() {
  try {
    const res = await fetch('manifest.json');
    if (!res.ok) throw new Error(`Kunne ikke laste manifest.json: ${res.status}`);
    const { entries } = await res.json();

    const now = new Date();

    const synlige = entries.filter(({ publisert }) => !publisert || new Date(publisert) <= now);

    const texts = await Promise.all(synlige.map(async ({ path }) => {
      const r = await fetch(path);
      if (!r.ok) throw new Error(`Kunne ikke laste ${path}: ${r.status}`);
      return r.text();
    }));

    const rendered = texts.map(renderEntry);

    container.innerHTML = rendered.join('\n') || '<p>Ingen innlegg ennå.</p>';
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

loadAll();
