// Ergebnisfeld über seine sichtbare Bezeichnung finden: Begriff (term) → zugehörige Definition.
// Chromium vergibt für <dd aria-labelledby> keinen zugänglichen Namen, daher nicht getByRole('definition', { name }).
export function feld(ergebnis, bezeichnung) {
  return ergebnis
    .locator('div')
    .filter({ has: ergebnis.page().getByRole('term').filter({ hasText: new RegExp(`^${bezeichnung}$`) }) })
    .getByRole('definition');
}
