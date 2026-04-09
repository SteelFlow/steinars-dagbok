// Legg til nye innlegg her i kronologisk rekkefølge:
const entries = [
  'entries/dag-01.md',
];

const container = document.getElementById('entries-container');

async function loadAll() {
  try {
    const texts = await Promise.all(entries.map(async path => {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Kunne ikke laste ${path}: ${res.status}`);
      return res.text();
    }));
    container.innerHTML = texts.map(renderEntry).join('\n');
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
          Kjør f.eks. <code style="color:#fff">npx serve .</code> i denne mappen,<br>
          eller bruk GitHub Pages / Netlify for publisering.
        </span>
      </div>`;
  }
}

loadAll();
