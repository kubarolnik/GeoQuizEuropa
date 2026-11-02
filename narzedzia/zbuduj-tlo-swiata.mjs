// Buduje data/tlo.geojson: obrysy WSZYSTKICH państw świata i największe jeziora (tło mapy).
// Uruchamiać PO zbuduj-dane.mjs. Geometrie pytań (data/geometrie.geojson) się nie zmieniają.
//
// Użycie: cd narzedzia && node zbuduj-tlo-swiata.mjs <katalog-z-plikami-ne>

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as turf from '@turf/turf';

const NE = process.argv[2];
if (!NE) { console.error('Podaj katalog z plikami Natural Earth.'); process.exit(1); }
const wczytaj = (n) => JSON.parse(readFileSync(join(NE, n + '.geojson'), 'utf8'));
const DANE = new URL('../data/', import.meta.url);

// Dotychczasowe tło Europy (zbuduj-dane.mjs, zasięg ZASIEG) zostaje bez zmian;
// ten skrypt dokłada zgrubne zarysy wszystkiego POZA tym prostokątem.
const ZASIEG = [-35, 25, 90, 85];
const POZA = [[-180, -90, ZASIEG[0], 90], [ZASIEG[2], -90, 180, 90], [ZASIEG[0], -90, ZASIEG[2], ZASIEG[1]], [ZASIEG[0], ZASIEG[3], ZASIEG[2], 90]];
const czesci = (g) => (g.geometry.type === 'Polygon' ? [g.geometry.coordinates] : g.geometry.type === 'MultiPolygon' ? g.geometry.coordinates : []);
function pozaZasiegiem(f, props) {
  const wiel = [];
  for (const b of POZA) for (const c of czesci(turf.bboxClip(f, b))) if (c.length && c[0].length >= 4 && turf.area(turf.polygon(c)) > 0) wiel.push(c);
  return wiel.length ? { type: 'Feature', properties: props, geometry: { type: 'MultiPolygon', coordinates: wiel } } : null;
}
const panstwa = wczytaj('ne_10m_admin_0_countries_pol').features.filter((f) => f.geometry)
  .map((f) => pozaZasiegiem(f, { iso: f.properties.ADM0_A3 })).filter(Boolean);
const jeziora = wczytaj('ne_10m_lakes').features.filter((f) => f.geometry && turf.area(f) > 3000e6)
  .map((f) => pozaZasiegiem(f, { jezioro: true })).filter(Boolean);
const europa = JSON.parse(readFileSync(new URL('tlo.geojson', DANE), 'utf8')).features.filter((f) => !f.properties.swiat);

const tmp = mkdtempSync(join(tmpdir(), 'tlo-'));
const MS = new URL('./node_modules/.bin/mapshaper', import.meta.url).pathname;
function uprosc(features, interwal, nazwa) {
  if (!features.length) return [];
  const we = join(tmp, nazwa + '-we.json'), wy = join(tmp, nazwa + '-wy.json');
  writeFileSync(we, JSON.stringify(turf.featureCollection(features)));
  execFileSync(MS, ['-i', we, '-simplify', `interval=${interwal}`, 'keep-shapes', '-filter-slivers', 'min-area=2km2', '-o', wy, 'precision=0.001', 'format=geojson'], { stdio: 'pipe' });
  return JSON.parse(readFileSync(wy, 'utf8')).features;
}
// Zaokrąglenie współrzędnych (zgrubne tło świata).
function zaokraglij(f, krok) {
  const r = (c) => (typeof c[0] === 'number' ? [Math.round(c[0] / krok) * krok, Math.round(c[1] / krok) * krok].map((v) => +v.toFixed(4)) : c.map(r));
  if (!f.geometry) return f;
  return { ...f, geometry: { ...f.geometry, coordinates: r(f.geometry.coordinates) } };
}

const swiat = [...uprosc(panstwa, 5000, 'panstwa'), ...uprosc(jeziora, 5000, 'jeziora')]
  .filter((f) => f.geometry && f.geometry.coordinates.length)
  .map((f) => zaokraglij({ ...f, properties: { ...f.properties, swiat: true } }, 0.01));
const wynik = [...europa, ...swiat];
writeFileSync(new URL('tlo.geojson', DANE), JSON.stringify(turf.featureCollection(wynik)));
console.log(`Gotowe: Europa ${europa.length} obiektów, reszta świata ${swiat.length}.`);
