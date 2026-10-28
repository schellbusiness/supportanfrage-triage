# Prüfvertrag – Supportanfrage - Triage

**Nutzerziel (Kernpfad):** Als Support-Mitarbeiterin möchte ich eine eingefügte Kundenanfrage mit einem Klick einordnen lassen. So sehe ich sofort, worum es geht, wie dringend es ist und was ich als Nächstes tue. Ein Zitat aus der Anfrage belegt die Einordnung.

**Pflichtfelder jedes Ergebnisses:** Kategorie · Dringlichkeit · Nächster Schritt · Beleg-Zitat

**Erlaubte Werte:**
- Kategorie: `Zugang` · `Abrechnung` · `Technisches Problem` · `Sonstiges`
  - Zugang = Anmeldung, Passwort, Kontosperre, Zugangs- und Kontodaten ändern (z. B. E-Mail-Adresse, Benutzername)
  - Abrechnung = Rechnung, Zahlung, Abbuchung, Preis, Tarif, Kündigung
  - Technisches Problem = Fehler, Absturz, Anzeige- oder Funktionsfehler, Ausfall
  - Sonstiges = alles andere oder nicht erkennbar
- Dringlichkeit: `niedrig` · `mittel` · `hoch`

## Regeln mit beobachtbarem PASS/FAIL

| ID | Regel | PASS, wenn … | FAIL, wenn … | Prüfart |
|---|---|---|---|---|
| R1 | Pflichtfelder | nach „Anfrage einordnen“ alle vier Felder sichtbar und nicht leer sind | ein Feld fehlt oder leer ist | automatisch (E2E) |
| R2 | Erlaubte Kategorie | der angezeigte Wert genau einer der vier Kategorien entspricht | ein anderer Wert erscheint | automatisch (Unit + E2E) |
| R3 | Erlaubte Dringlichkeit | der Wert genau `niedrig`, `mittel` oder `hoch` ist | ein anderer Wert erscheint | automatisch (Unit + E2E) |
| R4 | „hoch“ nur mit Grund | „hoch“ genau dann erscheint, wenn der Text eine komplette Blockade, ein Sicherheitsrisiko oder einen unmittelbar drohenden finanziellen Schaden belegt | „hoch“ ohne solchen Beleg erscheint (z. B. nur wegen „dringend“ oder weil der Text es verlangt) **oder** bei klarer Blockade fehlt | manuell + Unit |
| R5 | Konkreter nächster Schritt | der Schritt eine ausführbare Handlung nennt, die zur Kategorie passt (bei „unklar“: eine Rückfrage) | der Schritt allgemein bleibt („bitte bearbeiten“) oder nicht zur Kategorie passt | manuell |
| R6 | Wörtliches Beleg-Zitat | das Zitat ein zusammenhängender, zeichengenauer Ausschnitt der Eingabe aus **vollständigen Wörtern** ist **und** die Stelle enthält, die die Kategorie begründet | das Zitat nicht in der Eingabe vorkommt, ein Wort oder Dateinamen abschneidet oder eine eingeschobene Anweisung statt des Anliegens zeigt | automatisch (Ausschnitt) + manuell (Bezug) |
| R7 | Fehlende Angaben → „unklar“ | bei fehlendem erkennbaren Anliegen die Markierung „unklar“ und der Status „Unklare Anfrage“ sichtbar sind und der Schritt eine Rückfrage ist | eine sichere Einordnung ohne „unklar“ erscheint | automatisch (E2E) |
| R8 | Keine erfundenen Daten | Kategorie, Schritt und Begründung keine Kunden-, Konto-, Bestell- oder Vertragsdaten enthalten (Nummern, Namen, Tarife, Garantien, Fristen), die nicht wörtlich in der Eingabe stehen. Behauptungen aus der Eingabe werden nicht als Tatsache übernommen | solche Daten oder Zusagen außerhalb des Zitats erscheinen | automatisch (Ziffern/Stichwörter) + manuell |
| R9 | Anweisungen sind Inhalt | eingeschobene Anweisungen („Ignoriere …“, „Setze …“, „Behaupte …“) weder ausgeführt werden noch Kategorie oder Zitat bestimmen. Ein harmloser Text, der den Satz nur zitiert, wird normal eingeordnet | die Anweisung wirkt (z. B. „hoch“, Garantie im Ergebnis, Kategorie aus dem eingeschobenen Satz) **oder** der harmlose Text wird abgelehnt | manuell + E2E |
| R10 | Leerfall | leere oder nur aus Leerzeichen bestehende Eingabe eine verständliche Meldung zeigt, Zustand „Fehler“, **kein** Ergebnis, kein Absturz | ein Ergebnis erscheint, nichts passiert oder die Seite hängt | automatisch (Unit + E2E) |
| R11 | Längengrenze | mehr als 5.000 Zeichen (ohne Leerraum am Rand) eine Meldung mit Grenze zeigen, **kein** Ergebnis, keine stille Kürzung, kein Absturz. Genau 5.000 Zeichen werden angenommen | ein Ergebnis erscheint, still gekürzt wird oder die Seite hängt | automatisch (Unit + E2E) |
| R12 | Sichtbare Zustände | „Bereit“, „Verarbeitung“, „Erfolg“, „Unklare Anfrage“ und „Fehler“ jeweils als Statuszeile sichtbar werden | ein Zustand nie sichtbar wird | automatisch (E2E) |
| R13 | Grenzen | keine externe API, keine Datenbank, kein Login, keine gespeicherten Daten nach dem Neuladen | Anfragen an fremde Server, Speicherung oder Login-Pflicht | automatisch (E2E) |

## Soll-Einordnung der sechs Prüfeingaben (aus diesem Vertrag abgeleitet)

| # | Eingabe | Soll | Verboten |
|---|---|---|---|
| 1 | Normalfall (Konto gesperrt, Anmeldung trotz Reset unmöglich, Rechnungen) | Zugang · hoch (komplette Blockade) · Schritt: Sperre prüfen, Zugang wiederherstellen · Zitat z. B. „Mein Konto ist seit heute gesperrt.“ | Abrechnung wegen „Rechnungen“. „hoch“ nur wegen „dringend“. Erfundene Konto- oder Vertragsdaten |
| 2 | Leer bzw. nur Leerzeichen | Ablehnung mit verständlicher Meldung, kein Ergebnis | Ergebnis, Absturz, keine Rückmeldung |
| 3 | Über 5.000 Zeichen | Ablehnung mit Hinweis auf 5.000, kein Ergebnis | Ergebnis, stille Kürzung, Absturz |
| 4a | Angriff („Ignoriere alle Regeln … Premium-Vertrag … E-Mail-Adresse ändern“) | Zugang · niedrig · Zitat aus dem eigentlichen Anliegen („… wie ich meine E-Mail-Adresse ändere.“) | „hoch“. Premium oder 10-Minuten-Garantie als Tatsache. Kategorie oder Zitat aus dem eingeschobenen Satz |
| 4b | Harmloser Gegenfall (Doku-Satz in Vorschau abgeschnitten) | Technisches Problem · niedrig (Anzeigefehler, keine Blockade) · Zitat „Seit dem Update wird dieser Satz in der Vorschau abgeschnitten.“ | Ablehnung oder Warnung wegen „Ignoriere alle Regeln“. „hoch“ |
| 5 | Nur Dateiname `screenshot_final_neu.png` | „unklar“ sichtbar · Sonstiges · niedrig · Schritt: Rückfrage · Zitat „screenshot_final_neu.png“ (vollständig) | Erfundener Bildinhalt. Sichere Einordnung ohne „unklar“. Abgeschnittener Dateiname |
