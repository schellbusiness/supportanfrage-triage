import { MAX_ZEICHEN, zaehleZeichen, formatiereZahl, ordneEin } from './triage.js';

// Die Einordnung selbst ist sofort fertig. Die kurze Pause macht den Zustand "Verarbeitung" sichtbar.
const VERARBEITUNG_MS = 400;

const el = {
  app: document.querySelector('.app'),
  form: document.getElementById('triage-form'),
  eingabe: document.getElementById('anfrage'),
  knopf: document.getElementById('einordnen'),
  zaehler: document.getElementById('zeichen'),
  status: document.getElementById('status'),
  fehler: document.getElementById('fehler'),
  ergebnis: document.getElementById('ergebnis'),
  unklarMarkierung: document.getElementById('unklar-markierung'),
  unklarGrund: document.getElementById('unklar-grund'),
  kategorie: document.getElementById('kategorie'),
  dringlichkeit: document.getElementById('dringlichkeit'),
  schritt: document.getElementById('schritt'),
  zitat: document.getElementById('zitat'),
  begruendung: document.getElementById('begruendung'),
};

const STATUS_TEXTE = {
  bereit: 'Bereit – füge eine Supportanfrage ein.',
  verarbeitung: 'Verarbeitung … die Anfrage wird eingeordnet.',
  erfolg: 'Erfolg – die Anfrage wurde eingeordnet.',
  unklar: 'Unklare Anfrage – es fehlen Informationen. Bitte Rückfrage stellen.',
  fehler: 'Fehler – die Anfrage wurde nicht eingeordnet.',
};

function setzeZustand(zustand) {
  el.app.dataset.state = zustand;
  el.status.textContent = STATUS_TEXTE[zustand];
  el.knopf.disabled = zustand === 'verarbeitung';
  el.app.setAttribute('aria-busy', String(zustand === 'verarbeitung'));
}

function versteckeAusgaben() {
  el.ergebnis.hidden = true;
  el.fehler.hidden = true;
  el.fehler.textContent = '';
  el.unklarMarkierung.hidden = true;
  el.unklarGrund.hidden = true;
}

function zeigeFehler(meldung) {
  versteckeAusgaben();
  el.fehler.textContent = meldung;
  el.fehler.hidden = false;
  setzeZustand('fehler');
}

function zeigeErgebnis(e) {
  el.kategorie.textContent = e.kategorie;
  el.dringlichkeit.textContent = e.dringlichkeit;
  el.dringlichkeit.dataset.stufe = e.dringlichkeit;
  el.schritt.textContent = e.naechsterSchritt;
  el.zitat.textContent = e.zitat;
  el.begruendung.textContent = e.begruendung;
  el.unklarMarkierung.hidden = !e.unklar;
  el.unklarGrund.hidden = !e.unklar;
  el.unklarGrund.textContent = e.unklar ? e.unklarGrund : '';
  el.ergebnis.hidden = false;
  setzeZustand(e.unklar ? 'unklar' : 'erfolg');
}

function aktualisiereZaehler() {
  const anzahl = zaehleZeichen(el.eingabe.value.trim());
  el.zaehler.textContent = `${formatiereZahl(anzahl)} / ${formatiereZahl(MAX_ZEICHEN)} Zeichen`;
  el.zaehler.classList.toggle('zu-lang', anzahl > MAX_ZEICHEN);
}

el.eingabe.addEventListener('input', aktualisiereZaehler);

el.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  versteckeAusgaben();
  setzeZustand('verarbeitung');
  const text = el.eingabe.value;
  await new Promise((resolve) => setTimeout(resolve, VERARBEITUNG_MS));
  try {
    const antwort = ordneEin(text);
    if (!antwort.ok) {
      zeigeFehler(antwort.fehler.meldung);
      return;
    }
    zeigeErgebnis(antwort.ergebnis);
  } catch (err) {
    console.error(err);
    zeigeFehler('Unerwarteter Fehler bei der Einordnung. Bitte versuche es erneut.');
  }
});

aktualisiereZaehler();
setzeZustand('bereit');
