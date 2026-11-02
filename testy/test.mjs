// Testy poprawności danych i logiki quizu.
// Uruchomienie (z katalogu głównego projektu, bez instalowania czegokolwiek):
//   node testy/test.mjs

import { readFileSync } from 'node:fs';
import { tasuj, losujFraze, procent, pytaniaQuizu, nazwaWQuizie, SPRAWDZIAN } from '../js/quiz.js';

const czytaj = (p) => JSON.parse(readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const dane = czytaj('data/europa.json');
const geometrie = czytaj('data/geometrie.geojson');
const tlo = czytaj('data/tlo.geojson');
const geo = new Map(geometrie.features.map((f) => [f.id, f]));

let bledy = 0, testy = 0;
function test(nazwa, fn) {
  testy++;
  try { fn(); console.log('  ✓ ' + nazwa); } catch (e) { bledy++; console.log('  ✗ ' + nazwa + '\n      ' + e.message.split('\n').join('\n      ')); }
}
function rowne(a, b, opis = '') { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${opis} oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`); }
function prawda(w, opis) { if (!w) throw new Error(opis); }

// ---------------------------------------------------------------------------
// Lista oczekiwana – przepisana ze specyfikacji, niezależnie od pliku danych.
// Test porównuje z nią dokładnie każdą nazwę (ortografia, polskie znaki).
// ---------------------------------------------------------------------------
const PANSTWA = 'Albania (Tirana), Andora (Andora), Austria (Wiedeń), Belgia (Bruksela), Białoruś (Mińsk), Bośnia i Hercegowina (Sarajewo), Bułgaria (Sofia), Chorwacja (Zagrzeb), Cypr (Nikozja), Czarnogóra (Podgorica), Czechy (Praga), Dania (Kopenhaga), Estonia (Tallinn), Finlandia (Helsinki), Francja (Paryż), Grecja (Ateny), Hiszpania (Madryt), Holandia (Amsterdam), Irlandia (Dublin), Islandia (Reykjavik), Kosowo (Prisztina), Liechtenstein (Vaduz), Litwa (Wilno), Luksemburg (Luksemburg), Łotwa (Ryga), Macedonia Północna (Skopje), Malta (Valletta), Mołdawia (Kiszyniów), Monako (Monako), Niemcy (Berlin), Norwegia (Oslo), Polska (Warszawa), Portugalia (Lizbona), Rosja (Moskwa), Rumunia (Bukareszt), San Marino (San Marino), Serbia (Belgrad), Słowacja (Bratysława), Słowenia (Lublana), Szwajcaria (Berno), Szwecja (Sztokholm), Ukraina (Kijów), Watykan (Watykan), Węgry (Budapeszt), Wielka Brytania (Londyn), Włochy (Rzym)'
  .split('), ').map((s) => s.replace(/\)$/, '').split(' ('));
const OCZEKIWANE = {
  panstwa: PANSTWA.map(([p, s]) => (p === s || p === 'Cypr' ? `${p} (państwo)` : p)),
  stolice: PANSTWA.map(([p, s]) => (p === s ? `${s} (stolica)` : s)),
  morza: ['Morze Barentsa', 'Morze Białe', 'Morze Grenlandzkie', 'Morze Norweskie', 'Morze Północne', 'Morze Bałtyckie', 'Morze Śródziemne', 'Morze Egejskie', 'Morze Adriatyckie', 'Morze Liguryjskie', 'Morze Tyrreńskie', 'Morze Jońskie', 'Morze Marmara', 'Morze Czarne', 'Morze Azowskie'],
  zatoki: ['Zatoka Botnicka', 'Zatoka Fińska', 'Zatoka Biskajska', 'Zatoka Wenecka', 'Zatoka Genueńska'],
  polwyspy: ['Półwysep Skandynawski', 'Półwysep Kolski', 'Półwysep Jutlandzki', 'Półwysep Bretoński', 'Półwysep Iberyjski', 'Półwysep Apeniński', 'Półwysep Bałkański', 'Półwysep Krymski'],
  wyspy: ['Spitsbergen', 'Wyspy Owcze', 'Szetlandy', 'Zelandia', 'Gotlandia', 'Sarema', 'Baleary', 'Majorka', 'Minorka', 'Ibiza', 'Sardynia', 'Korsyka', 'Sycylia', 'Kreta', 'Cypr (wyspa)'],
  krainy: ['Nizina Wschodnioeuropejska', 'Nizina Nadkaspijska', 'Nizina Polska', 'Nizina Niemiecka', 'Nizina Francuska', 'Nizina Węgierska', 'Nizina Padańska', 'Nizina Czarnomorska', 'Masyw Centralny', 'Wyżyna Wołyńska', 'Wyżyna Bawarska', 'Góry Skandynawskie', 'Ural', 'Karpaty', 'Sudety', 'Góry Dynarskie', 'Apeniny', 'Alpy', 'Pireneje', 'Góry Betyckie', 'Bałkany', 'Harz'],
  rzeki: ['Wołga', 'Dniepr', 'Dniestr', 'Niemen', 'Tamiza', 'Sekwana', 'Dunaj', 'Pad', 'Ren', 'Rodan', 'Tag', 'Tyber'],
  jeziora: ['Jezioro Bodeńskie', 'Jezioro Como', 'Jezioro Genewskie', 'Onega', 'Ładoga', 'Balaton'],
  ciesniny: ['Skagerrak', 'Kattegat', 'Cieśnina Kaletańska', 'Cieśnina Gibraltarska', 'Cieśnina Sycylijska', 'Bosfor', 'Dardanele', 'Kanał La Manche', 'Kanał Świętego Jerzego'],
};
const PRZYNALEZNOSC = { Spitsbergen: 'Norwegia', 'Wyspy Owcze': 'Dania', Szetlandy: 'Wielka Brytania', Zelandia: 'Dania', Gotlandia: 'Szwecja', Sarema: 'Estonia', Baleary: 'Hiszpania', Majorka: 'Hiszpania', Minorka: 'Hiszpania', Ibiza: 'Hiszpania', Sardynia: 'Włochy', Korsyka: 'Francja', Sycylia: 'Włochy', Kreta: 'Grecja', 'Cypr (wyspa)': 'Cypr' };
const TRAFIONE = ['Trafione!', 'Doskonale!', 'Dobrze!', 'Fenomenalnie!', 'Brawo, kalafiorku!', 'Bombastycznie!'];
const PUDLO = ['Błąd!', 'Ale pech!', 'Nie tym razem', 'Słabiutko', 'Pudło!', 'Wisisz Kubie dychę'];

// ---- geometria (bez bibliotek) ----
function punktWPierscieniu([x, y], r) {
  let w = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) w = !w;
  }
  return w;
}
function punktWObszarze(pt, g) {
  const wiel = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return wiel.some((w) => { let x = false; for (const r of w) if (punktWPierscieniu(pt, r)) x = !x; return x; });
}
// odległość punktu od brzegu obszaru w km (przybliżenie płaskie, wystarczające na krótkich dystansach)
function odlegloscKm([x, y], g) {
  const wiel = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  const kx = 111.32 * Math.cos((y * Math.PI) / 180), ky = 110.57;
  let min = Infinity;
  for (const w of wiel) for (const r of w) for (let i = 1; i < r.length; i++) {
    const ax = (r[i - 1][0] - x) * kx, ay = (r[i - 1][1] - y) * ky, bx = (r[i][0] - x) * kx, by = (r[i][1] - y) * ky;
    const dx = bx - ax, dy = by - ay, d2 = dx * dx + dy * dy;
    const t = d2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / d2)) : 0;
    min = Math.min(min, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return min;
}
function wszystkieWspolrzedne(g) {
  const out = [];
  const w = (c) => (typeof c[0] === 'number' ? out.push(c) : c.forEach(w));
  w(g.coordinates);
  return out;
}

console.log('\nDane');
test('każde pytanie ma geometrię (niepustą, poprawnego typu)', () => {
  const typy = { 'państwo': /Polygon/, stolica: /^Point$/, rzeka: /LineString/ };
  for (const p of dane.pytania) {
    const f = geo.get(p.geometria);
    prawda(f, `brak geometrii dla „${p.nazwa}” (${p.geometria})`);
    const wsp = wszystkieWspolrzedne(f.geometry);
    prawda(wsp.length > 0, `pusta geometria: ${p.nazwa}`);
    prawda((typy[p.rodzaj] || /Polygon/).test(f.geometry.type), `zły typ geometrii ${f.geometry.type} dla „${p.nazwa}” (${p.rodzaj})`);
  }
});
test('wszystkie współrzędne są liczbami w zasięgu Europy (−35…90°E, 25…85°N)', () => {
  for (const p of dane.pytania) for (const [x, y] of wszystkieWspolrzedne(geo.get(p.geometria).geometry)) {
    prawda(Number.isFinite(x) && Number.isFinite(y) && x >= -35 && x <= 90 && y >= 25 && y <= 85, `${p.nazwa}: ${x},${y}`);
  }
});
test('brak duplikatów (id pytań, nazwy w quizie, nazwy w Sprawdzianie, odwołania do geometrii)', () => {
  const dup = (arr) => arr.filter((v, i) => arr.indexOf(v) !== i);
  rowne(dup(dane.pytania.map((p) => p.id)), [], 'zdublowane id:');
  rowne(dup(dane.pytania.map((p) => p.geometria)), [], 'zdublowane geometrie:');
  rowne(dup(pytaniaQuizu(dane, SPRAWDZIAN).map((p) => p.nazwa)), [], 'zdublowane nazwy w Sprawdzianie:');
  rowne(dup(geometrie.features.map((f) => f.id)), [], 'zdublowane id w geometrie.geojson:');
});
test('nazwy dokładnie zgodne ze specyfikacją (ortografia, polskie znaki, kolejność bez znaczenia)', () => {
  for (const [quiz, lista] of Object.entries(OCZEKIWANE)) {
    const jest = pytaniaQuizu(dane, quiz).map((p) => p.nazwa).sort();
    rowne(jest, [...lista].sort(), `quiz „${quiz}”:`);
  }
});
test('liczba pytań w quizach: 46, 46, 15, 5, 8, 15, 22, 12, 6, 9', () => {
  rowne(dane.quizy.map((q) => pytaniaQuizu(dane, q.id).length), [46, 46, 15, 5, 8, 15, 22, 12, 6, 9]);
});
test('„Sprawdzian” = suma pytań z quizów 1–10 (184)', () => {
  const suma = dane.quizy.reduce((s, q) => s + pytaniaQuizu(dane, q.id).length, 0);
  rowne(pytaniaQuizu(dane, SPRAWDZIAN).length, suma);
  rowne(suma, 184);
});
test('w quizie „Stolice” nazwy bez dopisku „(stolica)”, w Sprawdzianie z dopiskiem', () => {
  const wQuizie = pytaniaQuizu(dane, 'stolice').map((p) => nazwaWQuizie(p, 'stolice'));
  prawda(wQuizie.every((n) => !n.includes('(')), 'została nazwa z nawiasem: ' + wQuizie.filter((n) => n.includes('(')));
  rowne(wQuizie.filter((n) => ['Andora', 'Luksemburg', 'Monako', 'San Marino', 'Watykan'].includes(n)).sort(), ['Andora', 'Luksemburg', 'Monako', 'San Marino', 'Watykan']);
  rowne(new Set(wQuizie).size, wQuizie.length, 'nazwy w quizie „Stolice” muszą być unikalne:');
  rowne(nazwaWQuizie(dane.pytania.find((p) => p.id === 'stolica-monako'), SPRAWDZIAN), 'Monako (stolica)');
});
test('w quizie „Państwa” nazwy bez dopisku „(państwo)”, w Sprawdzianie z dopiskiem', () => {
  const wQuizie = pytaniaQuizu(dane, 'panstwa').map((p) => nazwaWQuizie(p, 'panstwa'));
  prawda(wQuizie.every((n) => !n.includes('(')), 'została nazwa z nawiasem: ' + wQuizie.filter((n) => n.includes('(')));
  rowne(wQuizie.filter((n) => ['Andora', 'Cypr', 'Luksemburg', 'Monako', 'San Marino', 'Watykan'].includes(n)).sort(), ['Andora', 'Cypr', 'Luksemburg', 'Monako', 'San Marino', 'Watykan']);
  rowne(new Set(wQuizie).size, wQuizie.length, 'nazwy w quizie „Państwa” muszą być unikalne:');
  rowne(nazwaWQuizie(dane.pytania.find((p) => p.id === 'panstwo-monako'), SPRAWDZIAN), 'Monako (państwo)');
  rowne(nazwaWQuizie(dane.pytania.find((p) => p.id === 'panstwo-cypr'), SPRAWDZIAN), 'Cypr (państwo)');
});
test('w quizie „Wyspy i Przynależności” Cypr bez dopisku „(wyspa)”, w Sprawdzianie z dopiskiem', () => {
  const wQuizie = pytaniaQuizu(dane, 'wyspy').map((p) => nazwaWQuizie(p, 'wyspy'));
  prawda(wQuizie.every((n) => !n.includes('(')), 'została nazwa z nawiasem: ' + wQuizie.filter((n) => n.includes('(')));
  prawda(wQuizie.includes('Cypr'), 'brak „Cypr” w quizie wysp');
  rowne(new Set(wQuizie).size, wQuizie.length, 'nazwy w quizie wysp muszą być unikalne:');
  rowne(nazwaWQuizie(dane.pytania.find((p) => p.id === 'wyspa-cypr'), SPRAWDZIAN), 'Cypr (wyspa)');
});
test('kolejność i nazwy quizów na liście', () => {
  rowne(dane.quizy.map((q) => `${q.numer}. ${q.nazwa}`), ['1. Państwa', '2. Stolice', '3. Morza', '4. Zatoki', '5. Półwyspy', '6. Wyspy i Przynależności', '7. Krainy Geograficzne', '8. Rzeki', '9. Jeziora', '10. Cieśniny']);
});
test('pule fraz zgodne ze specyfikacją', () => {
  rowne(dane.frazy.trafione, TRAFIONE);
  rowne(dane.frazy.pudlo, PUDLO);
});
test('przynależność wysp zgodna ze specyfikacją', () => {
  for (const p of pytaniaQuizu(dane, 'wyspy')) rowne(p.przynaleznosc, PRZYNALEZNOSC[p.nazwa], p.nazwa + ':');
});
test('teksty w UTF-8 (NFC), bez „krzaków” z błędnego kodowania', () => {
  const teksty = JSON.stringify(dane);
  prawda(teksty === teksty.normalize('NFC'), 'tekst nie jest w postaci NFC');
  prawda(!/Ã|Å|Ä|Ĺ|â€|�/.test(teksty), 'znaleziono znaki wskazujące na błędne kodowanie');
});
test('każda stolica leży w swoim państwie', () => {
  const panstwa = new Map(pytaniaQuizu(dane, 'panstwa').filter((p) => p.rodzaj === 'państwo').map((p) => [p.iso, geo.get(p.geometria).geometry]));
  for (const p of pytaniaQuizu(dane, 'stolice')) {
    const iso = dane.pytania.find((x) => x.rodzaj === 'państwo' && x.id === p.id.replace('stolica-', 'panstwo-')).iso;
    const g = panstwa.get(iso), pt = geo.get(p.geometria).geometry.coordinates;
    prawda(punktWObszarze(pt, g) || odlegloscKm(pt, g) < 1, `${p.nazwa} nie leży w państwie ${iso} (odległość ${odlegloscKm(pt, g).toFixed(1)} km)`);
  }
});
test('każda wyspa leży w państwie, do którego należy', () => {
  const poNazwie = new Map(pytaniaQuizu(dane, 'panstwa').filter((p) => p.rodzaj === 'państwo').map((p) => [p.nazwa.replace(' (państwo)', ''), geo.get(p.geometria).geometry]));
  for (const p of pytaniaQuizu(dane, 'wyspy')) {
    const pt = geo.get(p.geometria).properties.etykieta;
    // Wyspy Owcze to autonomiczne terytorium Królestwa Danii – w Natural Earth mają osobny obrys (FRO).
    const g = p.nazwa === 'Wyspy Owcze' ? tlo.features.find((f) => f.properties.iso === 'FRO').geometry : poNazwie.get(p.przynaleznosc);
    prawda(g, `brak państwa ${p.przynaleznosc}`);
    prawda(punktWObszarze(pt, g) || odlegloscKm(pt, g) < 3, `${p.nazwa} nie leży w państwie ${p.przynaleznosc}`);
  }
});
test('każde pytanie ma opis źródła geometrii („Natural Earth…” albo „ręcznie…”)', () => {
  for (const p of dane.pytania) prawda(/^(Natural Earth|ręcznie)/.test(p.zrodlo || ''), `${p.nazwa}: ${p.zrodlo}`);
});

console.log('\nLogika quizu');
// generator pseudolosowy z ziarnem – powtarzalne testy statystyczne
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// wartość krytyczna chi-kwadrat dla p = 0,001 (df = 5 → 20,515; df = 5 dla 6 fraz; df = 5 dla 3! permutacji)
const CHI2_KRYT_DF5 = 20.515;
function chi2(liczniki, oczekiwana) { return liczniki.reduce((s, n) => s + (n - oczekiwana) ** 2 / oczekiwana, 0); }

test('losowanie fraz: każda fraza z puli ma dokładnie równy przedział losowania', () => {
  for (const pula of [TRAFIONE, PUDLO]) {
    const n = pula.length, krok = 1 / n;
    pula.forEach((f, i) => {
      rowne(losujFraze(pula, () => i * krok), f, 'początek przedziału:');
      rowne(losujFraze(pula, () => (i + 1) * krok - 1e-12), f, 'koniec przedziału:');
    });
  }
});
test('losowanie fraz: test chi-kwadrat (60 000 losowań na pulę, p = 0,001)', () => {
  for (const [nazwa, pula] of [['TRAFIONE', TRAFIONE], ['PUDŁO', PUDLO]]) {
    const N = 60000, licz = new Array(pula.length).fill(0), los = mulberry32(nazwa.length * 7919);
    for (let i = 0; i < N; i++) licz[pula.indexOf(losujFraze(pula, los))]++;
    const x = chi2(licz, N / pula.length);
    prawda(x < CHI2_KRYT_DF5, `${nazwa}: chi² = ${x.toFixed(2)} ≥ ${CHI2_KRYT_DF5} (liczniki ${licz})`);
    console.log(`      ${nazwa}: ${licz.join(' / ')} (chi² = ${x.toFixed(2)})`);
  }
});
test('losowanie fraz z Math.random też jest równomierne (każda fraza 16,7% ± 1 pp.)', () => {
  for (const pula of [TRAFIONE, PUDLO]) {
    const N = 120000, licz = new Array(pula.length).fill(0);
    for (let i = 0; i < N; i++) licz[pula.indexOf(losujFraze(pula))]++;
    licz.forEach((n) => prawda(Math.abs(n / N - 1 / 6) < 0.01, `udział ${(n / N * 100).toFixed(2)}%`));
  }
});
test('tasowanie Fishera-Yatesa: zachowuje elementy i daje równomierne permutacje', () => {
  const pyt = pytaniaQuizu(dane, SPRAWDZIAN);
  const t = tasuj(pyt);
  rowne(t.map((p) => p.id).sort(), pyt.map((p) => p.id).sort());
  prawda(pyt.map((p) => p.id).join() !== t.map((p) => p.id).join(), 'kolejność nie została zmieniona');
  const los = mulberry32(42), licz = {}, N = 60000;
  for (let i = 0; i < N; i++) { const k = tasuj(['a', 'b', 'c'], los).join(''); licz[k] = (licz[k] || 0) + 1; }
  rowne(Object.keys(licz).length, 6, 'liczba różnych permutacji:');
  const x = chi2(Object.values(licz), N / 6);
  prawda(x < CHI2_KRYT_DF5, `chi² = ${x.toFixed(2)}`);
});
test('procent: zaokrąglenie do liczby całkowitej (7 z 12 = 58%)', () => {
  rowne(procent(7, 12), 58);
  rowne(procent(0, 15), 0);
  rowne(procent(15, 15), 100);
  rowne(procent(1, 3), 33);
  rowne(procent(2, 3), 67);
});
test('zapisywany jest tylko ostatni wynik (nadpisanie)', async () => {
  const { zapiszWynik, wczytajWyniki } = await import('../js/quiz.js');
  const mag = { d: {}, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = v; } };
  zapiszWynik('morza', 90, mag);
  zapiszWynik('morza', 40, mag);
  rowne(wczytajWyniki(mag), { morza: 40 });
});
test('migracja: stary wynik połączonego quizu „Państwa i Stolice” jest usuwany, reszta zostaje', async () => {
  const { wczytajWyniki } = await import('../js/quiz.js');
  const mag = { d: { 'europa-wyniki': JSON.stringify({ panstwa: 80, morza: 58 }) }, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = v; } };
  rowne(wczytajWyniki(mag), { morza: 58 });
  mag.setItem('europa-wyniki', JSON.stringify({ panstwa: 70, morza: 58 })); // nowy wynik po migracji zostaje
  rowne(wczytajWyniki(mag), { panstwa: 70, morza: 58 });
});

console.log(`\n${testy - bledy}/${testy} testów zaliczonych.`);
process.exit(bledy ? 1 : 0);
