// Logika quizu – czyste funkcje (bez DOM), testowane w testy/test.mjs.

export const SPRAWDZIAN = 'sprawdzian';

// Tasowanie Fishera-Yatesa. Zwraca nową tablicę.
export function tasuj(tablica, losuj = Math.random) {
  const a = tablica.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(losuj() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Każda fraza z puli z równym prawdopodobieństwem.
export function losujFraze(pula, losuj = Math.random) {
  return pula[Math.floor(losuj() * pula.length)];
}

// Procent zaokrąglony do liczby całkowitej (7 z 12 = 58%).
export function procent(poprawne, wszystkie) {
  if (!wszystkie) return 0;
  return Math.round((poprawne / wszystkie) * 100);
}

// Pytania danego quizu; „Sprawdzian” = wszystkie pytania z quizów 1–10.
export function pytaniaQuizu(dane, quizId) {
  if (quizId === SPRAWDZIAN) {
    const quizy = new Set(dane.quizy.map((q) => q.id));
    return dane.pytania.filter((p) => quizy.has(p.quiz));
  }
  return dane.pytania.filter((p) => p.quiz === quizId);
}

// Nazwa pytania wyświetlana w danym quizie. W quizach „Państwa”, „Stolice” oraz „Wyspy
// i Przynależności” dopiski „(państwo)” / „(stolica)” / „(wyspa)” są zbędne (Andora, Cypr,
// Luksemburg, Monako, San Marino, Watykan), więc je pomijamy. W Sprawdzianie zostają, bo tam obok siebie są np. „Monako (państwo)”
// i „Monako (stolica)”, a także „Cypr (państwo)” i „Cypr (wyspa)”.
export function nazwaWQuizie(pytanie, quizId) {
  if (quizId === 'stolice' && pytanie.rodzaj === 'stolica') return pytanie.nazwa.replace(/ \(stolica\)$/, '');
  if (quizId === 'panstwa' && pytanie.rodzaj === 'państwo') return pytanie.nazwa.replace(/ \(państwo\)$/, '');
  if (quizId === 'wyspy' && pytanie.rodzaj === 'wyspa') return pytanie.nazwa.replace(/ \(wyspa\)$/, '');
  return pytanie.nazwa;
}

// Obszary, w które kliknięcie liczy się jako trafienie. Przy stolicy wystarczy trafić
// w jej państwo (albo w sam punkt stolicy) – nie trzeba znać dokładnego położenia miasta.
export function panstwoStolicy(pytanie) {
  return pytanie.rodzaj === 'stolica' ? 'panstwo-' + pytanie.id.replace(/^stolica-/, '') : null;
}
export function geometrieTrafienia(pytanie) {
  const p = panstwoStolicy(pytanie);
  return p ? [pytanie.geometria, p] : [pytanie.geometria];
}

export function nazwaQuizu(dane, quizId) {
  if (quizId === SPRAWDZIAN) return 'Sprawdzian';
  return dane.quizy.find((q) => q.id === quizId)?.nazwa ?? '';
}

// ---- wyniki (tylko ostatnie ukończone podejście) ----
// Tryby: „wskaz” (kliknij miejsce na mapie) i „wypisz” (wpisz nazwę podświetlonego miejsca).
// Wyniki obu trybów są zapisywane osobno.
const KLUCZ_WYNIKOW = 'europa-wyniki';
const kluczWynikow = (tryb) => (tryb === 'wypisz' ? KLUCZ_WYNIKOW + '-wypisz' : KLUCZ_WYNIKOW);

// Wersja 2: quiz „Państwa i Stolice” podzielony na „Państwa” i „Stolice”.
// Stary wynik pod kluczem „panstwa” dotyczył połączonego quizu (92 pytania),
// więc jest usuwany; pozostałe wyniki zostają.
const KLUCZ_WERSJI = 'europa-wyniki-wersja';
function migruj(magazyn) {
  try {
    if (magazyn.getItem(KLUCZ_WERSJI) === '2') return;
    const w = JSON.parse(magazyn.getItem(KLUCZ_WYNIKOW) || '{}') || {};
    delete w.panstwa;
    magazyn.setItem(KLUCZ_WYNIKOW, JSON.stringify(w));
    magazyn.setItem(KLUCZ_WERSJI, '2');
  } catch { /* brak dostępu do magazynu */ }
}

export function wczytajWyniki(magazyn = globalThis.localStorage, tryb = 'wskaz') {
  if (tryb !== 'wypisz') migruj(magazyn);
  try { return JSON.parse(magazyn.getItem(kluczWynikow(tryb)) || '{}') || {}; } catch { return {}; }
}

export function zapiszWynik(quizId, wartoscProcent, magazyn = globalThis.localStorage, tryb = 'wskaz') {
  const w = wczytajWyniki(magazyn, tryb); // (wczytanie wykonuje też migrację)
  w[quizId] = wartoscProcent; // nadpisuje poprzedni wynik
  try { magazyn.setItem(kluczWynikow(tryb), JSON.stringify(w)); } catch { /* ignoruj */ }
}

// ---- tryb „Wypisz”: sprawdzanie wpisanej nazwy ----
// Pytanie wyświetlane nad polem do wpisania, zależnie od rodzaju obiektu.
const PYTANIA_O_RODZAJ = {
  'państwo': 'Jakie to państwo?',
  stolica: 'Jaka to stolica?',
  morze: 'Jakie to morze?',
  zatoka: 'Jaka to zatoka?',
  'półwysep': 'Jaki to półwysep?',
  wyspa: 'Jaka to wyspa lub archipelag?',
  kraina: 'Jaka to kraina geograficzna?',
  rzeka: 'Jaka to rzeka?',
  jezioro: 'Jakie to jezioro?',
  'cieśnina': 'Jaka to cieśnina lub kanał?',
};
export function pytanieORodzaj(pytanie) {
  return PYTANIA_O_RODZAJ[pytanie.rodzaj] || 'Co to za miejsce?';
}

// Inne poprawne, powszechnie używane polskie nazwy.
const INNE_NAZWY = {
  'panstwo-holandia': ['Niderlandy'],
  'stolica-islandia': ['Reykjavík'],
  'morze-marmara': ['Morze Marmarowe'],
  'ciesnina-la-manche': ['La Manche'],
  'ciesnina-swietego-jerzego': ['Kanał św. Jerzego', 'Kanał Św. Jerzego'],
};

// Porównanie bez względu na wielkość liter, zbędne spacje, kropkę/wykrzyknik na końcu
// i polskie znaki („macedonia polnocna” = „Macedonia Północna”, „Ladoga” = „Ładoga”).
const BEZ_OGONKOW = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };
export function normalizujOdpowiedz(tekst) {
  return String(tekst).normalize('NFC').toLocaleLowerCase('pl')
    .replace(/[ąćęłńóśźż]/g, (z) => BEZ_OGONKOW[z])
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // pozostałe znaki diakrytyczne, np. „í” w „Reykjavík”
    .replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();
}

// Słowo określające rodzaj obiektu na początku nazwy nie jest wymagane:
// na „Jaka to zatoka?” wystarczy „Biskajska”, na „Jakie to morze?” – „Północne” itd.
const SLOWA_RODZAJU = ['Morze', 'Zatoka', 'Półwysep', 'Nizina', 'Wyżyna', 'Góry', 'Masyw', 'Jezioro', 'Cieśnina', 'Kanał', 'Wyspy', 'Wyspa'];

// Wszystkie akceptowane odpowiedzi (do porównania). Dopiski „(państwo)”, „(stolica)”, „(wyspa)”
// nie są wymagane; przy nazwach typu „Stara Płanina (Bałkany)” wystarczy każda z części.
export function poprawneOdpowiedzi(pytanie, quizId) {
  const wyniki = new Set([nazwaWQuizie(pytanie, quizId), pytanie.nazwa, ...(INNE_NAZWY[pytanie.id] || [])]);
  for (const n of [...wyniki]) {
    const m = n.match(/^(.*?)\s*\((.+)\)$/);
    if (m) {
      wyniki.add(m[1]);
      if (!['państwo', 'stolica', 'wyspa'].includes(m[2])) wyniki.add(m[2]);
    }
  }
  for (const n of [...wyniki]) {
    const slowo = SLOWA_RODZAJU.find((w) => n.startsWith(w + ' '));
    if (slowo) wyniki.add(n.slice(slowo.length + 1));
  }
  return [...wyniki];
}

export function sprawdzOdpowiedz(wpis, pytanie, quizId) {
  const w = normalizujOdpowiedz(wpis);
  if (!w) return false;
  return poprawneOdpowiedzi(pytanie, quizId).some((o) => normalizujOdpowiedz(o) === w);
}
