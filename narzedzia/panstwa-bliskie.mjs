// Państwo z pytania = jego części leżące w okolicy Europy (prostokąt ZASIEG) w CAŁOŚCI
// (np. cała Rosja aż po Pacyfik) oraz wyspy w ich obrębie. Dalekie terytoria
// (Gujana Francuska, Karaiby holenderskie, Czukotka za 180. południkiem) nie należą do pytania.
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
export const czyBliski = (c, zb) => { const b = bboxW(c); return zb && b[0] >= zb[0] && b[1] >= zb[1] && b[2] <= zb[2] && b[3] <= zb[3]; };

export function panstwoBliskie(f) {
  const zb = zasiegBliski(f.geometry);
  const c = wielokaty(f.geometry).filter((w) => czyBliski(w, zb));
  if (!c.length) return null;
  return c.length === 1 ? turf.polygon(c[0], f.properties) : turf.multiPolygon(c, f.properties);
}
