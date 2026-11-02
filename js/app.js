// Widoki strony: start, lista quizów, quiz i wynik. Nawigacja przez adres z „#”.

import { MOTYWY, wczytajMotyw, zapiszMotyw, zastosujMotyw, akcentDla } from './motywy.js';
import { utworzKoloBarw } from './kolo-barw.js';
import { tasuj, losujFraze, procent, pytaniaQuizu, nazwaQuizu, nazwaWQuizie, geometrieTrafienia, panstwoStolicy, wczytajWyniki, zapiszWynik, SPRAWDZIAN } from './quiz.js';
import { utworzMape } from './mapa.js';

const app = document.getElementById('app');
let dane = null;      // data/europa.json
let geometrie = null; // data/geometrie.geojson
let tlo = null;       // data/tlo.geojson
let mapa = null;      // aktywna mapa quizu
let motyw = wczytajMotyw();
zastosujMotyw(motyw);

const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const ikona = {
  motyw: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" class="wypelnienie"/></svg>',
  wstecz: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  dalej: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  zamknij: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};
// Liniowe symbole kategorii (rysowane kolorem przewodnim).
const SYMBOLE = {
  panstwa: '<path d="M5 21V4"/><path d="M5 4.5c2.5-1.6 5-1.6 7.5 0s5 1.6 7 0v9c-2 1.6-4.5 1.6-7 0s-5-1.6-7.5 0"/>',
  stolice: '<path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.2"/>',
  morza: '<path d="M3 9.5c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.5 0M3 15c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.5 0"/>',
  zatoki: '<path d="M3 5h4.5c0 6.5 9 6.5 9 0H21"/><path d="M5 17c1.4-1.1 2.8-1.1 4.2 0s2.8 1.1 4.2 0 2.8-1.1 4.2 0"/>',
  polwyspy: '<path d="M3 5h18"/><path d="M9 5c0 5.5 1 10.5 3 15 2-4.5 3-9.5 3-15"/>',
  wyspy: '<path d="M6 11.5c0-2.6 2.7-4.5 6-4.5s6 1.9 6 4.5-2.7 3.5-6 3.5-6-.9-6-3.5z"/><path d="M3 19c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0"/>',
  krainy: '<path d="M2.5 19l6-10 4 6 3-4.5 6 8.5z"/>',
  rzeki: '<path d="M9 3c-3 4 5 5.5 3 9.5S6 17 8 21"/><path d="M16 3c-1.5 3 2 4.5 1 7.5"/>',
  jeziora: '<path d="M4.5 12.5c0-3.8 3.2-6 7.5-6s7.5 2.2 7.5 6-3.2 5.5-7.5 5.5-7.5-1.7-7.5-5.5z"/><path d="M9.5 12.5h5"/>',
  ciesniny: '<path d="M3 4c4 2 6.5 5.5 6.5 8S7 18 3 20M21 4c-4 2-6.5 5.5-6.5 8s2.5 6 6.5 8"/>',
};
const symbol = (id) => `<span class="kafel-ikona"><svg viewBox="0 0 24 24" aria-hidden="true">${SYMBOLE[id] || ''}</svg></span>`;
const odmianaPytan = (n) => (n === 1 ? 'pytanie' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'pytania' : 'pytań');

async function wczytajDane() {
  if (dane) return;
  const pobierz = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(u); return r.json(); };
  [dane, geometrie, tlo] = await Promise.all([
    pobierz('data/europa.json'), pobierz('data/geometrie.geojson'), pobierz('data/tlo.geojson'),
  ]);
}

function zamknijMape() {
  if (mapa) { mapa.zniszcz(); mapa = null; }
}

// ===================================================================== START
function widokStart() {
  zamknijMape();
  document.title = 'Geografia Europy';
  app.innerHTML = '';
  const wyniki = wczytajWyniki();
  const v = el(`
    <main class="widok widok-start">
      <div class="zdjecie-tla" aria-hidden="true" style="background-image:url(img/tlo-start.jpg)"></div>
      <button class="przycisk-ikona przycisk-motywu" type="button" aria-label="Wybierz motyw" aria-haspopup="dialog">${ikona.motyw}</button>
      <div class="start-srodek">
        <a class="przycisk glowny kategoria" href="#europa">Europa</a>
        <p class="start-podpis"></p>
      </div>
    </main>`);
  app.append(v);
  v.querySelector('.przycisk-motywu').addEventListener('click', (e) => { e.stopPropagation(); przelaczOknoMotywu(v); });
  wczytajDane().then(() => {
    if (!v.isConnected) return;
    const ids = [SPRAWDZIAN, ...dane.quizy.map((q) => q.id)];
    const ukonczone = ids.filter((id) => id in wyniki).length;
    v.querySelector('.start-podpis').textContent = `Sprawdzian i ${dane.quizy.length} quizów · ukończone ${ukonczone}/${ids.length}`;
  }).catch(() => {});
}

function przelaczOknoMotywu(widok) {
  const istniejace = widok.querySelector('.okno-motywu');
  if (istniejace) { zamknijOknoMotywu(istniejace); return; }
  const okno = el(`
    <div class="okno-motywu" role="dialog" aria-label="Motyw">
      <p class="okno-tytul">Motyw</p>
      <div class="motywy">
        ${MOTYWY.map((m) => `
          <button type="button" class="motyw" data-id="${m.id}" aria-pressed="${m.id === motyw.motyw}">
            <span class="miniatura" style="--m-tlo:${m.tlo === 'jasne' ? '#f6f5f2' : '#0f1d2b'}">
              <span class="miniatura-panel"><span class="miniatura-tekst krotki"></span><span class="miniatura-tekst"></span></span>
              <span class="miniatura-przycisk"></span>
              ${m.wlasny ? '<span class="miniatura-tecza"></span>' : ''}
            </span>
            <span class="motyw-nazwa">${m.nazwa}</span>
          </button>`).join('')}
      </div>
      <div class="wybor-koloru" hidden></div>
    </div>`);
  widok.append(okno);
  requestAnimationFrame(() => okno.classList.add('otwarte'));
  const wyborKoloru = okno.querySelector('.wybor-koloru');

  // Miniatury pokazują prawdziwy kolor przewodni (dla motywów własnych – wybrany kolor po korekcie kontrastu).
  function kolorujMiniatury() {
    okno.querySelectorAll('.motyw').forEach((b) => {
      b.querySelector('.miniatura').style.setProperty('--m-akcent', akcentDla({ motyw: b.dataset.id, kolor: motyw.kolor }).akcent);
    });
  }
  function odswiez() {
    kolorujMiniatury();
    okno.querySelectorAll('.motyw').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === motyw.motyw)));
    const wlasny = MOTYWY.find((m) => m.id === motyw.motyw).wlasny;
    wyborKoloru.hidden = !wlasny;
    if (wlasny && !wyborKoloru.childElementCount) {
      utworzKoloBarw(wyborKoloru, motyw.kolor, (hex) => { motyw.kolor = hex; zastosujMotyw(motyw); zapiszMotyw(motyw); kolorujMiniatury(); });
    }
  }
  okno.querySelectorAll('.motyw').forEach((b) => b.addEventListener('click', () => {
    motyw.motyw = b.dataset.id; zastosujMotyw(motyw); zapiszMotyw(motyw); odswiez();
  }));
  odswiez();
  okno.addEventListener('click', (e) => e.stopPropagation());
  const naZewnatrz = () => { zamknijOknoMotywu(okno); document.removeEventListener('click', naZewnatrz); };
  setTimeout(() => document.addEventListener('click', naZewnatrz), 0);
  const esc = (e) => { if (e.key === 'Escape') { naZewnatrz(); document.removeEventListener('keydown', esc); } };
  document.addEventListener('keydown', esc);
}
function zamknijOknoMotywu(okno) {
  okno.classList.remove('otwarte');
  setTimeout(() => okno.remove(), 180);
}

// ================================================================ LISTA QUIZÓW
async function widokLista() {
  zamknijMape();
  document.title = 'Europa – quizy';
  await wczytajDane();
  const wyniki = wczytajWyniki();
  const ile = (id) => pytaniaQuizu(dane, id).length;
  // Wynik pokazujemy tylko dla quizów już ukończonych.
  const dolKafla = (id) => `
    <span class="kafel-meta"><span class="liczba">${ile(id)} ${odmianaPytan(ile(id))}</span>${id in wyniki ? `<span class="wynik">${wyniki[id]}%</span>` : ''}</span>
    <span class="pasek-wyniku${id in wyniki ? '' : ' pusty'}" aria-hidden="true">${id in wyniki ? `<span style="width:${wyniki[id]}%"></span>` : ''}</span>`;
  app.innerHTML = '';
  app.append(el(`
    <main class="widok widok-lista">
      <header class="pasek">
        <a class="przycisk maly" href="#">${ikona.wstecz}<span>Wróć</span></a>
        <h1>Europa</h1>
      </header>
      <a class="przycisk kafel kafel-sprawdzian" href="#quiz-${SPRAWDZIAN}">
        <span class="kafel-gora">
          <span class="kafel-dol">
            <span class="kafel-nazwa">Sprawdzian</span>
            <span class="kafel-opis">${ile(SPRAWDZIAN)} ${odmianaPytan(ile(SPRAWDZIAN))} · wszystkie kategorie</span>
          </span>
          ${SPRAWDZIAN in wyniki ? `<span class="wynik-duzy">${wyniki[SPRAWDZIAN]}%<small>ostatni wynik</small></span>` : ''}
        </span>
        ${SPRAWDZIAN in wyniki ? `<span class="pasek-wyniku" aria-hidden="true"><span style="width:${wyniki[SPRAWDZIAN]}%"></span></span>` : ''}
      </a>
      <div class="siatka">
        ${dane.quizy.map((q) => `
          <a class="przycisk kafel" href="#quiz-${q.id}">
            <span class="kafel-foto" style="background-image:url(img/kafel-${q.id}.jpg?v=2)"><span class="kafel-numer">${q.numer}</span></span>
            <span class="kafel-tresc">
              <span class="kafel-naglowek">${symbol(q.id)}<span class="kafel-nazwa">${q.nazwa}</span></span>
              ${dolKafla(q.id)}
            </span>
          </a>`).join('')}
      </div>
    </main>`));
}

// ======================================================================= QUIZ
async function widokQuiz(quizId) {
  zamknijMape();
  await wczytajDane();
  if (quizId !== SPRAWDZIAN && !dane.quizy.some((q) => q.id === quizId)) { location.hash = '#europa'; return; }
  const nazwa = nazwaQuizu(dane, quizId);
  document.title = `${nazwa} – Europa`;

  app.innerHTML = '';
  const v = el(`
    <main class="widok widok-quiz">
      <div class="mapa" id="mapa"></div>
      <section class="panel" aria-live="polite">
        <div class="panel-gora">
          <span class="etykieta">${nazwa}</span>
          <span class="licznik"></span>
          <button class="przycisk-tekst zakoncz" type="button">Zakończ</button>
        </div>
        <h2 class="cel"></h2>
        <div class="odpowiedz" hidden>
          <p class="fraza"></p>
          <p class="przynaleznosc" hidden></p>
          <button class="przycisk glowny dalej" type="button"><span>Dalej</span>${ikona.dalej}</button>
        </div>
        <div class="postep" aria-hidden="true"><span></span></div>
      </section>
    </main>`);
  app.append(v);

  mapa = utworzMape(v.querySelector('#mapa'), { geometrie, tlo });
  const panel = v.querySelector('.panel');
  const licznik = v.querySelector('.licznik');
  const cel = v.querySelector('.cel');
  const odpowiedz = v.querySelector('.odpowiedz');
  const fraza = v.querySelector('.fraza');
  const przynaleznosc = v.querySelector('.przynaleznosc');
  const dalej = v.querySelector('.dalej');
  const postep = v.querySelector('.postep span');
  const ustawPostep = (n) => { postep.style.transform = `scaleX(${n / pytania.length})`; };

  let pytania, nr, poprawne, odpowiedziano;

  function start() {
    pytania = tasuj(pytaniaQuizu(dane, quizId));
    nr = 0; poprawne = 0;
    pokazPytanie();
  }

  function pokazPytanie() {
    odpowiedziano = false;
    mapa.wyczysc();
    const p = pytania[nr];
    licznik.textContent = `${nr + 1}/${pytania.length}`;
    ustawPostep(nr);
    cel.textContent = nazwaWQuizie(p, quizId);
    cel.classList.remove('wejscie'); void cel.offsetWidth; cel.classList.add('wejscie');
    odpowiedz.hidden = true;
    panel.classList.remove('po-odpowiedzi', 'trafione', 'pudlo');
  }

  function odpowiedzNa(latlng) {
    if (odpowiedziano) return;
    odpowiedziano = true;
    const p = pytania[nr];
    // Stolica: trafienie w jej państwo też się liczy.
    const ok = geometrieTrafienia(p).some((g) => mapa.trafia(g, latlng));
    const panstwo = panstwoStolicy(p);
    if (panstwo) mapa.podswietl(panstwo, { slabo: true });
    mapa.podswietl(p.geometria);
    ustawPostep(nr + 1);

    if (ok) {
      // Trafienie: bez frazy i bez przycisku „Dalej”. Jeśli obiekt nie mieści się w widoku,
      // mapa najpierw płynnie go odsłania, a dopiero potem liczymy 1 sekundę do następnego pytania.
      poprawne++;
      panel.classList.remove('trafione'); void panel.offsetWidth; panel.classList.add('trafione');
      const tenNr = nr;
      Promise.resolve(mapa.pokazObiekt(p.geometria, panel.getBoundingClientRect().bottom, { przyblizMale: false })).then(() => {
        setTimeout(() => {
          if (!v.isConnected || nr !== tenNr) return; // quiz zakończony albo przerwany w międzyczasie
          nastepne();
        }, 1000);
      });
      return;
    }

    mapa.pokazPudlo(latlng);

    fraza.innerHTML = '';
    fraza.append(el(`<span class="znak">${ikona.zamknij}</span>`));
    fraza.append(document.createTextNode(losujFraze(dane.frazy.pudlo)));
    if (p.przynaleznosc) {
      przynaleznosc.hidden = false;
      przynaleznosc.innerHTML = '';
      przynaleznosc.append('Przynależność: ', Object.assign(document.createElement('strong'), { textContent: p.przynaleznoscOpis || p.przynaleznosc }));
    } else przynaleznosc.hidden = true;
    dalej.querySelector('span').textContent = nr === pytania.length - 1 ? 'Wynik' : 'Dalej';
    odpowiedz.hidden = false;
    panel.classList.add('po-odpowiedzi', 'pudlo');
    try { navigator.vibrate?.(120); } catch { /* brak wibracji */ }

    // Po zmianie zawartości panelu sprawdzamy jego wysokość i odsłaniamy obiekt pod nim.
    // Przy stolicy pokazujemy całe państwo (z podświetloną stolicą), przy innych obiektach – sam obiekt.
    requestAnimationFrame(() => mapa.pokazObiekt(panstwo || p.geometria, panel.getBoundingClientRect().bottom));
    dalej.focus({ preventScroll: true, focusVisible: false });
  }

  function nastepne() {
    if (!odpowiedziano) return;
    nr++;
    if (nr >= pytania.length) pokazWynik();
    else pokazPytanie();
  }

  function pokazWynik() {
    const proc = procent(poprawne, pytania.length);
    zapiszWynik(quizId, proc); // nadpisuje poprzedni wynik tego quizu
    mapa.wyczysc();
    const okno = el(`
      <div class="tlo-okna tlo-wyniku">
        <section class="okno wynik-koncowy" role="dialog" aria-label="Wynik">
          <span class="etykieta">${nazwa}</span>
          <div class="pierscien">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle class="tor" cx="60" cy="60" r="54"/>
              <circle class="luk" cx="60" cy="60" r="54" stroke-dasharray="${(2 * Math.PI * 54).toFixed(2)}" stroke-dashoffset="${(2 * Math.PI * 54).toFixed(2)}"/>
            </svg>
            <p class="wynik-procent">${proc}%</p>
          </div>
          <p class="wynik-opis">Poprawne odpowiedzi: <strong>${poprawne}</strong> z <strong>${pytania.length}</strong></p>
          <div class="przyciski">
            <button class="przycisk jeszcze" type="button">Jeszcze raz</button>
            <a class="przycisk glowny" href="#europa">Wróć do quizów</a>
          </div>
        </section>
      </div>`);
    v.append(okno);
    panel.hidden = true;
    // pierścień dochodzi do wyniku po pojawieniu się okna
    const luk = okno.querySelector('.luk');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      luk.style.strokeDashoffset = String(2 * Math.PI * 54 * (1 - proc / 100));
    }));
    okno.querySelector('.jeszcze').addEventListener('click', () => {
      okno.remove(); panel.hidden = false; mapa.widokEuropy(); start();
    });
  }

  function zakoncz() {
    const okno = el(`
      <div class="tlo-okna">
        <section class="okno" role="dialog" aria-label="Zakończyć quiz?">
          <p class="okno-pytanie">Zakończyć quiz?</p>
          <p class="okno-opis">Wynik tego podejścia nie zostanie zapisany.</p>
          <div class="przyciski">
            <button class="przycisk glowny anuluj" type="button">Kontynuuj</button>
            <a class="przycisk" href="#europa">Zakończ</a>
          </div>
        </section>
      </div>`);
    v.append(okno);
    okno.querySelector('.anuluj').addEventListener('click', () => okno.remove());
    okno.addEventListener('click', (e) => { if (e.target === okno) okno.remove(); });
  }

  mapa.naKlikniecie(odpowiedzNa);
  dalej.addEventListener('click', nastepne);
  v.querySelector('.zakoncz').addEventListener('click', zakoncz);
  start();
}

// =================================================================== ROUTER
async function trasa() {
  const h = location.hash.replace(/^#\/?/, '');
  // płynne wyjście poprzedniego widoku
  const stary = app.querySelector('.widok');
  if (stary && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stary.classList.add('wychodzi');
    await new Promise((r) => setTimeout(r, 150));
  }
  try {
    if (h === '' ) widokStart();
    else if (h === 'europa') await widokLista();
    else if (h.startsWith('quiz-') || h.startsWith('quiz/')) await widokQuiz(decodeURIComponent(h.slice(5)));
    else location.hash = '';
  } catch (e) {
    console.error(e);
    app.innerHTML = '';
    app.append(el(`<main class="widok widok-blad"><p>Nie udało się wczytać danych mapy.</p><p class="okno-opis">Strona musi być otwarta przez serwer (np. GitHub Pages albo <code>npx serve</code>), a nie bezpośrednio z pliku.</p><a class="przycisk" href="#">Strona główna</a></main>`));
  }
}

document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && document.querySelector('.panel.po-odpowiedzi:not([hidden])') && !document.querySelector('.tlo-okna')) {
    if (document.activeElement?.classList.contains('dalej')) return; // przycisk sam obsłuży
    e.preventDefault();
    document.querySelector('.panel .dalej')?.click();
  }
});
window.addEventListener('hashchange', trasa);
// Nowe wejście na stronę (wpisany adres, zakładka, link z „#europa” / „#quiz-…”) zaczyna się od
// strony głównej z przyciskiem „Europa”. Odświeżenie (F5) oraz powrót przyciskiem wstecz/dalej
// zostawiają bieżący widok – jak na YouTube, gdzie odświeżenie zostawia ten sam film.
const rodzajWejscia = performance.getEntriesByType?.('navigation')?.[0]?.type;
if (location.hash && rodzajWejscia !== 'reload' && rodzajWejscia !== 'back_forward') {
  history.replaceState(null, '', location.pathname + location.search);
}
trasa();
