// Jednorazowy pomocnik: zapisuje data/europa.json z ręcznie wpisanej listy poniżej.
// Wszystkie polskie nazwy są wpisane ręcznie, dokładnie według specyfikacji (bez tłumaczenia maszynowego).
import { writeFileSync } from 'node:fs';

const quizy = [
  { id: 'panstwa', numer: 1, nazwa: 'Państwa' },
  { id: 'stolice', numer: 2, nazwa: 'Stolice' },
  { id: 'morza', numer: 3, nazwa: 'Morza' },
  { id: 'zatoki', numer: 4, nazwa: 'Zatoki' },
  { id: 'polwyspy', numer: 5, nazwa: 'Półwyspy' },
  { id: 'wyspy', numer: 6, nazwa: 'Wyspy' },
  { id: 'krainy', numer: 7, nazwa: 'Krainy Geograficzne' },
  { id: 'rzeki', numer: 8, nazwa: 'Rzeki' },
  { id: 'jeziora', numer: 9, nazwa: 'Jeziora' },
  { id: 'ciesniny', numer: 10, nazwa: 'Cieśniny' },
];

// [id, państwo, kod ISO (Natural Earth ADM0_A3), stolica, [szer., dł.] stolicy]
// Współrzędne stolic wpisane ręcznie (centrum miasta), sprawdzane testem: każda stolica musi leżeć w swoim państwie.
const panstwa = [
  ['albania', 'Albania', 'ALB', 'Tirana', [41.3275, 19.8187]],
  ['andora', 'Andora', 'AND', 'Andora', [42.5063, 1.5218]],
  ['austria', 'Austria', 'AUT', 'Wiedeń', [48.2082, 16.3738]],
  ['belgia', 'Belgia', 'BEL', 'Bruksela', [50.8466, 4.3528]],
  ['bialorus', 'Białoruś', 'BLR', 'Mińsk', [53.9045, 27.5615]],
  ['bosnia', 'Bośnia i Hercegowina', 'BIH', 'Sarajewo', [43.8563, 18.4131]],
  ['bulgaria', 'Bułgaria', 'BGR', 'Sofia', [42.6977, 23.3219]],
  ['chorwacja', 'Chorwacja', 'HRV', 'Zagrzeb', [45.8150, 15.9819]],
  ['cypr', 'Cypr', 'CYP', 'Nikozja', [35.1856, 33.3823]],
  ['czarnogora', 'Czarnogóra', 'MNE', 'Podgorica', [42.4304, 19.2594]],
  ['czechy', 'Czechy', 'CZE', 'Praga', [50.0755, 14.4378]],
  ['dania', 'Dania', 'DNK', 'Kopenhaga', [55.6761, 12.5683]],
  ['estonia', 'Estonia', 'EST', 'Tallinn', [59.4370, 24.7536]],
  ['finlandia', 'Finlandia', 'FIN', 'Helsinki', [60.1699, 24.9384]],
  ['francja', 'Francja', 'FRA', 'Paryż', [48.8566, 2.3522]],
  ['grecja', 'Grecja', 'GRC', 'Ateny', [37.9838, 23.7275]],
  ['hiszpania', 'Hiszpania', 'ESP', 'Madryt', [40.4168, -3.7038]],
  ['holandia', 'Holandia', 'NLD', 'Amsterdam', [52.3676, 4.9041]],
  ['irlandia', 'Irlandia', 'IRL', 'Dublin', [53.3498, -6.2603]],
  ['islandia', 'Islandia', 'ISL', 'Reykjavik', [64.1466, -21.9426]],
  ['kosowo', 'Kosowo', 'KOS', 'Prisztina', [42.6629, 21.1655]],
  ['liechtenstein', 'Liechtenstein', 'LIE', 'Vaduz', [47.1410, 9.5209]],
  ['litwa', 'Litwa', 'LTU', 'Wilno', [54.6872, 25.2797]],
  ['luksemburg', 'Luksemburg', 'LUX', 'Luksemburg', [49.6116, 6.1319]],
  ['lotwa', 'Łotwa', 'LVA', 'Ryga', [56.9496, 24.1052]],
  ['macedonia', 'Macedonia Północna', 'MKD', 'Skopje', [41.9981, 21.4254]],
  ['malta', 'Malta', 'MLT', 'Valletta', [35.8989, 14.5146]],
  ['moldawia', 'Mołdawia', 'MDA', 'Kiszyniów', [47.0105, 28.8638]],
  ['monako', 'Monako', 'MCO', 'Monako', [43.7384, 7.4246]],
  ['niemcy', 'Niemcy', 'DEU', 'Berlin', [52.5200, 13.4050]],
  ['norwegia', 'Norwegia', 'NOR', 'Oslo', [59.9139, 10.7522]],
  ['polska', 'Polska', 'POL', 'Warszawa', [52.2297, 21.0122]],
  ['portugalia', 'Portugalia', 'PRT', 'Lizbona', [38.7223, -9.1393]],
  ['rosja', 'Rosja', 'RUS', 'Moskwa', [55.7558, 37.6173]],
  ['rumunia', 'Rumunia', 'ROU', 'Bukareszt', [44.4268, 26.1025]],
  ['san-marino', 'San Marino', 'SMR', 'San Marino', [43.9356, 12.4473]],
  ['serbia', 'Serbia', 'SRB', 'Belgrad', [44.8125, 20.4612]],
  ['slowacja', 'Słowacja', 'SVK', 'Bratysława', [48.1486, 17.1077]],
  ['slowenia', 'Słowenia', 'SVN', 'Lublana', [46.0569, 14.5058]],
  ['szwajcaria', 'Szwajcaria', 'CHE', 'Berno', [46.9480, 7.4474]],
  ['szwecja', 'Szwecja', 'SWE', 'Sztokholm', [59.3293, 18.0686]],
  ['ukraina', 'Ukraina', 'UKR', 'Kijów', [50.4501, 30.5234]],
  ['watykan', 'Watykan', 'VAT', 'Watykan', [41.9029, 12.4534]],
  ['wegry', 'Węgry', 'HUN', 'Budapeszt', [47.4979, 19.0402]],
  ['wielka-brytania', 'Wielka Brytania', 'GBR', 'Londyn', [51.5074, -0.1278]],
  ['wlochy', 'Włochy', 'ITA', 'Rzym', [41.8933, 12.4829]],
];

const pytania = [];
const dodaj = (o) => pytania.push(o);

for (const [id, panstwo, iso, stolica, [lat, lng]] of panstwa) {
  const takaSama = panstwo === stolica;
  // Cypr ma też pytanie „Cypr (wyspa)” w quizie 5, dlatego w Sprawdzianie musi się odróżniać.
  const dopiskiPanstwa = takaSama || id === 'cypr';
  dodaj({ id: `panstwo-${id}`, nazwa: dopiskiPanstwa ? `${panstwo} (państwo)` : panstwo, rodzaj: 'państwo', quiz: 'panstwa', geometria: `panstwo-${id}`, iso, zrodlo: 'Natural Earth (widok granic: Polska)' });
  dodaj({ id: `stolica-${id}`, nazwa: takaSama ? `${stolica} (stolica)` : stolica, rodzaj: 'stolica', quiz: 'stolice', geometria: `stolica-${id}`, panstwo, wspolrzedne: [lat, lng], zrodlo: 'ręcznie (współrzędne)' });
}

const NE = 'Natural Earth';
const R = 'ręcznie';
const lista = (quiz, rodzaj, wpisy) => wpisy.forEach(([id, nazwa, zrodlo, extra]) =>
  dodaj({ id, nazwa, rodzaj, quiz, geometria: id, zrodlo, ...(extra || {}) }));

lista('morza', 'morze', [
  ['morze-barentsa', 'Morze Barentsa', NE],
  ['morze-biale', 'Morze Białe', NE],
  ['morze-grenlandzkie', 'Morze Grenlandzkie', NE],
  ['morze-norweskie', 'Morze Norweskie', NE],
  ['morze-polnocne', 'Morze Północne', NE],
  ['morze-baltyckie', 'Morze Bałtyckie', NE],
  ['morze-srodziemne', 'Morze Śródziemne', NE],
  ['morze-egejskie', 'Morze Egejskie', NE],
  ['morze-adriatyckie', 'Morze Adriatyckie', NE],
  ['morze-liguryjskie', 'Morze Liguryjskie', NE],
  ['morze-tyrrenskie', 'Morze Tyrreńskie', NE],
  ['morze-jonskie', 'Morze Jońskie', NE],
  ['morze-marmara', 'Morze Marmara', NE],
  ['morze-czarne', 'Morze Czarne', NE],
  ['morze-azowskie', 'Morze Azowskie', NE],
]);

lista('zatoki', 'zatoka', [
  ['zatoka-botnicka', 'Zatoka Botnicka', NE],
  ['zatoka-finska', 'Zatoka Fińska', NE],
  ['zatoka-biskajska', 'Zatoka Biskajska', NE],
  ['zatoka-wenecka', 'Zatoka Wenecka', R],
  ['zatoka-genuenska', 'Zatoka Genueńska', R],
]);

lista('polwyspy', 'półwysep', [
  ['polwysep-skandynawski', 'Półwysep Skandynawski', R],
  ['polwysep-kolski', 'Półwysep Kolski', NE],
  ['polwysep-jutlandzki', 'Półwysep Jutlandzki', R],
  ['polwysep-bretonski', 'Półwysep Bretoński', R],
  ['polwysep-iberyjski', 'Półwysep Iberyjski', R],
  ['polwysep-apeninski', 'Półwysep Apeniński', R],
  ['polwysep-balkanski', 'Półwysep Bałkański', NE],
  ['polwysep-krymski', 'Półwysep Krymski', NE],
]);

const w = (p) => ({ przynaleznosc: p });
lista('wyspy', 'wyspa', [
  ['wyspa-spitsbergen', 'Spitsbergen', NE, w('Norwegia')],
  ['wyspa-wyspy-owcze', 'Wyspy Owcze', NE, w('Dania')],
  ['wyspa-szetlandy', 'Szetlandy', NE, w('Wielka Brytania')],
  ['wyspa-zelandia', 'Zelandia', NE, w('Dania')],
  ['wyspa-gotlandia', 'Gotlandia', NE, w('Szwecja')],
  ['wyspa-sarema', 'Sarema', NE, w('Estonia')],
  ['wyspa-baleary', 'Baleary', NE, w('Hiszpania')],
  ['wyspa-majorka', 'Majorka', NE, w('Hiszpania')],
  ['wyspa-minorka', 'Minorka', NE, w('Hiszpania')],
  ['wyspa-ibiza', 'Ibiza', NE, w('Hiszpania')],
  ['wyspa-sardynia', 'Sardynia', NE, w('Włochy')],
  ['wyspa-korsyka', 'Korsyka', NE, w('Francja')],
  ['wyspa-sycylia', 'Sycylia', NE, w('Włochy')],
  ['wyspa-kreta', 'Kreta', NE, w('Grecja')],
  ['wyspa-cypr', 'Cypr (wyspa)', NE, { przynaleznosc: 'Cypr', przynaleznoscOpis: 'Cypr (osobne państwo)' }],
]);

lista('krainy', 'kraina', [
  ['kraina-nizina-wschodnioeuropejska', 'Nizina Wschodnioeuropejska', R],
  ['kraina-nizina-nadkaspijska', 'Nizina Nadkaspijska', NE],
  ['kraina-nizina-polska', 'Nizina Polska', R],
  ['kraina-nizina-niemiecka', 'Nizina Niemiecka', R],
  ['kraina-nizina-francuska', 'Nizina Francuska', R],
  ['kraina-nizina-wegierska', 'Nizina Węgierska', NE],
  ['kraina-nizina-padanska', 'Nizina Padańska', R],
  ['kraina-nizina-czarnomorska', 'Nizina Czarnomorska', R],
  ['kraina-masyw-centralny', 'Masyw Centralny', NE],
  ['kraina-wyzyna-wolynska', 'Wyżyna Wołyńska', R],
  ['kraina-wyzyna-bawarska', 'Wyżyna Bawarska', R],
  ['kraina-gory-skandynawskie', 'Góry Skandynawskie', NE],
  ['kraina-ural', 'Ural', NE],
  ['kraina-karpaty', 'Karpaty', NE],
  ['kraina-sudety', 'Sudety', NE],
  ['kraina-gory-dynarskie', 'Góry Dynarskie', NE],
  ['kraina-apeniny', 'Apeniny', NE],
  ['kraina-alpy', 'Alpy', NE],
  ['kraina-pireneje', 'Pireneje', NE],
  ['kraina-gory-betyckie', 'Góry Betyckie', R],
  ['kraina-balkany', 'Stara Płanina (Bałkany)', NE],
  ['kraina-harz', 'Harz', NE],
]);

lista('rzeki', 'rzeka', [
  ['rzeka-wolga', 'Wołga', NE], ['rzeka-dniepr', 'Dniepr', NE], ['rzeka-dniestr', 'Dniestr', NE],
  ['rzeka-niemen', 'Niemen', R], ['rzeka-tamiza', 'Tamiza', NE], ['rzeka-sekwana', 'Sekwana', NE],
  ['rzeka-dunaj', 'Dunaj', NE], ['rzeka-pad', 'Pad', NE], ['rzeka-ren', 'Ren', NE],
  ['rzeka-rodan', 'Rodan', NE], ['rzeka-tag', 'Tag', NE], ['rzeka-tyber', 'Tyber', NE],
]);

lista('jeziora', 'jezioro', [
  ['jezioro-bodenskie', 'Jezioro Bodeńskie', NE], ['jezioro-como', 'Jezioro Como', NE],
  ['jezioro-genewskie', 'Jezioro Genewskie', NE], ['jezioro-onega', 'Onega', NE],
  ['jezioro-ladoga', 'Ładoga', NE], ['jezioro-balaton', 'Balaton', NE],
]);

lista('ciesniny', 'cieśnina', [
  ['ciesnina-skagerrak', 'Skagerrak', NE], ['ciesnina-kattegat', 'Kattegat', NE],
  ['ciesnina-kaletanska', 'Cieśnina Kaletańska', R], ['ciesnina-gibraltarska', 'Cieśnina Gibraltarska', R],
  ['ciesnina-sycylijska', 'Cieśnina Sycylijska', R], ['ciesnina-bosfor', 'Bosfor', NE],
  ['ciesnina-dardanele', 'Dardanele', NE], ['ciesnina-la-manche', 'Kanał La Manche', NE],
  ['ciesnina-swietego-jerzego', 'Kanał Świętego Jerzego', R],
]);

const dane = {
  opis: 'Wszystkie pytania quizów „Europa”. Polskie nazwy wpisane ręcznie. Geometrie w data/geometrie.geojson (pole „geometria” = id obiektu). „Sprawdzian” = wszystkie pytania z quizów 1–10.',
  frazy: {
    trafione: ['Trafione!', 'Doskonale!', 'Dobrze!', 'Fenomenalnie!', 'Brawo, kalafiorku!', 'Bombastycznie!'],
    pudlo: ['Błąd!', 'Ale pech!', 'Nie tym razem', 'Słabiutko', 'Pudło!', 'Wisisz Kubie dychę'],
  },
  quizy,
  pytania,
};
writeFileSync(new URL('../data/europa.json', import.meta.url), JSON.stringify(dane, null, 1) + '\n', 'utf8');
console.log('pytań:', pytania.length);
