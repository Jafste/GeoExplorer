#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFile, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultSeedPath = path.resolve(scriptDirectory, "..", "seed", "locations.json");
const defaultCacheDirectory = path.resolve(os.tmpdir(), "geoexplorer-image-quality-cache");
const defaultReportPath = path.resolve(scriptDirectory, "..", "..", "..", "docs", "scope", "image-quality-audit.json");
const defaultBlocklistPath = path.resolve(scriptDirectory, "..", "..", "..", "docs", "scope", "image-quality-blocklist.json");

const defaultOptions = {
  seedPath: defaultSeedPath,
  reportPath: defaultReportPath,
  blocklistPath: defaultBlocklistPath,
  cacheDirectory: defaultCacheDirectory,
  mapillaryBaseUrl: "https://geoexplorer.firmwork.pt",
  timeoutMs: 10_000,
  concurrency: 6,
  delayMs: 0,
  retries: 2,
  removeErrors: false,
  maxSources: null,
  roles: new Set(["media", "visualSource"]),
  providers: null,
  write: false,
  help: false,
};

function printHelp() {
  console.log(`Uso:
  node src/database/tools/audit-image-quality.mjs [opções]

Opções:
  --seed <caminho>             Caminho para locations.json.
  --report <caminho>           Caminho para o relatório JSON.
  --blocklist <caminho>        Blacklist persistente para fontes removidas. Por omissão: docs/scope/image-quality-blocklist.json.
  --no-blocklist               Não atualiza blacklist persistente.
  --cache <diretoria>          Diretoria local para cache de imagens.
  --mapillary-base-url <url>   Base para resolver /api/media/mapillary/*. Por omissão usa produção.
  --timeout-ms <número>        Timeout por imagem. Por omissão: 10000.
  --concurrency <número>       Downloads/análises em paralelo. Por omissão: 6.
  --delay-ms <número>          Espera antes de cada download. Por omissão: 0.
  --retries <número>           Tentativas extra por download. Por omissão: 2.
  --remove-errors              Com --write, remove também fontes que falham download/análise.
  --roles <lista>              media,visualSource. Por omissão: ambos.
  --providers <lista>          Filtra providers, ex.: Mapillary,Panoramax.
  --max-sources <número>       Limita o número de fontes analisadas.
  --write                      Remove do seed os casos high-confidence.
  --help                       Mostra esta ajuda.

Critério:
  remove = desfocagem/contraste/brilho/resolução claramente maus.
  review = limiar intermédio que deve ser visto manualmente.`);
}

function parseArgs(args) {
  const options = { ...defaultOptions, roles: new Set(defaultOptions.roles) };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help") {
      options.help = true;
      continue;
    }

    if (arg === "--write") {
      options.write = true;
      continue;
    }

    if (arg === "--remove-errors") {
      options.removeErrors = true;
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
      case "--report":
        options.reportPath = path.resolve(value);
        break;
      case "--blocklist":
        options.blocklistPath = path.resolve(value);
        break;
      case "--cache":
        options.cacheDirectory = path.resolve(value);
        break;
      case "--mapillary-base-url":
        options.mapillaryBaseUrl = value.replace(/\/$/, "");
        break;
      case "--timeout-ms":
        options.timeoutMs = parsePositiveInteger(arg, value);
        break;
      case "--concurrency":
        options.concurrency = parsePositiveInteger(arg, value);
        break;
      case "--delay-ms":
        options.delayMs = parseNonNegativeInteger(arg, value);
        break;
      case "--retries":
        options.retries = parseNonNegativeInteger(arg, value);
        break;
      case "--max-sources":
        options.maxSources = parsePositiveInteger(arg, value);
        break;
      case "--roles":
        options.roles = new Set(value.split(",").map((entry) => entry.trim()).filter(Boolean));
        break;
      case "--providers":
        options.providers = new Set(value.split(",").map((entry) => entry.trim()).filter(Boolean));
        break;
      default:
        throw new Error(`Opção desconhecida: ${arg}`);
    }
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

function parseNonNegativeInteger(name, value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} deve ser um inteiro positivo ou zero.`);
  }

  return parsed;
}

function collectSources(locations, options) {
  const sources = [];

  for (const location of locations) {
    if (options.roles.has("media") && location.media) {
      sources.push({
        key: `${location.id}:media`,
        role: "media",
        locationId: location.id,
        title: location.title,
        city: location.city,
        country: location.country,
        sourceIndex: null,
        source: location.media,
      });
    }

    if (options.roles.has("visualSource")) {
      for (const [sourceIndex, source] of (location.visualSources ?? []).entries()) {
        sources.push({
          key: `${location.id}:visualSource:${sourceIndex}`,
          role: "visualSource",
          locationId: location.id,
          title: location.title,
          city: location.city,
          country: location.country,
          sourceIndex,
          source,
        });
      }
    }
  }

  const filteredSources = sources.filter((entry) => {
    if (!entry.source?.imageUrl || !entry.source?.sourceProvider) {
      return false;
    }

    return !options.providers || options.providers.has(entry.source.sourceProvider);
  });

  return options.maxSources ? filteredSources.slice(0, options.maxSources) : filteredSources;
}

function resolveImageUrl(imageUrl, options) {
  if (imageUrl.startsWith("/api/media/mapillary/")) {
    return `${options.mapillaryBaseUrl}${imageUrl}`;
  }

  return imageUrl;
}

async function downloadImage(entry, options) {
  await fs.mkdir(options.cacheDirectory, { recursive: true });
  const resolvedUrl = resolveImageUrl(entry.source.imageUrl, options);
  const cacheKey = crypto.createHash("sha256").update(resolvedUrl).digest("hex");
  const cachePath = path.join(options.cacheDirectory, `${cacheKey}.image`);

  try {
    await fs.access(cachePath);
    return { cachePath, resolvedUrl, cached: true };
  } catch {
    // Cache miss.
  }

  let lastError;

  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    if (options.delayMs > 0) {
      await sleep(options.delayMs);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      const response = await fetch(resolvedUrl, {
        headers: {
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "User-Agent": "GeoExplorerDatasetBot/1.0 image quality audit",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/") && !looksLikeImageUrl(resolvedUrl)) {
        throw new Error(`Resposta não é imagem: ${contentType || "sem content-type"}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(cachePath, buffer);
      return { cachePath, resolvedUrl, cached: false };
    } catch (error) {
      lastError = error;

      if (attempt < options.retries) {
        await sleep(600 * (attempt + 1));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

function looksLikeImageUrl(value) {
  try {
    const url = new URL(value);
    return /\.(avif|jpe?g|png|webp)$/i.test(url.pathname);
  } catch {
    return /\.(avif|jpe?g|png|webp)(?:[?#].*)?$/i.test(value);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function analyzeImage(cachePath) {
  const dimensionsOutput = await runMagick([
    "identify",
    "-format",
    "%w %h",
    cachePath,
  ]);
  const [width, height] = dimensionsOutput.trim().split(/\s+/).map(Number);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error("Não foi possível ler dimensões da imagem.");
  }

  const raw = await runMagickBuffer([
    cachePath,
    "-auto-orient",
    "-resize",
    "256x256^",
    "-gravity",
    "center",
    "-extent",
    "256x256",
    "-colorspace",
    "Gray",
    "-depth",
    "8",
    "gray:-",
  ]);

  return computeMetrics(raw, width, height);
}

function runMagick(args) {
  return new Promise((resolve, reject) => {
    const child = execFile("magick", args, {
      maxBuffer: 20 * 1024 * 1024,
      encoding: "utf8",
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }

      resolve(stdout);
    });

    child.stdin?.end();
  });
}

function runMagickBuffer(args) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const errorChunks = [];
    const child = spawn("magick", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.stderr.on("data", (chunk) => errorChunks.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(Buffer.concat(errorChunks).toString("utf8") || `magick terminou com código ${code}`));
        return;
      }

      resolve(Buffer.concat(chunks));
    });
  });
}

function computeMetrics(buffer, width, height) {
  const sampleWidth = 256;
  const sampleHeight = 256;
  const expectedLength = sampleWidth * sampleHeight;

  if (buffer.length !== expectedLength) {
    throw new Error(`Amostra inesperada: ${buffer.length} bytes.`);
  }

  let sum = 0;
  let sumSq = 0;
  let laplacianSum = 0;
  let laplacianSq = 0;
  let gradientSum = 0;
  let edgePixels = 0;
  let gradientCount = 0;

  for (const value of buffer) {
    sum += value;
    sumSq += value * value;
  }

  for (let y = 1; y < sampleHeight - 1; y += 1) {
    for (let x = 1; x < sampleWidth - 1; x += 1) {
      const index = y * sampleWidth + x;
      const laplacian =
        4 * buffer[index] -
        buffer[index - 1] -
        buffer[index + 1] -
        buffer[index - sampleWidth] -
        buffer[index + sampleWidth];
      const gradientX = buffer[index + 1] - buffer[index - 1];
      const gradientY = buffer[index + sampleWidth] - buffer[index - sampleWidth];
      const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY);

      laplacianSum += laplacian;
      laplacianSq += laplacian * laplacian;
      gradientSum += gradient;
      gradientCount += 1;

      if (gradient >= 12) {
        edgePixels += 1;
      }
    }
  }

  const totalPixels = buffer.length;
  const innerPixels = (sampleWidth - 2) * (sampleHeight - 2);
  const mean = sum / totalPixels;
  const stdDev = Math.sqrt(sumSq / totalPixels - mean * mean);
  const laplacianMean = laplacianSum / innerPixels;
  const laplacianVariance = laplacianSq / innerPixels - laplacianMean * laplacianMean;
  const gradientMean = gradientSum / gradientCount;
  const edgeDensity = edgePixels / gradientCount;

  return {
    width,
    height,
    pixels: width * height,
    mean: round(mean),
    stdDev: round(stdDev),
    laplacianVariance: round(laplacianVariance),
    gradientMean: round(gradientMean),
    edgeDensity: round(edgeDensity, 4),
  };
}

function classify(metrics, provider) {
  const reasons = [];
  const reviewReasons = [];
  const isPanorama = provider === "Panoramax";
  const blurLimit = isPanorama ? 58 : 85;
  const gradientLimit = isPanorama ? 4.8 : 6.2;
  const reviewBlurLimit = isPanorama ? 82 : 120;
  const reviewGradientLimit = isPanorama ? 6.2 : 8.4;

  if (Math.min(metrics.width, metrics.height) < 420 || metrics.pixels < 260_000) {
    reasons.push("resolução demasiado baixa");
  }

  if (metrics.mean < 28 && metrics.stdDev < 28) {
    reasons.push("muito escura");
  }

  if (metrics.mean > 226 && metrics.stdDev < 24) {
    reasons.push("muito lavada/clara");
  }

  if (metrics.stdDev < 14) {
    reasons.push("contraste muito baixo");
  }

  if (
    metrics.laplacianVariance < blurLimit &&
    metrics.gradientMean < gradientLimit &&
    metrics.edgeDensity < 0.18
  ) {
    reasons.push("muito desfocada");
  } else if (
    metrics.laplacianVariance < reviewBlurLimit &&
    metrics.gradientMean < reviewGradientLimit
  ) {
    reviewReasons.push("possivelmente desfocada");
  }

  if (reasons.length > 0) {
    return { action: "remove", reasons };
  }

  if (reviewReasons.length > 0) {
    return { action: "review", reasons: reviewReasons };
  }

  return { action: "keep", reasons: [] };
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function processWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker));
  return results;
}

async function inspectSource(entry, index, total, options) {
  let cachePath;

  try {
    const download = await downloadImage(entry, options);
    cachePath = download.cachePath;
    const metrics = await analyzeImage(cachePath);
    const classification = classify(metrics, entry.source.sourceProvider);

    if ((index + 1) % 50 === 0 || classification.action !== "keep") {
      console.error(`[${index + 1}/${total}] ${classification.action} ${entry.key}`);
    }

    return {
      ...entry,
      source: sanitizeSource(entry.source),
      resolvedUrl: download.resolvedUrl,
      metrics,
      action: classification.action,
      reasons: classification.reasons,
    };
  } catch (error) {
    if (cachePath) {
      await fs.rm(cachePath, { force: true });
    }

    console.error(`[${index + 1}/${total}] erro ${entry.key}: ${error.message}`);
    return {
      ...entry,
      source: sanitizeSource(entry.source),
      resolvedUrl: resolveImageUrl(entry.source.imageUrl, options),
      action: "error",
      reasons: [error.message],
    };
  }
}

function sanitizeSource(source) {
  return {
    sourceProvider: source.sourceProvider,
    imageUrl: source.imageUrl,
    imageSourceUrl: source.imageSourceUrl,
    imageAttribution: source.imageAttribution,
    streetViewProvider: source.streetViewProvider,
  };
}

function applyRemovals(locations, removals) {
  const removalKeys = new Set(removals.map((entry) => entry.key));
  const removedLocations = [];
  const changedLocations = [];
  const keptLocations = [];

  for (const location of locations) {
    const mediaKey = `${location.id}:media`;
    const visualSources = location.visualSources ?? [];
    const nextVisualSources = visualSources.filter(
      (_source, sourceIndex) => !removalKeys.has(`${location.id}:visualSource:${sourceIndex}`),
    );

    if (!removalKeys.has(mediaKey)) {
      if (nextVisualSources.length !== visualSources.length) {
        changedLocations.push(location.id);
      }

      keptLocations.push({
        ...location,
        ...(location.visualSources ? { visualSources: nextVisualSources } : {}),
      });
      continue;
    }

    const replacement = nextVisualSources.find(
      (source) => source.sourceProvider === "Panoramax" || source.sourceProvider === "Wikimedia Commons",
    );

    if (replacement) {
      changedLocations.push(location.id);
      keptLocations.push({
        ...location,
        media: replacement,
        visualSources: [replacement, ...nextVisualSources.filter((source) => source.imageUrl !== replacement.imageUrl)],
      });
      continue;
    }

    removedLocations.push(location.id);
  }

  return { locations: keptLocations, changedLocations, removedLocations };
}

function summarize(results) {
  const summary = {
    total: results.length,
    byAction: {},
    byProvider: {},
    byRole: {},
  };

  for (const result of results) {
    summary.byAction[result.action] = (summary.byAction[result.action] ?? 0) + 1;
    summary.byProvider[result.source.sourceProvider] = (summary.byProvider[result.source.sourceProvider] ?? 0) + 1;
    summary.byRole[result.role] = (summary.byRole[result.role] ?? 0) + 1;
  }

  return summary;
}

async function updateBlocklist(blocklistPath, entries) {
  if (!blocklistPath || entries.length === 0) {
    return null;
  }

  let blocklist = {
    generatedAt: new Date().toISOString(),
    updatedAt: null,
    entries: [],
  };

  try {
    blocklist = JSON.parse(await fs.readFile(blocklistPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  const now = new Date().toISOString();
  const existing = new Map(
    (blocklist.entries ?? []).map((entry) => [buildBlocklistKey(entry), entry]),
  );

  for (const entry of entries.map(toReportEntry)) {
    const key = buildBlocklistKey(entry);
    const previous = existing.get(key);
    existing.set(key, {
      ...previous,
      key,
      locationId: entry.locationId,
      provider: entry.provider,
      imageUrl: entry.imageUrl,
      imageSourceUrl: entry.imageSourceUrl,
      resolvedUrl: entry.resolvedUrl,
      reasons: entry.reasons,
      firstSeenAt: previous?.firstSeenAt ?? now,
      lastSeenAt: now,
    });
  }

  const nextBlocklist = {
    generatedAt: blocklist.generatedAt ?? now,
    updatedAt: now,
    entries: [...existing.values()].sort((left, right) => left.key.localeCompare(right.key)),
  };

  await fs.mkdir(path.dirname(blocklistPath), { recursive: true });
  await fs.writeFile(blocklistPath, `${JSON.stringify(nextBlocklist, null, 2)}\n`);

  return {
    path: blocklistPath,
    totalEntries: nextBlocklist.entries.length,
    addedEntries: entries.length,
  };
}

function buildBlocklistKey(entry) {
  return entry.imageSourceUrl || entry.imageUrl || entry.locationId || entry.key;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const locations = JSON.parse(await fs.readFile(options.seedPath, "utf8"));
  const sources = collectSources(locations, options);

  console.error(`A analisar ${sources.length} fontes visuais...`);

  const results = await processWithConcurrency(
    sources,
    options.concurrency,
    (entry, index) => inspectSource(entry, index, sources.length, options),
  );

  const removals = results.filter((result) => result.action === "remove");
  const review = results.filter((result) => result.action === "review");
  const errors = results.filter((result) => result.action === "error");
  const appliedRemovals = options.removeErrors ? [...removals, ...errors] : removals;

  const report = {
    generatedAt: new Date().toISOString(),
    seedPath: options.seedPath,
    thresholds: {
      remove: "resolução baixa, imagem escura/lavada, contraste muito baixo ou blur forte",
      review: "blur intermédio",
    },
    summary: summarize(results),
    removals: removals.map(toReportEntry),
    review: review.map(toReportEntry),
    errors: errors.map(toReportEntry),
  };

  await fs.mkdir(path.dirname(options.reportPath), { recursive: true });
  await fs.writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`);

  if (options.write && appliedRemovals.length > 0) {
    const applied = applyRemovals(locations, appliedRemovals);
    const blocklist = await updateBlocklist(options.blocklistPath, appliedRemovals);
    await fs.writeFile(options.seedPath, `${JSON.stringify(applied.locations, null, 2)}\n`);
    report.applied = {
      changedLocations: applied.changedLocations,
      removedLocations: applied.removedLocations,
      removedImageIssues: removals.length,
      removedTechnicalErrors: options.removeErrors ? errors.length : 0,
      totalLocationsBefore: locations.length,
      totalLocationsAfter: applied.locations.length,
      qualityBlocklist: blocklist,
    };
    await fs.writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }

  process.stdout.write(`${JSON.stringify({
    reportPath: options.reportPath,
    summary: report.summary,
    removals: removals.length,
    review: review.length,
    errors: errors.length,
    applied: report.applied ?? null,
  }, null, 2)}\n`);
}

function toReportEntry(result) {
  return {
    key: result.key,
    role: result.role,
    locationId: result.locationId,
    title: result.title,
    city: result.city,
    country: result.country,
    sourceIndex: result.sourceIndex,
    provider: result.source.sourceProvider,
    imageUrl: result.source.imageUrl,
    imageSourceUrl: result.source.imageSourceUrl,
    resolvedUrl: result.resolvedUrl,
    reasons: result.reasons,
    metrics: result.metrics,
  };
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
