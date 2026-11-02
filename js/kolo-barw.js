// Interaktywne koło barw: kąt = odcień, odległość od środka = nasycenie,
// suwak pod spodem = jasność. Podgląd na żywo przez callback naZmiane(hex).

import { hexNaRgb, rgbNaHex } from './motywy.js';

function hsvNaRgb(h, s, v) {
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][((i % 6) + 6) % 6];
  return [r * 255, g * 255, b * 255];
}
function rgbNaHsv([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = ((h / 6) % 1 + 1) % 1;
  return [h, max ? d / max : 0, max];
}

export function utworzKoloBarw(kontener, hexPoczatkowy, naZmiane) {
  const ROZMIAR = 188;
  kontener.innerHTML = `
    <div class="kolo">
      <canvas width="${ROZMIAR * 2}" height="${ROZMIAR * 2}" style="width:${ROZMIAR}px;height:${ROZMIAR}px" aria-label="Koło barw"></canvas>
      <div class="kolo-znacznik"></div>
    </div>
    <label class="kolo-jasnosc"><span>Jasność</span><input type="range" min="15" max="100" step="1"></label>`;
  const canvas = kontener.querySelector('canvas');
  const znacznik = kontener.querySelector('.kolo-znacznik');
  const suwak = kontener.querySelector('input');
  let [h, s, v] = rgbNaHsv(hexNaRgb(hexPoczatkowy));

  function rysuj() {
    const ctx = canvas.getContext('2d');
    const N = canvas.width, R = N / 2;
    const img = ctx.createImageData(N, N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dx = x - R + 0.5, dy = y - R + 0.5, r = Math.hypot(dx, dy);
        const i = (y * N + x) * 4;
        if (r > R) { img.data[i + 3] = 0; continue; }
        const [cr, cg, cb] = hsvNaRgb((Math.atan2(dy, dx) / (2 * Math.PI) + 1) % 1, r / R, v);
        img.data[i] = cr; img.data[i + 1] = cg; img.data[i + 2] = cb;
        img.data[i + 3] = r > R - 1.5 ? Math.round(255 * (R - r) / 1.5) : 255; // wygładzona krawędź
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  function ustawZnacznik() {
    const R = ROZMIAR / 2, a = h * 2 * Math.PI;
    znacznik.style.left = `${R + Math.cos(a) * s * R}px`;
    znacznik.style.top = `${R + Math.sin(a) * s * R}px`;
    znacznik.style.background = rgbNaHex(hsvNaRgb(h, s, v));
  }
  function zglos() { ustawZnacznik(); naZmiane(rgbNaHex(hsvNaRgb(h, s, v))); }

  function zPozycji(e) {
    const b = canvas.getBoundingClientRect();
    const R = b.width / 2;
    const dx = e.clientX - b.left - R, dy = e.clientY - b.top - R;
    h = (Math.atan2(dy, dx) / (2 * Math.PI) + 1) % 1;
    s = Math.min(1, Math.hypot(dx, dy) / R);
    zglos();
  }
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    zPozycji(e);
    const ruch = (ev) => zPozycji(ev);
    const koniec = () => { canvas.removeEventListener('pointermove', ruch); canvas.removeEventListener('pointerup', koniec); canvas.removeEventListener('pointercancel', koniec); };
    canvas.addEventListener('pointermove', ruch);
    canvas.addEventListener('pointerup', koniec);
    canvas.addEventListener('pointercancel', koniec);
  });
  suwak.value = String(Math.round(Math.max(0.15, v) * 100));
  suwak.addEventListener('input', () => { v = Number(suwak.value) / 100; rysuj(); zglos(); });

  rysuj();
  ustawZnacznik();
}
