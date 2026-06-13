import type { SeedLocation } from "../types/game";

export const mockLocations = [
  {
    "id": "innsbruck-old-town",
    "title": "Centro histórico alpino",
    "city": "Innsbruck",
    "country": "Áustria",
    "region": "europe",
    "category": "historic-core",
    "latitude": 47.2692,
    "longitude": 11.4041,
    "sceneLabel": "Rua alpina compacta",
    "sceneNote": "Fachadas claras, relevo montanhoso e luz fria de vale.",
    "prompt": "Observa a mistura de centro histórico compacto, telhados inclinados e pano de fundo montanhoso antes de escolheres o teu palpite.",
    "visualGradient": [
      "#d8b590",
      "#5e7f92",
      "#173340"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/B%C3%BCrgerstra%C3%9Fe_26%2B24_%28BT0A2830%29.jpg/1920px-B%C3%BCrgerstra%C3%9Fe_26%2B24_%28BT0A2830%29.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:B%C3%BCrgerstra%C3%9Fe_26%2B24_(BT0A2830).jpg",
      "imageAttribution": "Simon Legner (User:simon04)",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-27"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/6f/0b/55/76/760f-4296-8e65-a34d251d20f4/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/2dfb7a20-3543-4bd8-9ccc-94c9cb97f33e/items/6f0b5576-760f-4296-8e65-a34d251d20f4",
        "imageAttribution": "p4n-pics",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=6f0b5576-760f-4296-8e65-a34d251d20f4",
        "verifiedAt": "2026-05-13"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/3890531174509925",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=3890531174509925",
        "imageAttribution": "innsbruck-barrierefrei",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=3890531174509925",
        "verifiedAt": "2026-05-18"
      }
    ],
    "clues": [
      {
        "label": "Arquitetura",
        "value": "Fachadas compactas e telhados inclinados",
        "confidence": "Alta"
      },
      {
        "label": "Relevo",
        "value": "Vale alpino com montanha muito presente",
        "confidence": "Alta"
      },
      {
        "label": "Sinalética",
        "value": "Ambiente germânico mas sem texto dominante",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "porto-ribeira",
    "title": "Ribeira histórica",
    "city": "Porto",
    "country": "Portugal",
    "region": "europe",
    "category": "riverfront",
    "latitude": 41.1402,
    "longitude": -8.611,
    "sceneLabel": "Frente ribeirinha colorida",
    "sceneNote": "Declive urbano, azulejo discreto e margem de rio larga.",
    "prompt": "Repara na topografia em socalco, na linguagem das fachadas e na relação da cidade com o rio.",
    "visualGradient": [
      "#f0b36e",
      "#b84f4f",
      "#233f58"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Porto_July_2014-34a.jpg/1920px-Porto_July_2014-34a.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Porto_July_2014-34a.jpg",
      "imageAttribution": "Alvesgaspar",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-27"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/02/26/93/4b/70ad-4d0b-bbab-91e1df6bc9a9/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/0d43a85a-707d-4d80-bd9c-4b5a9c9d2e20/items/0226934b-70ad-4d0b-bbab-91e1df6bc9a9",
        "imageAttribution": "Robot8A",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=0226934b-70ad-4d0b-bbab-91e1df6bc9a9",
        "verifiedAt": "2026-05-13"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/796759401228032",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=796759401228032",
        "imageAttribution": "cartixa",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=796759401228032",
        "verifiedAt": "2026-05-20"
      }
    ],
    "clues": [
      {
        "label": "Topografia",
        "value": "Cidade com forte declive sobre rio",
        "confidence": "Alta"
      },
      {
        "label": "Fachadas",
        "value": "Paleta quente e densa junto à frente de água",
        "confidence": "Média"
      },
      {
        "label": "Contexto",
        "value": "Ambiente atlântico do sul da Europa",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "bruges-canal",
    "title": "Canal medieval",
    "city": "Bruges",
    "country": "Bélgica",
    "region": "europe",
    "category": "canal-city",
    "latitude": 51.2093,
    "longitude": 3.2247,
    "sceneLabel": "Canal e alvenaria gótica",
    "sceneNote": "Água calma, tijolo escuro e malha urbana muito ordenada.",
    "prompt": "A combinação entre canal, tijolo e escala medieval ajuda a limitar bastante a área geográfica.",
    "visualGradient": [
      "#af7e5b",
      "#3f5966",
      "#10202b"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Br%C3%BCgge_Blick_vom_Belfried_4.jpg/1920px-Br%C3%BCgge_Blick_vom_Belfried_4.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Br%C3%BCgge_Blick_vom_Belfried_4.jpg",
      "imageAttribution": "Zairon",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-27"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.mapcomplete.org/derivatives/28/5f/3c/bf/6474-4328-95c0-da7ccd2b2756/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/f3d02893-b4c1-4cd6-8b27-e27ab57eb59a/items/285f3cbf-6474-4328-95c0-da7ccd2b2756",
        "imageAttribution": "mapcomplete, Pieter Vander Vennet",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=285f3cbf-6474-4328-95c0-da7ccd2b2756",
        "verifiedAt": "2026-05-13"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/408080481765640",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=408080481765640",
        "imageAttribution": "teddy73",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=408080481765640",
        "verifiedAt": "2026-05-18"
      }
    ],
    "clues": [
      {
        "label": "Material",
        "value": "Tijolo dominante e coberturas escuras",
        "confidence": "Alta"
      },
      {
        "label": "Hidrografia",
        "value": "Canal urbano estreito e controlado",
        "confidence": "Alta"
      },
      {
        "label": "Escala",
        "value": "Centro antigo muito preservado",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "tallinn-old-town",
    "title": "Cidade medieval báltica",
    "city": "Tallinn",
    "country": "Estónia",
    "region": "europe",
    "category": "historic-core",
    "latitude": 59.437,
    "longitude": 24.7536,
    "sceneLabel": "Pedra fria e torres estreitas",
    "sceneNote": "Paredes espessas, luz baixa e atmosfera báltica.",
    "prompt": "O frio visual, a densidade muralhada e o desenho das coberturas apontam para o norte da Europa.",
    "visualGradient": [
      "#c9c0b0",
      "#647b88",
      "#14222b"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Old_Town_of_Tallinn%2C_Tallinn%2C_Estonia_-_panoramio_%2858%29.jpg/1920px-Old_Town_of_Tallinn%2C_Tallinn%2C_Estonia_-_panoramio_%2858%29.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Old_Town_of_Tallinn,_Tallinn,_Estonia_-_panoramio_(58).jpg",
      "imageAttribution": "Ben Bender",
      "imageLicense": "CC BY-SA 3.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "verifiedAt": "2026-04-27"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.mapcomplete.org/derivates/19/ba/5f/16/1f0c-497e-be82-7ff0f92986e4/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/6e702976-580b-419c-8fb3-cf7bd364e6f8/items/19ba5f16-1f0c-497e-be82-7ff0f92986e4",
        "imageAttribution": "mapcomplete, 5R-MFT",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=19ba5f16-1f0c-497e-be82-7ff0f92986e4",
        "verifiedAt": "2026-05-13"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/1003920220967225",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=1003920220967225",
        "imageAttribution": "jorrarro",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=1003920220967225",
        "verifiedAt": "2026-05-18"
      }
    ],
    "clues": [
      {
        "label": "Clima visual",
        "value": "Luz fria e atmosfera austera",
        "confidence": "Alta"
      },
      {
        "label": "Defesa urbana",
        "value": "Vestígios de muralha e torres",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Norte ou Báltico mais plausível do que centro-sul",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "prague-bridge-view",
    "title": "Vista monumental fluvial",
    "city": "Praga",
    "country": "Chéquia",
    "region": "europe",
    "category": "bridge-view",
    "latitude": 50.0865,
    "longitude": 14.4114,
    "sceneLabel": "Rio largo e torres monumentais",
    "sceneNote": "Eixos visuais fortes, pedra clara e horizonte monumental.",
    "prompt": "Aqui interessa separar uma capital centro-europeia monumental de um centro histórico alpino ou báltico.",
    "visualGradient": [
      "#d8c3a1",
      "#7a5d56",
      "#1d3445"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Prague_07-2016_view_from_Lesser_Town_Tower_of_Charles_Bridge_img3.jpg/1920px-Prague_07-2016_view_from_Lesser_Town_Tower_of_Charles_Bridge_img3.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Prague_07-2016_view_from_Lesser_Town_Tower_of_Charles_Bridge_img3.jpg",
      "imageAttribution": "A.Savin",
      "imageLicense": "FAL",
      "imageLicenseUrl": "http://artlibre.org/licence/lal/en",
      "verifiedAt": "2026-04-27"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/7c/4c/89/00/2362-41d9-a8df-aa275fadb982/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/8e1cc8d6-8565-4502-a694-f7e9d26c5677/items/7c4c8900-2362-41d9-a8df-aa275fadb982",
        "imageAttribution": "Pfabing",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=7c4c8900-2362-41d9-a8df-aa275fadb982",
        "verifiedAt": "2026-05-13"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/1020501285796566",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=1020501285796566",
        "imageAttribution": "changchun1",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=1020501285796566",
        "verifiedAt": "2026-05-18"
      }
    ],
    "clues": [
      {
        "label": "Escala",
        "value": "Capital monumental com eixo fluvial forte",
        "confidence": "Alta"
      },
      {
        "label": "Material",
        "value": "Pedra clara e torres marcantes",
        "confidence": "Média"
      },
      {
        "label": "Tipologia",
        "value": "Ponte histórica de forte presença urbana",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "split-waterfront",
    "title": "Marginal mediterrânica",
    "city": "Split",
    "country": "Croácia",
    "region": "europe",
    "category": "waterfront",
    "latitude": 43.5081,
    "longitude": 16.4402,
    "sceneLabel": "Passeio costeiro ensolarado",
    "sceneNote": "Palmeiras discretas, pedra clara e mar muito presente.",
    "prompt": "Tenta distinguir um porto mediterrânico adriático de cenários ibéricos ou italianos.",
    "visualGradient": [
      "#f7c46b",
      "#6db6b5",
      "#15364a"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Split_080620-133710-IMG_0968x.jpg/1920px-Split_080620-133710-IMG_0968x.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Split_080620-133710-IMG_0968x.jpg",
      "imageAttribution": "Tatyana Peshkova",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-27"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/01/eb/ad/5b/56f8-4b86-8b5a-ea18b34c9ab5/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/4618cd2c-c5fe-49a3-bca4-b56a0efc0af4/items/01ebad5b-56f8-4b86-8b5a-ea18b34c9ab5",
        "imageAttribution": "PanierAvide",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=01ebad5b-56f8-4b86-8b5a-ea18b34c9ab5",
        "verifiedAt": "2026-05-13"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/1902472573235704",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=1902472573235704",
        "imageAttribution": "mapfool",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=1902472573235704",
        "verifiedAt": "2026-05-18"
      }
    ],
    "clues": [
      {
        "label": "Clima",
        "value": "Luz quente e costa muito aberta",
        "confidence": "Alta"
      },
      {
        "label": "Material",
        "value": "Pedra clara e frente de água ordenada",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Adriático plausível",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "amsterdam-canals",
    "title": "Canal linear urbano",
    "city": "Amesterdão",
    "country": "Países Baixos",
    "region": "europe",
    "category": "canal-city",
    "latitude": 52.3676,
    "longitude": 4.9041,
    "sceneLabel": "Canal largo com frentes estreitas",
    "sceneNote": "Bicicletas, água domesticada e casas altas e estreitas.",
    "prompt": "Distingue uma cidade de canais do noroeste europeu entre variantes belgas e neerlandesas.",
    "visualGradient": [
      "#d3a57a",
      "#5f7382",
      "#11232e"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png/1920px-Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png",
      "imageAttribution": "Andrés Barrios",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-27"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://nl.panoramax.xyz/derivates/33/d1/b2/ba/0089-4c92-ae24-8bbfd8b2f054/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/2f367ad0-d22c-4a37-be99-8ffc6b54acfa/items/33d1b2ba-0089-4c92-ae24-8bbfd8b2f054",
        "imageAttribution": "Panoramax Test-NL, City of Amsterdam",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=33d1b2ba-0089-4c92-ae24-8bbfd8b2f054",
        "verifiedAt": "2026-05-13"
      }
    ],
    "clues": [
      {
        "label": "Malha urbana",
        "value": "Frentes estreitas e regulares",
        "confidence": "Alta"
      },
      {
        "label": "Mobilidade",
        "value": "Cultura urbana de bicicleta muito evidente",
        "confidence": "Média"
      },
      {
        "label": "Água",
        "value": "Canal largo e altamente integrado",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "budapest-buda-view",
    "title": "Margem monumental danubiana",
    "city": "Budapeste",
    "country": "Hungria",
    "region": "europe",
    "category": "riverfront",
    "latitude": 47.4979,
    "longitude": 19.0402,
    "sceneLabel": "Rio largo e colina urbana",
    "sceneNote": "Rio dominante, relevo suave e arquitetura monumental.",
    "prompt": "Procura distinguir um rio imperial centro-europeu de capitais mais ocidentais.",
    "visualGradient": [
      "#d7b27c",
      "#74849c",
      "#192c3d"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Budav%C3%A1ri_Palota%2C_ABCDEF_%C3%A9p%C3%BClet.jpg/1920px-Budav%C3%A1ri_Palota%2C_ABCDEF_%C3%A9p%C3%BClet.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Budav%C3%A1ri_Palota,_ABCDEF_%C3%A9p%C3%BClet.jpg",
      "imageAttribution": "Varius",
      "imageLicense": "CC BY-SA 3.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "verifiedAt": "2026-04-27"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/c9/62/b8/a2/fa6f-4fe9-ab31-a2f89ef812b0/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/1df1e220-b788-40b5-bdf3-fc6467348822/items/c962b8a2-fa6f-4fe9-ab31-a2f89ef812b0",
        "imageAttribution": "Robot8A, robot8a",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=c962b8a2-fa6f-4fe9-ab31-a2f89ef812b0",
        "verifiedAt": "2026-05-13"
      }
    ],
    "clues": [
      {
        "label": "Escala fluvial",
        "value": "Curso de água muito largo",
        "confidence": "Alta"
      },
      {
        "label": "Relevo",
        "value": "Cidade dividida entre margem plana e colina",
        "confidence": "Média"
      },
      {
        "label": "Estilo",
        "value": "Monumentalidade de capital centro-europeia",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "bern-old-town",
    "title": "Arcadas urbanas",
    "city": "Berna",
    "country": "Suíça",
    "region": "europe",
    "category": "historic-core",
    "latitude": 46.948,
    "longitude": 7.4474,
    "sceneLabel": "Arcadas e pedra neutra",
    "sceneNote": "Centro limpo, pedra regular e ordem urbana muito marcada.",
    "prompt": "A limpeza formal e as arcadas ajudam a separar este desafio de outros centros alpinos.",
    "visualGradient": [
      "#d8c2a7",
      "#728292",
      "#1a3141"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/7/75/Bern_luftaufnahme.png",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Bern_luftaufnahme.png",
      "imageAttribution": "de:Benutzer:Reaast",
      "imageLicense": "Public domain",
      "imageLicenseUrl": "https://commons.wikimedia.org/wiki/Commons:Public_domain",
      "verifiedAt": "2026-04-27"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/9d/13/88/8e/d109-4499-8775-3b9dfc5542a9/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/c744a893-1f0b-4b13-89e5-4cce592c563d/items/9d13888e-d109-4499-8775-3b9dfc5542a9",
        "imageAttribution": "Moosh",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=9d13888e-d109-4499-8775-3b9dfc5542a9",
        "verifiedAt": "2026-05-13"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/299049308337827",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=299049308337827",
        "imageAttribution": "ahzf",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=299049308337827",
        "verifiedAt": "2026-05-20"
      }
    ],
    "clues": [
      {
        "label": "Espaço público",
        "value": "Arcadas corridas e desenho muito regular",
        "confidence": "Alta"
      },
      {
        "label": "Contexto",
        "value": "Centro alpino mais contido e institucional",
        "confidence": "Média"
      },
      {
        "label": "Leitura",
        "value": "Ambiente centro-europeu rico mas discreto",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "lucca-wall",
    "title": "Muralha e telhado toscano",
    "city": "Lucca",
    "country": "Itália",
    "region": "europe",
    "category": "historic-core",
    "latitude": 43.8429,
    "longitude": 10.5027,
    "sceneLabel": "Tijolo quente e perfil baixo",
    "sceneNote": "Telhados de terracota, horizontalidade e muralha evidente.",
    "prompt": "Aqui interessa perceber o sul europeu interior e evitar confusões com ambientes alpinos ou ibéricos.",
    "visualGradient": [
      "#d28b63",
      "#8b6a57",
      "#213245"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Italy_-_Lucca_-_2.jpg/1920px-Italy_-_Lucca_-_2.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Italy_-_Lucca_-_2.jpg",
      "imageAttribution": "Arne Müseler / www.arne-mueseler.com",
      "imageLicense": "CC BY-SA 3.0 de",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/deed.en",
      "verifiedAt": "2026-04-27"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/02/31/db/a4/4d90-49a7-bd54-86ecdd9d1cb2/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/6e537ed7-cecb-4674-a4ee-592024d3ac20/items/0231dba4-4d90-49a7-bd54-86ecdd9d1cb2",
        "imageAttribution": "scai",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=0231dba4-4d90-49a7-bd54-86ecdd9d1cb2",
        "verifiedAt": "2026-05-13"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/1296039754896598",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=1296039754896598",
        "imageAttribution": "ente",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=1296039754896598",
        "verifiedAt": "2026-05-20"
      }
    ],
    "clues": [
      {
        "label": "Coberturas",
        "value": "Terracota dominante",
        "confidence": "Alta"
      },
      {
        "label": "Estrutura",
        "value": "Muralha urbana de leitura clara",
        "confidence": "Média"
      },
      {
        "label": "Latitude cultural",
        "value": "Sul da Europa interior",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "stockholm-gamla-stan",
    "title": "Centro antigo nórdico",
    "city": "Estocolmo",
    "country": "Suécia",
    "region": "europe",
    "category": "historic-core",
    "latitude": 59.3251,
    "longitude": 18.0711,
    "sceneLabel": "Centro antigo nórdico",
    "sceneNote": "Ruas estreitas, fachadas coloridas e luz fria de capital báltica.",
    "prompt": "Observa ruas estreitas, fachadas coloridas e luz fria de capital báltica. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#d7c2a0",
      "#667680",
      "#132531"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Corner_between_S%C3%B6dra_Benickebrinken_and_%C3%96sterl%C3%A5nggatan_in_Gamla_Stan%2C_Stockholm%2C_Sweden%2C_2022_December.jpg/1920px-Corner_between_S%C3%B6dra_Benickebrinken_and_%C3%96sterl%C3%A5nggatan_in_Gamla_Stan%2C_Stockholm%2C_Sweden%2C_2022_December.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Corner_between_S%C3%B6dra_Benickebrinken_and_%C3%96sterl%C3%A5nggatan_in_Gamla_Stan,_Stockholm,_Sweden,_2022_December.jpg",
      "imageAttribution": "Ximonic (Simo Räsänen)",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/51/84/ce/3c/f6b7-4e0f-a8f1-4c70343712ff/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/1d2d2cae-51a0-4e85-8707-ad6718115359/items/5184ce3c-f6b7-4e0f-a8f1-4c70343712ff",
        "imageAttribution": "motocultrice, bernardvoyageur",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=5184ce3c-f6b7-4e0f-a8f1-4c70343712ff",
        "verifiedAt": "2026-05-13"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/1925333927847181",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=1925333927847181",
        "imageAttribution": "graharg",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=1925333927847181",
        "verifiedAt": "2026-06-10"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Centro antigo preservado e malha urbana compacta",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Fachadas históricas, ruas densas e leitura pedonal forte.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "seville-plaza",
    "title": "Praça monumental andaluza",
    "city": "Sevilha",
    "country": "Espanha",
    "region": "europe",
    "category": "plaza",
    "latitude": 37.3891,
    "longitude": -5.9845,
    "sceneLabel": "Praça ibérica monumental",
    "sceneNote": "Cerâmica, arcadas e luz quente num espaço amplo.",
    "prompt": "Observa cerâmica, arcadas e luz quente num espaço amplo. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#e2b16a",
      "#9f6b4f",
      "#203343"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Seville%2C_Plaza_de_Espa%C3%B1a_%2838625005691%29_%28edited%29.jpg/1920px-Seville%2C_Plaza_de_Espa%C3%B1a_%2838625005691%29_%28edited%29.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Seville,_Plaza_de_Espa%C3%B1a_(38625005691)_(edited).jpg",
      "imageAttribution": "Dmitry Dzhus from London",
      "imageLicense": "CC BY 2.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/e1/1f/34/f3/f7d1-4aa8-a710-8836be8cbe38/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/e06f4af3-a9d4-4958-aa78-da97f197d24e/items/e11f34f3-f7d1-4aa8-a710-8836be8cbe38",
        "imageAttribution": "p4n-pics",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=e11f34f3-f7d1-4aa8-a710-8836be8cbe38",
        "verifiedAt": "2026-05-13"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/205871314543320",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=205871314543320",
        "imageAttribution": "filohipo",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=205871314543320",
        "verifiedAt": "2026-05-18"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Praça principal com forte leitura cívica",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Espaço público amplo, fachadas marcantes e luz mais aberta.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "lisbon-alfama",
    "title": "Bairro histórico atlântico",
    "city": "Lisboa",
    "country": "Portugal",
    "region": "europe",
    "category": "historic-core",
    "latitude": 38.7114,
    "longitude": -9.1294,
    "sceneLabel": "Bairro de colina atlântico",
    "sceneNote": "Ruas apertadas, fachadas claras e declive urbano.",
    "prompt": "Observa ruas apertadas, fachadas claras e declive urbano. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#d7c2a0",
      "#667680",
      "#132531"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Alfama%2C_Lisbon_%28DSC03367%29.jpg/1920px-Alfama%2C_Lisbon_%28DSC03367%29.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Alfama,_Lisbon_(DSC03367).jpg",
      "imageAttribution": "Matti Blume",
      "imageLicense": "CC BY-SA",
      "imageLicenseUrl": "https://commons.wikimedia.org/wiki/File:Alfama,_Lisbon_(DSC03367).jpg",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/1014690996893512",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=1014690996893512",
        "imageAttribution": "claudiop",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=1014690996893512",
        "verifiedAt": "2026-05-20"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Centro antigo preservado e malha urbana compacta",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Fachadas históricas, ruas densas e leitura pedonal forte.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "sintra-pena-palace",
    "title": "Palácio romântico na serra",
    "city": "Sintra",
    "country": "Portugal",
    "region": "europe",
    "category": "landmark",
    "latitude": 38.7876,
    "longitude": -9.3906,
    "sceneLabel": "Palácio colorido em relevo",
    "sceneNote": "Arquitetura romântica, serra húmida e cores fortes.",
    "prompt": "Observa arquitetura romântica, serra húmida e cores fortes. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#d5c8aa",
      "#6f7782",
      "#172430"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Pena_Palace%2C_Sintra%2C_Portugal%2C_20250606_1037_0005.jpg/1920px-Pena_Palace%2C_Sintra%2C_Portugal%2C_20250606_1037_0005.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Pena_Palace,_Sintra,_Portugal,_20250606_1037_0005.jpg",
      "imageAttribution": "Jakub Hałun",
      "imageLicense": "CC BY 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/231836612071820",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=231836612071820",
        "imageAttribution": "marcuscalabresus",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=231836612071820",
        "verifiedAt": "2026-05-18"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Marco arquitetónico com forte leitura geográfica",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Monumento dominante e contexto urbano reconhecível.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "barcelona-gothic-quarter",
    "title": "Centro histórico mediterrânico",
    "city": "Barcelona",
    "country": "Espanha",
    "region": "europe",
    "category": "historic-core",
    "latitude": 41.3839,
    "longitude": 2.1763,
    "sceneLabel": "Malha gótica mediterrânica",
    "sceneNote": "Ruas densas, pedra quente e contexto urbano costeiro.",
    "prompt": "Observa ruas densas, pedra quente e contexto urbano costeiro. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#d7c2a0",
      "#667680",
      "#132531"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Monument_a_Colom_-_Barcelona_-_Spain_-_panoramio.jpg/1920px-Monument_a_Colom_-_Barcelona_-_Spain_-_panoramio.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Monument_a_Colom_-_Barcelona_-_Spain_-_panoramio.jpg",
      "imageAttribution": "Ｊun O",
      "imageLicense": "CC BY-SA 3.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.mapcomplete.org/derivates/6d/5d/21/a0/e2d0-44b8-ab77-7937e76f3022/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/6e702976-580b-419c-8fb3-cf7bd364e6f8/items/6d5d21a0-e2d0-44b8-ab77-7937e76f3022",
        "imageAttribution": "mapcomplete, Toni Serra",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=6d5d21a0-e2d0-44b8-ab77-7937e76f3022",
        "verifiedAt": "2026-05-15"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/317847116356934",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=317847116356934",
        "imageAttribution": "marcuscalabresus",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=317847116356934",
        "verifiedAt": "2026-05-20"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Centro antigo preservado e malha urbana compacta",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Fachadas históricas, ruas densas e leitura pedonal forte.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "granada-alhambra",
    "title": "Fortaleza palaciana andaluza",
    "city": "Granada",
    "country": "Espanha",
    "region": "europe",
    "category": "fortress",
    "latitude": 37.1761,
    "longitude": -3.5881,
    "sceneLabel": "Palácio fortificado sobre colina",
    "sceneNote": "Pátios, pedra quente e relevo seco do sul ibérico.",
    "prompt": "Observa pátios, pedra quente e relevo seco do sul ibérico. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#c8b391",
      "#6a7477",
      "#17262d"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Pavillon_Cour_des_Lions_Alhambra_Granada_Spain.jpg/1920px-Pavillon_Cour_des_Lions_Alhambra_Granada_Spain.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Pavillon_Cour_des_Lions_Alhambra_Granada_Spain.jpg",
      "imageAttribution": "Jebulon",
      "imageLicense": "CC0",
      "imageLicenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/ec/49/b1/44/67a5-4e70-9a71-c7c505d726f4/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/270b63e4-7cda-4e1d-b659-14a805d2a8f7/items/ec49b144-67a5-4e70-9a71-c7c505d726f4",
        "imageAttribution": "fgouget",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=ec49b144-67a5-4e70-9a71-c7c505d726f4",
        "verifiedAt": "2026-05-15"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/1300083277052082",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=1300083277052082",
        "imageAttribution": "angoca",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=1300083277052082",
        "verifiedAt": "2026-05-20"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Estrutura defensiva como pista dominante",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Muralhas, pedra e implantação defensiva muito visível.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "salamanca-old-city",
    "title": "Cidade universitária de pedra dourada",
    "city": "Salamanca",
    "country": "Espanha",
    "region": "europe",
    "category": "historic-core",
    "latitude": 40.9649,
    "longitude": -5.663,
    "sceneLabel": "Pedra dourada castelhana",
    "sceneNote": "Fachadas monumentais e praça histórica do interior ibérico.",
    "prompt": "Observa fachadas monumentais e praça histórica do interior ibérico. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#d7c2a0",
      "#667680",
      "#132531"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/c/c6/The_Old_City_of_Salamanca%2C_Spain.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:The_Old_City_of_Salamanca,_Spain.jpg",
      "imageAttribution": "Arieledashow",
      "imageLicense": "CC0",
      "imageLicenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/f6/17/2a/6d/4620-4804-8f2e-de994243f6f4/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/fcf60a38-34ce-4ecb-9f32-e44623139370/items/f6172a6d-4620-4804-8f2e-de994243f6f4",
        "imageAttribution": "p4n-pics",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=f6172a6d-4620-4804-8f2e-de994243f6f4",
        "verifiedAt": "2026-05-15"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/168930841783784",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=168930841783784",
        "imageAttribution": "sanchi",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=168930841783784",
        "verifiedAt": "2026-06-09"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Centro antigo preservado e malha urbana compacta",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Fachadas históricas, ruas densas e leitura pedonal forte.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "paris-montmartre",
    "title": "Escadaria em colina urbana densa",
    "city": "Paris",
    "country": "França",
    "region": "europe",
    "category": "historic-core",
    "latitude": 48.8867,
    "longitude": 2.3431,
    "sceneLabel": "Colina urbana de pedra clara",
    "sceneNote": "Declive, fachadas claras e tecido compacto de capital ocidental.",
    "prompt": "Observa o declive, as escadarias e a densidade urbana antes de marcares a tua estimativa.",
    "visualGradient": [
      "#d7c2a0",
      "#667680",
      "#132531"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/L%27escalier_de_droite_menant_%C3%A0_la_Basilique_de_Montmartre_-_GT_03_-_2024.jpg/1920px-L%27escalier_de_droite_menant_%C3%A0_la_Basilique_de_Montmartre_-_GT_03_-_2024.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:L%27escalier_de_droite_menant_%C3%A0_la_Basilique_de_Montmartre_-_GT_03_-_2024.jpg",
      "imageAttribution": "Terragio67",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/d6/0e/05/33/da25-4aa9-a184-55b96cee8142/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/aed5e9f4-f87f-4925-b9f7-88137e2462b5/items/d60e0533-da25-4aa9-a184-55b96cee8142",
        "imageAttribution": "JLZIMMERMANN",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=d60e0533-da25-4aa9-a184-55b96cee8142",
        "verifiedAt": "2026-05-15"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/184057890207691",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=184057890207691",
        "imageAttribution": "txllxt",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=184057890207691",
        "verifiedAt": "2026-05-18"
      }
    ],
    "clues": [
      {
        "label": "Relevo",
        "value": "Colina marcada dentro de uma malha urbana muito densa",
        "confidence": "Alta"
      },
      {
        "label": "Materiais",
        "value": "Pedra clara, varandas e frentes históricas compactas",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Compara capitais ocidentais com outras cidades de encosta suave",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "lyon-old-town",
    "title": "Centro antigo junto ao rio",
    "city": "Lyon",
    "country": "França",
    "region": "europe",
    "category": "historic-core",
    "latitude": 45.764,
    "longitude": 4.827,
    "sceneLabel": "Bairro renascentista compacto",
    "sceneNote": "Coberturas quentes, ruas estreitas e frente fluvial próxima.",
    "prompt": "Observa coberturas quentes, ruas estreitas e frente fluvial próxima. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#d7c2a0",
      "#667680",
      "#132531"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Vieuxlyon_saintjean_toits.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Vieuxlyon_saintjean_toits.jpg",
      "imageAttribution": "Karldupart",
      "imageLicense": "CC BY-SA 3.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/dc/1d/1f/f1/7511-4a9a-8735-ed553532a242/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/1e14c9a1-1dd0-4af4-835a-d3a92f1a4f5d/items/dc1d1ff1-7511-4a9a-8735-ed553532a242",
        "imageAttribution": "benoitdd",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=dc1d1ff1-7511-4a9a-8735-ed553532a242",
        "verifiedAt": "2026-05-15"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/253331313250074",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=253331313250074",
        "imageAttribution": "quicky",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=253331313250074",
        "verifiedAt": "2026-05-20"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Centro antigo preservado e malha urbana compacta",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Fachadas históricas, ruas densas e leitura pedonal forte.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "strasbourg-petite-france",
    "title": "Canal histórico alsaciano",
    "city": "Estrasburgo",
    "country": "França",
    "region": "europe",
    "category": "canal-city",
    "latitude": 48.5817,
    "longitude": 7.7425,
    "sceneLabel": "Canal e enxaimel alsaciano",
    "sceneNote": "Água calma, madeira aparente e escala centro-europeia.",
    "prompt": "Observa água calma, madeira aparente e escala centro-europeia. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#c99a70",
      "#57717e",
      "#10232f"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Stra%C3%9Fburg_%28Frankreich%29%2C_Petite_France_--_2011_--_1759.jpg/1920px-Stra%C3%9Fburg_%28Frankreich%29%2C_Petite_France_--_2011_--_1759.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Stra%C3%9Fburg_(Frankreich),_Petite_France_--_2011_--_1759.jpg",
      "imageAttribution": "Dietmar Rabich",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Canal integrado no centro urbano",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Água domesticada, frentes estreitas e malha regular.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "colmar-old-town",
    "title": "Centro antigo alsaciano",
    "city": "Colmar",
    "country": "França",
    "region": "europe",
    "category": "historic-core",
    "latitude": 48.0794,
    "longitude": 7.3585,
    "sceneLabel": "Fachadas coloridas alsacianas",
    "sceneNote": "Enxaimel, canais pequenos e paleta muito marcada.",
    "prompt": "Observa enxaimel, canais pequenos e paleta muito marcada. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#d7c2a0",
      "#667680",
      "#132531"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Colmar_Alsace_Old_Town_29_Oct_1993.jpg/1920px-Colmar_Alsace_Old_Town_29_Oct_1993.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Colmar_Alsace_Old_Town_29_Oct_1993.jpg",
      "imageAttribution": "Infrogmation",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/ff/2d/03/98/318c-4222-8cd0-05a78c8bf8bd/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/967f25de-c5f3-4861-8463-b3d4a4009cc7/items/ff2d0398-318c-4222-8cd0-05a78c8bf8bd",
        "imageAttribution": "Moosh",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=ff2d0398-318c-4222-8cd0-05a78c8bf8bd",
        "verifiedAt": "2026-05-15"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Centro antigo preservado e malha urbana compacta",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Fachadas históricas, ruas densas e leitura pedonal forte.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "venice-grand-canal",
    "title": "Canal monumental veneziano",
    "city": "Veneza",
    "country": "Itália",
    "region": "europe",
    "category": "canal-city",
    "latitude": 45.4375,
    "longitude": 12.3358,
    "sceneLabel": "Canal largo e palácios",
    "sceneNote": "Água como rua principal e fachadas históricas densas.",
    "prompt": "Observa água como rua principal e fachadas históricas densas. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#c99a70",
      "#57717e",
      "#10232f"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Panorama_of_Canal_Grande_and_Ponte_di_Rialto%2C_Venice_-_September_2017.jpg/1920px-Panorama_of_Canal_Grande_and_Ponte_di_Rialto%2C_Venice_-_September_2017.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Panorama_of_Canal_Grande_and_Ponte_di_Rialto,_Venice_-_September_2017.jpg",
      "imageAttribution": "Martin Falbisoner",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/15/e9/71/a9/8ea9-4ad2-afb4-b5c917748e39/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/4d541672-d680-4d65-ae83-f7647a96d5fa/items/15e971a9-8ea9-4ad2-afb4-b5c917748e39",
        "imageAttribution": "Moosh",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=15e971a9-8ea9-4ad2-afb4-b5c917748e39",
        "verifiedAt": "2026-05-15"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Canal integrado no centro urbano",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Água domesticada, frentes estreitas e malha regular.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "florence-duomo",
    "title": "Centro renascentista toscano",
    "city": "Florença",
    "country": "Itália",
    "region": "europe",
    "category": "landmark",
    "latitude": 43.7731,
    "longitude": 11.256,
    "sceneLabel": "Cúpula monumental toscana",
    "sceneNote": "Pedra clara, telhados quentes e escala renascentista.",
    "prompt": "Observa pedra clara, telhados quentes e escala renascentista. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#d5c8aa",
      "#6f7782",
      "#172430"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Dome_of_Cattedrale_di_Santa_Maria_del_Fiore_%28Florence%29.jpg/1920px-Dome_of_Cattedrale_di_Santa_Maria_del_Fiore_%28Florence%29.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Dome_of_Cattedrale_di_Santa_Maria_del_Fiore_(Florence).jpg",
      "imageAttribution": "Livioandronico2013",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/1a/30/6d/59/8670-4f33-8a70-77a38814d28c/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/b473b4a1-d518-46f2-82bd-c9de1e801945/items/1a306d59-8670-4f33-8a70-77a38814d28c",
        "imageAttribution": "motocultrice, bernardvoyageur",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=1a306d59-8670-4f33-8a70-77a38814d28c",
        "verifiedAt": "2026-05-15"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/1744865609240602",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=1744865609240602",
        "imageAttribution": "mapconcierge",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=1744865609240602",
        "verifiedAt": "2026-05-20"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Marco arquitetónico com forte leitura geográfica",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Monumento dominante e contexto urbano reconhecível.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "rome-colosseum",
    "title": "Anfiteatro antigo em tecido urbano",
    "city": "Roma",
    "country": "Itália",
    "region": "europe",
    "category": "landmark",
    "latitude": 41.8902,
    "longitude": 12.4922,
    "sceneLabel": "Ruína oval de pedra quente",
    "sceneNote": "Monumento clássico isolado por avenidas e pedra de tom mediterrânico.",
    "prompt": "Observa a ruína oval, a pedra antiga e a escala urbana envolvente antes de fechares o palpite.",
    "visualGradient": [
      "#d5c8aa",
      "#6f7782",
      "#172430"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Colosseum_in_Rome-April_2007-1-_copie_2B.jpg/1920px-Colosseum_in_Rome-April_2007-1-_copie_2B.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Colosseum_in_Rome-April_2007-1-_copie_2B.jpg",
      "imageAttribution": "Diliff",
      "imageLicense": "CC BY-SA 2.5",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/2.5",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/2e/c8/02/89/186a-4cbd-b7ec-3642347b236a/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/8c80e6bb-52a3-4a6a-ac1a-f370bd7907ac/items/2ec80289-186a-4cbd-b7ec-3642347b236a",
        "imageAttribution": "motocultrice, binnette",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=2ec80289-186a-4cbd-b7ec-3642347b236a",
        "verifiedAt": "2026-05-15"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/1015918842276242",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=1015918842276242",
        "imageAttribution": "blaszlo",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=1015918842276242",
        "verifiedAt": "2026-05-20"
      }
    ],
    "clues": [
      {
        "label": "Antiguidade",
        "value": "Grande anfiteatro preservado no meio da cidade",
        "confidence": "Alta"
      },
      {
        "label": "Clima visual",
        "value": "Pedra quente e luz mediterrânica ajudam a limitar a zona",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Compara capitais históricas do sul com centros clássicos menores",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "naples-waterfront",
    "title": "Marginal vulcânica mediterrânica",
    "city": "Nápoles",
    "country": "Itália",
    "region": "europe",
    "category": "waterfront",
    "latitude": 40.832,
    "longitude": 14.247,
    "sceneLabel": "Frente costeira mediterrânica",
    "sceneNote": "Baía aberta, cidade densa e relevo ao fundo.",
    "prompt": "Observa baía aberta, cidade densa e relevo ao fundo. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#d8c08a",
      "#5f8fa5",
      "#153447"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Il_Posilippo_and_waterfront%2C_Naples%2C_Italy_LOC_4711351703.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Il_Posilippo_and_waterfront,_Naples,_Italy_LOC_4711351703.jpg",
      "imageAttribution": "The Library of Congress from Washington, DC, United States",
      "imageLicense": "No restrictions",
      "imageLicenseUrl": "https://www.flickr.com/commons/usage/",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/c5/02/e9/56/7cab-4ff7-8a38-ce76b71ff289/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/98e7fd90-7d45-4859-ad76-368cc86f28d1/items/c502e956-7cab-4ff7-8a38-ce76b71ff289",
        "imageAttribution": "motocultrice, binnette",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=c502e956-7cab-4ff7-8a38-ce76b71ff289",
        "verifiedAt": "2026-05-15"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/841502630052967",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=841502630052967",
        "imageAttribution": "richlv",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=841502630052967",
        "verifiedAt": "2026-05-20"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Frente de água como pista principal",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Água próxima, horizonte aberto e relação direta com a cidade.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "dubrovnik-old-town",
    "title": "Cidade muralhada adriática",
    "city": "Dubrovnik",
    "country": "Croácia",
    "region": "europe",
    "category": "fortress",
    "latitude": 42.641,
    "longitude": 18.109,
    "sceneLabel": "Muralhas junto ao Adriático",
    "sceneNote": "Pedra clara, mar próximo e fortificação compacta.",
    "prompt": "Observa pedra clara, mar próximo e fortificação compacta. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#c8b391",
      "#6a7477",
      "#17262d"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Dubrovnik_Old_Town_1.jpg/1920px-Dubrovnik_Old_Town_1.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Dubrovnik_Old_Town_1.jpg",
      "imageAttribution": "kallerna",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/1c/64/b4/79/e497-4b23-af62-314e25aa9f59/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/1bfc1384-67ec-47b2-bc9e-798cff6af9e9/items/1c64b479-e497-4b23-af62-314e25aa9f59",
        "imageAttribution": "Robot8A",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=1c64b479-e497-4b23-af62-314e25aa9f59",
        "verifiedAt": "2026-05-15"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Estrutura defensiva como pista dominante",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Muralhas, pedra e implantação defensiva muito visível.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "kotor-bay",
    "title": "Baía montanhosa balcânica",
    "city": "Kotor",
    "country": "Montenegro",
    "region": "europe",
    "category": "waterfront",
    "latitude": 42.4247,
    "longitude": 18.7712,
    "sceneLabel": "Baía estreita entre montanhas",
    "sceneNote": "Água calma, pedra clara e relevo muito fechado.",
    "prompt": "Observa água calma, pedra clara e relevo muito fechado. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#d8c08a",
      "#5f8fa5",
      "#153447"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/20090719_Crkva_Gospa_od_Zdravlja_Kotor_Bay_Montenegro.jpg/1920px-20090719_Crkva_Gospa_od_Zdravlja_Kotor_Bay_Montenegro.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:20090719_Crkva_Gospa_od_Zdravlja_Kotor_Bay_Montenegro.jpg",
      "imageAttribution": "User:Ggia",
      "imageLicense": "CC BY-SA 3.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/30/0d/55/7f/c285-4369-93ec-4e2460811722/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/15242702-e1fe-493b-8281-7d02d28d537e/items/300d557f-c285-4369-93ec-4e2460811722",
        "imageAttribution": "Robot8A",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=300d557f-c285-4369-93ec-4e2460811722",
        "verifiedAt": "2026-05-15"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/303609657899153",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=303609657899153",
        "imageAttribution": "egorka",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=303609657899153",
        "verifiedAt": "2026-05-20"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Frente de água como pista principal",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Água próxima, horizonte aberto e relação direta com a cidade.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "ljubljana-old-town",
    "title": "Centro antigo esloveno",
    "city": "Liubliana",
    "country": "Eslovénia",
    "region": "europe",
    "category": "historic-core",
    "latitude": 46.0569,
    "longitude": 14.5058,
    "sceneLabel": "Centro compacto com castelo",
    "sceneNote": "Rio pequeno, fachadas centro-europeias e colina próxima.",
    "prompt": "Observa rio pequeno, fachadas centro-europeias e colina próxima. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#d7c2a0",
      "#667680",
      "#132531"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Ljubljana_old_town_with_castle_2025.jpg/1920px-Ljubljana_old_town_with_castle_2025.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Ljubljana_old_town_with_castle_2025.jpg",
      "imageAttribution": "Furkan Akkurt",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.mapcomplete.org/derivatives/51/a5/87/34/dcd5-45f0-8c57-9887aea5fad0/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/14ea2dff-2d5f-4134-9a9c-0b7ff34d87aa/items/51a58734-dcd5-45f0-8c57-9887aea5fad0",
        "imageAttribution": "mapcomplete, Terence Eden",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=51a58734-dcd5-45f0-8c57-9887aea5fad0",
        "verifiedAt": "2026-05-15"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/1598897913632019",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=1598897913632019",
        "imageAttribution": "mappatman",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=1598897913632019",
        "verifiedAt": "2026-05-20"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Centro antigo preservado e malha urbana compacta",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Fachadas históricas, ruas densas e leitura pedonal forte.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "sarajevo-bascarsija",
    "title": "Bazar histórico balcânico",
    "city": "Sarajevo",
    "country": "Bósnia e Herzegovina",
    "region": "europe",
    "category": "historic-core",
    "latitude": 43.859,
    "longitude": 18.431,
    "sceneLabel": "Bazar otomano urbano",
    "sceneNote": "Madeira, ruas baixas e vale montanhoso balcânico.",
    "prompt": "Observa madeira, ruas baixas e vale montanhoso balcânico. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#d7c2a0",
      "#667680",
      "#132531"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/c/c0/Sarajevo_-_view_from_Ba%C5%A1%C4%8Dar%C5%A1ija.JPG",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Sarajevo_-_view_from_Ba%C5%A1%C4%8Dar%C5%A1ija.JPG",
      "imageAttribution": "Pudelek (Marcin Szala)",
      "imageLicense": "CC BY-SA 3.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/5f/77/52/4a/9073-4356-8091-687562d6c4c2/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/f6284fba-fc1b-48c2-9254-c59f97f11c53/items/5f77524a-9073-4356-8091-687562d6c4c2",
        "imageAttribution": "Robot8A",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=5f77524a-9073-4356-8091-687562d6c4c2",
        "verifiedAt": "2026-05-15"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Centro antigo preservado e malha urbana compacta",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Fachadas históricas, ruas densas e leitura pedonal forte.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  },
  {
    "id": "mostar-bridge",
    "title": "Ponte histórica balcânica",
    "city": "Mostar",
    "country": "Bósnia e Herzegovina",
    "region": "europe",
    "category": "bridge-view",
    "latitude": 43.3373,
    "longitude": 17.815,
    "sceneLabel": "Ponte de pedra sobre rio estreito",
    "sceneNote": "Arco alto, água verde e encostas urbanas próximas.",
    "prompt": "Observa arco alto, água verde e encostas urbanas próximas. Usa estas pistas para marcar uma estimativa no mapa real da Europa.",
    "visualGradient": [
      "#d8c3a1",
      "#7a5d56",
      "#1d3445"
    ],
    "media": {
      "sourceProvider": "Wikimedia Commons",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Mostar_Old_Town_Panorama_2007.jpg/1920px-Mostar_Old_Town_Panorama_2007.jpg",
      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Mostar_Old_Town_Panorama_2007.jpg",
      "imageAttribution": "Ramirez",
      "imageLicense": "CC BY-SA 4.0",
      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "verifiedAt": "2026-04-29"
    },
    "visualSources": [
      {
        "sourceProvider": "Panoramax",
        "imageUrl": "https://panoramax.openstreetmap.fr/derivates/54/48/52/cd/701e-4325-bfc2-9823d40f0b3b/sd.jpg",
        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/e52b6af8-e2ad-4e0d-864b-3fd71609807c/items/544852cd-701e-4325-bfc2-9823d40f0b3b",
        "imageAttribution": "Robot8A",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Panoramax",
        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=544852cd-701e-4325-bfc2-9823d40f0b3b",
        "verifiedAt": "2026-05-15"
      },
      {
        "sourceProvider": "Mapillary",
        "imageUrl": "/api/media/mapillary/1716117159215719",
        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=1716117159215719",
        "imageAttribution": "igorzo",
        "imageLicense": "CC BY-SA 4.0",
        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "streetViewProvider": "Mapillary",
        "streetViewUrl": "https://www.mapillary.com/app/?pKey=1716117159215719",
        "verifiedAt": "2026-05-20"
      }
    ],
    "clues": [
      {
        "label": "Pista principal",
        "value": "Ponte histórica com grande valor de orientação",
        "confidence": "Alta"
      },
      {
        "label": "Contexto visual",
        "value": "Travessia marcante, rio e perfil urbano reconhecível.",
        "confidence": "Média"
      },
      {
        "label": "Região",
        "value": "Europa; compara clima, materiais e escala urbana antes de fechar o palpite.",
        "confidence": "Média"
      }
    ]
  }
] as SeedLocation[];
