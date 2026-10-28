// M5.3.2 Prüfprotokoll: alle sechs Prüfeingaben gegen die öffentliche URL (BASE_URL).
// Hält pro Eingabe das tatsächliche Ergebnis (JSON) und einen Screenshot als Beleg fest.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { EINGABEN } from '../eingaben.mjs';
import { feld as feldLocator } from './hilfen.js';

const VERSION = process.env.APP_VERSION ?? 'v1';
const ORDNER = path.join('belege', VERSION, 'protokoll');
fs.mkdirSync(ORDNER, { recursive: true });

// Soll-Einordnung aus PRUEFVERTRAG.md
const SOLL = {
  '1': { ergebnis: true, kategorie: 'Zugang', dringlichkeit: 'hoch', unklar: false, zitat: /gesperrt|nicht anmelden/ },
  '2': { ergebnis: false, meldung: /Supportanfrage ein/ },
  '3': { ergebnis: false, meldung: /5\.000/ },
  '4a': { ergebnis: true, kategorie: 'Zugang', dringlichkeit: 'niedrig', unklar: false, zitat: /E-Mail-Adresse/ },
  '4b': { ergebnis: true, kategorie: 'Technisches Problem', dringlichkeit: 'niedrig', unklar: false, zitat: /Vorschau abgeschnitten/ },
  '5': { ergebnis: true, kategorie: 'Sonstiges', dringlichkeit: 'niedrig', unklar: true, zitat: /^screenshot_final_neu\.png$/ },
};
const ERFUNDEN = /kundennummer|kontonummer|vertragsnummer|bestellnummer|iban|premium|garant|minuten/i;

async function lies(page) {
  const ergebnis = page.getByRole('region', { name: 'Ergebnis' });
  const meldung = page.getByRole('alert');
  const sichtbar = await ergebnis.isVisible();
  const feld = async (name) => (sichtbar ? (await feldLocator(ergebnis, name).textContent()).trim() : null);
  return {
    status: (await page.getByRole('status').textContent()).trim(),
    fehlermeldung: (await meldung.isVisible()) ? (await meldung.textContent()).trim() : null,
    ergebnisSichtbar: sichtbar,
    unklarMarkierung: sichtbar ? await ergebnis.getByText('unklar', { exact: true }).isVisible() : false,
    kategorie: await feld('Kategorie'),
    dringlichkeit: await feld('Dringlichkeit'),
    naechsterSchritt: await feld('Nächster Schritt'),
    zitat: await feld('Beleg-Zitat aus der Anfrage'),
    begruendung: sichtbar ? (await page.locator('#begruendung').textContent()).trim() : null,
  };
}

for (const e of EINGABEN) {
  test(`Eingabe ${e.id} – ${e.gruppe}`, async ({ page, baseURL }) => {
    const fremdeAnfragen = [];
    const browserFehler = [];
    page.on('request', (r) => {
      if (new URL(r.url()).origin !== new URL(baseURL).origin) fremdeAnfragen.push(r.url());
    });
    page.on('pageerror', (err) => browserFehler.push(err.message));

    await page.goto('./');
    const textfeld = page.getByLabel('Supportanfrage', { exact: true });
    await textfeld.fill(e.text);
    await expect.soft(textfeld, 'R11: keine stille Kürzung im Textfeld').toHaveValue(e.text);
    await page.getByRole('button', { name: 'Anfrage einordnen' }).click();
    await expect.soft(page.getByRole('status'), 'R12: Verarbeitung sichtbar').toHaveText(/^Verarbeitung/);
    await expect(page.getByRole('status')).toHaveText(/^(Erfolg|Unklare Anfrage|Fehler)/);

    const ist = { ...(await lies(page)), fremdeAnfragen, browserFehler };
    const protokoll = { version: VERSION, url: baseURL, zeitpunkt: new Date().toISOString(), eingabe: { id: e.id, gruppe: e.gruppe, zeichen: Array.from(e.text.trim()).length }, ist };
    fs.writeFileSync(path.join(ORDNER, `${e.id}.json`), JSON.stringify(protokoll, null, 2));
    await page.screenshot({ path: path.join(ORDNER, `${e.id}.png`), fullPage: true });

    const soll = SOLL[e.id];
    expect.soft(browserFehler, 'kein Absturz (keine JS-Fehler)').toEqual([]);
    expect.soft(fremdeAnfragen, 'R13: keine externen Anfragen').toEqual([]);
    expect.soft(ist.ergebnisSichtbar, soll.ergebnis ? 'Ergebnis erwartet' : 'kein Ergebnis erwartet').toBe(soll.ergebnis);

    if (!soll.ergebnis) {
      expect.soft(ist.status, 'Zustand Fehler').toMatch(/^Fehler/);
      expect.soft(ist.fehlermeldung ?? '', 'verständliche Meldung').toMatch(soll.meldung);
      return;
    }
    expect.soft(ist.kategorie, 'R2 Kategorie').toBe(soll.kategorie);
    expect.soft(ist.dringlichkeit, 'R3/R4 Dringlichkeit').toBe(soll.dringlichkeit);
    expect.soft(ist.unklarMarkierung, 'R7 Markierung „unklar“').toBe(soll.unklar);
    expect.soft(ist.status, 'R12 Zustand').toMatch(soll.unklar ? /^Unklare Anfrage/ : /^Erfolg/);
    expect.soft(ist.naechsterSchritt ?? '', 'R1/R5 nächster Schritt').toMatch(/.{30,}/);
    expect.soft(e.text, 'R6 Zitat wörtlich in der Eingabe').toContain(ist.zitat);
    expect.soft(ist.zitat, 'R6/R9 Zitat belegt das Anliegen').toMatch(soll.zitat);
    expect.soft(`${ist.kategorie} ${ist.naechsterSchritt} ${ist.begruendung}`, 'R8 keine erfundenen Daten').not.toMatch(ERFUNDEN);
  });
}
