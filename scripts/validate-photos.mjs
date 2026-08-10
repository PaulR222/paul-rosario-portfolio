import path from "node:path";
import { exists, publicFilePath, readPhotos } from "./photo-utils.mjs";

const errors = [];
const photos = await readPhotos().catch((error) => {
  errors.push(`Cannot read photo data: ${error.message}`);
  return [];
});

if (!Array.isArray(photos)) errors.push("src/data/photos.json must contain an array.");
const ids = new Set();
const hashes = new Set();
const archiveNumbers = new Set();

for (const [index, photo] of (Array.isArray(photos) ? photos : []).entries()) {
  const label = `Photo ${index + 1}`;
  if (!photo || typeof photo !== "object") { errors.push(`${label} must be an object.`); continue; }
  if (!photo.id || typeof photo.id !== "string") errors.push(`${label} has no valid id.`);
  else if (ids.has(photo.id)) errors.push(`${label} duplicates id "${photo.id}".`);
  else ids.add(photo.id);
  if (!Number.isInteger(photo.archiveNumber) || photo.archiveNumber <= 0) errors.push(`${label} has no valid archiveNumber.`);
  else if (archiveNumbers.has(photo.archiveNumber)) errors.push(`${label} duplicates archiveNumber ${photo.archiveNumber}.`);
  else archiveNumbers.add(photo.archiveNumber);
  if (photo.sourceHash) {
    if (hashes.has(photo.sourceHash)) errors.push(`${label} duplicates an existing sourceHash.`);
    hashes.add(photo.sourceHash);
  }
  if (!photo.src || typeof photo.src !== "string") errors.push(`${label} has no valid src.`);
  else if (/^https?:\/\//.test(photo.src)) {
    // Hosted URLs are allowed; availability is intentionally not network-checked.
  } else {
    const file = publicFilePath(photo.src);
    if (!file) errors.push(`${label} uses an unsafe or unsupported local src: ${photo.src}`);
    else if (!(await exists(file))) errors.push(`${label} references a missing file: ${path.relative(process.cwd(), file)}`);
  }
  if (photo.dateTaken && Number.isNaN(Date.parse(photo.dateTaken))) errors.push(`${label} has an invalid dateTaken value.`);
  for (const field of ["width", "height"]) if (photo[field] != null && (!Number.isInteger(photo[field]) || photo[field] <= 0)) errors.push(`${label} has an invalid ${field}.`);
  for (const variant of photo.variants || []) {
    const file = publicFilePath(variant.src);
    if (!file || !(await exists(file))) errors.push(`${label} has a missing or unsafe variant: ${variant.src}`);
  }
}

if (errors.length) {
  console.error(`Photography validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Photography collection is valid (${photos.length} photo${photos.length === 1 ? "" : "s"}).`);
}
