# GeoQuizEuropa
Sprawdzian Geografia

## Geografia Europy – quizy z mapą

Statyczna strona (HTML, CSS, JavaScript) do nauki geografii Europy. Bez backendu – wyniki i motyw zapisują się w `localStorage` przeglądarki.

## Uruchomienie

Strona wczytuje dane z plików JSON, więc musi być otwarta przez serwer HTTP (dwuklik w `index.html` nie wystarczy).

Lokalnie, w katalogu projektu:

```bash
python3 -m http.server 8000
```

i otwórz <http://localhost:8000>. Alternatywnie: `npx serve`.

### Publikacja na GitHub Pages

1. Wrzuć zawartość tego folderu do repozytorium na GitHubie (pliki `index.html` itd. w katalogu głównym).
2. W repozytorium: **Settings → Pages → Source: Deploy from a branch**, gałąź `main`, katalog `/ (root)`.
3. Po chwili strona działa pod adresem `https://<login>.github.io/<repozytorium>/` – także na telefonie.

Folderu `narzedzia/node_modules` nie trzeba (i nie warto) wrzucać.

## Struktura

```
index.html              strona główna, lista quizów, quiz, wynik
sprawdz.html            ukryta strona kontrolna – wszystkie obiekty z podpisami, filtr po quizie,
                        kliknięcie w mapę pokazuje, które odpowiedzi byłyby tam uznane za trafione
css/style.css           wygląd, 4 motywy
js/app.js               widoki i nawigacja (#, #europa, #quiz-<id>)
js/motywy.js            motywy + automatyczna korekta kontrastu własnego koloru
js/kolo-barw.js         koło barw
js/mapa.js              mapa Leaflet, podświetlanie, wykrywanie trafień (tolerancja w pikselach)
js/quiz.js              logika: tasowanie Fishera-Yatesa, losowanie fraz, procent, zapis wyniku
data/europa.json        WSZYSTKIE pytania: polska nazwa, rodzaj, quiz, odwołanie do geometrii,
                        przynależność (wyspy), opis źródła geometrii; pule fraz
data/geometrie.geojson  geometrie obiektów (id = pole „geometria” w europa.json)
data/tlo.geojson        obrysy pozostałych państw i jeziora (tylko do rysowania tła)
lib/leaflet/            Leaflet 1.9.4 (lokalna kopia)
narzedzia/              skrypty przygotowujące dane (niepotrzebne do działania strony)
testy/test.mjs          testy
```

## Mapa

- Podkład: **Esri World Shaded Relief** – sam relief, bez żadnych napisów. Kafelki są nakładane w trybie „multiply” na własne tło (morze/ląd), więc morze ma zawsze jednolity kolor. Rysowane są tylko granice państw i jeziora – bez nazw, bez rzek, bez punktów.
- Tolerancja kliknięcia: 25 px dla stolic, rzek, cieśnin i obszarów mniejszych niż 30 px na ekranie (np. Watykan, Monako, San Marino przy oddaleniu); 8 px od brzegu pozostałych obszarów.
- Przesuwanie i przybliżanie (także dwoma palcami) nie jest liczone jako odpowiedź. Podwójne stuknięcie nie przybliża mapy (pierwsze stuknięcie byłoby odpowiedzią).

## Testy

```bash
node testy/test.mjs
```

Sprawdzają m.in.: czy każde pytanie ma geometrię, brak duplikatów, zgodność każdej nazwy ze specyfikacją (litera po literze), liczbę pytań w każdym quizie i w Sprawdzianie (184 = suma quizów 1–9), równe prawdopodobieństwo fraz (dokładne przedziały + test chi-kwadrat), równomierność tasowania, zaokrąglanie procentów, nadpisywanie wyniku, położenie każdej stolicy w jej państwie i każdej wyspy w państwie, do którego należy.

## Odtworzenie danych (opcjonalne)

Geometrie są już zbudowane w `data/`. Żeby zbudować je od nowa:

1. Pobierz do jednego katalogu pliki GeoJSON z <https://github.com/nvkelso/natural-earth-vector/tree/master/geojson>:
   `ne_10m_admin_0_countries_pol`, `ne_10m_geography_marine_polys`, `ne_10m_geography_regions_polys`,
   `ne_10m_rivers_lake_centerlines`, `ne_10m_lakes`, `ne_10m_land`, `ne_10m_minor_islands`.
2. `cd narzedzia && npm install && node zbuduj-dane.mjs <katalog>`

Geometrie przygotowane ręcznie są w `narzedzia/reczne.mjs` (każda opisana komentarzem `RĘCZNIE`). Granice państw pochodzą z wersji Natural Earth „z punktu widzenia Polski” (Krym w Ukrainie, Kosowo jako państwo, Cypr jako całość).

## Licencje i źródła

- Natural Earth – domena publiczna.
- Relief: © Esri (World Shaded Relief) – wymagana atrybucja jest widoczna w rogu mapy.
- Leaflet – licencja BSD-2.
- Czcionka Inter (Google Fonts) – SIL Open Font License.
