// Buduje data/tlo.geojson: obrysy wszystkich państw świata i największe jeziora (tło mapy).
// Geometrie pytań (data/geometrie.geojson) się nie zmieniają.
//
// Użycie: cd narzedzia && node zbuduj-tlo-swiata.mjs <katalog-z-plikami-ne>

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as turf from '@turf/turf';
import { ZASIEG, zasiegBliski, czyBliski } from './panstwa-bliskie.mjs';

const NE = process.argv[2];
if (!NE) { console.error('Podaj katalog z plikami Natural Earth.'); process.exit(1); }
const wczytaj = (n) => JSON.parse(readFileSync(join(NE, n + '.geojson'), 'utf8'));
const DANE = new URL('../data/', import.meta.url);

// Tło budowane od nowa w jednym przebiegu mapshapera (wspólna topologia = brak szczelin
// między sąsiadami). Każde państwo dzielone jest na część w prostokącie ZASIEG (dokładnie,
// ~400 m) i resztę świata (zgrubnie, ~5 km). Państwa z pytań rysuje data/geometrie.geojson
// (w całości, bez dalekich terytoriów – panstwa-bliskie.mjs); tu zostają tylko te dalekie
// terytoria. Linie podziału nie są rysowane jako granice (js/mapa.js).
// Azjatyccy sąsiedzi Rosji dokładnie (400 m) – ich granica zgadza się z geometrią Rosji.
const DOKLADNIE = new Set(['CHN', 'MNG', 'PRK', 'KAZ']);
const POZA = [[-180, -90, ZASIEG[0], 90], [ZASIEG[2], -90, 180, 90], [ZASIEG[0], -90, ZASIEG[2], ZASIEG[1]], [ZASIEG[0], ZASIEG[3], ZASIEG[2], 90]];
const europa = JSON.parse(readFileSync(new URL('europa.json', DANE), 'utf8'));
const isoPytan = new Set(europa.pytania.filter((p) => p.iso).map((p) => p.iso));
const czesci = (g) => (g.geometry.type === 'Polygon' ? [g.geometry.coordinates] : g.geometry.type === 'MultiPolygon' ? g.geometry.coordinates : []);
const dobre = (c) => c.length && c[0].length >= 4 && turf.area(turf.polygon(c)) > 0;
function podziel(f, props) {
  const w = czesci(turf.bboxClip(f, ZASIEG)).filter(dobre);
  const z = POZA.flatMap((b) => czesci(turf.bboxClip(f, b))).filter(dobre);
  const mp = (c, d) => ({ type: 'Feature', properties: { ...props, d }, geometry: { type: 'MultiPolygon', coordinates: c } });
  const daleko = DOKLADNIE.has(props.iso) || isoPytan.has(props.iso) ? 400 : 5000;
  return [...(w.length ? [mp(w, 400)] : []), ...(z.length ? [mp(z, daleko)] : [])];
}
const panstwaNE = wczytaj('ne_10m_admin_0_countries_pol').features.filter((f) => f.geometry);
const bliskiePytan = new Map(panstwaNE.filter((f) => isoPytan.has(f.properties.ADM0_A3)).map((f) => [f.properties.ADM0_A3, zasiegBliski(f.geometry)]));
const panstwa = panstwaNE
  .flatMap((f) => podziel(f, { iso: f.properties.ADM0_A3 }));
const jeziora = wczytaj('ne_10m_lakes').features.filter((f) => f.geometry)
  .flatMap((f) => podziel(f, { jezioro: true }))
  .filter((f) => turf.area(f) > (f.properties.d === 400 ? 20e6 : 3000e6));

const tmp = mkdtempSync(join(tmpdir(), 'tlo-'));
const MS = new URL('./node_modules/.bin/mapshaper', import.meta.url).pathname;
function uprosc(features, nazwa) {
  if (!features.length) return [];
  const we = join(tmp, nazwa + '-we.json'), wy = join(tmp, nazwa + '-wy.json');
  writeFileSync(we, JSON.stringify(turf.featureCollection(features)));
  execFileSync(MS, ['-i', we, '-simplify', 'variable', 'interval=d', 'keep-shapes', '-filter-slivers', 'min-area=2km2', '-o', wy, 'precision=0.001', 'format=geojson'], { stdio: 'pipe' });
  return JSON.parse(readFileSync(wy, 'utf8')).features;
}
// Zaokrąglenie współrzędnych (zgrubne tło świata).
function zaokraglij(f, krok) {
  const r = (c) => (typeof c[0] === 'number' ? [Math.round(c[0] / krok) * krok, Math.round(c[1] / krok) * krok].map((v) => +v.toFixed(4)) : c.map(r));
  if (!f.geometry) return f;
  return { ...f, geometry: { ...f.geometry, coordinates: r(f.geometry.coordinates) } };
}

const wynik = [...uprosc(panstwa, 'panstwa'), ...uprosc(jeziora, 'jeziora')]
  .filter((f) => f.geometry && f.geometry.coordinates.length)
  // Z państw z pytań zostają tylko dalekie terytoria.
  .map((f) => (isoPytan.has(f.properties.iso)
    ? { ...f, geometry: { type: 'MultiPolygon', coordinates: czesci(f).filter((c) => !czyBliski(c, bliskiePytan.get(f.properties.iso))) } }
    : f))
  .filter((f) => f.geometry.coordinates.length)
  .map((f) => { const { d, ...props } = f.properties; return zaokraglij({ ...f, properties: props }, d === 5000 ? 0.01 : 0.0001); })
  // Kawałki jednego państwa łączymy w jeden obiekt – rysowany jedną ścieżką nie ma szczeliny na styku.
  .reduce((acc, f) => {
    const poprz = f.properties.iso && acc.find((g) => g.properties.iso === f.properties.iso);
    if (poprz) poprz.geometry.coordinates.push(...czesci(f)); else acc.push({ ...f, geometry: { type: 'MultiPolygon', coordinates: czesci(f) } });
    return acc;
  }, []);
writeFileSync(new URL('tlo.geojson', DANE), JSON.stringify(turf.featureCollection(wynik)));
console.log(`Gotowe: ${wynik.length} obiektów.`);
