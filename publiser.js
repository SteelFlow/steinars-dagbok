#!/usr/bin/env node
// Legger til eller oppdaterer et innlegg i register.json.
//
// Bruk:
//   publiser dag-02.md                   → publisert nå
//   publiser dag-02.md 2026-05-01        → publisert midnatt norsk tid
//   publiser dag-02.md 2026-04-10T15:20  → publisert kl. 15:20 norsk tid

const { readFileSync, writeFileSync, existsSync } = require('fs');
const path = require('path');

const [filArg, datoArg] = process.argv.slice(2);

if (!filArg) {
  console.error('Bruk: publiser <filnavn.md> [ÅÅÅÅ-MM-DD | ÅÅÅÅ-MM-DDThh:mm]');
  process.exit(1);
}

const filsti = `${filArg}`;

if (!existsSync(filsti)) {
  console.warn(`Advarsel: finner ikke filen "${filsti}"`);
  process.exit(1);
}

// Konverterer et klokkeslett i norsk tid (Europe/Oslo) til UTC ISO-streng.
// Teknikken: lag datoen som om den var UTC, finn hva Oslo-klokka da viser,
// beregn offsettet, og trekk det fra.
function norskTidTilUTC(dato, tid) {
  const tentativ = new Date(`${dato}T${tid}:00.000Z`);

  const deler = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Oslo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(tentativ);

  const f = type => deler.find(p => p.type === type).value;
  const time = f('hour') === '24' ? '00' : f('hour'); // kant: midnatt
  const osloISO = `${f('year')}-${f('month')}-${f('day')}T${time}:${f('minute')}:${f('second')}.000Z`;

  const offsetMs = new Date(osloISO).getTime() - tentativ.getTime();
  return new Date(tentativ.getTime() - offsetMs).toISOString();
}

let publisert;
if (!datoArg) {
  publisert = new Date().toISOString();
} else if (/^\d{4}-\d{2}-\d{2}$/.test(datoArg)) {
  publisert = norskTidTilUTC(datoArg, '00:00');
} else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datoArg)) {
  const [dato, tid] = datoArg.split('T');
  publisert = norskTidTilUTC(dato, tid);
} else {
  console.error(`Ugyldig datoformat: "${datoArg}"`);
  console.error('Forventet: ÅÅÅÅ-MM-DD eller ÅÅÅÅ-MM-DDThh:mm');
  process.exit(1);
}

const REGISTER = 'register.json';
let entries = existsSync(REGISTER)
  ? JSON.parse(readFileSync(REGISTER, 'utf-8')).entries
  : [];

const eksisterende = entries.find(e => e.path === filsti);
const norskVisning = new Date(publisert).toLocaleString('nb-NO', { timeZone: 'Europe/Oslo' });

if (eksisterende) {
  eksisterende.publisert = publisert;
  console.log(`Oppdatert: ${filsti}  →  ${norskVisning} (norsk tid)`);
} else {
  entries.push({ path: filsti, publisert });
  entries.sort((a, b) => a.path.localeCompare(b.path));
  console.log(`Lagt til:  ${filsti}  →  ${norskVisning} (norsk tid)`);
}

writeFileSync(REGISTER, JSON.stringify({ entries }, null, 2) + '\n', 'utf-8');
