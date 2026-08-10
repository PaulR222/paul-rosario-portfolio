import type { Metadata } from "next";
import Link from "next/link";
import photosData from "../../src/data/photos.json";
import type { Photo } from "../../src/types/photo";

export const metadata: Metadata = {
  title: "Photography — Paul Rosario",
  description: "A personal photography archive by Paul Rosario.",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function dateValue(date?: string) {
  if (!date) return Number.NEGATIVE_INFINITY;
  const value = Date.parse(date);
  return Number.isNaN(value) ? Number.NEGATIVE_INFINITY : value;
}

function humanDate(date?: string) {
  const value = dateValue(date);
  return value === Number.NEGATIVE_INFINITY ? "Date unknown" : dateFormatter.format(value);
}

function imageAlt(photo: Photo) {
  return photo.alt || photo.caption || `Photograph taken in ${photo.location || "an unknown location"}`;
}

export default function PhotographyPage() {
  const photos = (photosData as Photo[]).toSorted((a, b) => dateValue(b.dateTaken) - dateValue(a.dateTaken));

  return (
    <main className="photo-page">
      <header className="photo-header">
        <Link className="photo-wordmark" href="/" aria-label="Paul R Photography — return to portfolio">
          Paul R Photography
        </Link>
      </header>

      {photos.length ? (
        <section className="photo-grid" aria-label="Photography archive">
          {photos.map((photo, index) => {
            const location = photo.location?.trim() || "Unknown location";
            const variants = photo.variants?.toSorted((a, b) => a.width - b.width);
            const srcSet = variants?.map((variant) => `${variant.src} ${variant.width}w`).join(", ");
            const cameraLine = [photo.camera, photo.lens].filter(Boolean).join(" · ");

            return (
              <article className={`photo-entry photo-entry--layer-${(index % 3) + 1}`} key={photo.id}>
                <figure className="photo-figure">
                  <div className="photo-frame">
                    <span className="photo-number" data-archive-number={String(photo.archiveNumber).padStart(3, "0")}>
                      #{String(photo.archiveNumber).padStart(3, "0")}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.src}
                      srcSet={srcSet}
                      sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1200px) 46vw, 560px"
                      width={photo.width}
                      height={photo.height}
                      alt={imageAlt(photo)}
                      loading={index < 2 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  </div>
                  <figcaption>
                    {photo.caption && <p className="photo-caption">{photo.caption}</p>}
                    <p className="photo-primary-meta">{location} <span aria-hidden="true">·</span> {humanDate(photo.dateTaken)}</p>
                    {cameraLine && <p className="photo-secondary-meta">{cameraLine}</p>}
                  </figcaption>
                </figure>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="photo-empty" aria-label="Empty photography archive">
          <p>Archive in progress.</p>
        </section>
      )}
    </main>
  );
}
