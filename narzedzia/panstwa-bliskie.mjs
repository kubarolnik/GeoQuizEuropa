// Państwo z pytania = jego części leżące w okolicy Europy (prostokąt ZASIEG) w CAŁOŚCI
// (np. cała Rosja aż po Pacyfik) oraz wyspy w ich obrębie. Dalekie terytoria
// (Gujana Francuska, Karaiby holenderskie) nie należą do pytania.
import * as turf from '@turf/turf';

export const ZASIEG = [-35, 25, 90, 85];
const wielokaty = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
const bboxW = (c) => turf.bbox(turf.polygon(c));
const przecina = (b, z) => b[2] > z[0] && b[0] < z[2] && b[3] > z[1] && b[1] < z[3];

// Prostokąt obejmujący bliskie części państwa (null, gdy żadna nie leży przy Europie).
export function zasiegBliski(geometria) {
  const bliskie = wielokaty(geometria).map(bboxW).filter((b) => przecina(b, ZASIEG));
  if (!bliskie.length) return null;
  return [Math.min(...bliskie.map((b) => b[0])) - 1, Math.min(...bliskie.map((b) => b[1])) - 1,
    Math.max(...bliskie.map((b) => b[2])) + 1, Math.max(...bliskie.map((b) => b[3])) + 1];
}
// Część za 180. południkiem (koniec Czukotki z wysepkami, część Wyspy Wrangla) to przedłużenie państwa
// sięgającego 180°E – na mapie leży przy lewej krawędzi, ale też należy do pytania.
export const czyBliski = (c, zb) => {
  const b = bboxW(c);
  if (!zb || b[1] < zb[1] || b[3] > zb[3]) return false;
  if (zb[2] >= 180 && b[2] <= -165) return true;
  return b[0] >= zb[0] && b[2] <= zb[2];
};

export function panstwoBliskie(f) {
  const zb = zasiegBliski(f.geometry);
  const c = wielokaty(f.geometry).filter((w) => czyBliski(w, zb));
  if (!c.length) return null;
  return c.length === 1 ? turf.polygon(c[0], f.properties) : turf.multiPolygon(c, f.properties);
}
