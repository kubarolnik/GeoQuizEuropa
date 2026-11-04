// Widoki strony: start, lista quizów, quiz i wynik. Nawigacja przez adres z „#”.

import { MOTYWY, wczytajMotyw, zapiszMotyw, zastosujMotyw, akcentDla } from './motywy.js';
import { utworzKoloBarw } from './kolo-barw.js';
import { tasuj, losujFraze, procent, pytaniaQuizu, nazwaQuizu, nazwaWQuizie, geometrieTrafienia, panstwoStolicy, wczytajWyniki, zapiszWynik, pytanieORodzaj, sprawdzOdpowiedz, polecenieWskaz, SPRAWDZIAN } from './quiz.js';
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
// Krótkie opisy kategorii na kafelkach (na telefonie ukryte).
const OPISY_QUIZOW = {
  panstwa: 'Wszystkie państwa Europy.',
  stolice: 'Od Lizbony po Moskwę.',
  morza: 'Od Morza Barentsa po Azowskie.',
  zatoki: 'Botnicka, Biskajska, Wenecka…',
  polwyspy: 'Od Skandynawii po Krym.',
  wyspy: 'Wyspy i państwa, do których należą.',
  krainy: 'Niziny, wyżyny i łańcuchy górskie.',
  rzeki: 'Od Wołgi po Tamizę.',
  jeziora: 'Od Ładogi po Balaton.',
  ciesniny: 'Cieśniny i kanały między morzami.',
};
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
// Kontynenty na stronie głównej. Kolejny kontynent (np. Azja) dochodzi jako kolejny wpis
// – mapa w tle (img/kontynenty.svg) ma już jego kształt (klasa .kont-<id>).
const KONTYNENTY = [{ id: 'europa', nazwa: 'Europa', href: '#europa' }];
let mapaKontynentow = null; // tekst SVG (wczytywany raz)
function wstawMapeKontynentow(kontener) {
  const wstaw = (svg) => { if (kontener.isConnected) kontener.insertAdjacentHTML('afterbegin', svg); };
  if (mapaKontynentow) { wstaw(mapaKontynentow); return; }
  fetch('img/kontynenty.svg?v=1').then((r) => (r.ok ? r.text() : Promise.reject())).then((t) => { mapaKontynentow = t; wstaw(t); }).catch(() => {});
}
const glownaGora = (lewa) => `
      <header class="glowna-gora">
        ${lewa}
        <button class="przycisk-ikona przycisk-motywu" type="button" aria-label="Wybierz motyw" aria-haspopup="dialog">${ikona.motyw}</button>
      </header>`;
const logo = '<span class="logo"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg><b>GeoQuiz</b></span>';
const strzalka = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
// Ukończone quizy (Sprawdzian + quizy) w danym trybie.
function ukonczoneWTrybie(tryb) {
  const w = wczytajWyniki(undefined, tryb);
  return [SPRAWDZIAN, ...dane.quizy.map((q) => q.id)].filter((id) => id in w).length;
}

function widokStart() {
  zamknijMape();
  document.title = 'GeoQuiz – geografia';
  app.innerHTML = '';
  const v = el(`
    <main class="widok widok-glowna">
      ${glownaGora(logo)}
      <section class="glowna-hero">
        <div class="glowna-tekst">
          <span class="glowna-nad">Geografia · quizy z mapą</span>
          <h1>Naucz się mapy<br>świata.</h1>
          <p class="glowna-lead">Wybierz kontynent – państwa, stolice, morza, rzeki i góry na czystej mapie bez podpisów.</p>
          <div class="glowna-cta">
            ${KONTYNENTY.map((k) => `<a class="cta" href="${k.href}" data-kontynent="${k.id}">${k.nazwa}<span class="cta-strzalka">${strzalka}</span></a>`).join('')}
          </div>
          <div class="glowna-staty">
            <div><b class="stat-quizy">–</b><span>Quizy</span></div>
            <div><b class="stat-miejsca">–</b><span class="stat-miejsca-slowo">miejsc</span></div>
            <div><b class="stat-ukonczone">–</b><span>ukończone</span></div>
          </div>
        </div>
        <div class="glowna-mapa" data-kontynent="${KONTYNENTY[0].id}"><span class="glowna-mapa-podpis">${KONTYNENTY[0].nazwa}</span></div>
      </section>
    </main>`);
  app.append(v);
  v.querySelector('.przycisk-motywu').addEventListener('click', (e) => { e.stopPropagation(); przelaczOknoMotywu(v); });
  const mapa = v.querySelector('.glowna-mapa');
  wstawMapeKontynentow(mapa);
  // Komputer: wskazany kontynent podświetla się na mapie (na telefonie nie – patrz CSS).
  for (const w of v.querySelectorAll('.cta')) {
    w.addEventListener('pointerenter', () => {
      const k = KONTYNENTY.find((x) => x.id === w.dataset.kontynent);
      mapa.dataset.kontynent = k.id;
      mapa.querySelector('.glowna-mapa-podpis').textContent = k.nazwa;
    });
  }
  wczytajDane().then(() => {
    if (!v.isConnected) return;
    const ile = dane.quizy.length + 1; // Sprawdzian + quizy
    v.querySelector('.stat-quizy').textContent = ile * 2; // każdy quiz w dwóch trybach (Wskaż i Wypisz)
    v.querySelector('.stat-miejsca').textContent = dane.pytania.length;
    const n = dane.pytania.length;
    v.querySelector('.stat-miejsca-slowo').textContent = n === 1 ? 'miejsce' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'miejsca' : 'miejsc';
    v.querySelector('.stat-ukonczone').textContent = `${ukonczoneWTrybie('wskaz') + ukonczoneWTrybie('wypisz')}/${ile * 2}`;
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

// ================================================================ WYBÓR TRYBU
const TRYBY = {
  wskaz: { nazwa: 'Wskaż', opis: 'Kliknij na mapie miejsce, o które pyta quiz', lista: '#europa-wskaz', quiz: (id) => `#quiz-${id}` },
  wypisz: { nazwa: 'Wypisz', opis: 'Wpisz nazwę miejsca podświetlonego na mapie', lista: '#europa-wypisz', quiz: (id) => `#wypisz-${id}` },
};
const ikonaTrybu = {
  wskaz: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.2"/></svg>',
  wypisz: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
};

function widokWybor() {
  zamknijMape();
  document.title = 'Europa – wybierz tryb';
  app.innerHTML = '';
  const v = el(`
    <main class="widok widok-glowna widok-tryby">
      ${glownaGora(`<a class="glowna-wroc" href="#">${ikona.wstecz}<span>Wróć</span></a>`)}
      <section class="tryby-tresc">
        <span class="glowna-nad">Europa</span>
        <h1>Wybierz tryb</h1>
        <div class="glowna-lista">
          ${Object.entries(TRYBY).map(([id, t]) => `
            <a class="wiersz" href="${t.lista}" data-tryb="${id}">
              <span class="wiersz-ikona">${ikonaTrybu[id]}</span>
              <span class="wiersz-tekst"><b>${t.nazwa}</b><span class="wiersz-opis">${t.opis}</span></span>
              <span class="wiersz-postep"></span>
              <span class="wiersz-strzalka">${strzalka}</span>
            </a>`).join('')}
        </div>
      </section>
      <div class="glowna-mapa tryby-mapa" data-kontynent="europa" aria-hidden="true"></div>
    </main>`);
  app.append(v);
  v.querySelector('.przycisk-motywu').addEventListener('click', (e) => { e.stopPropagation(); przelaczOknoMotywu(v); });
  wstawMapeKontynentow(v.querySelector('.tryby-mapa'));
  wczytajDane().then(() => {
    if (!v.isConnected) return;
    for (const w of v.querySelectorAll('.wiersz')) w.querySelector('.wiersz-postep').textContent = `${ukonczoneWTrybie(w.dataset.tryb)}/${dane.quizy.length + 1}`;
  }).catch(() => {});
}

// ================================================================ LISTA QUIZÓW
async function widokLista(tryb = 'wskaz') {
  zamknijMape();
  const T = TRYBY[tryb];
  document.title = `${T.nazwa} – Europa`;
  await wczytajDane();
  const wyniki = wczytajWyniki(undefined, tryb);
  const ile = (id) => pytaniaQuizu(dane, id).length;
  // Kafelek: zdjęcie przechodzące w rozmyte tło w jego kolorach, nazwa, liczba pytań, wynik z paskiem.
  // Wynik pokazujemy tylko dla quizów już ukończonych.
  const stan = (id) => (!(id in wyniki) ? 'Nowy' : wyniki[id] === 100 ? 'Ukończony' : 'W trakcie');
  // Nazwa w dwóch liniach (Krainy Geograficzne): bez opisu, żeby wynik się zmieścił.
  const karta = (q) => {
    const zdjecie = `img/kafel-${q.id}.jpg?v=2`;
    const w = wyniki[q.id];
    return `
          <a class="karta${q.nazwa.length > 16 ? ' karta-dluga' : ''}" href="${T.quiz(q.id)}">
            <span class="karta-tlo" style="background-image:url(${zdjecie})" aria-hidden="true"></span>
            <span class="karta-zdjecie" style="background-image:url(${zdjecie})"><span class="karta-numer">${q.numer}</span></span>
            <span class="karta-tresc">
              <span class="karta-tytul"><span class="karta-liczba">${ile(q.id)} pyt.</span><span class="karta-nazwa">${q.nazwa}</span></span>
              <span class="karta-opis">${OPISY_QUIZOW[q.id] || ''}</span>
              <span class="karta-info">
                <span class="karta-stan">${stan(q.id)}</span>
                <span class="karta-wynik">${w === undefined ? 'Brak wyniku' : `Wynik ${w}%`}<span class="karta-pasek" aria-hidden="true"><span style="width:${w ?? 0}%"></span></span></span>
              </span>
            </span>
          </a>`;
  };
  app.innerHTML = '';
  app.append(el(`
    <main class="widok widok-lista">
      <header class="pasek">
        <a class="przycisk maly" href="#europa">${ikona.wstecz}<span>Wróć</span></a>
        <h1>Europa <span class="pasek-tryb">· ${T.nazwa}</span></h1>
      </header>
      <a class="przycisk kafel kafel-sprawdzian" href="${T.quiz(SPRAWDZIAN)}">
        <span class="kafel-gora">
          <span class="kafel-dol">
            <span class="kafel-nazwa">Sprawdzian</span>
            <span class="kafel-opis">${ile(SPRAWDZIAN)} ${odmianaPytan(ile(SPRAWDZIAN))} · wszystkie kategorie</span>
          </span>
          <span class="wyniki-sprawdzianu">
            ${SPRAWDZIAN in wyniki ? `<span class="wynik-duzy">${wyniki[SPRAWDZIAN]}%<small>cały sprawdzian</small></span>` : ''}
            ${'sprawdzian-ostatni' in wyniki ? `<span class="wynik-duzy wynik-ostatni">${wyniki['sprawdzian-ostatni']}%<small>ostatnie podejście${wyniki['sprawdzian-ostatni-zakres'] < dane.quizy.length ? ` · ${wyniki['sprawdzian-ostatni-zakres']}\u00a0z\u00a0${dane.quizy.length}` : ''}</small></span>` : ''}
          </span>
        </span>
        ${SPRAWDZIAN in wyniki ? `<span class="pasek-wyniku" aria-hidden="true"><span style="width:${wyniki[SPRAWDZIAN]}%"></span></span>` : ''}
      </a>
      <div class="siatka">
        ${dane.quizy.map(karta).join('')}
      </div>
    </main>`));
  app.querySelector('.kafel-sprawdzian').addEventListener('click', (e) => { e.preventDefault(); oknoWyboruZagadnien(T); });
}

// Ostatnie podejście do Sprawdzianu (pełnego albo z wybranych zagadnień) – drugi wskaźnik na kafelku.
// Zapis obok wyników: „sprawdzian-ostatni” (procent) i „sprawdzian-ostatni-zakres” (liczba zagadnień).
function zapiszOstatniSprawdzian(proc, kategorie, tryb) {
  zapiszWynik('sprawdzian-ostatni', proc, undefined, tryb);
  zapiszWynik('sprawdzian-ostatni-zakres', kategorie ? kategorie.length : dane.quizy.length, undefined, tryb);
}

// ---- Sprawdzian z wybranych zagadnień ----
// Adres quizu: „sprawdzian” (wszystkie zagadnienia) albo „sprawdzian~morza,rzeki” (tylko wybrane).
function rozbierzAdresQuizu(adres) {
  const [quizId, wybor] = String(adres).split('~');
  if (quizId !== SPRAWDZIAN || !wybor) return { quizId, kategorie: null };
  const kategorie = dane.quizy.map((q) => q.id).filter((id) => wybor.split(',').includes(id));
  return { quizId, kategorie: kategorie.length && kategorie.length < dane.quizy.length ? kategorie : null };
}
function pytaniaSprawdzianu(quizId, kategorie) {
  const wszystkie = pytaniaQuizu(dane, quizId);
  return kategorie ? wszystkie.filter((p) => kategorie.includes(p.quiz)) : wszystkie;
}
// Okno wyboru zagadnień przed Sprawdzianem (wszystkie zaznaczone na start).
function oknoWyboruZagadnien(T) {
  const ile = (id) => pytaniaQuizu(dane, id).length;
  const okno = el(`
    <div class="tlo-okna tlo-wyboru">
      <section class="okno okno-zagadnien" role="dialog" aria-label="Wybierz zagadnienia">
        <p class="okno-pytanie">Sprawdzian</p>
        <p class="okno-opis">Wybierz zagadnienia do testu</p>
        <button class="przycisk-tekst zaznacz-wszystkie" type="button">Odznacz wszystkie</button>
        <div class="lista-zagadnien">
          ${dane.quizy.map((q) => `
            <label class="zagadnienie">
              <input type="checkbox" value="${q.id}" checked>
              <span class="zagadnienie-nazwa"><span class="numer">${q.numer}.</span> ${q.nazwa}</span>
              <span class="zagadnienie-ile">${ile(q.id)}</span>
            </label>`).join('')}
        </div>
        <p class="zagadnienia-podsumowanie"></p>
        <div class="przyciski">
          <button class="przycisk anuluj" type="button">Anuluj</button>
          <button class="przycisk glowny rozpocznij" type="button">Rozpocznij</button>
        </div>
      </section>
    </div>`);
  const pola = [...okno.querySelectorAll('input[type="checkbox"]')];
  const rozpocznij = okno.querySelector('.rozpocznij'), wszystkie = okno.querySelector('.zaznacz-wszystkie');
  const odswiez = () => {
    const wybrane = pola.filter((x) => x.checked);
    const n = wybrane.reduce((s, x) => s + ile(x.value), 0);
    rozpocznij.disabled = !wybrane.length;
    const k = wybrane.length, slowoK = k === 1 ? 'zagadnienie' : k >= 2 && k <= 4 ? 'zagadnienia' : 'zagadnień';
    okno.querySelector('.zagadnienia-podsumowanie').textContent = k ? `Wybrano ${k} ${slowoK} · ${n} ${odmianaPytan(n)}` : 'Zaznacz co najmniej jedno zagadnienie';
    wszystkie.textContent = wybrane.length === pola.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie';
  };
  pola.forEach((x) => x.addEventListener('change', odswiez));
  wszystkie.addEventListener('click', () => { const zazn = !pola.every((x) => x.checked); pola.forEach((x) => { x.checked = zazn; }); odswiez(); });
  okno.querySelector('.anuluj').addEventListener('click', () => okno.remove());
  okno.addEventListener('click', (e) => { if (e.target === okno) okno.remove(); });
  rozpocznij.addEventListener('click', () => {
    const wybrane = pola.filter((x) => x.checked).map((x) => x.value);
    if (!wybrane.length) return;
    location.hash = T.quiz(wybrane.length === pola.length ? SPRAWDZIAN : `${SPRAWDZIAN}~${wybrane.join(',')}`);
  });
  odswiez();
  document.body.append(okno);
  rozpocznij.focus({ preventScroll: true });
  // okno znika przy zmianie widoku
  const sprzataj = () => { okno.remove(); window.removeEventListener('hashchange', sprzataj); };
  window.addEventListener('hashchange', sprzataj);
}

// ======================================================================= QUIZ
async function widokQuiz(adres) {
  zamknijMape();
  await wczytajDane();
  const { quizId, kategorie } = rozbierzAdresQuizu(adres);
  if (quizId !== SPRAWDZIAN && !dane.quizy.some((q) => q.id === quizId)) { location.hash = '#europa-wskaz'; return; }
  const nazwa = kategorie ? `Sprawdzian · ${kategorie.length} z ${dane.quizy.length}` : nazwaQuizu(dane, quizId);
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

  let pytania, nr, poprawne, odpowiedziano, bledy;

  // Część mapy zasłonięta przez panel: zwykle pas u góry, a na telefonie trzymanym
  // poziomo (panel w lewym górnym rogu) – pas po lewej stronie.
  // Ten sam warunek co w CSS dla karty w rogu (telefon trzymany poziomo).
  const kartaWRogu = window.matchMedia('(orientation: landscape) and (max-height: 500px) and (pointer: coarse)');
  function marginesyPanelu() {
    const r = panel.getBoundingClientRect();
    return kartaWRogu.matches ? [0, r.right] : [r.bottom, 0];
  }

  function start() {
    pytania = tasuj(pytaniaSprawdzianu(quizId, kategorie));
    nr = 0; poprawne = 0; bledy = [];
    pokazPytanie();
  }

  function pokazPytanie() {
    odpowiedziano = false;
    mapa.wyczysc();
    mapa.wrocDoEuropy();
    const p = pytania[nr];
    licznik.textContent = `${nr + 1}/${pytania.length}`;
    ustawPostep(nr);
    // Miękki dywiz: w wąskiej karcie (telefon poziomo) bardzo długie słowo łamie się poprawnie.
    cel.textContent = polecenieWskaz(p, quizId).replace(/Wschodnioeuropejsk/, 'Wschodnio\u00ADeuropejsk');
    cel.classList.remove('wejscie'); void cel.offsetWidth; cel.classList.add('wejscie');
    odpowiedz.hidden = true;
    panel.classList.remove('po-odpowiedzi', 'trafione', 'pudlo', 'tylko-przynaleznosc');
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
      pokazPrzynaleznoscPoTrafieniu(p, odpowiedz, przynaleznosc, panel);
      const tenNr = nr;
      Promise.resolve(mapa.pokazObiekt(p.geometria, marginesyPanelu()[0], { przyblizMale: false, lewyMargines: marginesyPanelu()[1] })).then(() => {
        setTimeout(() => {
          if (!v.isConnected || nr !== tenNr) return; // quiz zakończony albo przerwany w międzyczasie
          nastepne();
        }, 1000);
      });
      return;
    }

    mapa.pokazPudlo(latlng);
    bledy.push(p);

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
    requestAnimationFrame(() => { const [gora, lewo] = marginesyPanelu(); mapa.pokazObiekt(panstwo || p.geometria, gora, { lewyMargines: lewo }); });
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
    if (!kategorie) zapiszWynik(quizId, proc); // nadpisuje poprzedni wynik (Sprawdzian z wybranych zagadnień nie jest zapisywany)
    if (quizId === SPRAWDZIAN) zapiszOstatniSprawdzian(proc, kategorie);
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
            <button class="przycisk jeszcze" type="button">Jeszcze raz<span class="klawisz" aria-hidden="true">spacja</span></button>
            <a class="przycisk glowny wroc-do-listy" href="#europa-wskaz">Wróć do quizów<span class="klawisz" aria-hidden="true">enter</span></a>
          </div>
        </section>
      </div>`);
    v.append(okno);
    if (quizId === SPRAWDZIAN) pokazBledy(okno, bledy);
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
            <a class="przycisk" href="#europa-wskaz">Zakończ</a>
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

// ============================================================== QUIZ „WYPISZ”
// Na mapie podświetla się obiekt, a użytkownik wpisuje jego nazwę w górnym pasku.
async function widokWypisz(adres) {
  zamknijMape();
  await wczytajDane();
  const { quizId, kategorie } = rozbierzAdresQuizu(adres);
  if (quizId !== SPRAWDZIAN && !dane.quizy.some((q) => q.id === quizId)) { location.hash = '#europa-wypisz'; return; }
  const nazwa = kategorie ? `Sprawdzian · ${kategorie.length} z ${dane.quizy.length}` : nazwaQuizu(dane, quizId);
  document.title = `${nazwa} (wypisz) – Europa`;
  const KOLOR_PYTANIA = '#e8b04b'; // podświetlenie obiektu, o który pytamy
  const KOLOR_DOBRZE = '#16b45a';
  const KOLOR_ZLE = '#e04848';

  app.innerHTML = '';
  const v = el(`
    <main class="widok widok-quiz">
      <div class="mapa" id="mapa"></div>
      <section class="panel panel-wypisz" aria-live="polite">
        <div class="panel-gora">
          <span class="etykieta">${nazwa}</span>
          <span class="licznik"></span>
          <button class="przycisk-tekst zakoncz" type="button">Zakończ</button>
        </div>
        <h2 class="cel"></h2>
        <form class="wpisz" autocomplete="off">
          <input class="pole" type="text" name="odpowiedz" placeholder="Wpisz nazwę…" aria-label="Nazwa podświetlonego miejsca"
            autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="go">
          <button class="przycisk glowny sprawdz" type="submit">Sprawdź</button>
        </form>
        <div class="odpowiedz" hidden>
          <p class="fraza"></p>
          <p class="poprawna"></p>
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
  const forma = v.querySelector('.wpisz');
  const pole = v.querySelector('.pole');
  const przyciskSprawdz = v.querySelector('.sprawdz');
  const odpowiedz = v.querySelector('.odpowiedz');
  const fraza = v.querySelector('.fraza');
  const poprawna = v.querySelector('.poprawna');
  const przynaleznosc = v.querySelector('.przynaleznosc');
  const dalej = v.querySelector('.dalej');
  const postep = v.querySelector('.postep span');
  const ustawPostep = (n) => { postep.style.transform = `scaleX(${n / pytania.length})`; };
  const dotyk = window.matchMedia('(pointer: coarse)');
  const kartaWRogu = window.matchMedia('(orientation: landscape) and (max-height: 500px) and (pointer: coarse)');
  const marginesyPanelu = () => { const r = panel.getBoundingClientRect(); return kartaWRogu.matches ? [0, r.right] : [r.bottom, 0]; };
  // Wysokość dołu ekranu zasłoniętego przez klawiaturę telefonu (0, gdy klawiatura jest schowana).
  // Niektóre przeglądarki (np. strona osadzona w ramce) nie podają wysokości klawiatury –
  // wtedy, gdy pole ma fokus na telefonie, przyjmujemy typową wysokość klawiatury.
  const zaslonietyDol = () => {
    const vv = window.visualViewport;
    const zmierzone = vv ? Math.max(0, Math.round(window.innerHeight - (vv.offsetTop + vv.height))) : 0;
    if (zmierzone >= 50 || !dotyk.matches || document.activeElement !== pole) return zmierzone;
    const poziomo = window.innerWidth > window.innerHeight;
    return Math.round(window.innerHeight * (poziomo ? 0.55 : 0.42));
  };
  // Odsłania obiekt w części mapy, której nie zasłania panel ani klawiatura.
  function odslon(id) {
    const [gora, lewo] = marginesyPanelu();
    return mapa.pokazObiekt(id, gora, { lewyMargines: lewo, dolnyMargines: zaslonietyDol(), przyblizMale: false });
  }
  let doOdsloniecia = null; // obiekt bieżącego pytania
  // Otwarcie/zamknięcie klawiatury zmienia widoczną część ekranu – sprawdzamy, czy obiekt nadal widać.
  let czekaj = null;
  let wracaDoEuropy = false; // w trakcie powrotu do widoku Europy nie przerywamy lotu mapy
  const poZmianieEkranu = () => { clearTimeout(czekaj); czekaj = setTimeout(() => { if (v.isConnected && doOdsloniecia && !wracaDoEuropy) odslon(doOdsloniecia); }, 150); };
  window.visualViewport?.addEventListener('resize', poZmianieEkranu);
  pole.addEventListener('focus', poZmianieEkranu);

  let pytania, nr, poprawne, odpowiedziano, bledy;
  let klawiaturaPrzedBledem = false; // czy przed błędną odpowiedzią klawiatura była otwarta (telefon)

  function start() {
    pytania = tasuj(pytaniaSprawdzianu(quizId, kategorie));
    nr = 0; poprawne = 0; bledy = [];
    pokazPytanie();
  }

  function pokazPytanie() {
    odpowiedziano = false;
    mapa.wyczysc();
    const p = pytania[nr];
    licznik.textContent = `${nr + 1}/${pytania.length}`;
    ustawPostep(nr);
    cel.textContent = pytanieORodzaj(p);
    cel.classList.remove('wejscie'); void cel.offsetWidth; cel.classList.add('wejscie');
    odpowiedz.hidden = true;
    pole.value = '';
    pole.classList.remove('dobrze', 'zle');
    panel.classList.remove('po-odpowiedzi', 'trafione', 'pudlo', 'tylko-przynaleznosc');
    przyciskSprawdz.removeAttribute('aria-disabled');
    // Stolica: delikatnie jej państwo + punkt stolicy. Inne obiekty: sam obiekt.
    const panstwo = panstwoStolicy(p);
    if (panstwo) mapa.podswietl(panstwo, { slabo: true, kolor: KOLOR_PYTANIA });
    mapa.podswietl(p.geometria, { kolor: KOLOR_PYTANIA });
    // Jak w trybie „Wskaż”: mapa rusza się tylko wtedy, gdy obiekt (przy stolicy – całe jej
    // państwo) nie mieści się w widocznej części mapy; poza tym przybliżenie i położenie ustawia użytkownik.
    doOdsloniecia = panstwo || p.geometria;
    const obiekt = doOdsloniecia;
    wracaDoEuropy = true;
    const [gora0, lewo0] = marginesyPanelu();
    mapa.wrocDoEuropy(obiekt, { gornyMargines: gora0, lewyMargines: lewo0, dolnyMargines: zaslonietyDol() }).then(() => { wracaDoEuropy = false; requestAnimationFrame(() => { if (doOdsloniecia === obiekt) odslon(obiekt); }); });
    // Na komputerze kursor od razu w polu. Na telefonie klawiatura otwiera się po pierwszym
    // stuknięciu w pole i potem zostaje otwarta – pole nie traci fokusu między pytaniami.
    if (!dotyk.matches || document.activeElement === pole) pole.focus({ preventScroll: true });
  }

  function sprawdz(e) {
    e.preventDefault();
    // Po złej odpowiedzi Enter w polu działa jak „Dalej” (klawiatura zostaje otwarta).
    // Przyciemniony „Sprawdź” po odpowiedzi nic nie robi.
    if (odpowiedziano) { if (e.submitter !== przyciskSprawdz && panel.classList.contains('pudlo')) nastepne(); return; }
    if (!pole.value.trim()) { pole.focus(); return; }
    odpowiedziano = true;
    przyciskSprawdz.setAttribute('aria-disabled', 'true');
    const p = pytania[nr];
    const ok = sprawdzOdpowiedz(pole.value, p, quizId);
    // Pole nie jest wyłączane ani chowane (to zamykałoby klawiaturę na telefonie);
    // pisanie w nim jest tylko zablokowane do następnego pytania.
    ustawPostep(nr + 1);

    // Podświetlenie zmienia kolor: zielony – dobrze, czerwony – źle.
    const panstwo = panstwoStolicy(p);
    const kolor = ok ? KOLOR_DOBRZE : KOLOR_ZLE;
    mapa.wyczysc();
    if (panstwo) mapa.podswietl(panstwo, { slabo: true, kolor });
    mapa.podswietl(p.geometria, { kolor });

    if (ok) {
      // Poprawnie: bez frazy i bez „Dalej” – po 1 s następne pytanie.
      poprawne++;
      pole.classList.add('dobrze');
      panel.classList.remove('trafione'); void panel.offsetWidth; panel.classList.add('trafione');
      pokazPrzynaleznoscPoTrafieniu(p, odpowiedz, przynaleznosc, panel);
      const tenNr = nr;
      setTimeout(() => { if (v.isConnected && nr === tenNr) nastepne(); }, 1000);
      return;
    }

    pole.classList.add('zle');
    bledy.push(p);
    fraza.innerHTML = '';
    fraza.append(el(`<span class="znak">${ikona.zamknij}</span>`));
    fraza.append(document.createTextNode(losujFraze(dane.frazy.pudlo)));
    poprawna.innerHTML = '';
    poprawna.append('Poprawna odpowiedź: ', Object.assign(document.createElement('strong'), { textContent: nazwaWQuizie(p, quizId) }));
    if (p.przynaleznosc) {
      przynaleznosc.hidden = false;
      przynaleznosc.innerHTML = '';
      przynaleznosc.append('Przynależność: ', Object.assign(document.createElement('strong'), { textContent: p.przynaleznoscOpis || p.przynaleznosc }));
    } else przynaleznosc.hidden = true;
    dalej.querySelector('span').textContent = nr === pytania.length - 1 ? 'Wynik' : 'Dalej';
    odpowiedz.hidden = false;
    panel.classList.add('po-odpowiedzi', 'pudlo');
    try { navigator.vibrate?.(120); } catch { /* brak wibracji */ }
    // Po błędzie na telefonie chowamy klawiaturę, żeby było widać mapę i poprawną odpowiedź.
    // Na komputerze kursor zostaje w polu – Enter przechodzi dalej.
    klawiaturaPrzedBledem = dotyk.matches && document.activeElement === pole;
    if (dotyk.matches) pole.blur();
  }

  function nastepne() {
    if (!odpowiedziano) return;
    nr++;
    if (nr >= pytania.length) pokazWynik();
    else pokazPytanie();
  }

  function pokazWynik() {
    const proc = procent(poprawne, pytania.length);
    if (!kategorie) zapiszWynik(quizId, proc, undefined, 'wypisz'); // jw., w trybie „Wypisz”
    if (quizId === SPRAWDZIAN) zapiszOstatniSprawdzian(proc, kategorie, 'wypisz');
    mapa.wyczysc();
    pole.blur();
    const okno = el(`
      <div class="tlo-okna tlo-wyniku">
        <section class="okno wynik-koncowy" role="dialog" aria-label="Wynik">
          <span class="etykieta">${nazwa} · Wypisz</span>
          <div class="pierscien">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle class="tor" cx="60" cy="60" r="54"/>
              <circle class="luk" cx="60" cy="60" r="54" stroke-dasharray="${(2 * Math.PI * 54).toFixed(2)}" stroke-dashoffset="${(2 * Math.PI * 54).toFixed(2)}"/>
            </svg>
            <p class="wynik-procent">${proc}%</p>
          </div>
          <p class="wynik-opis">Poprawne odpowiedzi: <strong>${poprawne}</strong> z <strong>${pytania.length}</strong></p>
          <div class="przyciski">
            <button class="przycisk jeszcze" type="button">Jeszcze raz<span class="klawisz" aria-hidden="true">spacja</span></button>
            <a class="przycisk glowny wroc-do-listy" href="#europa-wypisz">Wróć do quizów<span class="klawisz" aria-hidden="true">enter</span></a>
          </div>
        </section>
      </div>`);
    v.append(okno);
    if (quizId === SPRAWDZIAN) pokazBledy(okno, bledy);
    panel.hidden = true;
    const luk = okno.querySelector('.luk');
    requestAnimationFrame(() => requestAnimationFrame(() => { luk.style.strokeDashoffset = String(2 * Math.PI * 54 * (1 - proc / 100)); }));
    okno.querySelector('.jeszcze').addEventListener('click', () => { okno.remove(); panel.hidden = false; mapa.widokEuropy(); start(); });
  }

  function zakoncz() {
    const okno = el(`
      <div class="tlo-okna">
        <section class="okno" role="dialog" aria-label="Zakończyć quiz?">
          <p class="okno-pytanie">Zakończyć quiz?</p>
          <p class="okno-opis">Wynik tego podejścia nie zostanie zapisany.</p>
          <div class="przyciski">
            <button class="przycisk glowny anuluj" type="button">Kontynuuj</button>
            <a class="przycisk" href="#europa-wypisz">Zakończ</a>
          </div>
        </section>
      </div>`);
    v.append(okno);
    okno.querySelector('.anuluj').addEventListener('click', () => okno.remove());
    okno.addEventListener('click', (e) => { if (e.target === okno) okno.remove(); });
  }

  // Sprzątanie nasłuchu po opuszczeniu quizu.
  window.addEventListener('hashchange', () => window.visualViewport?.removeEventListener('resize', poZmianieEkranu), { once: true });
  forma.addEventListener('submit', sprawdz);
  // „Dalej” po błędzie: na telefonie od razu otwieramy klawiaturę na następne pytanie
  // (fokus musi nastąpić w trakcie stuknięcia, inaczej telefon nie pokaże klawiatury).
  dalej.addEventListener('click', () => {
    if (klawiaturaPrzedBledem && nr < pytania.length - 1) pole.focus({ preventScroll: true });
    klawiaturaPrzedBledem = false;
  }, true);
  // Po złej odpowiedzi Enter w polu przechodzi dalej.
  pole.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && odpowiedziano) { e.preventDefault(); if (panel.classList.contains('pudlo')) nastepne(); }
  });
  // Między odpowiedzią a następnym pytaniem nie da się zmienić tekstu w polu.
  pole.addEventListener('beforeinput', (e) => { if (odpowiedziano) e.preventDefault(); });
  // Przycisk „Sprawdź” / „Dalej” nie zabiera fokusu z pola (klawiatura zostaje).
  for (const przycisk of [przyciskSprawdz, dalej]) {
    for (const typ of ['pointerdown', 'mousedown']) przycisk.addEventListener(typ, (e) => { if (document.activeElement === pole) e.preventDefault(); });
  }
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
    else if (h === 'europa') widokWybor();
    else if (h === 'europa-wskaz') await widokLista('wskaz');
    else if (h === 'europa-wypisz') await widokLista('wypisz');
    else if (h.startsWith('quiz-') || h.startsWith('quiz/')) await widokQuiz(decodeURIComponent(h.slice(5)));
    else if (h.startsWith('wypisz-')) await widokWypisz(decodeURIComponent(h.slice(7)));
    else location.hash = '';
  } catch (e) {
    console.error(e);
    app.innerHTML = '';
    app.append(el(`<main class="widok widok-blad"><p>Nie udało się wczytać danych mapy.</p><p class="okno-opis">Strona musi być otwarta przez serwer (np. GitHub Pages albo <code>npx serve</code>), a nie bezpośrednio z pliku.</p><a class="przycisk" href="#">Strona główna</a></main>`));
  }
}

// Wyspy: przynależność widać także po poprawnej odpowiedzi (sama, bez frazy i „Dalej”).
function pokazPrzynaleznoscPoTrafieniu(p, odpowiedz, przynaleznosc, panel) {
  if (!p.przynaleznosc) return;
  przynaleznosc.hidden = false;
  przynaleznosc.innerHTML = '';
  przynaleznosc.append('Przynależność: ', Object.assign(document.createElement('strong'), { textContent: p.przynaleznoscOpis || p.przynaleznosc }));
  panel.classList.add('tylko-przynaleznosc');
  odpowiedz.hidden = false;
}

// Sprawdzian: pod wynikiem blok z błędami pogrupowanymi wg kategorii (numeracja jak na liście quizów).
// Wynik zostaje dokładnie tam, gdzie był (na środku ekranu); blok błędów zaczyna się w 1/3 wolnego
// miejsca pod wynikiem, więc żeby zobaczyć całość, przewija się stronę w dół.
function pokazBledy(okno, bledy) {
  if (!bledy.length) return;
  const kolejnosc = new Map(dane.pytania.map((p, i) => [p.id, i]));
  const grupy = [...dane.quizy].sort((a, b) => a.numer - b.numer)
    .map((q) => ({ q, lista: bledy.filter((p) => p.quiz === q.id).sort((a, b) => kolejnosc.get(a.id) - kolejnosc.get(b.id)) }))
    .filter((g) => g.lista.length);
  const blok = el(`<section class="okno okno-bledy" aria-label="Błędy"><div class="naglowek-bledow"><span class="etykieta">Błędy · ${bledy.length}</span></div></section>`);
  for (const { q, lista } of grupy) {
    const grupa = el(`<div class="grupa-bledow"><h3><span class="numer">${q.numer}.</span> </h3><ul></ul></div>`);
    grupa.querySelector('h3').append(q.nazwa);
    for (const p of lista) grupa.querySelector('ul').append(Object.assign(document.createElement('li'), { textContent: nazwaWQuizie(p, p.quiz) }));
    blok.append(grupa);
  }
  okno.classList.add('z-bledami');
  okno.append(blok);
  const wynik = okno.querySelector('.wynik-koncowy');
  const uloz = () => {
    if (!okno.isConnected) { window.removeEventListener('resize', uloz); return; }
    const H = okno.clientHeight, h = wynik.offsetHeight, min = 16;
    const gora = Math.max(min, (H - h) / 2);
    wynik.style.marginTop = gora + 'px';
    blok.style.marginTop = Math.max(min, (H - gora - h) / 3) + 'px';
  };
  uloz();
  window.addEventListener('resize', uloz);
}

// Sposób obsługi (do podpowiedzi klawiszy na ekranie wyniku): myszka lub klawiatura → „mysz”,
// dotyk palcem → „dotyk”. Na starcie zgadujemy po rodzaju urządzenia.
const korzen = document.documentElement;
korzen.dataset.wejscie = matchMedia('(hover: hover) and (pointer: fine)').matches ? 'mysz' : 'dotyk';
for (const typ of ['pointermove', 'pointerdown']) {
  window.addEventListener(typ, (e) => {
    const w = e.pointerType === 'mouse' ? 'mysz' : e.pointerType === 'touch' ? 'dotyk' : null;
    if (w && korzen.dataset.wejscie !== w) korzen.dataset.wejscie = w;
  }, { passive: true, capture: true });
}
// Klawisze z klawiatury ekranowej (pisanie odpowiedzi na telefonie/tablecie) się nie liczą:
// przy otwartej klawiaturze ekranowej widoczna część strony jest wyraźnie niższa niż okno.
window.addEventListener('keydown', (e) => {
  const wPolu = e.target instanceof HTMLInputElement;
  const ekranowa = wPolu && window.visualViewport && window.visualViewport.height < window.innerHeight * 0.85;
  if (!ekranowa && e.key !== 'Unidentified' && e.key !== 'Process') korzen.dataset.wejscie = 'mysz';
}, true);

document.addEventListener('keydown', (e) => {
  // Esc w trakcie quizu = „Zakończ” (okno „Zakończyć quiz?”); przy otwartym oknie Esc je zamyka (jak „Kontynuuj”).
  if (e.key === 'Escape' && !e.repeat) {
    const pytanie = document.querySelector('.tlo-okna:not(.tlo-wyniku) .anuluj');
    if (pytanie) { e.preventDefault(); pytanie.click(); return; }
    const zakoncz = document.querySelector('.panel:not([hidden]) .zakoncz');
    if (zakoncz && !document.querySelector('.tlo-okna')) { e.preventDefault(); zakoncz.click(); return; }
  }
  // Ekran wyniku: spacja = „Jeszcze raz”, Enter = „Wróć do quizów”.
  const wynik = document.querySelector('.tlo-wyniku');
  // (defaultPrevented: ten sam Enter właśnie zakończył quiz w polu odpowiedzi – nie liczy się drugi raz)
  if (wynik && !e.defaultPrevented && (e.key === ' ' || e.key === 'Enter')) {
    e.preventDefault();
    if (!e.repeat) wynik.querySelector(e.key === ' ' ? '.jeszcze' : '.wroc-do-listy')?.click();
    return;
  }
  if (e.target instanceof HTMLInputElement) return; // pisanie w polu odpowiedzi
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
