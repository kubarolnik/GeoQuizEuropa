// Buduje data/geometrie.geojson i data/tlo.geojson z danych Natural Earth (skala 1:10 mln).
//
// Użycie:
//   1) pobierz pliki GeoJSON Natural Earth do jednego katalogu (lista w README),
//   2) cd narzedzia && npm install
//   3) node zbuduj-dane.mjs <katalog-z-plikami-ne>
//
// Polskie nazwy NIE pochodzą z Natural Earth – są wpisane ręcznie w data/europa.json.
// Stąd bierzemy wyłącznie kształty.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as turf from '@turf/turf';
import { panstwoBliskie } from './panstwa-bliskie.mjs';
import { RECZNE } from './reczne.mjs';

const NE = process.argv[2];
if (!NE) { console.error('Podaj katalog z plikami Natural Earth.'); process.exit(1); }
const wczytaj = (n) => JSON.parse(readFileSync(join(NE, n + '.geojson'), 'utf8'));
const DANE = new URL('../data/', import.meta.url);
const europa = JSON.parse(readFileSync(new URL('europa.json', DANE), 'utf8'));

// Zasięg danych (Europa z otoczeniem). Wszystko poza nim jest odcinane.
const ZASIEG = [-35, 25, 90, 85];

const fc = (features) => turf.featureCollection(features);
const czesci = (f) => turf.flatten(f).features; // MultiPolygon -> lista Polygon
const pole = (f) => turf.area(f);

function przytnijDoZasiegu(f) {
  const g = turf.bboxClip(f, ZASIEG);
  const parts = czesci(g).filter((p) => p.geometry.coordinates.length && p.geometry.coordinates[0].length >= 4 && pole(p) > 0);
  if (!parts.length) return null;
  return parts.length === 1 ? parts[0] : turf.multiPolygon(parts.map((p) => p.geometry.coordinates));
}
function unia(features) {
  const fs = features.filter(Boolean);
  if (fs.length === 1) return fs[0];
  return turf.union(fc(fs));
}
function najwiekszaCzesc(f) {
  return czesci(f).sort((a, b) => pole(b) - pole(a))[0];
}

// --------------------------------------------------------------- dane NE --
console.log('Wczytywanie Natural Earth…');
const panstwaNE = wczytaj('ne_10m_admin_0_countries_pol').features;
const morskieNE = wczytaj('ne_10m_geography_marine_polys').features;
const regionyNE = wczytaj('ne_10m_geography_regions_polys').features;
const rzekiNE = wczytaj('ne_10m_rivers_lake_centerlines').features;
const jezioraNE = wczytaj('ne_10m_lakes').features;
const ladNE = [...wczytaj('ne_10m_land').features, ...wczytaj('ne_10m_minor_islands').features];

// Ląd jako lista pojedynczych wielokątów (w zasięgu).
const ladCzesci = ladNE.flatMap((f) => czesci(f)).filter((p) => {
  const [x0, y0, x1, y1] = turf.bbox(p);
  return x1 > ZASIEG[0] && x0 < ZASIEG[2] && y1 > ZASIEG[1] && y0 < ZASIEG[3];
});
const ladZBbox = (bbox) => {
  const out = [];
  for (const p of ladCzesci) {
    const b = turf.bbox(p);
    if (b[2] < bbox[0] || b[0] > bbox[2] || b[3] < bbox[1] || b[1] > bbox[3]) continue;
    const c = turf.bboxClip(p, bbox);
    if (c.geometry.coordinates[0]?.length >= 4 && pole(c) > 0) out.push(c);
  }
  return out;
};

const panstwo = (iso) => {
  const f = panstwaNE.find((x) => x.properties.ADM0_A3 === iso);
  if (!f) throw new Error('Brak państwa ' + iso);
  return f;
};
const morskie = (nazwa) => {
  const f = morskieNE.find((x) => (x.properties.name ?? x.properties.NAME) === nazwa);
  if (!f) throw new Error('Brak obiektu morskiego ' + nazwa);
  return f;
};
const region = (nazwa) => {
  const f = regionyNE.find((x) => x.properties.NAME === nazwa);
  if (!f) throw new Error('Brak regionu ' + nazwa);
  return f;
};

// ----------------------------------------------------------- przepisy NE --
const MORZA = {
  'morze-barentsa': ['Barents Sea'],
  'morze-biale': ['White Sea'],
  'morze-grenlandzkie': ['Greenland Sea'],
  'morze-norweskie': ['Norwegian Sea'],
  'morze-polnocne': ['North Sea', 'Waddenzee'],
  // Morze Bałtyckie razem z zatokami i cieśninami duńskimi (Bełty, Sund).
  'morze-baltyckie': ['Baltic Sea', 'Gulf of Bothnia', 'Gulf of Finland', 'Gulf of Riga', 'Mecklenburger Bucht', 'Øresund', null],
  // Morze Śródziemne razem ze wszystkimi swoimi morzami i zatokami (bez Marmara i Czarnego).
  'morze-srodziemne': ['Mediterranean Sea', 'Adriatic Sea', 'Ionian Sea', 'Tyrrhenian Sea', 'Ligurian Sea', 'Balearic Sea', 'Alboran Sea', 'Aegean Sea', 'Sea of Crete', 'Golfe du Lion', 'Gulf of Sidra', 'Gulf of Gabès'],
  'morze-egejskie': ['Aegean Sea', 'Sea of Crete'],
  'morze-adriatyckie': ['Adriatic Sea'],
  'morze-liguryjskie': ['Ligurian Sea'],
  'morze-tyrrenskie': ['Tyrrhenian Sea'],
  'morze-jonskie': ['Ionian Sea'],
  'morze-marmara': ['Sea of Marmara'],
  'morze-czarne': ['Black Sea'],
  'morze-azowskie': ['Sea of Azov'],
  'zatoka-botnicka': ['Gulf of Bothnia'],
  'zatoka-finska': ['Gulf of Finland'],
  'zatoka-biskajska': ['Bay of Biscay'],
  'ciesnina-skagerrak': ['Skagerrak'],
  'ciesnina-kattegat': ['Kattegat'],
  'ciesnina-bosfor': ['Bosporus'],
  'ciesnina-dardanele': ['Dardanelles'],
  'ciesnina-la-manche': ['English Channel'],
};
// „null” = nienazwany wielokąt Natural Earth w cieśninach duńskich (Bełty).
const morskieBezNazwy = morskieNE.find((x) => x.properties.name == null && x.properties.featurecla === 'generic' && turf.bbox(x)[0] > 9 && turf.bbox(x)[2] < 12.5 && turf.bbox(x)[1] > 54);

const REGIONY = {
  'polwysep-kolski': 'KOLA PENINSULA',
  'polwysep-balkanski': 'BALKAN PEN.',
  'polwysep-krymski': 'CRIMEA',
  'kraina-nizina-nadkaspijska': 'CASPIAN DEPRESSION',
  'kraina-nizina-wegierska': 'Alföld',
  'kraina-masyw-centralny': 'Massif Central',
  'kraina-gory-skandynawskie': 'KJØLEN MOUNTAINS',
  'kraina-ural': 'URAL MOUNTAINS',
  'kraina-karpaty': 'CARPATHIAN MOUNTAINS',
  'kraina-sudety': 'Sudetes Mts.',
  'kraina-gory-dynarskie': 'Dinaric Alps',
  'kraina-apeniny': 'APPENNINI',
  'kraina-alpy': 'ALPS',
  'kraina-pireneje': 'PYRENEES',
  'kraina-balkany': 'Balkan Mts.',
  'kraina-harz': 'Harz',
};

// Półwysep Iberyjski = kontynentalna część Hiszpanii, Portugalii, Andory i Gibraltaru (granice z NE).
const UNIE_PANSTW = { 'polwysep-iberyjski': ['ESP', 'PRT', 'AND', 'GIB'] };

// Wyspy: wielokąty lądu NE, których punkt wewnętrzny leży w obszarze wyspy/archipelagu z NE.
const WYSPY = {
  'wyspa-spitsbergen': 'SVALBARD', // cały archipelag (w polskim zwyczaju też „Spitsbergen”)
  'wyspa-wyspy-owcze': 'Føroyar',
  'wyspa-szetlandy': 'Shetland Is.',
  'wyspa-zelandia': 'Zealand',
  'wyspa-gotlandia': 'Gotland',
  'wyspa-sarema': 'Saaremaa',
  'wyspa-baleary': 'Balearic Islands',
  'wyspa-majorka': 'Mallorca',
  'wyspa-minorka': 'Menorca',
  'wyspa-ibiza': 'Ibiza',
  'wyspa-sardynia': 'Sardegna',
  'wyspa-korsyka': 'Corse',
  'wyspa-sycylia': 'Sicilia',
  'wyspa-kreta': 'Crete',
  'wyspa-cypr': 'Cyprus',
};

const RZEKI = {
  'rzeka-wolga': ['Volga'],
  'rzeka-dniepr': ['Dnipro', 'Dnepre'], // „Dnepre” = odcinek źródłowy
  'rzeka-dniestr': ['Dniester'],
  'rzeka-niemen': ['Neman'],
  'rzeka-tamiza': ['Thames'],
  'rzeka-sekwana': ['Seine'],
  'rzeka-dunaj': ['Danube', 'Donau', 'Bratul Chillia', 'Bratul Sulina', 'Bratul Sfintu Gheorghe'], // z ramionami delty
  'rzeka-pad': ['Po'],
  'rzeka-ren': ['Rhein', 'Rhin', 'Rhine'],
  'rzeka-rodan': ['Rhône'],
  'rzeka-tag': ['Tajo', 'Tejo'],
  'rzeka-tyber': ['Tevere'],
};

const JEZIORA = {
  'jezioro-bodenskie': 'Bodensee',
  'jezioro-como': 'Lago di Como',
  'jezioro-genewskie': 'Lake Geneva',
  'jezioro-onega': 'Lake Onega',
  'jezioro-ladoga': 'Lake Ladoga',
  'jezioro-balaton': 'Lake Balaton',
};

// ------------------------------------------------------------- budowanie --
function zbudujReczny(id) {
  const r = RECZNE[id];
  const wykrojnik = turf.polygon([r.wielokat]);
  const bb = turf.bbox(turf.buffer(wykrojnik, 20, { units: 'kilometers' }));
  let wynik;
  if (r.przytnij === 'woda') {
    const lad = ladZBbox(bb);
    wynik = lad.length ? turf.difference(fc([wykrojnik, unia(lad)])) : wykrojnik;
  } else if (r.przytnij === 'lad' || r.przytnij === 'lad-glowny') {
    const lad = ladZBbox(bb);
    wynik = turf.intersect(fc([wykrojnik, unia(lad)]));
    if (r.przytnij === 'lad-glowny') wynik = najwiekszaCzesc(wynik);
  } else if (r.przytnij.startsWith('panstwo:')) {
    const p = przytnijDoZasiegu(panstwo(r.przytnij.slice(8)));
    wynik = najwiekszaCzesc(turf.intersect(fc([wykrojnik, p])));
  }
  if (!wynik) throw new Error('Pusta geometria ręczna: ' + id);
  return { geom: wynik, zrodlo: 'ręcznie: ' + r.opis + ' Linia brzegowa / granice: Natural Earth.' };
}

function zbudujWyspe(id) {
  const obszar = turf.buffer(region(WYSPY[id]), 3, { units: 'kilometers' });
  const bb = turf.bbox(obszar);
  const wybrane = ladCzesci.filter((p) => {
    const b = turf.bbox(p);
    if (b[2] < bb[0] || b[0] > bb[2] || b[3] < bb[1] || b[1] > bb[3]) return false;
    return turf.booleanPointInPolygon(turf.pointOnFeature(p), obszar);
  });
  if (!wybrane.length) throw new Error('Brak lądu dla wyspy ' + id);
  return { geom: turf.multiPolygon(wybrane.map((p) => p.geometry.coordinates)), zrodlo: `Natural Earth (ląd; wyspy w obszarze „${WYSPY[id]}”)` };
}

function zbudujRzeke(id) {
  const nazwy = RZEKI[id];
  const linie = rzekiNE.filter((f) => nazwy.includes(f.properties.name)).flatMap((f) =>
    f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates);
  if (!linie.length) throw new Error('Brak rzeki ' + id);
  if (RECZNE[id]?.linia) {
    linie.push(RECZNE[id].wielokat);
    return { geom: turf.multiLineString(linie), zrodlo: 'ręcznie: ' + RECZNE[id].opis };
  }
  return { geom: turf.multiLineString(linie), zrodlo: `Natural Earth (rzeki: ${nazwy.join(', ')})` };
}

function zbuduj(p) {
  const id = p.geometria;
  if (p.rodzaj === 'stolica') {
    const [lat, lng] = p.wspolrzedne;
    return { geom: turf.point([lng, lat]), zrodlo: 'ręcznie: współrzędne centrum miasta' };
  }
  // Państwo w całości (np. cała Rosja), bez dalekich terytoriów zamorskich.
  if (p.rodzaj === 'państwo') return { geom: panstwoBliskie(panstwo(p.iso)), zrodlo: 'Natural Earth (granice w ujęciu Polski)' };
  if (RZEKI[id]) return zbudujRzeke(id);
  if (RECZNE[id]) return zbudujReczny(id);
  if (MORZA[id]) {
    const fs = MORZA[id].map((n) => (n === null ? morskieBezNazwy : morskie(n)));
    return { geom: unia(fs), zrodlo: `Natural Earth (${MORZA[id].map((n) => n ?? 'cieśniny duńskie').join(' + ')})` };
  }
  if (REGIONY[id]) return { geom: region(REGIONY[id]), zrodlo: `Natural Earth („${REGIONY[id]}”)` };
  if (UNIE_PANSTW[id]) {
    const u = unia(UNIE_PANSTW[id].map((k) => przytnijDoZasiegu(panstwo(k))));
    return { geom: najwiekszaCzesc(u), zrodlo: 'Natural Earth (kontynentalna część Hiszpanii, Portugalii, Andory i Gibraltaru)' };
  }
  if (WYSPY[id]) return zbudujWyspe(id);
  if (RZEKI[id]) return zbudujRzeke(id);
  if (JEZIORA[id]) {
    const f = jezioraNE.find((x) => x.properties.name === JEZIORA[id]);
    if (!f) throw new Error('Brak jeziora ' + id);
    return { geom: f, zrodlo: `Natural Earth („${JEZIORA[id]}”)` };
  }
  throw new Error('Brak przepisu dla ' + id);
}

const obiekty = [];
for (const p of europa.pytania) {
  process.stdout.write('.');
  const { geom, zrodlo } = zbuduj(p);
  obiekty.push({ type: 'Feature', properties: { id: p.geometria, zrodlo }, geometry: geom.geometry ?? geom });
}
console.log();

// Tło: obrysy wszystkich państw w zasięgu (tylko do rysowania granic).
const isoPytan = new Set(europa.pytania.filter((p) => p.iso).map((p) => p.iso));
const tlo = [];
for (const f of panstwaNE) {
  const b = turf.bbox(f);
  if (b[2] < ZASIEG[0] || b[0] > ZASIEG[2] || b[3] < ZASIEG[1] || b[1] > ZASIEG[3]) continue;
  if (isoPytan.has(f.properties.ADM0_A3)) continue;
  const g = przytnijDoZasiegu(f);
  if (g) tlo.push({ type: 'Feature', properties: { iso: f.properties.ADM0_A3 }, geometry: g.geometry });
}

// Tło: wszystkie jeziora w zasięgu (żeby jeziora z quizu nie wyróżniały się na mapie).
const jezioraTla = jezioraNE.filter((f) => {
  const b = turf.bbox(f);
  return b[0] > ZASIEG[0] && b[2] < ZASIEG[2] && b[1] > ZASIEG[1] && b[3] < ZASIEG[3] && turf.area(f) > 20e6;
}).map((f) => ({ type: 'Feature', properties: { id: 'jezioro-tla-' + (f.properties.ne_id ?? Math.random()), jezioro: true }, geometry: f.geometry }));

// ------------------------------------------------------- upraszczanie ----
// mapshaper upraszcza z zachowaniem topologii (wspólne granice państw pozostają wspólne).
const tmp = mkdtempSync(join(tmpdir(), 'europa-'));
const MS = new URL('./node_modules/.bin/mapshaper', import.meta.url).pathname;
function uprosc(features, interwal, nazwa) {
  const we = join(tmp, nazwa + '-we.json');
  const wy = join(tmp, nazwa + '-wy.json');
  writeFileSync(we, JSON.stringify(fc(features)));
  execFileSync(MS, ['-i', we, '-simplify', `interval=${interwal}`, 'keep-shapes', '-o', wy, 'precision=0.0001', 'format=geojson'], { stdio: 'pipe' });
  return JSON.parse(readFileSync(wy, 'utf8')).features;
}

const panstwaIPozostale = (f) => f.properties.id.startsWith('panstwo-');
const doUproszczeniaPanstwa = [...obiekty.filter(panstwaIPozostale), ...tlo.map((f) => ({ ...f, properties: { ...f.properties, id: 'tlo-' + f.properties.iso } }))];
const uproszczonePanstwa = uprosc(doUproszczeniaPanstwa, 400, 'panstwa');
const linia = (f) => f.geometry.type.includes('LineString');
const reszta = obiekty.filter((f) => !panstwaIPozostale(f) && f.geometry.type !== 'Point');
// mapshaper wymaga jednego typu geometrii na warstwę: osobno obszary, osobno linie (rzeki).
const uproszczonaReszta = [
  ...uprosc(reszta.filter((f) => !linia(f)), 400, 'obszary'),
  ...uprosc(reszta.filter(linia), 300, 'linie'),
];
const punkty = obiekty.filter((f) => f.geometry.type === 'Point');

const wynikowe = [
  ...uproszczonePanstwa.filter((f) => !f.properties.id.startsWith('tlo-')),
  ...uproszczonaReszta,
  ...punkty,
].map((f) => ({ type: 'Feature', id: f.properties.id, properties: { ...f.properties, etykieta: punktEtykiety(f) }, geometry: f.geometry }));
// Punkt podpisu (dla strony sprawdz.html): wewnątrz największej części obszaru / w połowie rzeki.
function punktEtykiety(f) {
  const g = f.geometry;
  const zaokr = (c) => c.map((v) => Math.round(v * 1e4) / 1e4);
  if (g.type === 'Point') return g.coordinates;
  if (g.type.includes('LineString')) {
    const linie = turf.flatten(f).features.sort((a, b) => turf.length(b) - turf.length(a));
    return zaokr(turf.along(linie[0], turf.length(linie[0]) / 2).geometry.coordinates);
  }
  const cz = najwiekszaCzesc(f);
  const c = turf.centerOfMass(cz);
  return zaokr((turf.booleanPointInPolygon(c, cz) ? c : turf.pointOnFeature(cz)).geometry.coordinates);
}
const kolejnosc = new Map(europa.pytania.map((p, i) => [p.geometria, i]));
wynikowe.sort((a, b) => kolejnosc.get(a.id) - kolejnosc.get(b.id));

const tloWyj = [
  ...uproszczonePanstwa.filter((f) => f.properties.id.startsWith('tlo-'))
    .map((f) => ({ type: 'Feature', properties: { iso: f.properties.iso }, geometry: f.geometry })),
  ...uprosc(jezioraTla, 400, 'jeziora-tla').map((f) => ({ type: 'Feature', properties: { jezioro: true }, geometry: f.geometry })),
];

writeFileSync(new URL('geometrie.geojson', DANE), JSON.stringify(fc(wynikowe)));
writeFileSync(new URL('tlo.geojson', DANE), JSON.stringify(fc(tloWyj)));

// Zapisz opis źródła geometrii przy każdym pytaniu w europa.json.
const zrodla = new Map(wynikowe.map((f) => [f.id, f.properties.zrodlo]));
for (const p of europa.pytania) p.zrodlo = zrodla.get(p.geometria);
writeFileSync(new URL('europa.json', DANE), JSON.stringify(europa, null, 1) + '\n', 'utf8');

console.log(`Gotowe: ${wynikowe.length} geometrii, ${tloWyj.filter((f) => !f.properties.jezioro).length} państw i ${tloWyj.filter((f) => f.properties.jezioro).length} jezior w tle.`);
