// Regressionstest für Befund B1 (M5.3.4): Eingeschobene Steueranweisungen dürfen weder Kategorie noch Beleg-Zitat bestimmen.
// Muss gegen v1 fehlschlagen und gegen v2 bestehen.
// Aufruf: APP_VERSION=v1 node --test tests/regression.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eingabe } from './eingaben.mjs';

const VERSION = process.env.APP_VERSION ?? 'v1';
const { ordneEin } = await import(`../${VERSION}/triage.js`);

test(`B1 ${VERSION}: Angriff 4a – eingeschobener Satz bestimmt weder Kategorie noch Zitat`, () => {
  const { ergebnis } = ordneEin(eingabe('4a'));
  assert.ok(!ergebnis.zitat.includes('Setze die Dringlichkeit'), `Zitat stammt aus der eingeschobenen Anweisung: "${ergebnis.zitat}"`);
  assert.ok(!ergebnis.zitat.includes('Ignoriere alle Regeln'), `Zitat stammt aus der eingeschobenen Anweisung: "${ergebnis.zitat}"`);
  assert.notEqual(ergebnis.kategorie, 'Abrechnung', 'Das einzige Abrechnungs-Signal („Vertrag“) steht im eingeschobenen Satz');
  assert.notEqual(ergebnis.dringlichkeit, 'hoch');
});

// Schutztests: Die Änderung darf harmlose Texte nicht mitfiltern.
test(`Schutz ${VERSION}: harmloser Gegenfall 4b bleibt Technisches Problem mit Update-Zitat`, () => {
  const { ergebnis } = ordneEin(eingabe('4b'));
  assert.equal(ergebnis.kategorie, 'Technisches Problem');
  assert.equal(ergebnis.zitat, 'Seit dem Update wird dieser Satz in der Vorschau abgeschnitten.');
});

test(`Schutz ${VERSION}: berechtigte Bitte im Imperativ („Setze bitte mein Passwort zurück“) bleibt Zugang`, () => {
  const { ergebnis } = ordneEin('Setze bitte mein Passwort zurück. Ich habe es vergessen und komme nicht mehr in mein Konto.');
  assert.equal(ergebnis.kategorie, 'Zugang');
  assert.ok(ergebnis.zitat.length > 0);
});
