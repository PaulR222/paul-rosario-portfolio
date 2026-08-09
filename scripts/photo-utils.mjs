import { access, readFile } from "node:fs/promises";
import path from "node:path";

export const projectRoot = path.resolve(import.meta.dirname, "..");
export const dataPath = path.join(projectRoot, "src/data/photos.json");
export const publicRoot = path.join(projectRoot, "public");
export const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic", ".heif"]);

export async function readPhotos() {
  return JSON.parse(await readFile(dataPath, "utf8"));
}

export function publicFilePath(src) {
  if (!src.startsWith("/photography/") || src.includes("..")) return null;
  return path.join(publicRoot, src.slice(1));
}

export async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

export function sortPhotos(photos) {
  return photos.sort((a, b) => {
    const aTime = Date.parse(a.dateTaken || "") || 0;
    const bTime = Date.parse(b.dateTaken || "") || 0;
    return bTime - aTime || a.id.localeCompare(b.id);
  });
}
