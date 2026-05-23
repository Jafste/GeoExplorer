#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultSeedPath = path.resolve(scriptDirectory, "..", "seed", "locations.json");
const defaultFields = [
  "id",
  "computed_geometry",
  "thumb_1024_url",
].join(",");

const defaultOptions = {
  seedPath: defaultSeedPath,
  outputPath: null,
  bboxDegrees: 0.002,
  imageLimit: 20,
  maxDistanceMeters: 50,
  maxResults: 25,
  maxLocations: null,
  timeoutMs: 8000,
  includeExisting: false,
};

function printHelp() {
  console.log(`Uso:
  MAPILLARY_ACCESS_TOKEN=... node src/database/tools/find-mapillary-sources.mjs [opções]

Opções:
  --seed <caminho>             Caminho para locations.json. Por omissão usa src/database/seed/locations.json.
  --output <caminho>           Escreve o resultado JSON num ficheiro em vez de usar stdout.
  --bbox-degrees <número>      Raio de pesquisa em graus à volta de cada ponto. Por omissão: 0.002.
  --image-limit <número>       Número de imagens Mapillary a pedir por local. Por omissão: 20.
  --max-distance-meters <num>  Distância máxima aceite a partir do ponto do desafio. Por omissão: 50.
  --max-results <número>       Interrompe depois de encontrar este número de candidatos. Por omissão: 25.
  --max-locations <número>     Analisa apenas os primeiros N locais elegíveis.
  --timeout-ms <número>        Timeout de cada pedido Mapillary. Por omissão: 8000.
  --include-existing           Inclui locais que já têm uma fonte visual Mapillary.
  --help                       Mostra esta ajuda.

O script apenas encontra candidatos. Não altera locations.json.`);
}

function parseArgs(args) {
  const options = { ...defaultOptions };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help") {
      return { ...options, help: true };
    }

    if (arg === "--include-existing") {
      options.includeExisting = true;
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
      case "--output":
        options.outputPath = path.resolve(next);
        break;
      case "--bbox-degrees":
        options.bboxDegrees = parsePositiveNumber(arg, next);
        break;
      case "--image-limit":
        options.imageLimit = parsePositiveInteger(arg, next);
        break;
      case "--max-distance-meters":
        options.maxDistanceMeters = parsePositiveNumber(arg, next);
        break;
      case "--max-results":
        options.maxResults = parsePositiveInteger(arg, next);
        break;
      case "--max-locations":
        options.maxLocations = parsePositiveInteger(arg, next);
        break;
      case "--timeout-ms":
        options.timeoutMs = parsePositiveInteger(arg, next);
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

function hasProvider(location, provider) {
  return (location.visualSources ?? []).some((source) => source.sourceProvider === provider);
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

function parsePointGeometry(value) {
  const geometry = typeof value === "string" ? JSON.parse(value) : value;
  if (geometry?.type !== "Point" || !Array.isArray(geometry.coordinates)) {
    return null;
  }

  const [longitude, latitude] = geometry.coordinates;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function buildMapillaryUrl(imageId) {
  return `https://www.mapillary.com/app/?pKey=${encodeURIComponent(imageId)}`;
}

function buildBackendMapillaryUrl(imageId) {
  return `/api/media/mapillary/${encodeURIComponent(imageId)}`;
}

function buildAttribution(image) {
  const creator = image.creator;
  const username = typeof creator === "object" && creator !== null ? creator.username : null;

  return username || image.imageAttribution || "Mapillary contributor";
}

function toVisualSource(image) {
  const imageSourceUrl = buildMapillaryUrl(image.id);

  return {
    sourceProvider: "Mapillary",
    imageUrl: buildBackendMapillaryUrl(image.id),
    imageSourceUrl,
    imageAttribution: buildAttribution(image),
    imageLicense: "CC BY-SA 4.0",
    imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    streetViewProvider: "Mapillary",
    streetViewUrl: imageSourceUrl,
    verifiedAt: new Date().toISOString().slice(0, 10),
  };
}

async function fetchImages(location, options, token) {
  const bbox = [
    location.longitude - options.bboxDegrees,
    location.latitude - options.bboxDegrees,
    location.longitude + options.bboxDegrees,
    location.latitude + options.bboxDegrees,
  ].join(",");
  const params = new URLSearchParams({
    access_token: token,
    bbox,
    fields: defaultFields,
    limit: String(options.imageLimit),
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  let response;

  try {
    response = await fetch(`https://graph.mapillary.com/images?${params}`, {
      signal: controller.signal,
    });
  }
  catch (error) {
    console.error(`Ignorei ${location.id}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
  finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text();
    console.error(`Ignorei ${location.id}: Mapillary devolveu HTTP ${response.status}: ${body}`);
    return [];
  }

  const payload = await response.json();
  return payload.data ?? [];
}

async function fetchImageDetails(imageId, options, token) {
  const params = new URLSearchParams({
    access_token: token,
    fields: "id,creator,thumb_1024_url",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(`https://graph.mapillary.com/${imageId}?${params}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  }
  catch {
    return null;
  }
  finally {
    clearTimeout(timeout);
  }
}

function pickNearestCandidate(location, images, options) {
  const candidates = images
    .map((image) => {
      const point = parsePointGeometry(image.computed_geometry);
      const imageUrl = image.thumb_2048_url || image.thumb_1024_url;

      if (!point || !image.id || !imageUrl) {
        return null;
      }

      return {
        image,
        point,
        distanceMeters: Math.round(distanceMeters(location, point)),
      };
    })
    .filter(Boolean)
    .filter((candidate) => candidate.distanceMeters <= options.maxDistanceMeters)
    .sort((left, right) => left.distanceMeters - right.distanceMeters);

  return candidates[0] ?? null;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const token = process.env.MAPILLARY_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Define MAPILLARY_ACCESS_TOKEN antes de correr este script.");
  }

  const locations = JSON.parse(await fs.readFile(options.seedPath, "utf8"));
  const eligibleLocations = locations
    .filter((location) => options.includeExisting || !hasProvider(location, "Mapillary"))
    .slice(0, options.maxLocations ?? locations.length);
  const candidates = [];

  for (const location of eligibleLocations) {
    if (candidates.length >= options.maxResults) {
      break;
    }

    const images = await fetchImages(location, options, token);
    const nearest = pickNearestCandidate(location, images, options);
    if (!nearest) {
      continue;
    }

    const details = await fetchImageDetails(nearest.image.id, options, token);
    const image = {
      ...nearest.image,
      ...(details ?? {}),
    };

    candidates.push({
      locationId: location.id,
      title: location.title,
      city: location.city,
      country: location.country,
      challengeLatitude: location.latitude,
      challengeLongitude: location.longitude,
      imageLatitude: nearest.point.latitude,
      imageLongitude: nearest.point.longitude,
      distanceMeters: nearest.distanceMeters,
      visualSource: toVisualSource(image),
    });
  }

  const result = {
    generatedAt: new Date().toISOString(),
    sourceProvider: "Mapillary",
    inspectedLocations: eligibleLocations.length,
    maxDistanceMeters: options.maxDistanceMeters,
    candidates,
  };
  const output = `${JSON.stringify(result, null, 2)}\n`;

  if (options.outputPath) {
    await fs.writeFile(options.outputPath, output);
    console.error(`Escrevi ${candidates.length} candidatos em ${options.outputPath}.`);
    return;
  }

  process.stdout.write(output);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
