#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultSeedPath = path.resolve(scriptDirectory, "..", "seed", "locations.json");

const defaultOptions = {
  seedPath: defaultSeedPath,
  nearbyMeters: 75,
  repeatThreshold: 10,
  titleRepeatThreshold: 4,
  failOnErrors: false,
};

const reviewedAerialImages = [
  ["venice-grand-canal", "https://commons.wikimedia.org/wiki/File:Panorama_of_Canal_Grande_and_Ponte_di_Rialto,_Venice_-_September_2017.jpg"],
  ["mostar-bridge", "https://commons.wikimedia.org/wiki/File:Mostar_Old_Town_Panorama_2007.jpg"],
  ["cesky-krumlov-old-town", "https://commons.wikimedia.org/wiki/File:%C4%8Cesk%C3%BD_Krumlov_(Krummau)_-_panorama_-_old_city.JPG"],
  ["piran-tartini-square", "https://commons.wikimedia.org/wiki/File:Tartini_Square_from_above%2C_Piran%2C_May_2009.jpg"],
  ["gullfoss-waterfall", "https://commons.wikimedia.org/wiki/File:Gullfoss_from_the_Air_(cropped).jpg"],
  ["bath-royal-crescent", "https://commons.wikimedia.org/wiki/File:Royal.crescent.aerial.bath.arp.jpg"],
  ["cordoba-mosque-cathedral", "https://commons.wikimedia.org/wiki/File:Mezquita_de_Córdoba_desde_el_aire_(Córdoba,_España).jpg"],
  ["stirling-castle", "https://commons.wikimedia.org/wiki/File:Stirling_Castle_Aerial_Photo.jpg"],
  ["mont-saint-michel", "https://commons.wikimedia.org/wiki/File:Mont-Saint-Michel_vu_du_ciel.jpg"],
  ["carcassonne-carcassonne", "https://commons.wikimedia.org/wiki/File:1_carcassonne_aerial_2016.jpg"],
  ["chambord-chateau-de-chambord", "https://commons.wikimedia.org/wiki/File:Aerial_image_of_Ch%C3%A2teau_de_Chambord_(view_from_the_southeast).jpg"],
  ["schwerin-schwerin-castle", "https://commons.wikimedia.org/wiki/File:Aerial_image_of_Schwerin_Castle_(view_from_the_east).jpg"],
].map(([id, imageSourceUrl]) => ({ id, imageSourceUrl }));

function printHelp() {
  console.log(`Uso:
  node src/database/tools/audit-location-dataset.mjs [opções]

Opções:
  --seed <caminho>            Caminho para locations.json. Por omissão usa src/database/seed/locations.json.
  --nearby-meters <número>    Distância usada para assinalar locais muito próximos. Por omissão: 75.
  --repeat-threshold <num>    Número mínimo de repetições para reportar texto genérico. Por omissão: 10.
  --title-repeat-threshold <num> Número mínimo de títulos/labels repetidos para sinalizar dificuldade. Por omissão: 4.
  --fail-on-errors            Termina com erro quando encontra problemas fortes nos dados.
  --help                      Mostra esta ajuda.

O script não altera locations.json. Apenas mostra sinais de qualidade do dataset.`);
}

function parseArgs(args) {
  const options = { ...defaultOptions };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help") {
      return { ...options, help: true };
    }

    if (arg === "--fail-on-errors") {
      options.failOnErrors = true;
      continue;
    }

    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`A opção ${arg} precisa de um valor.`);
    }

    index += 1;

    switch (arg) {
      case "--seed":
        options.seedPath = path.resolve(next);
        break;
      case "--nearby-meters":
        options.nearbyMeters = parsePositiveNumber(arg, next);
        break;
      case "--repeat-threshold":
        options.repeatThreshold = parsePositiveInteger(arg, next);
        break;
      case "--title-repeat-threshold":
        options.titleRepeatThreshold = parsePositiveInteger(arg, next);
        break;
      default:
        throw new Error(`Opção desconhecida: ${arg}`);
    }
  }

  return options;
}

function parsePositiveNumber(name, value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um número positivo.`);
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

function countBy(items, getKey) {
  const counts = new Map();

  for (const item of items) {
    const key = getKey(item) ?? "(vazio)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Object.fromEntries([...counts.entries()].sort((left, right) => right[1] - left[1]));
}

function groupDuplicates(items, getKey) {
  const groups = new Map();

  for (const item of items) {
    const key = getKey(item);
    if (!key) {
      continue;
    }

    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  }

  return [...groups.entries()]
    .filter(([, values]) => values.length > 1)
    .map(([key, values]) => ({
      value: key,
      ids: values.map((location) => location.id),
    }));
}

function findRepeatedText(locations, field, threshold) {
  return groupDuplicates(locations, (location) => location[field])
    .filter((entry) => entry.ids.length >= threshold)
    .map((entry) => ({
      field,
      value: entry.value,
      count: entry.ids.length,
      examples: entry.ids.slice(0, 8),
    }));
}

function findRepeatedDifficultyText(locations, field, threshold) {
  return groupDuplicates(locations, (location) => location[field])
    .filter((entry) => entry.ids.length >= threshold)
    .map((entry) => ({
      field,
      value: entry.value,
      count: entry.ids.length,
      examples: entry.ids.slice(0, 10),
    }));
}

function getPlayableText(location) {
  return [
    location.title,
    location.sceneLabel,
    location.sceneNote,
    location.prompt,
    ...(location.clues ?? []).flatMap((clue) => [clue.label, clue.value]),
  ].join(" ");
}

function findTooDirectPlayableText(locations) {
  return locations
    .map((location) => {
      const playableText = getPlayableText(location).toLocaleLowerCase("pt-PT");
      const exposedTerms = [location.city, location.country]
        .filter((term) => typeof term === "string" && term.length >= 4)
        .filter((term) => playableText.includes(term.toLocaleLowerCase("pt-PT")));

      return {
        id: location.id,
        exposedTerms,
      };
    })
    .filter((entry) => entry.exposedTerms.length > 0);
}

function findPossibleAerialImages(locations) {
  const aerialPatterns = [
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

  return locations
    .filter((location) => {
      if (wasAerialImageReviewed(location)) {
        return false;
      }

      const sourceText = [location.media?.imageUrl, location.media?.imageSourceUrl]
        .filter(Boolean)
        .join(" ");

      return aerialPatterns.some((pattern) => pattern.test(sourceText));
    })
    .map((location) => ({
      id: location.id,
      title: location.title,
      imageSourceUrl: location.media?.imageSourceUrl,
    }));
}

function wasAerialImageReviewed(location) {
  return reviewedAerialImages.some(
    (reviewed) =>
      reviewed.id === location.id &&
      reviewed.imageSourceUrl === location.media?.imageSourceUrl,
  );
}

function findReviewedAerialImages(locations) {
  return reviewedAerialImages
    .map((reviewed) => {
      const location = locations.find((candidate) => candidate.id === reviewed.id);

      if (!location || location.media?.imageSourceUrl !== reviewed.imageSourceUrl) {
        return null;
      }

      return {
        id: location.id,
        title: location.title,
        imageSourceUrl: location.media.imageSourceUrl,
      };
    })
    .filter(Boolean);
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

function findNearbyPairs(locations, maxDistanceMeters) {
  const pairs = [];

  for (let leftIndex = 0; leftIndex < locations.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < locations.length; rightIndex += 1) {
      const left = locations[leftIndex];
      const right = locations[rightIndex];
      const distance = distanceMeters(left, right);

      if (distance <= maxDistanceMeters) {
        pairs.push({
          distanceMeters: Math.round(distance),
          ids: [left.id, right.id],
          titles: [left.title, right.title],
        });
      }
    }
  }

  return pairs.sort((left, right) => left.distanceMeters - right.distanceMeters);
}

function findMissingMetadata(locations) {
  const requiredMediaFields = [
    "sourceProvider",
    "imageUrl",
    "imageSourceUrl",
    "imageAttribution",
    "imageLicense",
    "imageLicenseUrl",
    "verifiedAt",
  ];
  const issues = [];

  for (const location of locations) {
    const media = location.media;
    if (!media || media.sourceProvider === "mock") {
      continue;
    }

    const missingFields = requiredMediaFields.filter((field) => !media[field]);
    if (missingFields.length > 0) {
      issues.push({ id: location.id, missingFields });
    }
  }

  return issues;
}

function collectVisualSourceStats(locations) {
  const sources = locations.flatMap((location) => location.visualSources ?? []);

  return {
    total: sources.length,
    byProvider: countBy(sources, (source) => source.sourceProvider),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const locations = JSON.parse(await fs.readFile(options.seedPath, "utf8"));
  const duplicateIds = groupDuplicates(locations, (location) => location.id);
  const duplicatePrimaryImages = groupDuplicates(
    locations.filter((location) => location.media?.sourceProvider !== "mock"),
    (location) => location.media?.imageSourceUrl,
  );
  const missingMetadata = findMissingMetadata(locations);
  const nearbyPairs = findNearbyPairs(locations, options.nearbyMeters);
  const repeatedText = [
    ...findRepeatedText(locations, "title", options.repeatThreshold),
    ...findRepeatedText(locations, "sceneLabel", options.repeatThreshold),
    ...findRepeatedText(locations, "prompt", options.repeatThreshold),
  ];
  const repeatedDifficultyText = [
    ...findRepeatedDifficultyText(locations, "title", options.titleRepeatThreshold),
    ...findRepeatedDifficultyText(locations, "sceneLabel", options.titleRepeatThreshold),
  ];
  const tooDirectPlayableText = findTooDirectPlayableText(locations);
  const possibleAerialImages = findPossibleAerialImages(locations);
  const reviewedAerialImages = findReviewedAerialImages(locations);

  const report = {
    generatedAt: new Date().toISOString(),
    totalLocations: locations.length,
    countries: countBy(locations, (location) => location.country),
    primaryMediaProviders: countBy(locations, (location) => location.media?.sourceProvider),
    visualSources: collectVisualSourceStats(locations),
    errors: {
      duplicateIds,
      duplicatePrimaryImages,
      missingMetadata,
    },
    warnings: {
      nearbyPairs,
      repeatedText,
      difficulty: {
        tooDirectPlayableText,
        repeatedDifficultyText,
        possibleAerialImages,
        reviewedAerialImages,
      },
    },
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

  const hasErrors =
    duplicateIds.length > 0 ||
    duplicatePrimaryImages.length > 0 ||
    missingMetadata.length > 0;

  if (options.failOnErrors && hasErrors) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
