import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import exifr from "exifr";
import sharp from "sharp";
import { dataPath, projectRoot, readPhotos, sortPhotos, supportedExtensions } from "./photo-utils.mjs";

const input = process.argv.slice(2).find((argument) => argument !== "--");
if (!input) {
  console.error("Usage: npm run photos:import -- <image-or-folder>");
  process.exit(1);
}

async function collectFiles(candidate) {
  const absolute = path.resolve(candidate);
  const stat = await import("node:fs/promises").then(({ stat }) => stat(absolute));
  if (stat.isFile()) return supportedExtensions.has(path.extname(absolute).toLowerCase()) ? [absolute] : [];
  const entries = await readdir(absolute, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => collectFiles(path.join(absolute, entry.name))));
  return nested.flat();
}

function cleanSegment(value, fallback = "unknown-location") {
  return String(value || fallback).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || fallback;
}

function isoDate(value) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

async function approximateLocation(latitude, longitude) {
  const key = process.env.GEOCODING_API_KEY;
  if (!key || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  const url = new URL("https://api.opencagedata.com/geocode/v1/json");
  url.searchParams.set("q", `${latitude},${longitude}`);
  url.searchParams.set("key", key);
  url.searchParams.set("no_annotations", "1");
  url.searchParams.set("language", "en");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Geocoding returned HTTP ${response.status}`);
  const components = (await response.json()).results?.[0]?.components;
  if (!components) return undefined;
  const locality = components.national_park || components.city || components.town || components.village || components.county;
  const region = components.state || components.country;
  return [locality, region].filter(Boolean).filter((part, index, list) => list.indexOf(part) === index).slice(0, 2).join(", ") || undefined;
}

const files = await collectFiles(input);
const photos = await readPhotos();
const knownHashes = new Set(photos.map((photo) => photo.sourceHash).filter(Boolean));
let nextArchiveNumber = Math.max(0, ...photos.map((photo) => photo.archiveNumber || 0)) + 1;
let imported = 0;
let skipped = 0;
let failed = 0;

for (const file of files) {
  try {
    const source = await readFile(file);
    const sourceHash = createHash("sha256").update(source).digest("hex");
    if (knownHashes.has(sourceHash)) { console.log(`SKIP ${file} (already imported)`); skipped += 1; continue; }

    const exif = await exifr.parse(source, { gps: true, tiff: true, exif: true }).catch(() => ({}));
    const dateTaken = isoDate(exif?.DateTimeOriginal || exif?.CreateDate || exif?.ModifyDate);
    let location;
    try { location = await approximateLocation(exif?.latitude, exif?.longitude); } catch (error) { console.warn(`WARN ${path.basename(file)}: ${error.message}`); }
    const datePrefix = dateTaken?.slice(0, 10) || new Date().toISOString().slice(0, 10);
    const year = dateTaken?.slice(0, 4) || "undated";
    const locationSlug = cleanSegment(location);
    const outputDirectory = path.join(projectRoot, "public", "photography", year);
    await mkdir(outputDirectory, { recursive: true });

    let sequence = 1;
    let stem;
    do { stem = `${datePrefix}-${locationSlug}-${String(sequence++).padStart(3, "0")}`; }
    while (photos.some((photo) => photo.src.includes(`/${stem}.`)));

    const normalized = sharp(source).rotate();
    const metadata = await normalized.metadata();
    const widths = [960, 1600, 2400].filter((width) => width < (metadata.width || 2401));
    if (metadata.width && !widths.includes(metadata.width)) widths.push(metadata.width);
    const variantWidths = [...new Set(widths)].sort((a, b) => a - b);
    const variants = [];
    for (const width of variantWidths) {
      const filename = `${stem}-${width}w.webp`;
      await normalized.clone().resize({ width, withoutEnlargement: true }).webp({ quality: 88, effort: 5 }).toFile(path.join(outputDirectory, filename));
      variants.push({ src: `/photography/${year}/${filename}`, width });
    }
    const primary = variants.at(-1);
    const primaryHeight = metadata.width && metadata.height ? Math.round(metadata.height * primary.width / metadata.width) : undefined;
    const make = exif?.Make?.trim();
    const model = exif?.Model?.trim();
    const camera = [make, model].filter(Boolean).filter((part, index, list) => index === 0 || part.toLowerCase() !== list[0].toLowerCase()).join(" ") || undefined;

    photos.push({
      id: `photo_${randomUUID()}`,
      archiveNumber: nextArchiveNumber++,
      src: primary.src,
      width: primary.width,
      height: primaryHeight,
      ...(dateTaken && { dateTaken }),
      location: location || "Unknown location",
      ...(camera && { camera }),
      ...(exif?.LensModel && { lens: String(exif.LensModel).trim() }),
      alt: location ? `Photograph taken in ${location}` : "Photograph from Paul Rosario's archive",
      variants,
      sourceHash,
    });
    knownHashes.add(sourceHash);
    imported += 1;
    const missing = [!dateTaken && "capture date", !location && "location", !camera && "camera", !exif?.LensModel && "lens"].filter(Boolean);
    console.log(`ADD  ${path.basename(file)} -> ${path.relative(projectRoot, path.join(outputDirectory, path.basename(primary.src)))}`);
    if (missing.length) console.warn(`WARN ${path.basename(file)}: missing ${missing.join(", ")}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${file}: ${error.message}`);
  }
}

if (imported) await writeFile(dataPath, `${JSON.stringify(sortPhotos(photos), null, 2)}\n`);
console.log(`\nDone: ${imported} imported, ${skipped} skipped, ${failed} failed.`);
if (failed) process.exitCode = 1;
