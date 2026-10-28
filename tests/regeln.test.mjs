// Automatisierter Regeltest (M5.3.2): eindeutig prüfbare Regeln aus dem Prüfvertrag.
// Aufruf: APP_VERSION=v1 node --test tests/regeln.test.mjs
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { EINGABEN, UEBERLANG, eingabe } from './eingaben.mjs';

const VERSION = process.env.APP_VERSION ?? 'v1';
const { ordneEin, KATEGORIEN, DRINGLICHKEITEN, MAX_ZEICHEN } = await import(`../${VERSION}/triage.js`);

const GUELTIG = EINGABEN.filter((e) => ['1', '4a', '4b', '5'].includes(e.id));

// Ein Zitat ist "wörtlich", wenn es zeichengenau in der Eingabe steht und dort kein Wort oder Token zerschneidet.
function istGanzerAusschnitt(text, zitat) {
  const wortzeichen = /[\p{L}\p{N}_]/u;
  for (let start = text.indexOf(zitat); start !== -1; start = text.indexOf(zitat, start + 1)) {
    const davor = text[start - 1] ?? ' ';
    const danach = text[start + zitat.length] ?? ' ';
    if (!wortzeichen.test(davor) && !wortzeichen.test(danach)) return true;
  }
  return false;
}

describe(`Regeltest ${VERSION}`, () => {
  describe('R10 Leerfall', () => {
    for (const [name, text] of [['leer', ''], ['nur Leerzeichen (Prüfeingabe 2)', eingabe('2')], ['Tabs und Zeilenumbrüche', '\t\n  \n']]) {
      test(`${name}: abgelehnt, verständliche Meldung, kein Ergebnis`, () => {
        const antwort = ordneEin(text);
        assert.equal(antwort.ok, false);
        assert.equal(antwort.ergebnis, undefined);
        assert.equal(antwort.fehler.grund, 'leer');
        assert.match(antwort.fehler.meldung, /Supportanfrage ein/);
      });
    }
  });

  describe('R11 Längengrenze', () => {
    test('genau 5.000 Zeichen werden angenommen', () => {
      const antwort = ordneEin('a'.repeat(MAX_ZEICHEN));
      assert.equal(MAX_ZEICHEN, 5000);
      assert.equal(antwort.ok, true);
    });
    test('5.001 Zeichen werden abgelehnt, kein Ergebnis', () => {
      const antwort = ordneEin('a'.repeat(5001));
      assert.equal(antwort.ok, false);
      assert.equal(antwort.ergebnis, undefined);
      assert.equal(antwort.fehler.grund, 'zu_lang');
      assert.match(antwort.fehler.meldung, /5\.000/);
    });
    test('Prüfeingabe 3 (über 5.000 Zeichen) wird abgelehnt, kein Ergebnis', () => {
      assert.ok(Array.from(UEBERLANG).length > 5000);
      const antwort = ordneEin(UEBERLANG);
      assert.equal(antwort.ok, false);
      assert.equal(antwort.ergebnis, undefined);
      assert.equal(antwort.fehler.grund, 'zu_lang');
    });
    test('Leerraum am Rand zählt nicht: 5.000 Zeichen plus Leerzeichen werden angenommen', () => {
      assert.equal(ordneEin(`  ${'a'.repeat(5000)}  \n`).ok, true);
    });
  });

  describe('R2/R3 erlaubte Werte', () => {
    for (const { id, text } of GUELTIG) {
      test(`Eingabe ${id}: Kategorie und Dringlichkeit stammen aus den erlaubten Listen`, () => {
        const { ergebnis } = ordneEin(text);
        assert.ok(KATEGORIEN.includes(ergebnis.kategorie), `Kategorie "${ergebnis.kategorie}"`);
        assert.ok(DRINGLICHKEITEN.includes(ergebnis.dringlichkeit), `Dringlichkeit "${ergebnis.dringlichkeit}"`);
        assert.deepEqual(KATEGORIEN, ['Zugang', 'Abrechnung', 'Technisches Problem', 'Sonstiges']);
        assert.deepEqual(DRINGLICHKEITEN, ['niedrig', 'mittel', 'hoch']);
      });
    }
  });

  describe('R6 wörtliches Beleg-Zitat', () => {
    for (const { id, text } of GUELTIG) {
      test(`Eingabe ${id}: Zitat ist zeichengenauer Ausschnitt aus vollständigen Wörtern`, () => {
        const { ergebnis } = ordneEin(text);
        assert.ok(ergebnis.zitat.length > 0, 'Zitat ist leer');
        assert.ok(text.includes(ergebnis.zitat), `Zitat steht nicht in der Eingabe: "${ergebnis.zitat}"`);
        assert.ok(istGanzerAusschnitt(text, ergebnis.zitat), `Zitat schneidet ein Wort/Token ab: "${ergebnis.zitat}"`);
      });
    }
  });
});
