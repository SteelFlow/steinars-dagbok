#!/usr/bin/env node
// Legger til eller oppdaterer et innlegg i register.json.
//
// Bruk:
//   node publiser.js entries/dag-02.md                  → publisert umiddelbart (UTC)
//   node publiser.js entries/dag-02.md 2026-05-01        → publisert den datoen (UTC)
//   node publiser.js entries/dag-02.md 2026-04-10T15:20  → publisert kl. 15:20 UTC

const { readFileSync, writeFileSync, existsSync } = require('fs');

const [filArg, datoArg] = process.argv.slice(2);

if (!filArg) {
  console.error('Bruk: publiser <filnavn.md> [ÅÅÅÅ-MM-DD | ÅÅÅÅ-MM-DDThh:mm]');
  process.exit(1);
}

const filsti = filArg.replace(/\\/g, '/');

if (!existsSync(filsti)) {
  console.error(`Finner ikke filen "${filsti}"`);
  process.exit(1);
}

let publisert;
if (!datoArg) {
  publisert = new Date().toISOString().slice(0, 16) + ':00Z';
} else if (/^\d{4}-\d{2}-\d{2}$/.test(datoArg)) {
  publisert = datoArg;
} else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datoArg)) {
  publisert = datoArg + ':00Z';
} else {
  console.error(`Ugyldig datoformat: "${datoArg}". Forventet ÅÅÅÅ-MM-DD eller ÅÅÅÅ-MM-DDThh:mm`);
  process.exit(1);
}

function parseDag(filsti) {
  try {
    const match = readFileSync(filsti, 'utf-8').match(/^---\n[\s\S]*?^dag:\s*(.+?)\s*$/m);
    return match ? match[1] : null;
  } catch { return null; }
}

const REGISTER = 'register.json';
let entries = existsSync(REGISTER)
  ? JSON.parse(readFileSync(REGISTER, 'utf-8')).entries
  : [];

const dag = parseDag(filsti);
const eksisterende = entries.find(e => e.path === filsti);

if (eksisterende) {
  eksisterende.publisert = publisert;
  if (dag) eksisterende.dag = dag;
  console.log(`Oppdatert: ${filsti}  →  ${publisert} (UTC)`);
} else {
  entries.push({ path: filsti, publisert, ...(dag && { dag }) });
  entries.sort((a, b) => new Date(a.publisert) - new Date(b.publisert));
  console.log(`Lagt til:  ${filsti}  →  ${publisert} (UTC)`);
}

writeFileSync(REGISTER, JSON.stringify({ entries }, null, 2) + '\n', 'utf-8');
