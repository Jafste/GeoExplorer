#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DEFAULT_REPORT = "docs/scope/image-quality-audit.json";
const DEFAULT_OUTPUT = "tmp/image-quality-review-gallery";
const DEFAULT_BASE_URL = "https://geoexplorer.firmwork.pt";
const DEFAULT_CACHE = path.resolve(os.tmpdir(), "geoexplorer-image-quality-cache");
const DEFAULT_CONCURRENCY = 6;
const THUMB_WIDTH = 220;
const THUMB_HEIGHT = 150;
const LABEL_HEIGHT = 66;
const SHEET_COLUMNS = 5;
const SHEET_ROWS = 5;

function parseArgs(argv) {
  const options = {
    report: DEFAULT_REPORT,
    output: DEFAULT_OUTPUT,
    baseUrl: DEFAULT_BASE_URL,
    cache: DEFAULT_CACHE,
    concurrency: DEFAULT_CONCURRENCY,
    keepDownloads: false,
    maxItems: Number.POSITIVE_INFINITY,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case "--report":
        options.report = next;
        index += 1;
        break;
      case "--output":
        options.output = next;
        index += 1;
        break;
      case "--base-url":
        options.baseUrl = next;
        index += 1;
        break;
      case "--cache":
        options.cache = next;
        index += 1;
        break;
      case "--no-cache":
        options.cache = null;
        break;
      case "--concurrency":
        options.concurrency = Number.parseInt(next, 10);
        index += 1;
        break;
      case "--max-items":
        options.maxItems = Number.parseInt(next, 10);
        index += 1;
        break;
      case "--keep-downloads":
        options.keepDownloads = true;
        break;
      default:
        throw new Error(`Argumento desconhecido: ${arg}`);
    }
  }

  if (!Number.isFinite(options.concurrency) || options.concurrency < 1) {
    throw new Error("--concurrency deve ser um inteiro positivo.");
  }

  return options;
}

function resolveImageUrl(item, baseUrl) {
  const url = item.resolvedUrl || item.imageUrl;

  if (!url) {
    return null;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return new URL(url, baseUrl).toString();
}

function shellEscape(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function truncate(value, length) {
  const text = String(value ?? "").trim();

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, Math.max(0, length - 1))}…`;
}

function slug(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function commandExists(command) {
  return new Promise((resolve) => {
    const child = spawn("sh", ["-lc", `command -v ${command}`], { stdio: "ignore" });
    child.on("close", (code) => resolve(code === 0));
  });
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} terminou com código ${code}: ${stderr.trim()}`));
    });
  });
}

async function downloadImage(item, filePath, baseUrl, cacheDirectory) {
  const url = resolveImageUrl(item, baseUrl);

  if (!url) {
    throw new Error("Imagem sem URL.");
  }

  if (cacheDirectory) {
    const cacheKey = createHash("sha256").update(url).digest("hex");
    const cachePath = path.join(cacheDirectory, `${cacheKey}.image`);

    if (existsSync(cachePath)) {
      await copyFile(cachePath, filePath);
      return;
    }
  }

  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());

  if (bytes.length === 0) {
    throw new Error("Resposta vazia.");
  }

  await writeFile(filePath, bytes);
}

async function createThumbnail({ item, index, sourcePath, thumbPath }) {
  const number = String(index + 1).padStart(3, "0");
  const title = truncate(item.locationId, 34);
  const detail = truncate(`${item.provider} · ${item.country ?? ""}`, 34);
  const reasons = truncate((item.reasons ?? []).join(", "), 34);

  await run("magick", [
    sourcePath,
    "-auto-orient",
    "-resize",
    `${THUMB_WIDTH}x${THUMB_HEIGHT}^`,
    "-gravity",
    "center",
    "-extent",
    `${THUMB_WIDTH}x${THUMB_HEIGHT}`,
    "(",
    "-size",
    `${THUMB_WIDTH}x${LABEL_HEIGHT}`,
    "xc:#0b1016",
    "-fill",
    "#d1ff26",
    "-pointsize",
    "18",
    "-annotate",
    "+8+22",
    `#${number}`,
    "-fill",
    "#f4f7fb",
    "-pointsize",
    "10",
    "-annotate",
    "+8+42",
    shellEscape(title),
    "-fill",
    "#9aa3ad",
    "-pointsize",
    "9",
    "-annotate",
    "+8+58",
    shellEscape(detail || reasons),
    ")",
    "-append",
    thumbPath,
  ]);
}

async function createPlaceholder({ item, index, thumbPath, message }) {
  const number = String(index + 1).padStart(3, "0");
  const title = truncate(item.locationId, 28);

  await run("magick", [
    "-size",
    `${THUMB_WIDTH}x${THUMB_HEIGHT + LABEL_HEIGHT}`,
    "xc:#151922",
    "-fill",
    "#d1ff26",
    "-pointsize",
    "18",
    "-annotate",
    "+10+30",
    `#${number}`,
    "-fill",
    "#f4f7fb",
    "-pointsize",
    "12",
    "-annotate",
    "+10+62",
    shellEscape(title),
    "-fill",
    "#ff8f9a",
    "-pointsize",
    "11",
    "-annotate",
    "+10+94",
    shellEscape(truncate(message, 30)),
    thumbPath,
  ]);
}

async function createContactSheet(files, outputPath) {
  await run("magick", [
    "montage",
    ...files,
    "-tile",
    `${SHEET_COLUMNS}x${SHEET_ROWS}`,
    "-geometry",
    "+8+8",
    "-background",
    "#05080d",
    outputPath,
  ]);
}

function renderHtml(items, generatedAt) {
  const cards = items
    .map((item) => {
      const sourceUrl = item.imageSourceUrl || item.resolvedUrl || item.imageUrl || "#";
      const metricText = item.metrics
        ? `lap ${item.metrics.laplacianVariance} · grad ${item.metrics.gradientMean} · edge ${item.metrics.edgeDensity}`
        : "";

      return `
        <article class="card">
          <label class="select-row">
            <input type="checkbox" value="${escapeHtml(item.key)}" data-location-id="${escapeHtml(item.locationId)}">
            <strong>#${String(item.index).padStart(3, "0")}</strong>
            <span>${escapeHtml(item.provider)}</span>
          </label>
          <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">
            <img src="${escapeHtml(item.thumbRelativePath)}" alt="Review #${String(item.index).padStart(3, "0")}">
          </a>
          <div class="meta">
            <strong>${escapeHtml(item.locationId)}</strong>
            <span>${escapeHtml([item.city, item.country].filter(Boolean).join(", "))}</span>
            <small>${escapeHtml((item.reasons ?? []).join(", "))}</small>
            <code>${escapeHtml(metricText)}</code>
          </div>
        </article>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GeoExplorer · review de imagens</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, Arial, sans-serif; background: #05080d; color: #f4f7fb; }
    body { margin: 0; padding: 24px; background: #05080d; }
    header { display: grid; gap: 10px; margin-bottom: 20px; }
    h1 { margin: 0; font-size: clamp(26px, 4vw, 48px); letter-spacing: -0.04em; }
    p { margin: 0; color: #9aa3ad; }
    button { min-height: 40px; border: 1px solid rgba(209,255,38,.35); background: rgba(209,255,38,.12); color: #d1ff26; font-weight: 800; cursor: pointer; }
    textarea { min-height: 110px; width: min(900px, 100%); border: 1px solid #28313c; background: #0b1016; color: #f4f7fb; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; }
    .card { border: 1px solid #202a35; background: #0b1016; padding: 10px; display: grid; gap: 9px; }
    .select-row { display: flex; align-items: center; gap: 8px; color: #9aa3ad; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
    .select-row strong { color: #d1ff26; }
    img { width: 100%; display: block; background: #151922; }
    .meta { display: grid; gap: 4px; font-size: 12px; color: #9aa3ad; }
    .meta strong { color: #f4f7fb; overflow-wrap: anywhere; }
    .meta code { color: #d1ff26; white-space: normal; }
  </style>
</head>
<body>
  <header>
    <h1>GeoExplorer · review de imagens</h1>
    <p>${items.length} imagens marcadas para revisão · gerado em ${escapeHtml(generatedAt)}</p>
    <div class="actions">
      <button type="button" id="copyKeys">Copiar keys selecionadas</button>
      <button type="button" id="copyLocations">Copiar locationIds selecionados</button>
      <span id="count">0 selecionadas</span>
    </div>
    <textarea id="selectedOutput" readonly placeholder="As imagens marcadas aparecem aqui."></textarea>
  </header>
  <main class="grid">${cards}</main>
  <script>
    const checks = [...document.querySelectorAll('input[type="checkbox"]')];
    const output = document.querySelector('#selectedOutput');
    const count = document.querySelector('#count');
    function selected(attr) {
      return checks.filter((check) => check.checked).map((check) => attr === 'value' ? check.value : check.dataset.locationId);
    }
    function update() {
      const values = selected('value');
      count.textContent = values.length + ' selecionadas';
      output.value = values.join('\\n');
    }
    checks.forEach((check) => check.addEventListener('change', update));
    document.querySelector('#copyKeys').addEventListener('click', async () => {
      update();
      await navigator.clipboard.writeText(output.value);
    });
    document.querySelector('#copyLocations').addEventListener('click', async () => {
      const values = selected('locationId');
      output.value = values.join('\\n');
      count.textContent = values.length + ' selecionadas';
      await navigator.clipboard.writeText(output.value);
    });
  </script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const reportPath = path.resolve(options.report);
  const outputDir = path.resolve(options.output);
  const downloadsDir = path.join(outputDir, "downloads");
  const thumbsDir = path.join(outputDir, "thumbs");
  const sheetsDir = path.join(outputDir, "sheets");

  if (!existsSync(reportPath)) {
    throw new Error(`Relatório não encontrado: ${reportPath}`);
  }

  if (!(await commandExists("magick"))) {
    throw new Error("ImageMagick 'magick' não está instalado.");
  }

  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const reviewItems = (report.review ?? []).slice(0, options.maxItems);

  await mkdir(downloadsDir, { recursive: true });
  await mkdir(thumbsDir, { recursive: true });
  await mkdir(sheetsDir, { recursive: true });

  const generatedItems = await mapWithConcurrency(reviewItems, options.concurrency, async (item, index) => {
    const number = String(index + 1).padStart(3, "0");
    const keyHash = createHash("sha1").update(item.key).digest("hex").slice(0, 10);
    const baseName = `${number}-${slug(item.locationId).slice(0, 50)}-${keyHash}`;
    const sourcePath = path.join(downloadsDir, `${baseName}.img`);
    const thumbPath = path.join(thumbsDir, `${baseName}.png`);

    try {
      await downloadImage(item, sourcePath, options.baseUrl, options.cache);
      await createThumbnail({ item, index, sourcePath, thumbPath });
    } catch (error) {
      await createPlaceholder({
        item,
        index,
        thumbPath,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }

    return {
      ...item,
      index: index + 1,
      thumbPath,
      thumbRelativePath: path.relative(outputDir, thumbPath),
    };
  });

  const sheetSize = SHEET_COLUMNS * SHEET_ROWS;
  const sheetFiles = [];

  for (let start = 0; start < generatedItems.length; start += sheetSize) {
    const page = Math.floor(start / sheetSize) + 1;
    const pageItems = generatedItems.slice(start, start + sheetSize);
    const sheetPath = path.join(sheetsDir, `review-sheet-${String(page).padStart(2, "0")}.png`);

    await createContactSheet(pageItems.map((item) => item.thumbPath), sheetPath);
    sheetFiles.push(sheetPath);
  }

  await writeFile(
    path.join(outputDir, "review-items.json"),
    JSON.stringify(generatedItems.map(({ thumbPath, ...item }) => item), null, 2)
  );
  await writeFile(path.join(outputDir, "index.html"), renderHtml(generatedItems, new Date().toISOString()));

  if (!options.keepDownloads) {
    await rm(downloadsDir, { recursive: true, force: true });
  }

  console.log(JSON.stringify({
    outputDir,
    html: path.join(outputDir, "index.html"),
    sheets: sheetFiles,
    items: generatedItems.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
