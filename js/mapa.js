// Mapa: podkład reliefu (bez napisów), granice państw, podświetlanie obiektów
// i rozpoznawanie trafień z tolerancją w pikselach ekranu.
/* global L */

const KAFELKI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}';
const ZASIEG_MAPY = [[25, -35], [84, 90]];
const WIDOK_EUROPY = [[35, -12], [71, 45]];

// Tolerancja kliknięcia (piksele ekranu).
export const TOLERANCJA_DUZA = 25; // rzeki, stolice, cieśniny, obiekty małe na ekranie
export const TOLERANCJA_MALA = 8;  // brzegi dużych obszarów
const MALY_NA_EKRANIE = 30;        // obszar węższy niż tyle pikseli traktujemy jak mały

const KOLORY_MAPY = {
  jasne: { morze: '#a9c6df', lad: '#f3f0e8', granica: 'rgba(35,35,40,0.55)' },
  ciemne: { morze: '#0b1724', lad: '#27323e', granica: 'rgba(235,235,240,0.42)' },
};
const KOLOR_PODSWIETLENIA = '#16b45a';

export function utworzMape(element, { geometrie, tlo }) {
  const map = L.map(element, {
    zoomControl: false,
    attributionControl: true,
    minZoom: 3,
    maxZoom: 12,
    maxBounds: ZASIEG_MAPY,
    maxBoundsViscosity: 0.8,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 90,
    worldCopyJump: false,
    // Podwójne stuknięcie nie przybliża – inaczej pierwsze stuknięcie byłoby odpowiedzią.
    doubleClickZoom: false,
  });
  map.attributionControl.setPrefix(false);
  L.control.zoom({ position: 'bottomright', zoomInTitle: 'Przybliż', zoomOutTitle: 'Oddal' }).addTo(map);

  // Warstwa podkładu (pod kafelkami): morze + ląd. Kafelki reliefu nakładane są
  // w trybie „multiply”, więc relief cieniuje ląd, a morze ma stały kolor.
  map.createPane('podklad').style.zIndex = 150;
  map.createPane('granice').style.zIndex = 350;
  map.getPane('granice').style.pointerEvents = 'none';
  const rendererPodkladu = L.canvas({ pane: 'podklad', padding: 1 });
  const rendererGranic = L.canvas({ pane: 'granice', padding: 1 });

  const wszystkiePanstwa = {
    type: 'FeatureCollection',
    features: [...tlo.features.filter((f) => !f.properties.jezioro), ...geometrie.features.filter((f) => f.id.startsWith('panstwo-'))],
  };
  // Wszystkie jeziora w kolorze wody (te z quizu niczym się nie wyróżniają).
  const jeziora = { type: 'FeatureCollection', features: [...tlo.features.filter((f) => f.properties.jezioro), ...geometrie.features.filter((f) => f.id.startsWith('jezioro-'))] };

  const morze = L.rectangle(ZASIEG_MAPY, { renderer: rendererPodkladu, stroke: false, fillOpacity: 1, interactive: false }).addTo(map);
  const lad = L.geoJSON(wszystkiePanstwa, { renderer: rendererPodkladu, stroke: false, fillOpacity: 1, interactive: false }).addTo(map);
  const wodyLadowe = L.geoJSON(jeziora, { renderer: rendererPodkladu, stroke: false, fillOpacity: 1, interactive: false }).addTo(map);

  L.tileLayer(KAFELKI, {
    maxNativeZoom: 13,
    maxZoom: 12,
    attribution: 'Relief: © Esri',
    className: 'kafelki-reliefu',
  }).addTo(map);

  const granice = L.geoJSON(wszystkiePanstwa, { renderer: rendererGranic, fill: false, weight: 0.9, interactive: false }).addTo(map);

  function kolorujMape() {
    const k = KOLORY_MAPY[document.documentElement.dataset.tlo === 'jasne' ? 'jasne' : 'ciemne'];
    morze.setStyle({ fillColor: k.morze });
    lad.setStyle({ fillColor: k.lad });
    wodyLadowe.setStyle({ fillColor: k.morze });
    granice.setStyle({ color: k.granica });
    element.style.background = k.morze;
  }
  kolorujMape();
  document.addEventListener('zmiana-motywu', kolorujMape);

  map.fitBounds(WIDOK_EUROPY, { animate: false });

  // ---- indeks geometrii ----
  const indeks = new Map(geometrie.features.map((f) => [f.id, f]));

  // ---- kliknięcie bez przesuwania ----
  // Przesuwanie i przybliżanie (także dwoma palcami) nigdy nie liczy się jako kliknięcie.
  // Wskaźniki (palce / mysz) śledzimy na całym oknie: puszczenie może nastąpić
  // nad panelem albo poza oknem i też musi zakończyć gest.
  let start = null, gestPrzerwany = false;
  const aktywne = new Set();
  const kontener = map.getContainer();
  kontener.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') aktywne.clear(); // mysz ma jeden wskaźnik – nic nie może „wisieć”
    aktywne.add(e.pointerId);
    if (aktywne.size === 1) { start = { x: e.clientX, y: e.clientY }; gestPrzerwany = false; } else gestPrzerwany = true;
  }, true);
  const naOknie = {
    pointermove: (e) => { if (start && aktywne.has(e.pointerId) && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) gestPrzerwany = true; },
    pointerup: (e) => { aktywne.delete(e.pointerId); },
    pointercancel: (e) => { aktywne.delete(e.pointerId); gestPrzerwany = true; },
    blur: () => { aktywne.clear(); },
  };
  for (const [typ, fn] of Object.entries(naOknie)) window.addEventListener(typ, fn, true);
  map.on('zoomstart movestart', () => { if (aktywne.size > 0) gestPrzerwany = true; });

  const sluchacze = [];
  map.on('click', (e) => {
    if (gestPrzerwany) return;
    sluchacze.forEach((fn) => fn(e.latlng));
  });

  // ---- warstwa podświetleń ----
  const warstwa = L.layerGroup().addTo(map);

  function wyczysc() { warstwa.clearLayers(); }

  // slabo: delikatne podświetlenie (np. państwo pod podświetloną stolicą)
  function podswietl(id, { kolor = KOLOR_PODSWIETLENIA, slabo = false } = {}) {
    const f = indeks.get(id);
    if (!f) return;
    const typ = f.geometry.type;
    if (typ === 'Point') {
      const [lng, lat] = f.geometry.coordinates;
      L.circleMarker([lat, lng], { radius: 7, color: '#fff', weight: 2.5, fillColor: kolor, fillOpacity: 1, interactive: false, className: 'podswietlenie' }).addTo(warstwa);
      L.marker([lat, lng], { icon: L.divIcon({ className: 'puls', html: `<span style="--kolor:${kolor}"></span>`, iconSize: [44, 44] }), interactive: false, keyboard: false }).addTo(warstwa);
      return;
    }
    if (typ.includes('LineString')) {
      L.geoJSON(f, { style: { color: '#ffffff', weight: 8, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }, interactive: false, className: 'podswietlenie' }).addTo(warstwa);
      L.geoJSON(f, { style: { color: kolor, weight: 4.5, opacity: 1, lineCap: 'round', lineJoin: 'round' }, interactive: false, className: 'podswietlenie' }).addTo(warstwa);
      return;
    }
    if (slabo) {
      L.geoJSON(f, { style: { color: kolor, weight: 1.5, opacity: 0.8, fillColor: kolor, fillOpacity: 0.16 }, interactive: false, className: 'podswietlenie' }).addTo(warstwa);
      return;
    }
    L.geoJSON(f, { style: { color: kolor, weight: 2.5, opacity: 1, fillColor: kolor, fillOpacity: 0.38 }, interactive: false, className: 'podswietlenie' }).addTo(warstwa);
    // Bardzo małe obszary (np. Watykan, Monako) dostają dodatkowo pierścień, żeby były widoczne.
    const b = L.geoJSON(f).getBounds();
    const p1 = map.latLngToContainerPoint(b.getSouthWest()), p2 = map.latLngToContainerPoint(b.getNorthEast());
    if (Math.max(Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y)) < 14) {
      L.marker(b.getCenter(), { icon: L.divIcon({ className: 'puls', html: `<span style="--kolor:${kolor}"></span>`, iconSize: [44, 44] }), interactive: false, keyboard: false }).addTo(warstwa);
    }
  }

  function pokazPudlo(latlng) {
    L.marker(latlng, {
      icon: L.divIcon({ className: 'znacznik-pudla', html: '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12.5"/><path d="M9 9l10 10M19 9L9 19"/></svg>', iconSize: [28, 28] }),
      interactive: false, keyboard: false, zIndexOffset: 1000,
    }).addTo(warstwa);
  }

  // Płynnie przesuwa (i w razie potrzeby oddala) mapę, żeby obiekt był widoczny
  // w części mapy niezasłoniętej przez górny panel. Bardzo małe obszary (np. wyspy
  // przy dużym oddaleniu) są dodatkowo lekko przybliżane.
  // Zwraca obietnicę spełnianą, gdy mapa skończy się przesuwać (od razu, jeśli nie trzeba jej ruszać).
  // przyblizMale: false – nie przybliżaj małych obiektów (przy trafieniu obiekt jest już pod kursorem).
  function pokazObiekt(id, gornyMargines = 0, { przyblizMale = true } = {}) {
    const f = indeks.get(id);
    if (!f) return Promise.resolve();
    const punkt = f.geometry.type === 'Point';
    const granicaObiektu = punkt
      ? L.latLngBounds([L.latLng(f.geometry.coordinates[1], f.geometry.coordinates[0])])
      : L.geoJSON(f).getBounds();
    const rozmiar = map.getSize();
    const margines = 24;
    const lg = map.containerPointToLatLng([margines, gornyMargines + margines]);
    const pd = map.containerPointToLatLng([rozmiar.x - margines - 48, rozmiar.y - margines]);
    const widoczne = L.latLngBounds(lg, pd);
    const a = map.latLngToContainerPoint(granicaObiektu.getSouthWest()), b = map.latLngToContainerPoint(granicaObiektu.getNorthEast());
    const malenki = !punkt && Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) < 16;
    const zoom = map.getZoom();
    const maxZoom = malenki && przyblizMale ? Math.max(zoom, Math.min(zoom + 2, 8)) : zoom;
    if (widoczne.contains(granicaObiektu) && maxZoom === zoom) return Promise.resolve();
    return new Promise((gotowe) => {
      let zakonczone = false;
      const koniec = () => { if (zakonczone) return; zakonczone = true; map.off('moveend', koniec); gotowe(); };
      map.once('moveend', koniec);
      setTimeout(koniec, 2500); // zabezpieczenie, gdyby animacja nie zgłosiła końca
      map.flyToBounds(granicaObiektu, {
        paddingTopLeft: [margines, gornyMargines + margines],
        paddingBottomRight: [margines + 48, margines],
        maxZoom,
        duration: 0.9,
      });
    });
  }

  // ---- rozpoznawanie trafień ----
  function trafia(id, latlng) {
    const f = indeks.get(id);
    if (!f) return false;
    return odlegloscPx(f, latlng) <= tolerancja(f);
  }

  // Tolerancja w pikselach dla danego obiektu przy bieżącym przybliżeniu.
  function tolerancja(f) {
    const typ = f.geometry.type;
    if (typ === 'Point' || typ.includes('LineString') || f.id.startsWith('ciesnina-')) return TOLERANCJA_DUZA;
    const b = L.geoJSON(f).getBounds();
    const p1 = map.latLngToLayerPoint(b.getSouthWest()), p2 = map.latLngToLayerPoint(b.getNorthEast());
    const min = Math.min(Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
    return min < MALY_NA_EKRANIE ? TOLERANCJA_DUZA : TOLERANCJA_MALA;
  }

  // Odległość kliknięcia od obiektu w pikselach (0 = wewnątrz obszaru).
  function odlegloscPx(f, latlng) {
    const p = map.latLngToLayerPoint(latlng);
    const rzut = ([lng, lat]) => map.latLngToLayerPoint([lat, lng]);
    const g = f.geometry;
    if (g.type === 'Point') { const q = rzut(g.coordinates); return Math.hypot(q.x - p.x, q.y - p.y); }
    const linie = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : null;
    if (linie) {
      let min = Infinity;
      for (const l of linie) min = Math.min(min, odlegloscOdLamanej(p, l.map(rzut)));
      return min;
    }
    const wielokaty = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    let min = Infinity;
    for (const w of wielokaty) {
      const pierscienie = w.map((r) => r.map(rzut));
      let wewnatrz = false;
      for (const r of pierscienie) if (punktWPierscieniu(p, r)) wewnatrz = !wewnatrz;
      if (wewnatrz) return 0;
      for (const r of pierscienie) min = Math.min(min, odlegloscOdLamanej(p, r));
    }
    return min;
  }

  return {
    map,
    indeks,
    naKlikniecie: (fn) => sluchacze.push(fn),
    podswietl,
    wyczysc,
    pokazPudlo,
    pokazObiekt,
    trafia,
    odlegloscPx,
    tolerancja,
    widokEuropy: () => map.flyToBounds(WIDOK_EUROPY, { duration: 0.8 }),
    zniszcz: () => {
      document.removeEventListener('zmiana-motywu', kolorujMape);
      for (const [typ, fn] of Object.entries(naOknie)) window.removeEventListener(typ, fn, true);
      map.remove();
    },
  };
}

function punktWPierscieniu(p, r) {
  let w = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const a = r[i], b = r[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) w = !w;
  }
  return w;
}

function odlegloscOdLamanej(p, pts) {
  let min = Infinity;
  for (let i = 1; i < pts.length; i++) min = Math.min(min, odlegloscOdOdcinka(p, pts[i - 1], pts[i]));
  if (pts.length === 1) min = Math.hypot(p.x - pts[0].x, p.y - pts[0].y);
  return min;
}

function odlegloscOdOdcinka(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d2 = dx * dx + dy * dy;
  let t = d2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / d2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
