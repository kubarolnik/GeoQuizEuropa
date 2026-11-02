// ============================================================================
//  GEOMETRIE PRZYGOTOWANE RĘCZNIE
// ----------------------------------------------------------------------------
//  Tych obiektów nie ma w Natural Earth (albo jest tam w innym znaczeniu),
//  więc ich zasięg wyznaczyłem ręcznie. Każdy obiekt to „wykrojnik”:
//  przybliżony wielokąt [długość, szerokość], który skrypt budujący
//  przycina do lądu lub wody z Natural Earth. Dzięki temu linia brzegowa
//  jest dokładna, a ręcznie wyznaczona jest tylko granica „lądowa”
//  (np. umowna granica niziny) albo „morska” (np. wejście do zatoki).
//
//  przytnij:
//    'woda'        – wykrojnik minus ląd (zatoki, cieśniny)
//    'lad'         – wykrojnik ∩ ląd (krainy)
//    'lad-glowny'  – wykrojnik ∩ ląd, tylko największa część (półwyspy, bez wysp)
//    'panstwo:XXX' – wykrojnik ∩ terytorium państwa XXX (kod Natural Earth)
// ============================================================================

export const RECZNE = {
  // ---------------------------------------------------------------- ZATOKI --
  // RĘCZNIE. Zatoka Wenecka: północna część Adriatyku, na północ od linii
  // delta Padu (Punta della Maestra) – przylądek Kamenjak (płd. kraniec Istrii).
  'zatoka-wenecka': {
    przytnij: 'woda',
    opis: 'Północny Adriatyk na północ od linii delta Padu – płd. kraniec Istrii.',
    wielokat: [[12.0, 44.95], [12.53, 44.95], [13.91, 44.76], [13.95, 45.2], [13.9, 45.6], [13.9, 46.0], [12.0, 46.0], [12.0, 44.95]],
  },
  // RĘCZNIE. Zatoka Genueńska: najdalej na północ wysunięta część Morza
  // Liguryjskiego, na północ od linii Imperia – La Spezia.
  'zatoka-genuenska': {
    przytnij: 'woda',
    opis: 'Północna część Morza Liguryjskiego na północ od linii Imperia – La Spezia.',
    wielokat: [[7.8, 43.87], [8.03, 43.87], [9.85, 44.03], [10.2, 44.5], [7.8, 44.5], [7.8, 43.87]],
  },

  // ------------------------------------------------------------- CIEŚNINY --
  // RĘCZNIE. Cieśnina Kaletańska (Dover): między linią Dungeness – przylądek
  // Gris-Nez a linią North Foreland/Leathercoat Point – Walde.
  'ciesnina-kaletanska': {
    przytnij: 'woda',
    opis: 'Między linią Dungeness – Gris-Nez a linią Leathercoat Point – Walde.',
    wielokat: [[0.9, 50.97], [0.97, 50.905], [1.585, 50.87], [1.75, 50.85], [1.95, 50.97], [1.92, 51.0], [1.40, 51.17], [1.3, 51.13], [0.9, 50.97]],
  },
  // RĘCZNIE. Cieśnina Gibraltarska: między linią przylądek Trafalgar – przylądek
  // Spartel (zachód) a linią Europa Point (Gibraltar) – Punta Almina (Ceuta) (wschód).
  // (Wielokąt z Natural Earth jest prawie pusty po przycięciu do brzegu.)
  'ciesnina-gibraltarska': {
    przytnij: 'woda',
    opis: 'Między linią przylądek Trafalgar – przylądek Spartel a linią Europa Point – Punta Almina (Ceuta).',
    wielokat: [[-6.03, 36.18], [-5.92, 35.79], [-5.6, 35.7], [-5.28, 35.89], [-5.345, 36.11], [-5.6, 36.3], [-6.03, 36.18]],
  },
  // RĘCZNIE. Cieśnina Sycylijska: między zachodnią Sycylią a przylądkiem Bon (Tunezja).
  'ciesnina-sycylijska': {
    przytnij: 'woda',
    opis: 'Między zachodnią Sycylią a przylądkiem Bon w Tunezji.',
    wielokat: [[11.04, 37.12], [12.35, 38.02], [12.75, 37.55], [13.3, 37.2], [12.5, 36.4], [11.15, 36.6], [11.04, 37.12]],
  },
  // RĘCZNIE. Kanał Świętego Jerzego: między Irlandią a Walią, od linii
  // Carnsore Point – St David's Head na północ do linii Arklow – wyspa Bardsey.
  'ciesnina-swietego-jerzego': {
    przytnij: 'woda',
    opis: 'Między Irlandią a Walią: od linii Carnsore Point – St David’s Head do linii Arklow – Bardsey.',
    wielokat: [[-6.36, 52.17], [-5.31, 51.90], [-4.80, 52.76], [-6.14, 52.80], [-6.4, 52.8], [-6.6, 52.3], [-6.36, 52.17]],
  },

  // --------------------------------------------------------------- RZEKI --
  // Natural Earth ma tylko dolny Niemen (od Kowna). RĘCZNIE dodany górny bieg:
  // źródła koło Uzdy – Stołpce – Lubcza – Mosty – Grodno – Druskieniki – Olita – Kowno.
  // (Dolny bieg z Natural Earth dołączany jest automatycznie.)
  'rzeka-niemen': {
    linia: true,
    opis: 'górny bieg (Uzda – Stołpce – Lubcza – Mosty – Grodno – Druskieniki – Olita – Kowno) wyznaczony ręcznie; dolny bieg (od Kowna) z Natural Earth.',
    wielokat: [[27.22, 53.42], [26.95, 53.45], [26.73, 53.48], [26.45, 53.60], [26.07, 53.75], [25.75, 53.72], [25.32, 53.65], [25.0, 53.55], [24.54, 53.41], [24.2, 53.47], [23.95, 53.6], [23.83, 53.68], [23.78, 53.85], [23.97, 54.02], [24.18, 54.16], [24.05, 54.40], [24.08, 54.51], [24.03, 54.61], [23.95, 54.63], [23.90, 54.90]],
  },

  // ------------------------------------------------------------ PÓŁWYSPY --
  // RĘCZNIE (granica lądowa). Półwysep Skandynawski: Norwegia, Szwecja
  // i północno-zachodnia Finlandia; granica na lądzie: linia ujście Torne
  // (Tornio) – Varangerfjord. Wyspy pominięte.
  'polwysep-skandynawski': {
    przytnij: 'lad-glowny',
    opis: 'Ląd na zachód od linii Tornio – Varangerfjord (bez wysp).',
    wielokat: [[3, 55.2], [17, 55.2], [24.3, 65.6], [24.15, 65.85], [28.9, 70.05], [35, 72], [3, 72], [3, 55.2]],
  },
  // RĘCZNIE (granica lądowa). Półwysep Jutlandzki (Cymbryjski): na północ
  // od linii ujście Łaby – Hamburg – Lubeka (z Szlezwikiem-Holsztynem). Bez wysp.
  'polwysep-jutlandzki': {
    przytnij: 'lad-glowny',
    opis: 'Ląd na północ od linii ujście Łaby – Hamburg – Lubeka (bez wysp).',
    wielokat: [[7.5, 53.85], [9.1, 53.85], [10.0, 53.55], [10.88, 53.95], [11.2, 54.3], [11.0, 58], [7.5, 58], [7.5, 53.85]],
  },
  // RĘCZNIE (granica lądowa). Półwysep Bretoński: na zachód od linii ujście
  // Loary – zatoka Mont-Saint-Michel. Bez wysp.
  'polwysep-bretonski': {
    przytnij: 'lad-glowny',
    opis: 'Ląd na zachód od linii ujście Loary – zatoka Mont-Saint-Michel.',
    wielokat: [[-6, 47.0], [-2.4, 47.0], [-2.0, 47.28], [-1.51, 48.62], [-1.6, 49.3], [-6, 49.3], [-6, 47.0]],
  },
  // RĘCZNIE (granica lądowa). Półwysep Apeniński: na południe od linii
  // północnego podnóża Apenin (Genua – Parma – Bolonia – Rimini). Bez Sycylii i wysp.
  'polwysep-apeninski': {
    przytnij: 'lad-glowny',
    opis: 'Ląd na południe od linii Genua – Bolonia – Rimini (bez wysp).',
    wielokat: [[8.6, 44.35], [8.93, 44.45], [9.6, 44.75], [10.33, 44.75], [10.93, 44.6], [11.34, 44.46], [11.88, 44.27], [12.57, 44.06], [13.5, 44.0], [19, 40.5], [19, 37.5], [15.8, 37.85], [15.0, 38.2], [7.5, 43.0], [8.6, 44.35]],
  },

  // -------------------------------------------------------------- KRAINY --
  // RĘCZNIE. Nizina Wschodnioeuropejska (Niż Wschodnioeuropejski): od wschodniej
  // granicy Polski i łuku Karpat po Ural i rzekę Ural; na północy bez Tarczy
  // Bałtyckiej (Karelia, Półwysep Kolski); na południu do Morza Czarnego,
  // Azowskiego i przedgórza Kaukazu. Wyspy pominięte.
  'kraina-nizina-wschodnioeuropejska': {
    przytnij: 'lad-glowny',
    opis: 'Od granicy Polski i Karpat po Ural; bez Karelii i Płw. Kolskiego.',
    wielokat: [
      [19.6, 54.45], [22.8, 54.37], [23.5, 53.9], [23.9, 52.7], [23.6, 52.1], [24.1, 50.8], [24.0, 50.4],
      [23.0, 49.5], [24.5, 49.0], [25.5, 48.4], [26.6, 48.2], [28.2, 45.5], [29.7, 45.2],
      [31.0, 45.0], [33.0, 44.3], [36.8, 45.2], [39.0, 44.8], [42.0, 45.0], [44.5, 44.9], [47.4, 44.6],
      [50.0, 45.5], [51.9, 46.9], [51.4, 48.5], [51.37, 51.2], [55.1, 51.6], [56.5, 52.3], [57.5, 54.5],
      [58.0, 57.0], [58.3, 60.0], [58.6, 62.5], [59.5, 64.5], [61.5, 66.0], [64.0, 67.8], [60.5, 69.5],
      [60.5, 70.5], [50.0, 69.6], [44.0, 69.0], [41.5, 66.2], [38.0, 64.6], [36.5, 63.9], [35.3, 61.5],
      [32.0, 60.5], [30.0, 59.95], [29.0, 60.0], [21.5, 59.6], [20.5, 57.0], [19.6, 54.45],
    ],
  },
  // RĘCZNIE. Nizina Polska: polska część Niżu Środkowoeuropejskiego – od
  // wybrzeża po północny skraj wyżyn i Przedgórza Sudeckiego, w granicach Polski.
  'kraina-nizina-polska': {
    przytnij: 'panstwo:POL',
    opis: 'Polska na północ od linii Sudety – Wyżyna Śląska – Wyżyna Małopolska – Wyżyna Lubelska.',
    wielokat: [
      [13.5, 51.1], [14.5, 51.1], [15.5, 51.05], [16.2, 50.95], [17.0, 50.7], [17.9, 50.3], [18.4, 50.45],
      [18.6, 50.9], [19.3, 51.1], [20.2, 51.3], [21.2, 51.45], [22.0, 51.45], [22.8, 51.35], [24.5, 51.3],
      [24.5, 55.5], [13.5, 55.5], [13.5, 51.1],
    ],
  },
  // RĘCZNIE. Nizina Niemiecka (Nizina Północnoniemiecka): Niemcy na północ
  // od linii średniogórzy (Zatoka Kolońska – Teutoburski Las – Harz – Lipsk – Łużyce).
  'kraina-nizina-niemiecka': {
    przytnij: 'panstwo:DEU',
    opis: 'Niemcy na północ od linii średniogórzy (Bonn – Hanower – Harz – Lipsk – Zgorzelec).',
    wielokat: [
      [5.5, 50.8], [7.0, 50.75], [7.6, 51.4], [8.5, 51.8], [9.3, 52.15], [10.0, 52.15], [10.6, 51.95],
      [11.4, 51.85], [11.9, 51.4], [12.4, 51.25], [13.5, 51.1], [15.2, 51.1], [15.5, 55.5], [5.5, 55.5], [5.5, 50.8],
    ],
  },
  // RĘCZNIE. Nizina Francuska: Basen Paryski i nizina nad środkową Loarą –
  // bez Masywu Armorykańskiego, Ardenów, Wogezów i Masywu Centralnego.
  'kraina-nizina-francuska': {
    przytnij: 'panstwo:FRA',
    opis: 'Basen Paryski i dolina środkowej Loary (bez Bretanii, Ardenów, Wogezów, Masywu Centralnego).',
    wielokat: [
      [1.3, 51.3], [2.6, 51.3], [4.1, 50.0], [5.5, 49.5], [5.9, 48.9], [5.6, 48.0], [4.8, 47.3], [3.9, 47.1],
      [3.0, 46.8], [2.0, 46.4], [1.0, 46.3], [0.3, 46.5], [-0.6, 46.9], [-0.6, 47.4], [-0.5, 48.0],
      [-0.6, 48.5], [-0.9, 49.1], [-0.9, 49.6], [1.3, 51.3],
    ],
  },
  // RĘCZNIE. Nizina Padańska: dolina Padu między Alpami a Apeninami, po wybrzeże
  // Adriatyku (z Niziną Wenecką i Friulską), w granicach Włoch.
  'kraina-nizina-padanska': {
    przytnij: 'panstwo:ITA',
    opis: 'Dolina Padu między podnóżem Alp a podnóżem Apenin.',
    wielokat: [
      [7.4, 44.4], [7.6, 45.0], [7.88, 45.47], [8.6, 45.7], [9.3, 45.8], [10.2, 45.6], [10.7, 45.45],
      [11.5, 45.7], [12.3, 45.9], [13.0, 46.05], [13.6, 45.85], [13.6, 45.5], [13.2, 45.0], [12.6, 44.4],
      [12.57, 44.06], [12.0, 44.2], [11.34, 44.46], [10.93, 44.6], [10.33, 44.75], [9.6, 44.85],
      [9.0, 44.85], [8.6, 44.65], [8.0, 44.6], [7.4, 44.4],
    ],
  },
  // RĘCZNIE. Nizina Czarnomorska: pas nizin nad północnym wybrzeżem Morza
  // Czarnego (od Dunaju po Morze Azowskie), bez Krymu.
  'kraina-nizina-czarnomorska': {
    przytnij: 'lad',
    opis: 'Północne wybrzeże Morza Czarnego od Dunaju po Morze Azowskie, bez Krymu.',
    wielokat: [
      [28.2, 45.3], [28.5, 46.6], [29.5, 47.3], [30.5, 47.6], [31.5, 47.8], [33.0, 47.7], [34.5, 47.5],
      [35.5, 47.2], [35.9, 46.6], [35.0, 46.2], [33.4, 46.2], [33.0, 45.9], [30.5, 45.8], [29.7, 45.2], [28.2, 45.3],
    ],
  },
  // RĘCZNIE. Wyżyna Wołyńska: między Bugiem a Horyniem, na północ od Małego Polesia.
  'kraina-wyzyna-wolynska': {
    przytnij: 'lad',
    opis: 'Między Bugiem a Horyniem (okolice Łucka, Włodzimierza, Równego).',
    wielokat: [[23.9, 50.6], [24.0, 51.05], [25.0, 51.0], [26.0, 50.95], [26.9, 50.8], [27.1, 50.4], [26.5, 50.2], [25.5, 50.25], [24.6, 50.35], [24.0, 50.35], [23.9, 50.6]],
  },
  // RĘCZNIE. Wyżyna Bawarska: bawarska część Przedgórza Alpejskiego – między
  // Dunajem a Alpami, od Iller po Inn i Salzach.
  'kraina-wyzyna-bawarska': {
    przytnij: 'lad',
    opis: 'Między Dunajem a Alpami, od Iller po Inn i Salzach.',
    wielokat: [[10.0, 48.4], [11.0, 48.75], [12.1, 49.0], [12.9, 48.8], [13.45, 48.57], [13.04, 48.26], [12.9, 47.9], [13.0, 47.8], [12.1, 47.8], [11.4, 47.75], [10.7, 47.65], [10.0, 47.75], [10.0, 48.4]],
  },
  // RĘCZNIE. Góry Betyckie (Kordyliera Betycka): od Kadyksu i Gibraltaru po
  // przylądek La Nao, na południe od doliny Gwadalkiwiru (z Sierra Nevadą).
  'kraina-gory-betyckie': {
    przytnij: 'lad',
    opis: 'Południowo-wschodnia Hiszpania: od Gibraltaru po przylądek La Nao, na południe od Gwadalkiwiru.',
    wielokat: [[-5.5, 35.9], [-6.3, 36.4], [-5.7, 36.9], [-5.0, 37.1], [-4.3, 37.4], [-3.6, 37.8], [-2.8, 38.0], [-2.0, 38.4], [-1.0, 38.7], [0.3, 38.9], [0.5, 38.5], [-1.0, 37.3], [-2.0, 36.6], [-4.5, 36.4], [-5.5, 35.9]],
  },
};
