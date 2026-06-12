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
const defaultOutputPath = path.resolve(scriptDirectory, "..", "..", "..", "docs", "scope", "image-anomaly-audit.json");
const defaultCacheDirectory = path.resolve(os.tmpdir(), "geoexplorer-image-quality-cache");

const defaultOptions = {
  seedPath: defaultSeedPath,
  outputPath: defaultOutputPath,
  excludeReviewReportPath: null,
  cacheDirectory: defaultCacheDirectory,
  mapillaryBaseUrl: "https://geoexplorer.firmwork.pt",
  timeoutMs: 12_000,
  retries: 2,
  concurrency: 6,
  maxReview: 150,
  minScore: 20,
  roles: new Set(["media", "visualSource"]),
  providers: new Set(["Mapillary", "Panoramax"]),
};

function printHelp() {
  console.log(`Uso:
  node src/database/tools/audit-image-anomalies.mjs [opções]

Opções:
  --seed <path>                  Caminho para locations.json.
  --output <path>                Relatório JSON a gerar.
  --exclude-review-report <path> Ignora keys já marcadas para review nesse relatório.
  --cache <path>                 Diretoria de cache local de imagens.
  --mapillary-base-url <url>     Base para resolver /api/media/mapillary/*. Por omissão usa produção.
  --timeout-ms <número>          Timeout por imagem.
  --retries <número>             Tentativas extra por download.
  --concurrency <número>         Análises em paralelo.
  --max-review <número>          Máximo de candidatos no relatório.
  --min-score <número>           Score mínimo para candidato. Por omissão: 20.
  --roles <lista>                media,visualSource. Por omissão: ambos.
  --providers <lista>            Ex.: Mapillary,Panoramax.
  --help                         Mostra esta ajuda.

Critério:
  Esta passagem é deliberadamente conservadora: encontra candidatos suspeitos
  por regiões da imagem, capot/veículo, baixa nitidez, baixo contraste e
  padrões tipo placa/mapa. Não remove nada do seed.`);
}

function parseArgs(args) {
  const options = {
    ...defaultOptions,
    roles: new Set(defaultOptions.roles),
    providers: new Set(defaultOptions.providers),
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help") {
      return { ...options, help: true };
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
      case "--output":
        options.outputPath = path.resolve(value);
        break;
      case "--exclude-review-report":
        options.excludeReviewReportPath = path.resolve(value);
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
      case "--retries":
        options.retries = parseNonNegativeInteger(arg, value);
        break;
      case "--concurrency":
        options.concurrency = parsePositiveInteger(arg, value);
        break;
      case "--max-review":
        options.maxReview = parsePositiveInteger(arg, value);
        break;
      case "--min-score":
        options.minScore = parsePositiveNumber(arg, value);
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

function parsePositiveNumber(name, value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um número positivo.`);
  }
  return parsed;
}

function collectSources(locations, options) {
  const sources = [];

  for (const location of locations) {
    if (options.roles.has("media") && location.media) {
      sources.push(toSourceEntry(location, location.media, "media", null));
    }

    if (options.roles.has("visualSource")) {
      for (const [sourceIndex, source] of (location.visualSources ?? []).entries()) {
        sources.push(toSourceEntry(location, source, "visualSource", sourceIndex));
      }
    }
  }

  return sources.filter((entry) => {
    if (!entry.source.imageUrl || !entry.source.sourceProvider) {
      return false;
    }

    return options.providers.has(entry.source.sourceProvider);
  });
}

function toSourceEntry(location, source, role, sourceIndex) {
  return {
    key: sourceIndex === null ? `${location.id}:${role}` : `${location.id}:${role}:${sourceIndex}`,
    role,
    locationId: location.id,
    title: location.title,
    city: location.city,
    country: location.country,
    sourceIndex,
    provider: source.sourceProvider,
    source,
  };
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      const response = await fetch(resolvedUrl, {
        headers: {
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "User-Agent": "GeoExplorerDatasetBot/1.0 image anomaly audit",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function analyzeImage(cachePath) {
  const dimensionsOutput = await runMagick(["identify", "-format", "%w %h", cachePath]);
  const [width, height] = dimensionsOutput.trim().split(/\s+/).map(Number);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error("Não foi possível ler dimensões da imagem.");
  }

  const sampleWidth = 320;
  const sampleHeight = 160;
  const raw = await runMagickBuffer([
    cachePath,
    "-auto-orient",
    "-resize",
    `${sampleWidth}x${sampleHeight}!`,
    "-colorspace",
    "sRGB",
    "-depth",
    "8",
    "rgb:-",
  ]);

  if (raw.length !== sampleWidth * sampleHeight * 3) {
    throw new Error(`Amostra inesperada: ${raw.length} bytes.`);
  }

  const regions = {
    whole: measureRegion(raw, sampleWidth, sampleHeight, 0, 0, sampleWidth, sampleHeight),
    top: measureRegion(raw, sampleWidth, sampleHeight, 0, 0, sampleWidth, 40),
    center: measureRegion(raw, sampleWidth, sampleHeight, 80, 40, 240, 120),
    middle: measureRegion(raw, sampleWidth, sampleHeight, 0, 45, sampleWidth, 120),
    bottom: measureRegion(raw, sampleWidth, sampleHeight, 0, 124, sampleWidth, sampleHeight),
    bottomCenter: measureRegion(raw, sampleWidth, sampleHeight, 80, 120, 240, sampleHeight),
  };

  return {
    width,
    height,
    pixels: width * height,
    aspectRatio: round(width / height, 3),
    ...regions,
  };
}

function measureRegion(raw, sampleWidth, sampleHeight, x0, y0, x1, y1) {
  const gray = [];
  let sum = 0;
  let sumSq = 0;
  let saturationSum = 0;

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const index = (y * sampleWidth + x) * 3;
      const red = raw[index];
      const green = raw[index + 1];
      const blue = raw[index + 2];
      const value = 0.299 * red + 0.587 * green + 0.114 * blue;
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const saturation = max === 0 ? 0 : ((max - min) / max) * 255;

      gray.push(value);
      sum += value;
      sumSq += value * value;
      saturationSum += saturation;
    }
  }

  const width = x1 - x0;
  const height = y1 - y0;
  let gradientSum = 0;
  let laplacianSum = 0;
  let laplacianSq = 0;
  let edgePixels = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const laplacian =
        4 * gray[index] -
        gray[index - 1] -
        gray[index + 1] -
        gray[index - width] -
        gray[index + width];
      const gradientX = gray[index + 1] - gray[index - 1];
      const gradientY = gray[index + width] - gray[index - width];
      const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY);

      laplacianSum += laplacian;
      laplacianSq += laplacian * laplacian;
      gradientSum += gradient;
      count += 1;

      if (gradient >= 12) {
        edgePixels += 1;
      }
    }
  }

  const pixels = gray.length;
  const mean = sum / pixels;
  const stdDev = Math.sqrt(Math.max(0, sumSq / pixels - mean * mean));
  const laplacianMean = count === 0 ? 0 : laplacianSum / count;
  const laplacianVariance = count === 0 ? 0 : laplacianSq / count - laplacianMean * laplacianMean;

  return {
    mean: round(mean),
    stdDev: round(stdDev),
    saturationMean: round(saturationSum / pixels),
    gradientMean: round(count === 0 ? 0 : gradientSum / count),
    laplacianVariance: round(laplacianVariance),
    edgeDensity: round(count === 0 ? 0 : edgePixels / count, 4),
  };
}

function scoreAnomaly(entry, metrics) {
  const scoreParts = [];
  const { whole, center, bottom, bottomCenter } = metrics;

  if (Math.min(metrics.width, metrics.height) < 520 || metrics.pixels < 360_000) {
    scoreParts.push({ score: 18, reason: "resolução baixa para jogo" });
  }

  if (whole.mean < 38 && whole.stdDev < 36) {
    scoreParts.push({ score: 30, reason: "imagem muito escura" });
  }

  if (whole.mean > 220 && whole.stdDev < 28) {
    scoreParts.push({ score: 24, reason: "imagem lavada/clara" });
  }

  if (whole.stdDev < 22) {
    scoreParts.push({ score: 22, reason: "contraste baixo" });
  }

  if (whole.gradientMean < 5.8 && whole.edgeDensity < 0.12) {
    scoreParts.push({ score: 28, reason: "nitidez baixa perto do limite" });
  } else if (whole.gradientMean < 7.2 && whole.laplacianVariance < 95) {
    scoreParts.push({ score: 18, reason: "possível desfocagem residual" });
  }

  if (isBottomObstruction(bottom, bottomCenter, metrics.provider)) {
    scoreParts.push({ score: 36, reason: "parte inferior parece capot/veículo ou obstrução" });
  } else if (bottom.mean > 166 && bottom.saturationMean < 42 && bottom.gradientMean < 8.6) {
    scoreParts.push({ score: 20, reason: "parte inferior clara e pouco informativa" });
  }

  if (
    entry.provider === "Mapillary" &&
    center.mean > 142 &&
    center.saturationMean < 58 &&
    center.gradientMean > 9 &&
    center.edgeDensity > 0.09
  ) {
    scoreParts.push({ score: 24, reason: "possível placa/mapa/texto em primeiro plano" });
  }

  if (
    entry.provider === "Panoramax" &&
    metrics.aspectRatio > 1.8 &&
    bottomCenter.mean > 155 &&
    bottomCenter.saturationMean < 35 &&
    bottomCenter.stdDev < 43
  ) {
    scoreParts.push({ score: 26, reason: "panorama com centro inferior pouco útil" });
  }

  const score = scoreParts.reduce((total, part) => total + part.score, 0);
  const reasons = [...new Set(scoreParts.map((part) => part.reason))];

  return { score, reasons };
}

function isBottomObstruction(bottom, bottomCenter, provider) {
  const saturationLimit = provider === "Panoramax" ? 50 : 58;
  return (
    bottom.mean > 148 &&
    bottom.saturationMean < saturationLimit &&
    bottom.gradientMean < 7.4 &&
    bottom.stdDev < 46 &&
    bottomCenter.mean > 145 &&
    bottomCenter.saturationMean < saturationLimit
  );
}

function runMagick(args) {
  return new Promise((resolve, reject) => {
    execFile("magick", args, { maxBuffer: 20 * 1024 * 1024, encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }

      resolve(stdout);
    });
  });
}

function runMagickBuffer(args) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const errorChunks = [];
    const child = spawn("magick", args, { stdio: ["ignore", "pipe", "pipe"] });

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

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function loadExcludedReviewKeys(reportPath) {
  if (!reportPath) {
    return new Set();
  }

  try {
    const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
    return new Set((report.review ?? []).map((entry) => entry.key));
  } catch (error) {
    if (error.code === "ENOENT") {
      return new Set();
    }

    throw error;
  }
}

function toReviewItem(result) {
  return {
    key: result.key,
    role: result.role,
    locationId: result.locationId,
    title: result.title,
    city: result.city,
    country: result.country,
    sourceIndex: result.sourceIndex,
    provider: result.provider,
    imageUrl: result.source.imageUrl,
    imageSourceUrl: result.source.imageSourceUrl,
    resolvedUrl: result.resolvedUrl,
    reasons: result.reasons,
    anomalyScore: result.anomalyScore,
    metrics: {
      width: result.metrics.width,
      height: result.metrics.height,
      aspectRatio: result.metrics.aspectRatio,
      whole: result.metrics.whole,
      center: result.metrics.center,
      bottom: result.metrics.bottom,
      bottomCenter: result.metrics.bottomCenter,
    },
  };
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const locations = JSON.parse(await fs.readFile(options.seedPath, "utf8"));
  const excludedReviewKeys = await loadExcludedReviewKeys(options.excludeReviewReportPath);
  const sources = collectSources(locations, options).filter((entry) => !excludedReviewKeys.has(entry.key));

  console.error(`A analisar ${sources.length} fontes visuais para anomalias...`);

  const results = await mapWithConcurrency(sources, options.concurrency, async (entry, index) => {
    try {
      const download = await downloadImage(entry, options);
      const metrics = await analyzeImage(download.cachePath);
      metrics.provider = entry.provider;
      const anomaly = scoreAnomaly(entry, metrics);

      if ((index + 1) % 100 === 0 || anomaly.score >= options.minScore) {
        const state = anomaly.score >= options.minScore ? `suspect ${anomaly.score}` : "ok";
        console.error(`[${index + 1}/${sources.length}] ${state} ${entry.key}`);
      }

      return {
        ...entry,
        resolvedUrl: download.resolvedUrl,
        metrics,
        anomalyScore: anomaly.score,
        reasons: anomaly.reasons,
      };
    } catch (error) {
      console.error(`[${index + 1}/${sources.length}] erro ${entry.key}: ${error.message}`);
      return {
        ...entry,
        resolvedUrl: resolveImageUrl(entry.source.imageUrl, options),
        anomalyScore: 100,
        reasons: [`erro na análise: ${error.message}`],
        error: error.message,
      };
    }
  });

  const candidates = results
    .filter((result) => result.anomalyScore >= options.minScore)
    .sort((left, right) => right.anomalyScore - left.anomalyScore || left.key.localeCompare(right.key));
  const review = candidates.slice(0, options.maxReview).map(toReviewItem);

  const summary = {
    total: sources.length,
    candidates: candidates.length,
    review: review.length,
    byProvider: {},
    byReason: {},
  };

  for (const result of candidates) {
    summary.byProvider[result.provider] = (summary.byProvider[result.provider] ?? 0) + 1;
    for (const reason of result.reasons) {
      summary.byReason[reason] = (summary.byReason[reason] ?? 0) + 1;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    seedPath: options.seedPath,
    excludedReviewReportPath: options.excludeReviewReportPath,
    minScore: options.minScore,
    maxReview: options.maxReview,
    summary,
    review,
  };

  await fs.mkdir(path.dirname(options.outputPath), { recursive: true });
  await fs.writeFile(options.outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath: options.outputPath, summary }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
