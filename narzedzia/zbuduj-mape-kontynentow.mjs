// Buduje img/kontynenty.svg: liniowy rysunek Europy i Azji (tło strony głównej i wyboru trybu).
// Warstwy: siatka południków/równoleżników, cały ląd oraz osobne kształty kontynentów
// (.kont-europa, .kont-azja) – strona podświetla wskazany kontynent.
// Rosja jest dzielona wzdłuż Uralu, rzeki Ural i Kaukazu (uproszczona linia).
//
// Użycie: cd narzedzia && node zbuduj-mape-kontynentow.mjs   (po zbuduj-dane.mjs i zbuduj-tlo-swiata.mjs)

import { readFileSync, writeFileSync } from 'node:fs';
import * as turf from '@turf/turf';

const DANE = new URL('../data/', import.meta.url);
const tlo = JSON.parse(readFileSync(new URL('tlo.geojson', DANE), 'utf8'));
const geo = JSON.parse(readFileSync(new URL('geometrie.geojson', DANE), 'utf8'));

// Państwa azjatyckie (kody ADM0_A3 z Natural Earth). Państwa z quizu Europy należą do Europy.
const AZJA = new Set(['TUR', 'GEO', 'ARM', 'AZE', 'KAZ', 'UZB', 'TKM', 'KGZ', 'TJK', 'AFG', 'PAK', 'IND', 'NPL', 'BTN', 'BGD', 'LKA', 'MDV',
  'CHN', 'MNG', 'PRK', 'KOR', 'JPN', 'TWN', 'MMR', 'THA', 'LAO', 'KHM', 'VNM', 'MYS', 'SGP', 'IDN', 'BRN', 'PHL', 'TLS',
  'IRN', 'IRQ', 'SYR', 'LBN', 'ISR', 'PSX', 'JOR', 'SAU', 'YEM', 'OMN', 'ARE', 'QAT', 'BHR', 'KWT', 'CYN', 'HKG', 'MAC']);
// Część europejska Rosji: na zachód od linii Ural – rzeka Ural – Morze Kaspijskie – Kaukaz.
const EUROPA_ROSJI = turf.polygon([[[10, 85], [68, 85], [66, 69], [60, 65], [59.5, 60], [59.5, 55], [58.5, 51.5], [55, 51], [51.5, 47],
  [49, 46.5], [47.5, 43], [40, 43.3], [10, 43], [10, 85]]]);

const [W, H] = [1800, 1100], LON0 = -26, LON1 = 152, LAT0 = -12, LAT1 = 78;
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + Math.max(-80, Math.min(84, lat)) * Math.PI / 360));
const X = (lon) => (lon - LON0) / (LON1 - LON0) * W;
const Y = (lat) => (merc(LAT1) - merc(lat)) / (merc(LAT1) - merc(LAT0)) * H;

// Ścieżka SVG; punkty bliższe niż 3 px są pomijane (lekki plik, rysunek i tak jest subtelny).
function sciezka(geom) {
  if (!geom) return '';
  const wielokaty = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
  let d = '';
  for (const w of wielokaty) {
    if (!w || !Array.isArray(w[0])) continue;
    let ost = null, seg = '', n = 0;
    for (const [lon, lat] of w[0]) {
      if (lon < LON0 - 15 || lon > LON1 + 15 || lat < LAT0 - 10 || lat > LAT1 + 6) continue;
      const x = X(lon), y = Y(lat);
      if (ost && Math.hypot(x - ost[0], y - ost[1]) < 3) continue;
      seg += (seg ? 'L' : 'M') + Math.round(x) + ' ' + Math.round(y); ost = [x, y]; n++;
    }
    if (n >= 3) d += seg + 'Z';
  }
  return d;
}

const panstwaPytan = geo.features.filter((f) => f.id.startsWith('panstwo-'));
let lad = '', europa = '', azja = '';
for (const f of [...tlo.features.filter((f) => !f.properties.jezioro), ...panstwaPytan]) lad += sciezka(f.geometry);
for (const f of panstwaPytan) {
  if (f.id !== 'panstwo-rosja') { europa += sciezka(f.geometry); continue; }
  europa += sciezka(turf.intersect(turf.featureCollection([f, EUROPA_ROSJI]))?.geometry);
  azja += sciezka(turf.difference(turf.featureCollection([f, EUROPA_ROSJI]))?.geometry);
}
for (const f of tlo.features) if (AZJA.has(f.properties.iso)) azja += sciezka(f.geometry);

let siatka = '';
for (let lon = -20; lon <= 150; lon += 10) siatka += `M${Math.round(X(lon))} 0V${H}`;
for (let lat = -10; lat <= 80; lat += 10) siatka += `M0 ${Math.round(Y(lat))}H${W}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`
  + `<path class="siatka" d="${siatka}"/><path class="lad" d="${lad}"/>`
  + `<path class="kont kont-europa" d="${europa}"/><path class="kont kont-azja" d="${azja}"/></svg>\n`;
writeFileSync(new URL('../img/kontynenty.svg', import.meta.url), svg);
console.log(`Gotowe: img/kontynenty.svg (${Math.round(svg.length / 1024)} KB).`);
