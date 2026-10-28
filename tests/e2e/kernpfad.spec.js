// M5.3.3 Browser-Kernpfad: genau ein Kernpfad, gegen die öffentliche URL (BASE_URL).
import { test, expect } from '@playwright/test';
import { eingabe } from '../eingaben.mjs';
import { feld } from './hilfen.js';

const ANFRAGE = eingabe('1');

test('Kernpfad: Normalfall → Zugang, hoch, konkreter Schritt, wörtliches Zitat', async ({ page }, testInfo) => {
  // Start: App geöffnet, leeres Textfeld, keine Ergebnis-Karte
  await page.goto('./');
  const textfeld = page.getByLabel('Supportanfrage', { exact: true });
  const ergebnis = page.getByRole('region', { name: 'Ergebnis' });
  await expect(textfeld).toBeVisible();
  await expect(textfeld).toHaveValue('');
  await expect(ergebnis).toBeHidden();
  await expect(page.getByRole('status')).toHaveText(/^Bereit/);

  // Aktionen: Text eingeben, „Anfrage einordnen“ klicken, auf Ergebnis warten
  await textfeld.fill(ANFRAGE);
  await page.getByRole('button', { name: 'Anfrage einordnen' }).click();
  await expect(ergebnis).toBeVisible();
  await expect(page.getByRole('status')).toHaveText(/^Erfolg/);

  // Bestanden
  await expect(feld(ergebnis, 'Kategorie')).toHaveText('Zugang');
  await expect(feld(ergebnis, 'Dringlichkeit')).toHaveText('hoch');

  const schritt = feld(ergebnis, 'Nächster Schritt');
  await expect(schritt).toBeVisible();
  await expect(schritt).toHaveText(/.{30,}/);
  await expect(schritt).toHaveText(/sperr|zugang|konto|anmeld|passwort/i);

  const zitat = feld(ergebnis, 'Beleg-Zitat aus der Anfrage');
  await expect(zitat).toBeVisible();
  await expect(zitat).toHaveText(/\S/);
  const zitatText = (await zitat.textContent()).trim();
  expect(ANFRAGE, 'Zitat muss wörtlich in der Eingabe stehen').toContain(zitatText);

  // Nicht bestanden: erfundene Konto- oder Vertragsdaten, sichtbarer Fehlerzustand
  await expect(page.getByRole('alert')).toBeHidden();
  const ausgabeOhneZitat = (await ergebnis.innerText()).replace(zitatText, '');
  expect(ausgabeOhneZitat, 'keine Nummern, die nicht in der Eingabe stehen').not.toMatch(/\d/);
  expect(ausgabeOhneZitat).not.toMatch(/kundennummer|kontonummer|vertragsnummer|bestellnummer|iban|premium|tarif|garantie/i);

  await testInfo.attach('kernpfad-ergebnis', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });

  // Cleanup: Eingabe leeren, keine persistenten Daten
  await textfeld.fill('');
  await expect(textfeld).toHaveValue('');
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});
