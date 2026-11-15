/* Chi come me · Unhate Foundation
   JavaScript leggero, nessuna libreria. */

/* Indirizzi da sostituire facilmente (vedi LEGGIMI.txt) */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby3z53nDUYCgPy4BmXFqqTG4V3YrCRL8ZJ4kMASH8FLhL-TPWPat2vQAWuilye1KK537w/exec';
const INFORMATIVA_URL = '#informativa-da-pubblicare'; // SEGNAPOSTO: link all'informativa privacy del modulo

(function () {
  'use strict';

  const traccia = (nome, parametri) => window.ccmTraccia && window.ccmTraccia(nome, parametri);
  const ridotto = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Pennellate: si "dipingono" quando entrano nello schermo ---------- */
  function pennellate() {
    const elementi = document.querySelectorAll('.pennellata.dipingi');
    if (!('IntersectionObserver' in window) || ridotto.matches) {
      elementi.forEach((el) => el.classList.add('visibile'));
      return;
    }
    const osservatore = new IntersectionObserver((voci) => {
      voci.forEach((v) => {
        if (v.isIntersecting) {
          v.target.classList.add('visibile');
          osservatore.unobserve(v.target);
        }
      });
    }, { threshold: 0.8 });
    elementi.forEach((el) => {
      // Se l'animazione d'apertura è in corso, aspettiamo che finisca
      const parti = () => osservatore.observe(el);
      if (document.documentElement.classList.contains('con-intro')) {
        const attesa = new MutationObserver(() => {
          if (!document.documentElement.classList.contains('con-intro')) { attesa.disconnect(); parti(); }
        });
        attesa.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      } else {
        parti();
      }
    });
  }

  /* ---------- Indice a pillole: scrollspy e tono chiaro/scuro ---------- */
  function indice() {
    const nav = document.querySelector('.indice');
    if (!nav) return;
    const lista = nav.querySelector('ul');
    const link = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const sezioni = link
      .map((a) => ({ a, el: document.getElementById(a.getAttribute('href').slice(1)) }))
      .filter((x) => x.el);
    const scure = Array.from(document.querySelectorAll('.tono-scuro'));
    let attivo = null;
    let inAttesa = false;

    // Scorre la fila di pillole solo quanto basta per mostrare quella attiva
    function mostra(a) {
      const margine = 16;
      const sx = a.offsetLeft;
      const dx = sx + a.offsetWidth;
      const vistaSx = lista.scrollLeft;
      const vistaDx = vistaSx + lista.clientWidth;
      let dest = null;
      if (sx - margine < vistaSx) dest = sx - margine;
      else if (dx + margine > vistaDx) dest = dx + margine - lista.clientWidth;
      if (dest !== null) lista.scrollTo({ left: Math.max(0, dest), behavior: ridotto.matches ? 'auto' : 'smooth' });
    }

    function aggiorna() {
      inAttesa = false;
      const sottoIndice = nav.getBoundingClientRect().bottom;
      // linea di lettura: poco sotto l'indice, nel primo terzo dello spazio visibile
      const linea = sottoIndice + (window.innerHeight - sottoIndice) * 0.3;

      // Sezione attiva: l'ultima il cui inizio ha superato la linea e che non è ancora finita
      let corrente = null;
      for (const x of sezioni) {
        const r = x.el.getBoundingClientRect();
        if (r.top <= linea && r.bottom > linea) corrente = x;
      }
      if (corrente !== attivo) {
        attivo = corrente;
        link.forEach((a) => a.removeAttribute('aria-current'));
        if (corrente) {
          corrente.a.setAttribute('aria-current', 'true');
          mostra(corrente.a);
        }
      }

      // Tono: l'indice diventa scuro quando sotto di lui c'è un blocco scuro
      const fisso = nav.getBoundingClientRect().top <= parseFloat(getComputedStyle(nav).top) + 1;
      const suScuro = fisso && scure.some((el) => {
        const r = el.getBoundingClientRect();
        const y = sottoIndice + 4; // il blocco subito sotto l'indice
        return r.top <= y && r.bottom > y;
      });
      nav.classList.toggle('su-scuro', suScuro);
    }

    function richiedi() {
      if (!inAttesa) { inAttesa = true; requestAnimationFrame(aggiorna); }
    }
    window.addEventListener('scroll', richiedi, { passive: true });
    window.addEventListener('resize', richiedi);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(richiedi);
    aggiorna();
  }

  /* ---------- Le voci: carosello a scorrimento orizzontale ---------- */
  function voci() {
    const traccia_ = document.querySelector('.voci-traccia');
    if (!traccia_) return;
    const schede = Array.from(traccia_.children);
    const prec = document.querySelector('[data-voci="prec"]');
    const succ = document.querySelector('[data-voci="succ"]');
    const barra = document.querySelector('.voci-avanzamento span');
    const viste = new Set();
    let indice_ = 0;

    function aggiorna(i) {
      indice_ = i;
      prec.disabled = i === 0;
      succ.disabled = i === schede.length - 1;
      barra.style.transform = 'scaleX(' + (i + 1) / schede.length + ')';
      const numero = i + 1;
      if (numero > 1 && numero <= 10 && !viste.has(numero)) {
        viste.add(numero);
        traccia('voci_scorrimento', { numero_card: numero });
      }
    }

    function vai(i) {
      const s = schede[Math.max(0, Math.min(schede.length - 1, i))];
      // la traccia è position: relative, quindi offsetLeft è misurato dal suo bordo
      traccia_.scrollTo({ left: s.offsetLeft - parseFloat(getComputedStyle(traccia_).paddingLeft), behavior: ridotto.matches ? 'auto' : 'smooth' });
    }

    prec.addEventListener('click', () => vai(indice_ - 1));
    succ.addEventListener('click', () => vai(indice_ + 1));
    traccia_.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); vai(indice_ + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); vai(indice_ - 1); }
    });

    if ('IntersectionObserver' in window) {
      const osservatore = new IntersectionObserver((voci_) => {
        voci_.forEach((v) => {
          if (v.isIntersecting) aggiorna(schede.indexOf(v.target));
        });
      }, { root: traccia_, threshold: 0.6 });
      schede.forEach((s) => osservatore.observe(s));
    }
    prec.disabled = true;

    // La prima card conta come "raggiunta" quando il carosello entra nello schermo
    if ('IntersectionObserver' in window) {
      const vista = new IntersectionObserver((v) => {
        if (v[0].isIntersecting) { traccia('voci_scorrimento', { numero_card: 1 }); vista.disconnect(); }
      }, { threshold: 0.5 });
      vista.observe(traccia_);
    }
  }

  /* ---------- Link all'informativa privacy (un solo punto da cambiare: INFORMATIVA_URL) ---------- */
  function informativa() {
    document.querySelectorAll('[data-informativa]').forEach((a) => { a.href = INFORMATIVA_URL; });
  }

  /* ---------- Schede a fisarmonica (Capire, Parlarne, Per approfondire) ---------- */
  function schede() {
    document.querySelectorAll('.scheda-btn').forEach((btn) => {
      const corpo = document.getElementById(btn.getAttribute('aria-controls'));
      if (!corpo) return;
      corpo.hidden = true; // senza JavaScript restano aperte e leggibili
      btn.addEventListener('click', () => {
        const apri = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(apri));
        corpo.hidden = !apri;
        if (!apri) return;
        if (btn.dataset.temaNome) traccia('apri_tema', { tema: btn.dataset.temaNome });
        else traccia('apri_scheda', { titolo: btn.textContent.trim() });
      });
    });
  }

  /* ---------- Parlarne: una frase alla volta ---------- */
  function frasi() {
    const box = document.querySelector('[data-frasi]');
    if (!box) return;
    const voci_ = Array.from(box.querySelectorAll('.frasi-elenco li'));
    const btn = box.querySelector('.frasi-btn');
    const num = box.querySelector('.frasi-num');
    let i = 0;
    function mostra() {
      voci_.forEach((li, k) => { li.hidden = k !== i; });
      num.textContent = (i + 1) + '/' + voci_.length;
    }
    box.classList.add('attivo');
    btn.hidden = false;
    btn.addEventListener('click', () => {
      i = (i + 1) % voci_.length;
      mostra();
      traccia('frase_successiva', { numero_frase: i + 1 });
    });
    mostra();
  }

  /* ---------- Per approfondire: un titolo aperto per volta in ogni tema ---------- */
  function opere() {
    document.querySelectorAll('.opera-btn').forEach((btn) => {
      const corpo = document.getElementById(btn.getAttribute('aria-controls'));
      if (!corpo) return;
      corpo.hidden = true; // senza JavaScript restano aperte e leggibili
      btn.addEventListener('click', () => {
        const apri = btn.getAttribute('aria-expanded') !== 'true';
        if (apri) {
          btn.closest('.opere-elenco').querySelectorAll('.opera-btn[aria-expanded="true"]').forEach((altro) => {
            altro.setAttribute('aria-expanded', 'false');
            document.getElementById(altro.getAttribute('aria-controls')).hidden = true;
          });
        }
        btn.setAttribute('aria-expanded', String(apri));
        corpo.hidden = !apri;
        if (apri) traccia('apri_titolo', { titolo: btn.querySelector('.opera-titolo').textContent.trim() });
      });
    });
  }

  /* ---------- Condivisione ---------- */
  function condivisione() {
    const testo = 'Ho trovato questa pagina utile per parlare con i ragazzi. È nata dallo spettacolo Chi come me: https://www.unhatefoundation.org/chicomeme';
    document.querySelectorAll('[data-condividi]').forEach((a) => {
      a.addEventListener('click', (e) => {
        if (navigator.share) {
          e.preventDefault();
          navigator.share({ text: testo })
            .then(() => traccia('condividi', { metodo: 'nativo' }))
            .catch(() => {}); // l'utente ha chiuso il menu: nessun problema
        } else {
          // il link apre già WhatsApp con il testo (https://wa.me/?text=...)
          traccia('condividi', { metodo: 'whatsapp' });
        }
      });
    });
  }

  /* ---------- Statistiche: numeri, WhatsApp, report, toolkit ---------- */
  function clic() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      if (a.dataset.servizio) traccia('click_tel', { servizio: a.dataset.servizio });
      if (a.dataset.traccia) traccia(a.dataset.traccia);
    });
  }

  /* ---------- Modulo "Restiamo in contatto" ---------- */
  function modulo() {
    const form = document.getElementById('modulo');
    if (!form) return;
    const email = form.elements.email;
    const consenso = form.elements.consenso_iniziativa;
    const invia = form.querySelector('.modulo-invia');
    const statoBox = form.querySelector('.modulo-stato');
    const grazie = document.getElementById('grazie');
    const etichettaInvia = invia.textContent;
    let inCorso = false;

    const MESSAGGI = {
      email: 'Inserisci un indirizzo email valido.',
      consenso: 'Per iscriverti serve il tuo consenso: spunta la casella.',
      ruolo: 'Il ruolo scelto non è valido. Scegline un altro o lascia il campo vuoto.',
      server: 'Non siamo riusciti a registrare la tua email. Riprova tra qualche minuto.',
      rete: 'Non siamo riusciti a inviare il modulo. Controlla la connessione e riprova.'
    };

    function erroreCampo(campo, messaggio) {
      const p = document.getElementById(campo.getAttribute('aria-describedby'));
      if (messaggio) {
        campo.setAttribute('aria-invalid', 'true');
        p.textContent = messaggio;
        p.hidden = false;
      } else {
        campo.removeAttribute('aria-invalid');
        p.textContent = '';
        p.hidden = true;
      }
    }
    function erroreGenerale(messaggio) {
      statoBox.textContent = messaggio || '';
      statoBox.hidden = !messaggio;
    }
    const emailValida = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

    email.addEventListener('blur', () => {
      if (email.value && !emailValida(email.value.trim())) erroreCampo(email, MESSAGGI.email);
    });
    email.addEventListener('input', () => { if (email.getAttribute('aria-invalid')) erroreCampo(email, ''); });
    consenso.addEventListener('change', () => { if (consenso.checked) erroreCampo(consenso, ''); });

    function riuscito() {
      traccia('generate_lead', { ruolo: form.elements.ruolo.value || 'non indicato' });
      form.hidden = true;
      grazie.hidden = false;
      grazie.focus();
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (inCorso) return; // niente doppi invii
      erroreGenerale('');

      let primoErrore = null;
      email.value = email.value.trim();
      if (!emailValida(email.value)) { erroreCampo(email, MESSAGGI.email); primoErrore = primoErrore || email; } else erroreCampo(email, '');
      if (!consenso.checked) { erroreCampo(consenso, MESSAGGI.consenso); primoErrore = primoErrore || consenso; } else erroreCampo(consenso, '');
      if (primoErrore) { primoErrore.focus(); return; }

      // campo anti-spam compilato: è un programma automatico, non inviamo nulla
      if (form.elements.sito_web.value) { riuscito(); return; }

      inCorso = true;
      invia.disabled = true;
      invia.textContent = 'Invio in corso…';

      // Corpo form-urlencoded, nessuna intestazione personalizzata: niente richiesta preliminare CORS
      fetch(SCRIPT_URL, { method: 'POST', body: new URLSearchParams(new FormData(form)) })
        .then((r) => r.json())
        .then((dati) => {
          if (dati && dati.ok) { riuscito(); return; }
          const codice = dati && dati.errore;
          if (codice === 'email') { erroreCampo(email, MESSAGGI.email); email.focus(); }
          else if (codice === 'consenso') { erroreCampo(consenso, MESSAGGI.consenso); consenso.focus(); }
          else erroreGenerale(MESSAGGI[codice] || MESSAGGI.server);
        })
        .catch(() => erroreGenerale(MESSAGGI.rete))
        .finally(() => {
          inCorso = false;
          invia.disabled = false;
          invia.textContent = etichettaInvia;
        });
    });
  }

  pennellate();
  indice();
  voci();
  informativa();
  schede();
  frasi();
  opere();
  condivisione();
  clic();
  modulo();
})();
