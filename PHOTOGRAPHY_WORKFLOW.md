# Photography workflow

The photography archive lives at `/photography`. It is intentionally absent from the main navigation; the small wordmark on the archive links back to the portfolio.

## Storage and schema

- Optimized images: `public/photography/<year>/`
- Metadata: `src/data/photos.json`
- Type definition: `src/types/photo.ts`

Each JSON record requires `id` and `src`. It can also contain `width`, `height`, `dateTaken` (ISO 8601), `location`, `camera`, `lens`, `caption`, `alt`, `album`, `featured`, generated responsive `variants`, and `sourceHash`. The page sorts valid dates newest-first; undated photos appear last. Never publish latitude or longitude. `sourceHash` prevents the same source image from being imported twice.

## Import photographs

Keep originals outside this repository, then run:

```bash
pnpm photos:import -- ./incoming-photos
pnpm photos:validate
pnpm build
```

The importer accepts one supported image or a folder (including nested folders). It reads EXIF capture date, GPS, camera, lens, and dimensions; corrects EXIF orientation; creates quality WebP sizes up to the source width; writes stable web-safe filenames; updates the JSON data; skips duplicate source hashes; reports missing fields; and continues after individual failures. It never changes or deletes the original input.

Filenames follow `YYYY-MM-DD-location-sequence-width.webp`, for example `2026-04-14-austin-texas-001-1600w.webp`. Photos without dates use the import date in an `undated` folder.

### Location and privacy

Coordinates are used only in memory during import and are not written to photo metadata. Without a geocoding key, the public location becomes `Unknown location`. To enable approximate OpenCage reverse geocoding, copy `.env.example` to `.env.local`, add `GEOCODING_API_KEY`, and load it in your shell before importing. The importer keeps only a city/park/county plus state/country—never an address or exact coordinates.

Review every generated location. Override it by editing `location` in `src/data/photos.json`; this will not be overwritten later. Also replace generated `alt` text with a concise visual description and add a `caption` when useful.

## Manual additions and removal

To add a photo manually, place web-ready files under `public/photography/<year>/` and add one record to `src/data/photos.json`. Include intrinsic dimensions to prevent layout shift. Run `pnpm photos:validate` afterward.

To remove a photo, delete its JSON record and all files listed by its `src` and `variants`. The original source remains wherever you stored it. Validation catches leftover broken references, malformed dates/dimensions, duplicate IDs/hashes, and missing local files.

## Commit, review, and deployment

The preferred workflow provides a preview and rollback point:

```bash
git switch -c photos/upload-YYYY-MM-DD
pnpm photos:validate && pnpm lint && pnpm typecheck && pnpm build && pnpm test
git add public/photography src/data/photos.json
git commit -m "Add photography upload YYYY-MM-DD"
git push -u origin photos/upload-YYYY-MM-DD
```

Open a pull request, review the host's preview deployment, then merge. The photography GitHub Action checks metadata, image references, lint, types, and the production build. It uses read-only `contents` permission and never commits generated files.

With direct repository access, Codex may instead validate, commit, and push to the configured production branch. Grant only repository **Contents: read and write**; for the preferred PR workflow, also grant **Pull requests: read and write**. No administration, secrets, issues, or organization permissions are needed. Use a short-lived fine-grained token or installed GitHub App scoped to this repository. Never store credentials in source code.

This project uses OpenAI Sites with Cloudflare-compatible output (`.openai/hosting.json` and `vite.config.ts`). Publishing through Sites or merging to a Git-connected production branch deploys the existing site; confirm the production branch and automatic-deployment setting in the host before relying on merge-to-deploy.

## Future Codex instruction

> Add the attached photographs to my photography website. Preserve the originals, extract available EXIF metadata, use approximate locations only, generate web-safe filenames and responsive images, update the repository metadata, validate lint/types/tests/build, and prepare a pull-request-ready Git commit. Do not publish exact GPS coordinates or secrets.

Before Codex can push directly, the folder must be a Git clone with a configured GitHub remote, the environment must have authenticated repository access, and the hosting project must be connected to the intended production branch. None of those credentials belong in this repository.
