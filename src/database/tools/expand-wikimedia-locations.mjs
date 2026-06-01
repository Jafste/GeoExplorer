#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultSeedPath = path.resolve(scriptDirectory, "..", "seed", "locations.json");
const userAgent = "GeoExplorerDatasetBot/1.0 (student project; Wikimedia Commons metadata)";
const verifiedAt = "2026-05-29";

const countries = [
  ["Q142", "França"],
  ["Q183", "Alemanha"],
  ["Q38", "Itália"],
  ["Q29", "Espanha"],
  ["Q45", "Portugal"],
  ["Q145", "Reino Unido"],
  ["Q31", "Bélgica"],
  ["Q55", "Países Baixos"],
  ["Q34", "Suécia"],
  ["Q35", "Dinamarca"],
  ["Q40", "Áustria"],
  ["Q36", "Polónia"],
  ["Q213", "Chéquia"],
  ["Q214", "Eslováquia"],
  ["Q28", "Hungria"],
  ["Q211", "Letónia"],
  ["Q33", "Finlândia"],
  ["Q224", "Croácia"],
  ["Q215", "Eslovénia"],
  ["Q219", "Bulgária"],
  ["Q41", "Grécia"],
  ["Q191", "Estónia"],
  ["Q37", "Lituânia"],
  ["Q27", "Irlanda"],
  ["Q189", "Islândia"],
  ["Q39", "Suíça"],
  ["Q212", "Ucrânia"],
  ["Q218", "Roménia"],
  ["Q403", "Sérvia"],
  ["Q225", "Bósnia e Herzegovina"],
  ["Q236", "Montenegro"],
  ["Q221", "Macedónia do Norte"],
  ["Q222", "Albânia"],
  ["Q1246", "Kosovo"],
  ["Q233", "Malta"],
  ["Q32", "Luxemburgo"],
  ["Q20", "Noruega"],
  ["Q229", "Chipre"],
  ["Q235", "Mónaco"],
  ["Q228", "Andorra"],
  ["Q238", "São Marino"],
  ["Q347", "Liechtenstein"],
  ["Q217", "Moldávia"],
];

const typeToCategory = new Map([
  ["Q23413", "fortress"],
  ["Q16970", "landmark"],
  ["Q4989906", "landmark"],
  ["Q174782", "plaza"],
  ["Q108325", "landmark"],
  ["Q12280", "bridge-view"],
  ["Q24354", "landmark"],
  ["Q839954", "landmark"],
  ["Q570116", "landmark"],
  ["Q8502", "natural-landscape"],
  ["Q35509", "natural-landscape"],
]);

const categoryConfig = {
  "historic-core": {
    sceneImage: "/mock-scenes/historic-core-street.svg",
    gradients: [
      ["#d8b590", "#5e7f92", "#173340"],
      ["#c9a878", "#7c8173", "#202a2f"],
      ["#e0c5a0", "#9a6b4f", "#26323b"],
    ],
    titles: ["Centro antigo de pedra clara", "Núcleo histórico compacto", "Rua antiga de escala humana"],
    labels: ["Malha histórica compacta", "Rua patrimonial contida", "Centro antigo com textura mineral"],
    notes: ["Fachadas próximas, pavimento mineral e escala pedonal.", "Volumes antigos, rua estreita e leitura urbana densa.", "Pedra, reboco claro e sinais de uso turístico."],
    prompts: ["Observa a densidade da malha urbana, a idade das fachadas e a relação entre rua e monumento antes de marcar o mapa.", "Compara materiais, escala da rua e envolvente construída para aproximares a tua estimativa.", "Procura pistas na textura das fachadas, na largura da rua e no tipo de espaço público."],
  },
  riverfront: {
    sceneImage: "/mock-scenes/riverfront-city.svg",
    gradients: [
      ["#f0b36e", "#b84f4f", "#233f58"],
      ["#d5a15f", "#6f8fa3", "#182d3a"],
      ["#bfa17a", "#4f7a8b", "#152a33"],
    ],
    titles: ["Frente de água histórica", "Margem urbana patrimonial", "Eixo ribeirinho antigo"],
    labels: ["Margem construída junto à água", "Frente urbana com horizonte aberto", "Percurso junto a água e edifícios antigos"],
    notes: ["Água próxima, fachadas antigas e espaço de circulação amplo.", "Linha de margem, guarda-corpos e tecido urbano consolidado.", "Abertura visual junto à água com construção histórica por perto."],
    prompts: ["Repara na relação entre a frente urbana e a água, sem depender de nomes visíveis.", "Usa a largura da margem, os materiais e o perfil dos edifícios para orientar o palpite.", "Observa se a paisagem sugere rio, lago ou porto antes de escolher a zona no mapa."],
  },
  "canal-city": {
    sceneImage: "/mock-scenes/canal-city.svg",
    gradients: [
      ["#9ab7c7", "#d6b481", "#263847"],
      ["#7da0ad", "#c8a46f", "#172c37"],
      ["#aec8d2", "#b88e65", "#20333b"],
    ],
    titles: ["Canal urbano histórico", "Rua de água entre fachadas", "Percurso aquático patrimonial"],
    labels: ["Canal estreito com construção antiga", "Água urbana em malha densa", "Fachadas alinhadas junto ao canal"],
    notes: ["Água calma, fachadas próximas e circulação pedonal junto à margem.", "Canal como eixo urbano, com arquitetura compacta.", "Reflexos de água e construção histórica em ambos os lados."],
    prompts: ["Observa a largura do canal, o tipo de fachadas e a forma como a cidade toca na água.", "Procura pistas na relação entre pontes pequenas, margens e edifícios antigos.", "Compara a escala do canal e a densidade da malha urbana antes de marcar."],
  },
  "bridge-view": {
    sceneImage: "/mock-scenes/riverfront-city.svg",
    gradients: [
      ["#c0a075", "#607d8c", "#1f3038"],
      ["#d0b086", "#7d8790", "#19242b"],
      ["#baa06e", "#536d7a", "#172830"],
    ],
    titles: ["Travessia histórica sobre água", "Ponte marcada na paisagem", "Eixo de atravessamento antigo"],
    labels: ["Estrutura sobre água ou vale", "Ponte com leitura patrimonial", "Travessia urbana de forte presença"],
    notes: ["Estrutura linear, abertura de paisagem e margens bem definidas.", "Elemento de travessia com construção antiga ou monumental.", "Linha horizontal forte a ligar dois lados da paisagem."],
    prompts: ["Analisa a forma da ponte, a largura da água ou vale e o tecido urbano à volta.", "Usa o desenho da estrutura e a envolvente para estimar a região.", "Procura pistas na engenharia, nos materiais e na relação com as margens."],
  },
  waterfront: {
    sceneImage: "/mock-scenes/riverfront-city.svg",
    gradients: [
      ["#d6b078", "#6b8fa0", "#17313c"],
      ["#c9aa7d", "#4f7c91", "#132732"],
      ["#e0b86c", "#7c9aaa", "#1d3340"],
    ],
    titles: ["Frente marítima ou lacustre", "Margem aberta de carácter urbano", "Borda de água com leitura patrimonial"],
    labels: ["Água aberta junto à cidade", "Passeio junto a margem ampla", "Frente urbana virada à água"],
    notes: ["Horizonte aberto, construção próxima e espaço pedonal junto à água.", "Margem larga, luz aberta e sinais de cidade costeira ou lacustre.", "Água dominante, edifícios próximos e leitura de passeio público."],
    prompts: ["Observa se a água parece mar, lago ou grande rio e cruza isso com a arquitetura envolvente.", "Compara a luz, a margem e o tipo de construção antes de escolheres o ponto.", "Procura pistas no desenho da frente de água e na escala do espaço público."],
  },
  plaza: {
    sceneImage: "/mock-scenes/southern-plaza.svg",
    gradients: [
      ["#e3c48e", "#9b7553", "#273238"],
      ["#d8b879", "#a66f50", "#1f2b33"],
      ["#efcf93", "#7d6a58", "#24313a"],
    ],
    titles: ["Praça histórica mineral", "Largo urbano de pedra clara", "Espaço público monumental"],
    labels: ["Praça aberta com fachadas antigas", "Largo pedonal e enquadramento histórico", "Espaço mineral com edifícios de referência"],
    notes: ["Pavimento amplo, fachadas de escala cívica e pouca vegetação dominante.", "Largo aberto, volumes históricos e leitura de centro urbano.", "Espaço público amplo com arquitetura patrimonial em redor."],
    prompts: ["Repara no desenho do pavimento, na escala das fachadas e no clima visual do espaço aberto.", "Usa a forma da praça e os materiais para distinguir regiões urbanas europeias.", "Procura pistas na cor da pedra, na largura do espaço e na relação com edifícios públicos."],
  },
  landmark: {
    sceneImage: "/mock-scenes/historic-core-street.svg",
    gradients: [
      ["#d7c09a", "#75808a", "#1f2932"],
      ["#c8b08a", "#5f7380", "#18252e"],
      ["#e2cda2", "#8a7a65", "#24303a"],
    ],
    titles: ["Marco patrimonial de pedra", "Edifício histórico de forte presença", "Monumento urbano de escala cívica"],
    labels: ["Volume patrimonial dominante", "Arquitetura monumental em contexto urbano", "Elemento histórico de referência visual"],
    notes: ["Fachada trabalhada, materiais duráveis e presença forte no espaço público.", "Volume destacado, detalhes ornamentais e envolvente urbana.", "Arquitetura de referência com leitura clara de património."],
    prompts: ["Observa materiais, proporções e envolvente urbana sem depender de texto visível.", "Procura pistas no estilo arquitetónico, na escala e no tipo de espaço público próximo.", "Compara a linguagem do monumento com o clima visual e a densidade urbana à volta."],
  },
  fortress: {
    sceneImage: "/mock-scenes/historic-core-street.svg",
    gradients: [
      ["#b99a70", "#667067", "#18242b"],
      ["#c1a27a", "#7b7668", "#202c32"],
      ["#a98f68", "#596b63", "#16232a"],
    ],
    titles: ["Fortificação de pedra em cota alta", "Recinto defensivo histórico", "Muralha antiga sobre relevo"],
    labels: ["Pedra defensiva e leitura de altura", "Muralhas, torres ou recinto fortificado", "Arquitetura militar antiga em paisagem aberta"],
    notes: ["Muros espessos, posição dominante e construção robusta.", "Pedra marcada, volumes defensivos e leitura de controlo visual.", "Estrutura histórica com presença militar ou defensiva."],
    prompts: ["Analisa a posição no terreno, a robustez da construção e a abertura da paisagem.", "Procura pistas em muralhas, torres e materiais antes de escolher a região.", "Usa a relação entre fortificação e relevo para orientar o palpite."],
  },
  "mountain-town": {
    sceneImage: "/mock-scenes/historic-core-street.svg",
    gradients: [
      ["#d8c69c", "#7f946f", "#20313a"],
      ["#cbb98f", "#6f8a6d", "#182d36"],
      ["#e1c999", "#89966f", "#26343b"],
    ],
    titles: ["Núcleo urbano junto a relevo forte", "Rua antiga em paisagem elevada", "Centro compacto de ambiente serrano"],
    labels: ["Construção histórica com relevo próximo", "Malha compacta e montanha presente", "Rua antiga em contexto elevado"],
    notes: ["Telhados inclinados, rua contida e paisagem elevada por perto.", "Construção densa, luz de vale e presença de encosta.", "Fachadas antigas com relevo a condicionar o espaço."],
    prompts: ["Observa como a construção se adapta ao relevo e que materiais dominam a paisagem.", "Cruza a inclinação do terreno, a forma dos telhados e a densidade urbana.", "Procura pistas no vale, na encosta e na escala das ruas."],
  },
  "natural-landscape": {
    sceneImage: "/mock-scenes/riverfront-city.svg",
    gradients: [
      ["#b6cba0", "#6f8d6b", "#152b2f"],
      ["#c3d4a3", "#809b74", "#1d3333"],
      ["#a9c08e", "#65846b", "#16292f"],
    ],
    titles: ["Paisagem natural de forte contraste", "Cenário natural europeu", "Relevo e água em espaço aberto"],
    labels: ["Elemento natural dominante", "Paisagem aberta com leitura geomorfológica", "Ambiente natural com forte presença visual"],
    notes: ["Vegetação, água ou relevo dominam mais do que a construção.", "Espaço aberto, formas naturais e pouca malha urbana.", "Paisagem ampla com pistas de clima e relevo."],
    prompts: ["Observa o tipo de relevo, vegetação e água para estimar a zona provável.", "Usa a escala da paisagem e a cor dos materiais naturais para orientar o palpite.", "Procura pistas no clima visual, na inclinação e na presença de água."],
  },
};

const aerialImagePatterns = [
  /aerial/i,
  /aire/i,
  /leteck/i,
  /drone/i,
  /satellite/i,
  /from_the_air/i,
  /from_above/i,
  /vu_du_ciel/i,
  /des(de)?_el_aire/i,
  /panorama/i,
];

const options = parseArgs(process.argv.slice(2));
const existingLocations = JSON.parse(await fs.readFile(options.seedPath, "utf8"));
const existingIds = new Set(existingLocations.map((location) => location.id));
const existingImageSources = new Set(
  existingLocations
    .map((location) => location.media?.imageSourceUrl)
    .filter(Boolean),
);
const existingCoordinates = existingLocations.map((location) => ({
  id: location.id,
  latitude: location.latitude,
  longitude: location.longitude,
}));
const stats = {
  candidates: 0,
  noCoordinates: 0,
  outOfBounds: 0,
  tooClose: 0,
  noCommonsMetadata: 0,
  duplicateImageSource: 0,
  blockedPlayableText: 0,
  missingLabels: 0,
  accepted: 0,
};

const additions = [];
const seenItems = new Set();

for (const [countryId, countryName] of countries) {
  if (existingLocations.length + additions.length >= options.targetCount) {
    break;
  }

  const beforeCountry = additions.length;
  const bindings = await fetchWikidataCountryCandidates(countryId, options.perCountryLimit);
  const candidates = bindings
    .map((binding) => normalizeCandidateBinding(binding, countryId, countryName))
    .filter(Boolean)
    .filter((candidate) => {
      if (seenItems.has(candidate.itemId)) {
        return false;
      }

      seenItems.add(candidate.itemId);
      return true;
    });
  stats.candidates += candidates.length;
  const labelMap = await fetchEntityLabels(candidates);
  const commonsMap = await fetchCommonsMediaMap(candidates.map((candidate) => candidate.imageTitle));

  for (const candidate of candidates) {
    if (existingLocations.length + additions.length >= options.targetCount) {
      break;
    }

    if (additions.length - beforeCountry >= options.acceptedPerCountryLimit) {
      break;
    }

    const location = buildLocation(candidate, labelMap, commonsMap, existingIds, existingImageSources, existingCoordinates, additions);
    if (!location) {
      continue;
    }

    additions.push(location);
    stats.accepted += 1;
    existingIds.add(location.id);
    existingImageSources.add(location.media.imageSourceUrl);
    existingCoordinates.push({
      id: location.id,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  }

  console.error(`${countryName}: +${additions.length - beforeCountry} locais, total ${existingLocations.length + additions.length}`);
}

if (!options.dryRun) {
  await fs.writeFile(
    options.seedPath,
    `${JSON.stringify([...existingLocations, ...additions], null, 2)}\n`,
  );
}

console.log(JSON.stringify({
  seedPath: options.seedPath,
  originalCount: existingLocations.length,
  addedCount: additions.length,
  finalCount: existingLocations.length + additions.length,
  dryRun: options.dryRun,
  stats,
}, null, 2));

function parseArgs(args) {
  const parsed = {
    seedPath: defaultSeedPath,
    targetCount: 1000,
    perCountryLimit: 260,
    acceptedPerCountryLimit: 40,
    minimumDistanceMeters: 75,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }

    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`A opção ${arg} precisa de um valor.`);
    }

    index += 1;

    switch (arg) {
      case "--seed":
        parsed.seedPath = path.resolve(value);
        break;
      case "--target-count":
        parsed.targetCount = parsePositiveInteger(arg, value);
        break;
      case "--per-country-limit":
        parsed.perCountryLimit = parsePositiveInteger(arg, value);
        break;
      case "--accepted-per-country-limit":
        parsed.acceptedPerCountryLimit = parsePositiveInteger(arg, value);
        break;
      case "--minimum-distance-meters":
        parsed.minimumDistanceMeters = parsePositiveNumber(arg, value);
        break;
      default:
        throw new Error(`Opção desconhecida: ${arg}`);
    }
  }

  return parsed;
}

function parsePositiveInteger(name, value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`);
  }

  return parsed;
}

function parsePositiveNumber(name, value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um número positivo.`);
  }

  return parsed;
}

async function collectCandidateBindings({ perCountryLimit }) {
  const candidates = [];
  const seenItems = new Set();

  for (const [countryId, countryName] of countries) {
    const bindings = await fetchWikidataCountryCandidates(countryId, perCountryLimit);

    for (const binding of bindings) {
      const itemId = getEntityId(binding.item?.value);
      const imageTitle = getCommonsFileTitle(binding.image?.value);

      if (!itemId || !imageTitle || seenItems.has(itemId) || hasAerialImageName(imageTitle)) {
        continue;
      }

      seenItems.add(itemId);
      candidates.push({
        itemId,
        countryId,
        countryName,
        adminId: getEntityId(binding.admin?.value),
        typeId: getEntityId(binding.type?.value),
        imageTitle,
        coordinates: parseWktPoint(binding.coord?.value),
      });
    }
  }

  return candidates;
}

function normalizeCandidateBinding(binding, countryId, countryName) {
  const itemId = getEntityId(binding.item?.value);
  const imageTitle = getCommonsFileTitle(binding.image?.value);

  if (!itemId || !imageTitle || hasAerialImageName(imageTitle)) {
    return null;
  }

  return {
    itemId,
    countryId,
    countryName,
    adminId: getEntityId(binding.admin?.value),
    typeId: getEntityId(binding.type?.value),
    imageTitle,
    coordinates: parseWktPoint(binding.coord?.value),
  };
}

async function fetchWikidataCountryCandidates(countryId, limit) {
  const typeValues = [...typeToCategory.keys()].map((typeId) => `wd:${typeId}`).join(" ");
  const query = `SELECT ?item ?coord ?image ?admin ?type WHERE {
  VALUES ?type { ${typeValues} }
  ?item wdt:P17 wd:${countryId};
        wdt:P625 ?coord;
        wdt:P18 ?image;
        wdt:P31/wdt:P279* ?type.
  OPTIONAL { ?item wdt:P131 ?admin. }
}
LIMIT ${limit}`;
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
  let lastStatus = "timeout";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": userAgent,
        Accept: "application/sparql-results+json",
      },
    }, 15000 + attempt * 5000);

    if (response?.ok) {
      const data = await response.json();
      return data.results?.bindings ?? [];
    }

    lastStatus = response ? `${response.status} ${response.statusText}` : "timeout";
    await delay(750 * attempt);
  }

  console.warn(`Wikidata ${countryId}: ${lastStatus}`);
  return [];
}

async function fetchEntityLabels(candidates) {
  const ids = [
    ...new Set(
      candidates.flatMap((candidate) => [candidate.itemId, candidate.adminId]).filter(Boolean),
    ),
  ];
  const labels = new Map();

  for (const chunk of chunkArray(ids, 50)) {
    const url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.set("action", "wbgetentities");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    url.searchParams.set("props", "labels");
    url.searchParams.set("languages", "pt|en");
    url.searchParams.set("ids", chunk.join("|"));

    const data = await fetchJsonWithRetries(url, {
      headers: {
        "User-Agent": userAgent,
      },
    }, 15000);

    if (!data) {
      continue;
    }

    for (const [id, entity] of Object.entries(data.entities ?? {})) {
      labels.set(id, entity.labels?.pt?.value ?? entity.labels?.en?.value ?? id);
    }
  }

  return labels;
}

function buildLocation(candidate, labelMap, commonsMap, existingIds, existingImageSources, existingCoordinates, additions) {
  if (!candidate.coordinates) {
    stats.noCoordinates += 1;
    return null;
  }

  const { latitude, longitude } = candidate.coordinates;
  if (latitude < 34 || latitude > 72 || longitude < -25 || longitude > 45) {
    stats.outOfBounds += 1;
    return null;
  }

  if (isTooClose({ latitude, longitude }, existingCoordinates, options.minimumDistanceMeters)) {
    stats.tooClose += 1;
    return null;
  }

  const commons = commonsMap.get(candidate.imageTitle);
  if (!commons) {
    stats.noCommonsMetadata += 1;
    return null;
  }

  if (existingImageSources.has(commons.imageSourceUrl)) {
    stats.duplicateImageSource += 1;
    return null;
  }

  const itemLabel = labelMap.get(candidate.itemId) ?? candidate.itemId;
  const city = cleanLabel(labelMap.get(candidate.adminId) ?? itemLabel);
  if (/^Q\d+$/i.test(itemLabel) || /^Q\d+$/i.test(city)) {
    stats.missingLabels += 1;
    return null;
  }

  const category = typeToCategory.get(candidate.typeId) ?? inferCategory(itemLabel);
  const id = createUniqueId(slugify(`${city}-${itemLabel}`), existingIds);
  const templateIndex = additions.length;
  const text = buildPlayableText(category, latitude, longitude, templateIndex);

  if (containsBlockedTerm(text, [city, candidate.countryName])) {
    stats.blockedPlayableText += 1;
    return null;
  }

  return {
    id,
    title: text.title,
    city,
    country: candidate.countryName,
    region: "europe",
    category,
    latitude: roundCoordinate(latitude),
    longitude: roundCoordinate(longitude),
    sceneLabel: text.sceneLabel,
    sceneNote: text.sceneNote,
    sceneImage: text.sceneImage,
    prompt: text.prompt,
    visualGradient: text.visualGradient,
    media: commons,
    clues: text.clues,
  };
}

async function fetchCommonsMediaMap(imageTitles) {
  const uniqueTitles = [...new Set(imageTitles)].filter(Boolean);
  const media = new Map();

  for (const chunk of chunkArray(uniqueTitles, 50)) {
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url|extmetadata|user");
    url.searchParams.set("iiurlwidth", "1920");
    url.searchParams.set("titles", chunk.join("|"));

    const data = await fetchJsonWithRetries(url, {
      headers: {
        "User-Agent": userAgent,
      },
    }, 25000);

    if (!data) {
      continue;
    }

    for (const page of Object.values(data.query?.pages ?? {})) {
      const parsed = parseCommonsPage(page);
      if (parsed) {
        media.set(page.title, parsed);
      }
    }
  }

  return media;
}

async function fetchCommonsMedia(imageTitle) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|extmetadata|user");
  url.searchParams.set("iiurlwidth", "1920");
  url.searchParams.set("titles", imageTitle);

  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": userAgent,
    },
  }, 12000);

  if (!response?.ok) {
    return null;
  }

  const data = await response.json();
  const page = Object.values(data.query?.pages ?? {})[0];
  return parseCommonsPage(page);
}

function parseCommonsPage(page) {
  const info = page?.imageinfo?.[0];
  const metadata = info?.extmetadata;
  const license = cleanHtml(metadata?.LicenseShortName?.value);
  const licenseUrl = normalizeLicenseUrl(license, metadata?.LicenseUrl?.value);
  const attribution =
    cleanHtml(metadata?.Artist?.value) ||
    cleanHtml(metadata?.Credit?.value) ||
    cleanHtml(info?.user) ||
    "Contribuidor Wikimedia Commons";

  if (!info || !license || !licenseUrl?.startsWith("http") || !attribution) {
    return null;
  }

  const sourceUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title).replace(/%3A/g, ":").replace(/%20/g, "_")}`;
  if (hasAerialImageName(sourceUrl)) {
    return null;
  }

  return {
    sourceProvider: "Wikimedia Commons",
    imageUrl: info.thumburl ?? info.url,
    imageSourceUrl: sourceUrl,
    imageAttribution: attribution,
    imageLicense: license,
    imageLicenseUrl: licenseUrl,
    verifiedAt,
  };
}

function normalizeLicenseUrl(license, licenseUrl) {
  if (licenseUrl?.startsWith("http")) {
    return licenseUrl;
  }

  if (license.toLocaleLowerCase("pt-PT").includes("public domain")) {
    return "https://commons.wikimedia.org/wiki/Commons:Public_domain";
  }

  return licenseUrl;
}

function buildPlayableText(category, latitude, longitude, index) {
  const config = categoryConfig[category] ?? categoryConfig.landmark;
  const variant = Math.abs(index) % config.titles.length;
  const terrain = getTerrainHint(latitude, longitude);
  const urban = getUrbanHint(latitude, longitude);
  const signal = getSignalHint(category);

  return {
    title: config.titles[variant],
    sceneLabel: config.labels[variant],
    sceneNote: config.notes[variant],
    sceneImage: config.sceneImage,
    prompt: config.prompts[variant],
    visualGradient: config.gradients[variant],
    clues: [
      {
        label: "Ambiente",
        value: urban,
        confidence: "Média",
      },
      {
        label: "Leitura visual",
        value: signal,
        confidence: "Alta",
      },
      {
        label: "Terreno",
        value: terrain,
        confidence: "Média",
      },
    ],
  };
}

function getTerrainHint(latitude, longitude) {
  if (latitude >= 60) {
    return "Luz fria e paisagem de norte europeu";
  }

  if (latitude <= 42 && longitude >= -10) {
    return "Luz quente e materiais secos";
  }

  if (longitude <= -6) {
    return "Influência atlântica provável";
  }

  if (longitude >= 18) {
    return "Contexto oriental ou balcânico provável";
  }

  return "Relevo e clima de transição europeia";
}

function getUrbanHint(latitude, longitude) {
  if (latitude >= 58) {
    return "Escala contida e luz setentrional";
  }

  if (longitude >= 15) {
    return "Mistura de património urbano e espaço aberto";
  }

  if (latitude <= 43) {
    return "Texturas claras e espaço exterior muito presente";
  }

  return "Tecido histórico europeu consolidado";
}

function getSignalHint(category) {
  switch (category) {
    case "fortress":
      return "Muros espessos e posição defensiva";
    case "plaza":
      return "Pavimento amplo e fachadas de enquadramento";
    case "bridge-view":
      return "Estrutura linear e atravessamento claro";
    case "natural-landscape":
      return "Paisagem dominante e pouca malha urbana";
    case "waterfront":
    case "riverfront":
    case "canal-city":
      return "Água como eixo principal da leitura";
    default:
      return "Arquitetura patrimonial de forte presença";
  }
}

function inferCategory(label) {
  const normalized = label.toLocaleLowerCase("pt-PT");
  if (/bridge|ponte/.test(normalized)) {
    return "bridge-view";
  }

  if (/castle|fort|citadel|fortress|castelo|fortaleza|muralha/.test(normalized)) {
    return "fortress";
  }

  if (/square|praça|plaza/.test(normalized)) {
    return "plaza";
  }

  if (/waterfall|mountain|cave|lago|lake|cascata|montanha/.test(normalized)) {
    return "natural-landscape";
  }

  return "landmark";
}

function getEntityId(value) {
  const match = value?.match(/\/entity\/(Q\d+)$/);
  return match?.[1] ?? null;
}

function getCommonsFileTitle(value) {
  if (!value) {
    return null;
  }

  const rawTitle = decodeURIComponent(value.substring(value.lastIndexOf("/") + 1));
  return rawTitle.startsWith("File:") ? rawTitle : `File:${rawTitle}`;
}

function parseWktPoint(value) {
  const match = value?.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
  if (!match) {
    return null;
  }

  return {
    longitude: Number(match[1]),
    latitude: Number(match[2]),
  };
}

function cleanLabel(value) {
  return cleanHtml(value)
    .replace(/^commune of /i, "")
    .replace(/^municipality of /i, "")
    .trim();
}

function cleanHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function containsBlockedTerm(text, terms) {
  const playableText = [
    text.title,
    text.sceneLabel,
    text.sceneNote,
    text.prompt,
    ...text.clues.flatMap((clue) => [clue.label, clue.value]),
  ].join(" ").toLocaleLowerCase("pt-PT");

  return terms
    .filter((term) => typeof term === "string" && term.length >= 4)
    .some((term) => playableText.includes(term.toLocaleLowerCase("pt-PT")));
}

function hasAerialImageName(value) {
  return aerialImagePatterns.some((pattern) => pattern.test(value));
}

function createUniqueId(baseSlug, existingIds) {
  let candidate = baseSlug || "local-europeu";
  let suffix = 2;

  while (existingIds.has(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function isTooClose(candidate, coordinates, minimumDistanceMeters) {
  return coordinates.some(
    (existing) => distanceMeters(candidate, existing) < minimumDistanceMeters,
  );
}

function distanceMeters(first, second) {
  const earthRadiusMeters = 6_371_000;
  const dLat = toRadians(second.latitude - first.latitude);
  const dLon = toRadians(second.longitude - first.longitude);
  const lat1 = toRadians(first.latitude);
  const lat2 = toRadians(second.latitude);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function roundCoordinate(value) {
  return Math.round(value * 1000000) / 1000000;
}

function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJsonWithRetries(url, options, timeoutMs, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetchWithTimeout(url, options, timeoutMs + attempt * 2500);

    if (response?.ok) {
      return response.json();
    }

    await delay(500 * attempt);
  }

  return null;
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
