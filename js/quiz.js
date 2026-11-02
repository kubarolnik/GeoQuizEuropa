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
const KLUCZ_WYNIKOW = 'europa-wyniki';

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

export function wczytajWyniki(magazyn = globalThis.localStorage) {
  migruj(magazyn);
  try { return JSON.parse(magazyn.getItem(KLUCZ_WYNIKOW) || '{}') || {}; } catch { return {}; }
}

export function zapiszWynik(quizId, wartoscProcent, magazyn = globalThis.localStorage) {
  const w = wczytajWyniki(magazyn); // (wczytanie wykonuje też migrację)
  w[quizId] = wartoscProcent; // nadpisuje poprzedni wynik
  try { magazyn.setItem(KLUCZ_WYNIKOW, JSON.stringify(w)); } catch { /* ignoruj */ }
}
