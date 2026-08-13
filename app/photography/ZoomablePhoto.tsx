"use client";

import { useEffect, useRef, useState } from "react";

type ZoomablePhotoProps = {
  src: string;
  srcSet?: string;
  sizes: string;
  width?: number;
  height?: number;
  alt: string;
  eager: boolean;
};

const DOUBLE_TAP_DELAY = 320;

export default function ZoomablePhoto({ src, srcSet, sizes, width, height, alt, eager }: ZoomablePhotoProps) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const lastTap = useRef(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistance = useRef<number | undefined>(undefined);
  const pinchScale = useRef(1);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function openViewer() {
    setScale(1);
    setOpen(true);
  }

  function handleTouchEnd() {
    const now = Date.now();
    if (now - lastTap.current <= DOUBLE_TAP_DELAY) {
      lastTap.current = 0;
      openViewer();
    } else {
      lastTap.current = now;
    }
  }

  function pointerDistance() {
    const [first, second] = [...pointers.current.values()];
    return first && second ? Math.hypot(second.x - first.x, second.y - first.y) : undefined;
  }

  return (
    <>
      <div
        className="photo-zoom-trigger"
        role="button"
        tabIndex={0}
        aria-label={`Open enlarged view of ${alt}`}
        onDoubleClick={openViewer}
        onTouchEnd={handleTouchEnd}
        onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && openViewer()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} srcSet={srcSet} sizes={sizes} width={width} height={height} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} />
      </div>

      {open && (
        <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label={`Enlarged view of ${alt}`} onClick={() => setOpen(false)}>
          <button className="photo-lightbox-close" type="button" aria-label="Close enlarged photo" onClick={() => setOpen(false)}>×</button>
          <div
            className="photo-lightbox-stage"
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={() => setScale((value) => value > 1 ? 1 : 2.5)}
            onWheel={(event) => {
              event.preventDefault();
              setScale((value) => Math.min(5, Math.max(1, value - event.deltaY * .002)));
            }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
              if (pointers.current.size === 2) {
                pinchDistance.current = pointerDistance();
                pinchScale.current = scale;
              }
            }}
            onPointerMove={(event) => {
              if (!pointers.current.has(event.pointerId)) return;
              pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
              const distance = pointerDistance();
              if (distance && pinchDistance.current) setScale(Math.min(5, Math.max(1, pinchScale.current * distance / pinchDistance.current)));
            }}
            onPointerUp={(event) => {
              pointers.current.delete(event.pointerId);
              pinchDistance.current = undefined;
            }}
            onPointerCancel={(event) => {
              pointers.current.delete(event.pointerId);
              pinchDistance.current = undefined;
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} srcSet={srcSet} sizes="100vw" width={width} height={height} alt={alt} draggable={false} style={{ transform: `scale(${scale})` }} />
          </div>
        </div>
      )}
    </>
  );
}
