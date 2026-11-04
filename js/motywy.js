// Motywy kolorystyczne: 4 warianty, zapis w localStorage.

const KLUCZ = 'europa-motyw';

export const MOTYWY = [
  { id: 'czarny-bialy', nazwa: 'Czarne tło, biały kolor', tlo: 'ciemne', akcent: '#eceef1', wlasny: false },
  { id: 'bialy-czarny', nazwa: 'Białe tło, czarny kolor', tlo: 'jasne', akcent: '#1d2127', wlasny: false },
  { id: 'bialy-wlasny', nazwa: 'Białe tło, własny kolor', tlo: 'jasne', wlasny: true },
  { id: 'czarny-wlasny', nazwa: 'Czarne tło, własny kolor', tlo: 'ciemne', wlasny: true },
];

const TLO = { jasne: '#f6f5f2', ciemne: '#0f1d2b' };
// Domyślnie: czarne tło, biały kolor. Kolor #91a17d (szałwiowa zieleń) to podpowiedź dla własnego koloru.
const DOMYSLNY = { motyw: 'czarny-bialy', kolor: '#91a17d' };

export function wczytajMotyw() {
  try {
    const z = JSON.parse(localStorage.getItem(KLUCZ) || 'null');
    if (z && MOTYWY.some((m) => m.id === z.motyw) && /^#[0-9a-f]{6}$/i.test(z.kolor)) return z;
  } catch { /* brak dostępu do localStorage */ }
  return { ...DOMYSLNY };
}

export function zapiszMotyw(stan) {
  try { localStorage.setItem(KLUCZ, JSON.stringify(stan)); } catch { /* ignoruj */ }
}

// ---- kolory ----
export function hexNaRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbNaHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}
function luminancja([r, g, b]) {
  const k = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b);
}
export function kontrast(a, b) {
  const [l1, l2] = [luminancja(hexNaRgb(a)), luminancja(hexNaRgb(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
function rgbNaHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hslNaRgb([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const f = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255];
}

// Jeśli wybrany kolor jest za mało czytelny na tle, rozjaśnia go albo przyciemnia
// (zachowując odcień), aż kontrast osiągnie 4,5 : 1 (norma WCAG dla tekstu).
export function dopasujDoTla(hex, tlo) {
  const tloHex = TLO[tlo];
  if (kontrast(hex, tloHex) >= 4.5) return hex;
  let [h, s, l] = rgbNaHsl(hexNaRgb(hex));
  const krok = tlo === 'jasne' ? -0.01 : 0.01;
  for (let i = 0; i < 100; i++) {
    l = Math.max(0, Math.min(1, l + krok));
    const kand = rgbNaHex(hslNaRgb([h, s, l]));
    if (kontrast(kand, tloHex) >= 4.5) return kand;
  }
  return tlo === 'jasne' ? '#000000' : '#ffffff';
}

export function akcentDla(stan) {
  const m = MOTYWY.find((x) => x.id === stan.motyw) || MOTYWY[0];
  return { tlo: m.tlo, akcent: m.wlasny ? dopasujDoTla(stan.kolor, m.tlo) : m.akcent };
}

export function zastosujMotyw(stan) {
  const { tlo, akcent } = akcentDla(stan);
  const root = document.documentElement;
  root.dataset.tlo = tlo;
  root.style.setProperty('--akcent', akcent);
  const [r, g, b] = hexNaRgb(akcent);
  root.style.setProperty('--akcent-rgb', `${r}, ${g}, ${b}`);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', TLO[tlo]);
  document.dispatchEvent(new CustomEvent('zmiana-motywu', { detail: { tlo, akcent } }));
}
