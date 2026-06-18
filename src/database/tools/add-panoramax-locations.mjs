#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultSeedPath = path.resolve(scriptDirectory, "..", "seed", "locations.json");
const defaultQualityReportPath = path.resolve(scriptDirectory, "..", "..", "..", "docs", "scope", "image-quality-audit.json");
const defaultBlocklistPath = path.resolve(scriptDirectory, "..", "..", "..", "docs", "scope", "image-quality-blocklist.json");
const panoramaxApiBaseUrl = "https://api.panoramax.xyz/api";
const userAgent = "GeoExplorerDatasetBot/1.0 (student project; Panoramax 360 dataset)";
const verifiedAt = "2026-06-10";

const defaultOptions = {
  seedPath: defaultSeedPath,
  qualityReportPath: defaultQualityReportPath,
  blocklistPath: defaultBlocklistPath,
  target: 2_000,
  targetActive: true,
  targetProvided: false,
  fillCountryCount: null,
  minDistanceMeters: 120,
  cellLimit: 100,
  maxPerArea: 80,
  areas: null,
  countries: null,
  excludeAreas: new Set(),
  includeNon360: false,
  write: false,
};

const searchAreas = [
  area("Paris", "França", 2.2, 48.78, 2.48, 48.94),
  area("Lyon", "França", 4.72, 45.68, 4.95, 45.84),
  area("Marseille", "França", 5.25, 43.2, 5.55, 43.38),
  area("Toulouse", "França", 1.34, 43.52, 1.54, 43.68),
  area("Bordeaux", "França", -0.7, 44.78, -0.45, 44.92),
  area("Nantes", "França", -1.68, 47.16, -1.45, 47.28),
  area("Strasbourg", "França", 7.65, 48.52, 7.85, 48.64),
  area("Lille", "França", 2.95, 50.58, 3.16, 50.7),
  area("Rennes", "França", -1.78, 48.06, -1.58, 48.16),
  area("Grenoble", "França", 5.65, 45.12, 5.82, 45.25),
  area("Nice", "França", 7.18, 43.64, 7.35, 43.76),
  area("Caen", "França", -0.45, 49.14, -0.3, 49.22),
  area("Reims", "França", 3.95, 49.2, 4.12, 49.32),
  area("Rouen", "França", 1.02, 49.38, 1.16, 49.48),
  area("Le Havre", "França", 0.02, 49.44, 0.22, 49.55),
  area("Dijon", "França", 4.95, 47.26, 5.1, 47.36),
  area("Nancy", "França", 6.1, 48.64, 6.25, 48.74),
  area("Metz", "França", 6.08, 49.06, 6.25, 49.16),
  area("Tours", "França", 0.62, 47.34, 0.78, 47.44),
  area("Orléans", "França", 1.82, 47.86, 2.02, 47.96),
  area("Angers", "França", -0.65, 47.42, -0.48, 47.52),
  area("Brest", "França", -4.58, 48.34, -4.38, 48.44),
  area("Avignon", "França", 4.75, 43.9, 4.9, 44),
  area("Montpellier", "França", 3.78, 43.55, 4, 43.68),
  area("Amsterdam", "Países Baixos", 4.75, 52.3, 5.05, 52.44),
  area("Roterdão", "Países Baixos", 4.35, 51.84, 4.6, 52),
  area("Utrecht", "Países Baixos", 5.02, 52.02, 5.2, 52.14),
  area("Leiden", "Países Baixos", 4.42, 52.1, 4.56, 52.2),
  area("Eindhoven", "Países Baixos", 5.35, 51.38, 5.58, 51.52),
  area("Maastricht", "Países Baixos", 5.62, 50.8, 5.78, 50.9),
  area("Haarlem", "Países Baixos", 4.55, 52.34, 4.72, 52.43),
  area("Breda", "Países Baixos", 4.7, 51.54, 4.9, 51.66),
  area("Den Bosch", "Países Baixos", 5.22, 51.64, 5.38, 51.75),
  area("Arnhem", "Países Baixos", 5.82, 51.94, 6.02, 52.05),
  area("Zwolle", "Países Baixos", 6, 52.46, 6.18, 52.56),
  area("Amersfoort", "Países Baixos", 5.3, 52.1, 5.45, 52.2),
  area("Almere", "Países Baixos", 5.12, 52.32, 5.32, 52.43),
  area("Dublin", "Irlanda", -6.38, 53.26, -6.08, 53.43),
  area("Cork", "Irlanda", -8.58, 51.84, -8.38, 51.95),
  area("Galway", "Irlanda", -9.16, 53.22, -8.94, 53.33),
  area("Limerick", "Irlanda", -8.72, 52.6, -8.55, 52.72),
  area("Waterford", "Irlanda", -7.18, 52.22, -7.04, 52.3),
  area("Kilkenny", "Irlanda", -7.3, 52.62, -7.18, 52.7),
  area("Bruxelas", "Bélgica", 4.25, 50.78, 4.48, 50.92),
  area("Antuérpia", "Bélgica", 4.3, 51.15, 4.5, 51.28),
  area("Gante", "Bélgica", 3.6, 51, 3.85, 51.12),
  area("Bruges", "Bélgica", 3.12, 51.16, 3.32, 51.26),
  area("Leuven", "Bélgica", 4.62, 50.82, 4.78, 50.94),
  area("Mechelen", "Bélgica", 4.42, 51, 4.56, 51.08),
  area("Namur", "Bélgica", 4.78, 50.42, 4.95, 50.52),
  area("Liège", "Bélgica", 5.48, 50.58, 5.68, 50.7),
  area("Mons", "Bélgica", 3.88, 50.4, 4.02, 50.5),
  area("Lisboa", "Portugal", -9.25, 38.68, -9.1, 38.78),
  area("Porto", "Portugal", -8.7, 41.1, -8.55, 41.2),
  area("Berlim", "Alemanha", 13.25, 52.45, 13.55, 52.6),
  area("Munique", "Alemanha", 11.45, 48.06, 11.7, 48.2),
  area("Frankfurt", "Alemanha", 8.55, 50.04, 8.78, 50.18),
  area("Estugarda", "Alemanha", 9.08, 48.72, 9.25, 48.84),
  area("Zagreb", "Croácia", 15.85, 45.75, 16.1, 45.88),
  area("Cardiff", "Reino Unido", -3.25, 51.43, -3.1, 51.55),
  area("Londres", "Reino Unido", -0.25, 51.45, 0.05, 51.58),
];

const titleParts = {
  subjects: [
    "Panorama de rua urbana",
    "Vista 360 de malha compacta",
    "Eixo urbano observado ao nível da rua",
    "Cena de bairro europeu",
    "Rua com leitura arquitetónica",
    "Percurso urbano de escala pedonal",
    "Vista envolvente de espaço público",
    "Corredor viário em tecido urbano",
    "Cruzamento urbano de contexto denso",
    "Panorama de zona consolidada",
  ],
  qualifiers: [
    "com fachadas próximas",
    "com circulação local",
    "com pistas de pavimento",
    "com volumes baixos e médios",
    "com vegetação pontual",
    "com leitura de mobilidade",
    "com horizonte urbano curto",
    "com sinais de bairro",
    "com marcas de uso público",
    "com contexto pedonal",
  ],
};

const sceneLabels = [
  "Panorama de rua com leitura lateral",
  "Vista 360 em espaço urbano",
  "Cena envolvente ao nível do solo",
  "Imagem imersiva de bairro europeu",
  "Rua aberta a exploração visual",
  "Panorama navegável de tecido urbano",
  "Espaço público com pistas envolventes",
  "Trecho urbano com contexto completo",
];

const sceneNotes = [
  "A imagem permite ler fachadas, pavimento, vegetação e orientação da rua.",
  "Explora a vista lateral para comparar materiais, largura da via e densidade construída.",
  "O contexto útil está distribuído pela rua, por isso a rotação pode revelar pistas discretas.",
  "Observa o perfil viário, a relação com edifícios e a presença de elementos públicos.",
  "A envolvente ajuda a separar clima, desenho urbano e escala arquitetónica.",
  "Usa a leitura 360 para perceber continuidade de fachadas, árvores e mobiliário urbano.",
  "A pista principal está na combinação de via, passeio, construção e luz.",
  "A cena favorece análise de terreno urbano em vez de reconhecimento direto de monumento.",
];

const prompts = [
  "Roda a vista, compara a largura da rua, os materiais e a densidade urbana antes de marcares o mapa.",
  "Explora os lados da imagem para encontrar pistas de arquitetura, vegetação e desenho viário.",
  "Aproxima se precisares de ler textura, mas evita depender de sinais com nomes visíveis.",
  "Procura pistas no pavimento, no tipo de via, na altura dos edifícios e na luz.",
  "Usa a vista 360 para confirmar se estás perante centro denso, bairro residencial ou eixo de passagem.",
  "Analisa fachadas, passeios, sinalização genérica e relevo local antes do palpite.",
  "Compara o perfil da rua com outras zonas europeias e marca uma estimativa aproximada.",
  "Observa continuidade urbana, orientação da via e elementos de mobilidade para afinar a localização.",
];

const cluePools = [
  [
    ["Campo visual", "Vista 360 com pistas em várias direções", "Alta"],
    ["Escala urbana", "Rua de leitura pedonal e viária", "Média"],
    ["Terreno", "Contexto urbano consolidado", "Média"],
  ],
  [
    ["Imagem", "Panorama navegável de rua", "Alta"],
    ["Materiais", "Fachadas, pavimento e mobiliário público", "Média"],
    ["Ambiente", "Zona europeia com uso quotidiano", "Média"],
  ],
  [
    ["Orientação", "A rotação lateral pode revelar pistas adicionais", "Alta"],
    ["Mobilidade", "Via, passeio e acessos ajudam a ler o local", "Média"],
    ["Contexto", "Bairro ou centro urbano sem pista textual direta", "Média"],
  ],
  [
    ["Leitura", "A pista está mais no conjunto do que num único objeto", "Alta"],
    ["Arquitetura", "Volumes e materiais sugerem região urbana", "Média"],
    ["Espaço público", "Elementos laterais ajudam a comparar cidades", "Média"],
  ],
];

const gradients = [
  ["#b9c9ce", "#6f827b", "#1d2c33"],
  ["#c8b68c", "#73858d", "#1c2b32"],
  ["#d0c09a", "#647a82", "#22313a"],
  ["#b7c49a", "#6b8672", "#1d3030"],
  ["#c3b48f", "#7f7d72", "#202d35"],
  ["#c6ced0", "#728189", "#1a2932"],
  ["#d5bb86", "#758371", "#213039"],
  ["#b8c8b2", "#687f86", "#182a32"],
];

function area(city, country, minLongitude, minLatitude, maxLongitude, maxLatitude) {
  return { city, country, minLongitude, minLatitude, maxLongitude, maxLatitude };
}

function printHelp() {
  console.log(`Uso:
  node src/database/tools/add-panoramax-locations.mjs [opções]

Opções:
  --seed <caminho>          Caminho para locations.json.
  --target <número>         Número de novos locais Panoramax 360 a acrescentar. Por omissão: 2000.
  --fill-country-count <n>  Preenche cada país incluído até este total.
  --quality-report <path>   Relatório de qualidade a usar como blacklist. Por omissão: docs/scope/image-quality-audit.json.
  --no-quality-report       Não usa relatório de qualidade como blacklist.
  --blocklist <path>        Blacklist persistente de imagens rejeitadas. Por omissão: docs/scope/image-quality-blocklist.json.
  --no-blocklist            Não usa blacklist persistente.
  --min-distance-meters <n> Distância mínima entre novos pontos e pontos existentes. Por omissão: 120.
  --cell-limit <n>          Limite de resultados por célula Panoramax. Por omissão: 100.
  --max-per-area <n>        Limite de novos locais por área/cidade. Por omissão: 80.
  --areas <lista>           Áreas "Cidade|País|minLon|minLat|maxLon|maxLat" separadas por ponto e vírgula.
  --countries <lista>       Países a incluir, separados por vírgula.
  --exclude-areas <lista>   Cidades/áreas a ignorar, separadas por vírgula. Ex.: Breda,Frankfurt.
  --include-non360          Aceita fotos Panoramax planas quando não há panorama 360.
  --write                   Escreve no seed. Sem esta opção faz dry-run.
  --help                    Mostra esta ajuda.`);
}

function parseArgs(args) {
  const options = { ...defaultOptions };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help") {
      return { ...options, help: true };
    }

    if (arg === "--write") {
      options.write = true;
      continue;
    }

    if (arg === "--include-non360") {
      options.includeNon360 = true;
      continue;
    }

    if (arg === "--no-quality-report") {
      options.qualityReportPath = null;
      continue;
    }

    if (arg === "--no-blocklist") {
      options.blocklistPath = null;
      continue;
    }

    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`A opção ${arg} precisa de valor.`);
    }

    index += 1;

    switch (arg) {
      case "--seed":
        options.seedPath = path.resolve(value);
        break;
      case "--quality-report":
        options.qualityReportPath = path.resolve(value);
        break;
      case "--blocklist":
        options.blocklistPath = path.resolve(value);
        break;
      case "--target":
        options.target = parsePositiveInteger(arg, value);
        options.targetProvided = true;
        break;
      case "--fill-country-count":
        options.fillCountryCount = parsePositiveInteger(arg, value);
        break;
      case "--min-distance-meters":
        options.minDistanceMeters = parsePositiveNumber(arg, value);
        break;
      case "--cell-limit":
        options.cellLimit = parsePositiveInteger(arg, value);
        break;
      case "--max-per-area":
        options.maxPerArea = parsePositiveInteger(arg, value);
        break;
      case "--areas":
        options.areas = parseAreas(value);
        break;
      case "--countries":
        options.countries = new Set(value.split(",").map(normalizeAreaName).filter(Boolean));
        break;
      case "--exclude-areas":
        options.excludeAreas = new Set(value.split(",").map((entry) => normalizeAreaName(entry)).filter(Boolean));
        break;
      default:
        throw new Error(`Opção desconhecida: ${arg}`);
    }
  }

  if (options.fillCountryCount && !options.targetProvided) {
    options.targetActive = false;
  }

  return options;
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

function buildAreaCells(searchArea) {
  const cells = [];
  const longitudeSteps = 4;
  const latitudeSteps = 3;

  for (let longitudeIndex = 0; longitudeIndex < longitudeSteps; longitudeIndex += 1) {
    for (let latitudeIndex = 0; latitudeIndex < latitudeSteps; latitudeIndex += 1) {
      const minLongitude =
        searchArea.minLongitude +
        ((searchArea.maxLongitude - searchArea.minLongitude) * longitudeIndex) / longitudeSteps;
      const maxLongitude =
        searchArea.minLongitude +
        ((searchArea.maxLongitude - searchArea.minLongitude) * (longitudeIndex + 1)) / longitudeSteps;
      const minLatitude =
        searchArea.minLatitude +
        ((searchArea.maxLatitude - searchArea.minLatitude) * latitudeIndex) / latitudeSteps;
      const maxLatitude =
        searchArea.minLatitude +
        ((searchArea.maxLatitude - searchArea.minLatitude) * (latitudeIndex + 1)) / latitudeSteps;

      cells.push({ minLongitude, minLatitude, maxLongitude, maxLatitude });
    }
  }

  return cells;
}

async function fetchPanoramaxCell(cell, limit) {
  const url = new URL(`${panoramaxApiBaseUrl}/search`);
  url.searchParams.set(
    "bbox",
    [
      cell.minLongitude,
      cell.minLatitude,
      cell.maxLongitude,
      cell.maxLatitude,
    ].join(","),
  );
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    headers: {
      "accept": "application/json",
      "user-agent": userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`Panoramax respondeu ${response.status} para ${url}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.features) ? payload.features : [];
}

function isPanoramax360Feature(feature) {
  const exif = feature.properties?.exif ?? {};
  const projection = Object.entries(exif)
    .filter(([key]) => /GPano\.ProjectionType/i.test(key))
    .map(([, value]) => String(value).toLowerCase())
    .join(" ");

  if (projection.includes("equirectangular") || projection.includes("spherical")) {
    return true;
  }

  const dimensions = feature.properties?.["pers:interior_orientation"]?.sensor_array_dimensions;
  if (Array.isArray(dimensions) && dimensions.length >= 2 && Number(dimensions[1]) > 0) {
    const ratio = Number(dimensions[0]) / Number(dimensions[1]);
    if (Math.abs(ratio - 2) <= 0.08) {
      return true;
    }
  }

  const exifText = JSON.stringify(exif).toLowerCase();
  return exifText.includes("equirectangular") || exifText.includes("spherical");
}

function createLocationFromFeature(feature, searchArea, ordinal, is360) {
  const coordinates = feature.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (latitude < 34 || latitude > 72 || longitude < -25 || longitude > 45) {
    return null;
  }

  const imageUrl = feature.assets?.sd?.href ?? feature.assets?.hd?.href;
  const sourceUrl = feature.links?.find((link) => link.rel === "self")?.href;
  const imageAttribution =
    feature.providers?.find((provider) => provider.roles?.includes("producer"))?.name ??
    feature.providers?.[0]?.name ??
    feature.properties?.["geovisio:producer"] ??
    "Contribuidor Panoramax";

  if (!imageUrl || !sourceUrl || !feature.id) {
    return null;
  }

  const seed = stableHash(feature.id);
  const media = {
    sourceProvider: "Panoramax",
    imageUrl,
    imageSourceUrl: sourceUrl,
    imageAttribution,
    imageLicense: "CC BY-SA 4.0",
    imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    streetViewProvider: "Panoramax",
    streetViewUrl: `https://api.panoramax.xyz/#focus=pic&pic=${feature.id}`,
    verifiedAt,
  };

  return {
    id: buildLocationId(searchArea.city, feature.id),
    title: is360 ? buildTitle(seed) : "Imagem de rua urbana com contexto local",
    city: searchArea.city,
    country: searchArea.country,
    region: "Europe",
    category: is360 ? "street-level-panorama" : "street-level-photo",
    latitude: roundCoordinate(latitude),
    longitude: roundCoordinate(longitude),
    sceneLabel: is360 ? pick(sceneLabels, seed + ordinal) : "Foto de rua com pistas laterais",
    sceneNote: is360 ? pick(sceneNotes, seed + ordinal * 3) : "A imagem permite ler via, fachadas, vegetação e contexto próximo.",
    sceneImage: "/mock-scenes/historic-core-street.svg",
    prompt: is360 ? pick(prompts, seed + ordinal * 5) : "Observa materiais, perfil da rua, vegetação e escala urbana antes de marcares o mapa.",
    visualGradient: pick(gradients, seed + ordinal * 7),
    media,
    visualSources: [media],
    clues: pick(cluePools, seed + ordinal * 11).map(([label, value, confidence]) => ({
      label,
      value,
      confidence,
    })),
  };
}

function buildTitle(seed) {
  return `${pick(titleParts.subjects, seed)} ${pick(titleParts.qualifiers, Math.floor(seed / 7))}`;
}

function pick(items, seed) {
  return items[Math.abs(seed) % items.length];
}

function buildLocationId(city, featureId) {
  return `panoramax-360-${slugify(city)}-${featureId.slice(0, 8)}`;
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function stableHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

function roundCoordinate(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
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

function isFarEnough(candidate, existingLocations, minimumDistanceMeters) {
  return existingLocations.every((location) => distanceMeters(candidate, location) >= minimumDistanceMeters);
}

function normalizeAreaName(value) {
  return slugify(value.trim());
}

function parseAreas(value) {
  return value.split(";").map((entry) => {
    const [city, country, minLongitude, minLatitude, maxLongitude, maxLatitude] = entry.split("|");
    if (!city || !country) {
      throw new Error(`Área inválida: ${entry}`);
    }

    return area(
      city,
      country,
      parseFiniteNumber("minLongitude", minLongitude),
      parseFiniteNumber("minLatitude", minLatitude),
      parseFiniteNumber("maxLongitude", maxLongitude),
      parseFiniteNumber("maxLatitude", maxLatitude),
    );
  });
}

function parseFiniteNumber(name, value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} deve ser um número.`);
  }

  return parsed;
}

function isExcludedArea(searchArea, excludedAreas) {
  return excludedAreas.has(normalizeAreaName(searchArea.city)) ||
    excludedAreas.has(normalizeAreaName(`${searchArea.city}, ${searchArea.country}`));
}

function isIncludedCountry(searchArea, countries) {
  return !countries || countries.has(normalizeAreaName(searchArea.country));
}

function countBy(items, getKey) {
  const counts = new Map();

  for (const item of items) {
    const key = getKey(item) ?? "(vazio)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Object.fromEntries([...counts.entries()].sort((left, right) => right[1] - left[1]));
}

function countCountries(locations) {
  const counts = new Map();

  for (const location of locations) {
    counts.set(location.country, (counts.get(location.country) ?? 0) + 1);
  }

  return counts;
}

async function collectPanoramaxLocations(existingLocations, options) {
  const existingIds = new Set(existingLocations.map((location) => location.id));
  const existingImageSources = new Set(
    existingLocations
      .map((location) => location.media?.imageSourceUrl)
      .filter(Boolean),
  );
  const blockedIds = options.qualityBlocklist?.ids ?? new Set();
  const blockedImageUrls = options.qualityBlocklist?.imageUrls ?? new Set();
  const blockedImageSourceUrls = options.qualityBlocklist?.imageSourceUrls ?? new Set();
  const selected = [];
  const countryCounts = countCountries(existingLocations);
  const acceptedLocations = existingLocations.map((location) => ({
    latitude: location.latitude,
    longitude: location.longitude,
  }));
  const rejected = {
    duplicate: 0,
    not360: 0,
    invalid: 0,
    tooClose: 0,
    qualityBlocklist: 0,
    areaLimit: 0,
  };
  const perArea = new Map();

  const configuredAreas = options.areas ?? searchAreas;
  const areaStates = configuredAreas
    .filter((searchArea) => isIncludedCountry(searchArea, options.countries))
    .filter((searchArea) => !hasReachedCountryTarget(countryCounts, searchArea.country, options.fillCountryCount))
    .filter((searchArea) => !isExcludedArea(searchArea, options.excludeAreas))
    .map((searchArea) => {
    const areaKey = `${searchArea.city}, ${searchArea.country}`;
    const state = {
      searchArea,
      areaKey,
      cells: buildAreaCells(searchArea),
      cellIndex: 0,
    };
    perArea.set(areaKey, { queried: 0, accepted: 0, candidates360: 0 });
    return state;
  });

  while (!hasReachedTarget(selected, options)) {
    let progressed = false;

    for (const state of areaStates) {
      if (hasReachedTarget(selected, options)) {
        break;
      }

      if (hasReachedCountryTarget(countryCounts, state.searchArea.country, options.fillCountryCount)) {
        continue;
      }

      const areaStats = perArea.get(state.areaKey);
      if (areaStats.accepted >= options.maxPerArea) {
        continue;
      }

      const cell = state.cells[state.cellIndex];
      if (!cell) {
        continue;
      }

      progressed = true;
      state.cellIndex += 1;
      const features = await fetchPanoramaxCell(cell, options.cellLimit);
      areaStats.queried += features.length;

      for (const feature of features) {
        if (
          hasReachedTarget(selected, options) ||
          areaStats.accepted >= options.maxPerArea ||
          hasReachedCountryTarget(countryCounts, state.searchArea.country, options.fillCountryCount)
        ) {
          break;
        }

        const is360 = isPanoramax360Feature(feature);
        if (!is360 && !options.includeNon360) {
          rejected.not360 += 1;
          continue;
        }

        if (is360) {
          areaStats.candidates360 += 1;
        }

        const location = createLocationFromFeature(feature, state.searchArea, selected.length + 1, is360);
        if (!location) {
          rejected.invalid += 1;
          continue;
        }

        if (existingIds.has(location.id) || existingImageSources.has(location.media.imageSourceUrl)) {
          rejected.duplicate += 1;
          continue;
        }

        if (
          blockedIds.has(location.id) ||
          blockedImageUrls.has(location.media.imageUrl) ||
          blockedImageSourceUrls.has(location.media.imageSourceUrl)
        ) {
          rejected.qualityBlocklist += 1;
          continue;
        }

        if (!isFarEnough(location, acceptedLocations, options.minDistanceMeters)) {
          rejected.tooClose += 1;
          continue;
        }

        existingIds.add(location.id);
        existingImageSources.add(location.media.imageSourceUrl);
        selected.push(location);
        countryCounts.set(location.country, (countryCounts.get(location.country) ?? 0) + 1);
        acceptedLocations.push({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        areaStats.accepted += 1;
      }
    }

    if (!progressed) {
      rejected.areaLimit = areaStates.filter(
        (state) => perArea.get(state.areaKey).accepted >= options.maxPerArea,
      ).length;
      break;
    }
  }

  return {
    selected,
    rejected,
    remainingByCountry: options.fillCountryCount
      ? Object.fromEntries(
          [...countryCounts.entries()]
            .filter(([, count]) => count < options.fillCountryCount)
            .sort((left, right) => left[0].localeCompare(right[0])),
        )
      : null,
    perArea: Object.fromEntries(perArea.entries()),
  };
}

function hasReachedTarget(selected, options) {
  return options.targetActive && selected.length >= options.target;
}

function hasReachedCountryTarget(countryCounts, country, target) {
  return target && (countryCounts.get(country) ?? 0) >= target;
}

async function loadQualityBlocklist(reportPaths) {
  const blocklist = {
    ids: new Set(),
    imageUrls: new Set(),
    imageSourceUrls: new Set(),
  };

  for (const reportPath of reportPaths.filter(Boolean)) {
    let payload;
    try {
      payload = JSON.parse(await fs.readFile(reportPath, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") {
        continue;
      }

      throw error;
    }

    const entries = [
      ...(payload.removals ?? []),
      ...(payload.errors ?? []),
      ...(payload.entries ?? []),
    ];

    for (const entry of entries) {
      if (entry.locationId) {
        blocklist.ids.add(entry.locationId);
      }

      if (entry.imageUrl) {
        blocklist.imageUrls.add(entry.imageUrl);
      }

      if (entry.imageSourceUrl) {
        blocklist.imageSourceUrls.add(entry.imageSourceUrl);
      }
    }
  }

  return blocklist;
}

function countBlocklistItems(blocklist) {
  return {
    ids: blocklist.ids.size,
    imageUrls: blocklist.imageUrls.size,
    imageSourceUrls: blocklist.imageSourceUrls.size,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const existingLocations = JSON.parse(await fs.readFile(options.seedPath, "utf8"));
  options.qualityBlocklist = await loadQualityBlocklist([options.qualityReportPath, options.blocklistPath]);
  const { selected, rejected, remainingByCountry, perArea } = await collectPanoramaxLocations(existingLocations, options);
  const nextLocations = [...existingLocations, ...selected];
  const report = {
    generatedAt: new Date().toISOString(),
    seedPath: options.seedPath,
    qualityReportPath: options.qualityReportPath,
    blocklistPath: options.blocklistPath,
    qualityBlocklist: countBlocklistItems(options.qualityBlocklist),
    dryRun: !options.write,
    requested: options.target,
    added: selected.length,
    totalLocations: nextLocations.length,
    selectedByCountry: countBy(selected, (location) => location.country),
    selectedByCity: countBy(selected, (location) => location.city),
    remainingByCountry,
    rejected,
    perArea,
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

  if (options.targetActive && selected.length < options.target) {
    throw new Error(`Só foram encontrados ${selected.length} locais Panoramax 360 válidos para ${options.target} pedidos.`);
  }

  if (options.write) {
    await fs.writeFile(options.seedPath, `${JSON.stringify(nextLocations, null, 2)}\n`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
