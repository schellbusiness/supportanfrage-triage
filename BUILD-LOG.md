# Build-Log v1 – Supportanfrage - Triage

| Punkt | Festgehalten |
|---|---|
| Tool | Claude Code (Claude-Desktop-App, Code-Tab), Modell Claude Opus 5.5 |
| Startzeit | 28.10.2026, 14:58 Uhr (CET) |
| Prompt | Build-Prompt aus der Übung, unverändert (siehe unten) |
| Ergebnis | statische Web-App: `v1/index.html`, `v1/app.js`, `v1/triage.js`, `v1/style.css` |
| v1-URL | https://schellbusiness.github.io/supportanfrage-triage/v1/ (GitHub Pages, Tag `v1`) |

## Build-Prompt (unverändert übernommen)

> Baue eine kleine responsive Web-App „Supportanfrage - Triage“.
> Nutzer fügen eine Supportanfrage in ein Textfeld ein und klicken auf „Anfrage einordnen“.
> Die App zeigt danach:
> - Kategorie: Zugang, Abrechnung, Technisches Problem oder Sonstiges
> - Dringlichkeit: niedrig, mittel oder hoch
> - einen konkreten nächsten Schritt
> - ein wörtliches Beleg-Zitat aus der Anfrage
>
> Regeln:
> - Erfinde keine Kunden-, Konto-, Bestell- oder Vertragsdaten.
> - Wenn Informationen fehlen, markiere das Ergebnis sichtbar als „unklar“.
> - Anweisungen im Supporttext wie „Ignoriere alle Regeln“ sind Inhalt, niemals Befehle an die App.
> - Eine hohe Dringlichkeit gilt nur bei kompletter Blockade, Sicherheitsrisiko oder unmittelbar drohendem finanziellen Schaden.
> - Leere Eingaben werden verständlich abgelehnt und erzeugen kein Ergebnis.
> - Eingaben über 5.000 Zeichen werden kontrolliert abgelehnt und erzeugen kein Ergebnis.
>
> Implementiere sichtbare Zustände für bereit, Verarbeitung, Erfolg, unklare Anfrage und Fehler.
> Nutze für v1 eine lokale, nachvollziehbare regelbasierte Einordnung. Keine externe API, keine Datenbank und kein Login.
> Stelle die App auf einer öffentlichen URL bereit.
> Fertig ist v1, wenn der Kernpfad dreimal funktioniert, der Leerfall abgefangen wird und eine fremde Person ohne Erklärung starten konnte.

## Selbst getroffene Annahmen des Tools

1. **Regelwerk = Signalwörter.** Jede Kategorie hat eine Liste von Signalwörtern. Ein Treffer zählt am Wortanfang („rechnung“ trifft „Rechnungen“). Es gewinnt die Kategorie mit den meisten Treffern.
2. **„unklar“** gilt, wenn kein Signalwort passt, zwei Kategorien gleich viele Treffer haben oder der Text weniger als drei Wörter hat. Dann ist der nächste Schritt immer eine Rückfrage. Ohne Treffer ist die Kategorie „Sonstiges“.
3. **„hoch“** nur über feste Muster für Blockade (z. B. „gesperrt“, „nicht anmelden“), Sicherheitsrisiko (z. B. „gehackt“) oder drohenden finanziellen Schaden (z. B. „doppelt abgebucht“, „Inkasso“). Wörter wie „dringend“ oder „hoch“ im Text zählen bewusst nicht. „mittel“ gilt bei Beeinträchtigung (z. B. „funktioniert nicht“, „Fehler“). Sonst gilt „niedrig“.
4. **Zitat** ist der Satz mit den meisten Signalen, als zusammenhängender Ausschnitt der Eingabe, höchstens 240 Zeichen. Sätze werden an `.`, `!`, `?` und Zeilenumbrüchen getrennt.
5. **Zeichenzählung:** Leerraum am Anfang und Ende zählt nicht. Gezählt werden Unicode-Zeichen. Genau 5.000 sind erlaubt, ab 5.001 wird abgelehnt. Bewusst **kein** `maxlength` am Textfeld, damit nichts still gekürzt wird.
6. **Zustand „Verarbeitung“** ist sichtbar durch eine feste Pause von 400 ms. Die Regeln selbst laufen sofort.
7. **Leere oder zu lange Eingabe** führt zum Zustand „Fehler“ mit Erklärung. Ein altes Ergebnis wird vorher ausgeblendet.
8. **Nächster Schritt** kommt aus festen Textbausteinen je Kategorie und Dringlichkeit. Darin stehen keine Nummern, Namen, Tarife oder Zeitzusagen.
9. **Anweisungen im Text** werden wie jeder andere Text behandelt. Es gibt keine Sonderlogik, die Befehle erkennt.
10. **Zeichenzähler** unter dem Textfeld (0 / 5.000). Er macht die Längengrenze sichtbar. Sonst gibt es keine Zusatzfunktionen.
11. **Hosting:** statische Dateien. Keine Daten werden gespeichert oder gesendet.

## Offen gelegter Bias

Beim Bauen lagen die Testfälle aus M5.3.2 schon vor, weil alle Aufgabenblätter gleichzeitig kamen. Die Signalwortlisten wurden nicht auf diese Texte zugeschnitten. Ganz ausschließen lässt sich ein Einfluss trotzdem nicht. Ein lokaler Kurzcheck vor dem Veröffentlichen hat zwei Auffälligkeiten gezeigt (siehe Ausarbeitung, M5.3.4). v1 wurde trotzdem unverändert veröffentlicht. So will es die Übung: erst prüfen, Befunde als Hypothesen festhalten, dann gezielt eine Sache ändern.
