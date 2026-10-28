// Supportanfrage - Triage: regelbasierte Einordnung (v2)
// Läuft vollständig lokal im Browser. Keine externe API, keine Datenbank, kein Login.
// Jede Entscheidung wird mit den gefundenen Signalen begründet, damit sie nachvollziehbar bleibt.

export const MAX_ZEICHEN = 5000;
export const KATEGORIEN = ['Zugang', 'Abrechnung', 'Technisches Problem', 'Sonstiges'];
export const DRINGLICHKEITEN = ['niedrig', 'mittel', 'hoch'];

// Signalwörter je Kategorie. Treffer zählen nur am Wortanfang ("rechnung" trifft "Rechnungen").
const KATEGORIE_SIGNALE = {
  'Zugang': [
    'anmeld', 'login', 'log-in', 'einlogg', 'passwort', 'kennwort', 'zugang', 'benutzername',
    'gesperrt', 'sperrung', 'konto', 'account', 'zwei-faktor', '2fa', 'registrier',
  ],
  'Abrechnung': [
    'rechnung', 'abrechnung', 'zahlung', 'bezahl', 'abbuchung', 'abgebucht', 'lastschrift',
    'gutschrift', 'erstattung', 'rückerstattung', 'preis', 'kosten', 'gebühr', 'tarif', 'abo',
    'kündig', 'vertrag', 'mahnung', 'betrag', 'überweis', 'kreditkarte', 'paypal',
  ],
  'Technisches Problem': [
    'fehler', 'error', 'absturz', 'abgestürzt', 'stürzt', 'funktioniert nicht', 'geht nicht',
    'lädt nicht', 'langsam', 'bug', 'update', 'app', 'webseite', 'website', 'seite', 'anzeige',
    'angezeigt', 'darstellung', 'browser', 'server', 'ausfall', 'ausgefallen', 'hängt', 'synchronis',
  ],
};

// "hoch" nur bei kompletter Blockade, Sicherheitsrisiko oder unmittelbar drohendem finanziellen Schaden.
// Wörter wie "dringend", "sofort" oder "hoch" im Text heben die Dringlichkeit bewusst nicht an.
const HOCH_REGELN = [
  {
    grund: 'komplette Blockade',
    muster: [
      /gesperrt/iu,
      /nicht (mehr )?(an|ein)(melden|loggen)/iu,
      /keine?n? zugriff/iu,
      /komplett ausgefallen/iu,
      /geht gar nichts/iu,
      /nichts geht mehr/iu,
      /nicht (mehr )?erreichbar/iu,
    ],
  },
  {
    grund: 'Sicherheitsrisiko',
    muster: [/gehackt/iu, /unbefugt/iu, /fremde[rn]? (hat|haben|zugriff)/iu, /phishing/iu, /datenleck/iu, /missbrauch/iu, /betrug/iu],
  },
  {
    grund: 'unmittelbar drohender finanzieller Schaden',
    muster: [/doppelt abgebucht/iu, /mehrfach abgebucht/iu, /unberechtigt abgebucht/iu, /inkasso/iu, /mahnbescheid/iu, /pfändung/iu],
  },
];

const MITTEL_MUSTER = [
  /funktioniert nicht/iu, /geht nicht/iu, /fehler/iu, /falsch/iu, /stürzt/iu, /lädt nicht/iu,
  /kann .{0,30}nicht/iu, /nicht möglich/iu, /kaputt/iu,
];

const SCHRITTE = {
  'Zugang': {
    hoch: 'Sperrgrund im Kundenkonto prüfen, die Identität über einen bereits hinterlegten Kontaktweg bestätigen und den Zugang wieder freischalten, wenn kein Sicherheitsgrund dagegen spricht.',
    mittel: 'Anmeldeproblem nachstellen: Gerät, Browser und genaue Fehlermeldung erfragen, danach einen neuen Link zum Zurücksetzen des Passworts senden.',
    niedrig: 'Anleitung zum Ändern der Zugangs- bzw. Kontodaten senden und nachfragen, ob das Anliegen damit gelöst ist.',
  },
  'Abrechnung': {
    hoch: 'Betroffene Buchung sofort prüfen, weitere Abbuchungen oder Mahnschritte anhalten und die anfragende Person über die Klärung informieren.',
    mittel: 'Genannte Rechnung bzw. Buchung prüfen und eine Erklärung oder Korrektur senden.',
    niedrig: 'Frage zur Abrechnung beantworten und bei Bedarf Zeitraum oder Rechnungsdatum erfragen.',
  },
  'Technisches Problem': {
    hoch: 'Ausfall an das Technik-Team eskalieren, Umfang erfassen (wer ist betroffen, seit wann) und die anfragende Person über den Stand informieren.',
    mittel: 'Fehler nachstellen: Gerät, App- bzw. Browserversion und genaue Fehlermeldung erfragen und ein Ticket an den technischen Support übergeben.',
    niedrig: 'Beobachtung als Fehlerbericht an das Produktteam weitergeben und der anfragenden Person den Eingang bestätigen.',
  },
  'Sonstiges': {
    hoch: 'Anliegen sofort an die Teamleitung weitergeben, weil ein hohes Risiko erkannt wurde.',
    mittel: 'Anliegen an das zuständige Team weiterleiten und der anfragenden Person den Eingang bestätigen.',
    niedrig: 'Anliegen an das zuständige Team weiterleiten und der anfragenden Person den Eingang bestätigen.',
  },
};
const SICHERHEIT_SCHRITT = 'Sicherheitsvorfall: Konto vorsorglich absichern (aktive Sitzungen beenden, Passwort zurücksetzen lassen) und an das Sicherheitsteam eskalieren.';
const RUECKFRAGE_SCHRITT = 'Rückfrage an die anfragende Person: Bitte das Anliegen in ein bis zwei Sätzen beschreiben – was ist passiert, seit wann, und welche Meldung erscheint?';

const MAX_ZITAT = 240;

// v2: Steueranweisungen an die App (Imperativ am Satzanfang + Bezug auf Regeln oder Einordnung) bleiben Inhalt,
// werden aber nie ausgeführt und zählen weder für die Kategorie noch als Beleg-Zitat.
const STEUER_VERB = /^(?:ignorier|vergiss|setz|stuf|änder|behaupt|gib|antwort|schreib|markier|ordne)/iu;
const STEUER_ZIEL = /(?:regel|anweisung|dringlichkeit|kategorie|priorität|einordnung|system|prompt)/iu;

export function istSteueranweisung(satz) {
  return STEUER_VERB.test(satz) && STEUER_ZIEL.test(satz);
}

export function zaehleZeichen(text) {
  return Array.from(text ?? '').length;
}

export function formatiereZahl(n) {
  return n.toLocaleString('de-DE');
}

// Prüft die Eingabe, bevor eingeordnet wird. Leere und zu lange Eingaben erzeugen kein Ergebnis.
export function pruefeEingabe(roh) {
  const text = String(roh ?? '').trim();
  if (text.length === 0) {
    return {
      ok: false,
      grund: 'leer',
      meldung: 'Bitte füge eine Supportanfrage ein. Eine leere Eingabe kann nicht eingeordnet werden.',
    };
  }
  const laenge = zaehleZeichen(text);
  if (laenge > MAX_ZEICHEN) {
    return {
      ok: false,
      grund: 'zu_lang',
      laenge,
      meldung: `Die Anfrage ist zu lang: ${formatiereZahl(laenge)} Zeichen. Erlaubt sind höchstens ${formatiereZahl(MAX_ZEICHEN)} Zeichen. Bitte kürze den Text und versuche es erneut.`,
    };
  }
  return { ok: true, text };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function signalRegex(wort) {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(wort)}`, 'iu');
}

function findeSignale(text, worte) {
  return worte.filter((w) => signalRegex(w).test(text));
}

function zerlegeInSaetze(text) {
  const saetze = [];
  const re = /[^.!?\n]+[.!?]*/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const satz = m[0].trim();
    if (satz) saetze.push(satz);
  }
  return saetze.length ? saetze : [text];
}

// Wählt den Satz mit den meisten Signalen als wörtliches Zitat. Das Zitat ist immer ein Ausschnitt der Eingabe.
function waehleZitat(saetze, signalWorte, hochMuster) {
  let bester = saetze[0];
  let besterWert = -1;
  for (const satz of saetze) {
    let wert = findeSignale(satz, signalWorte).length;
    if (hochMuster && hochMuster.test(satz)) wert += 2;
    if (wert > besterWert) {
      bester = satz;
      besterWert = wert;
    }
  }
  if (zaehleZeichen(bester) > MAX_ZITAT) {
    const abschnitt = Array.from(bester).slice(0, MAX_ZITAT).join('');
    const letzteLuecke = abschnitt.lastIndexOf(' ');
    bester = letzteLuecke > 40 ? abschnitt.slice(0, letzteLuecke) : abschnitt;
  }
  return bester;
}

function bestimmeDringlichkeit(text) {
  for (const regel of HOCH_REGELN) {
    for (const muster of regel.muster) {
      const treffer = text.match(muster);
      if (treffer) {
        return { stufe: 'hoch', grund: regel.grund, signal: treffer[0], muster };
      }
    }
  }
  for (const muster of MITTEL_MUSTER) {
    const treffer = text.match(muster);
    if (treffer) {
      return { stufe: 'mittel', grund: 'Funktion beeinträchtigt, aber keine komplette Blockade', signal: treffer[0], muster };
    }
  }
  return { stufe: 'niedrig', grund: 'keine Blockade, kein Sicherheitsrisiko und kein drohender finanzieller Schaden erkennbar', signal: null, muster: null };
}

export function ordneEin(roh) {
  const pruefung = pruefeEingabe(roh);
  if (!pruefung.ok) return { ok: false, fehler: pruefung };
  const text = pruefung.text;

  const alleSaetze = zerlegeInSaetze(text);
  const inhaltsSaetze = alleSaetze.filter((satz) => !istSteueranweisung(satz));
  const belegSaetze = inhaltsSaetze.length ? inhaltsSaetze : alleSaetze;
  const belegText = belegSaetze.join('\n');

  const rangliste = Object.entries(KATEGORIE_SIGNALE)
    .map(([kategorie, worte]) => ({ kategorie, signale: findeSignale(belegText, worte) }))
    .sort((a, b) => b.signale.length - a.signale.length);
  const [beste, zweite] = rangliste;

  let kategorie = 'Sonstiges';
  let signale = [];
  let unklarGrund = null;
  if (beste.signale.length === 0) {
    unklarGrund = 'Kein Hinweis auf Zugang, Abrechnung oder ein technisches Problem gefunden.';
  } else if (beste.signale.length === zweite.signale.length) {
    kategorie = beste.kategorie;
    signale = beste.signale;
    unklarGrund = `Mehrere Kategorien sind gleich wahrscheinlich (${beste.kategorie}, ${zweite.kategorie}).`;
  } else {
    kategorie = beste.kategorie;
    signale = beste.signale;
  }

  const anzahlWoerter = text.split(/\s+/).filter(Boolean).length;
  if (!unklarGrund && anzahlWoerter < 3) {
    unklarGrund = 'Die Anfrage ist zu kurz, um sie sicher einzuordnen.';
  }

  const dringlichkeit = bestimmeDringlichkeit(text);
  const unklar = unklarGrund !== null;

  let naechsterSchritt;
  if (unklar) naechsterSchritt = RUECKFRAGE_SCHRITT;
  else if (dringlichkeit.stufe === 'hoch' && dringlichkeit.grund === 'Sicherheitsrisiko') naechsterSchritt = SICHERHEIT_SCHRITT;
  else naechsterSchritt = SCHRITTE[kategorie][dringlichkeit.stufe];

  const zitat = waehleZitat(belegSaetze, signale, dringlichkeit.muster);

  const begruendungKategorie = signale.length
    ? `Kategorie ${kategorie}: Signalwörter ${signale.map((s) => `„${s}“`).join(', ')}.`
    : `Kategorie ${kategorie}: keine passenden Signalwörter.`;
  const begruendungDringlichkeit = dringlichkeit.signal
    ? `Dringlichkeit ${dringlichkeit.stufe}: ${dringlichkeit.grund} (Signal „${dringlichkeit.signal}“).`
    : `Dringlichkeit ${dringlichkeit.stufe}: ${dringlichkeit.grund}.`;

  return {
    ok: true,
    ergebnis: {
      kategorie,
      dringlichkeit: dringlichkeit.stufe,
      naechsterSchritt,
      zitat,
      unklar,
      unklarGrund,
      begruendung: `${begruendungKategorie} ${begruendungDringlichkeit}`,
    },
  };
}
