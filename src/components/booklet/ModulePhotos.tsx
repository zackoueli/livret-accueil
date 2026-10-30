"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { BookletModule } from "@/types";

/** Vrai si le module contient au moins une photo à afficher. */
export function hasPhotos(mod: BookletModule | undefined): boolean {
  return (mod?.images?.length ?? 0) > 0;
}

/**
 * Bandeau de photos d'un module (utilisé par tous les designs de livret).
 * Un clic ouvre la photo en plein écran, avec navigation entre les photos.
 */
export function ModulePhotos({ mod, images, radius = 14, style }: {
  mod?: BookletModule;
  images?: string[];
  radius?: number;
  style?: React.CSSProperties;
}) {
  const list = images ?? mod?.images ?? [];
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") setActive(i => (i === null ? i : (i + 1) % list.length));
      if (e.key === "ArrowLeft") setActive(i => (i === null ? i : (i - 1 + list.length) % list.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, list.length]);

  if (!list.length) return null;

  const single = list.length === 1;
  const navBtn: React.CSSProperties = {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    width: 40, height: 40, borderRadius: "50%", border: "none",
    background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  return (
    <>
      <div style={{
        display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", touchAction: "pan-x",
        ...style,
      }}>
        {list.map((url, i) => (
          <button key={url + i} type="button" onClick={() => setActive(i)}
            style={{
              flexShrink: 0, padding: 0, border: "none", cursor: "zoom-in", background: "#0000000a",
              width: single ? "100%" : 128, height: single ? 180 : 96,
              borderRadius: radius, overflow: "hidden",
            }}>
            <img src={url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </button>
        ))}
      </div>

      {active !== null && (
        <div onClick={() => setActive(null)}
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.94)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <img src={list[active]} alt="" onClick={e => e.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12, objectFit: "contain" }} />
          <button type="button" aria-label="Fermer" onClick={() => setActive(null)}
            style={{ ...navBtn, top: 20, right: 20, transform: "none" }}>
            <X size={20} />
          </button>
          {!single && (
            <>
              <button type="button" aria-label="Précédente"
                onClick={e => { e.stopPropagation(); setActive((active - 1 + list.length) % list.length); }}
                style={{ ...navBtn, left: 12 }}>
                <ChevronLeft size={22} />
              </button>
              <button type="button" aria-label="Suivante"
                onClick={e => { e.stopPropagation(); setActive((active + 1) % list.length); }}
                style={{ ...navBtn, right: 12 }}>
                <ChevronRight size={22} />
              </button>
              <span style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 13, opacity: 0.8 }}>
                {active + 1} / {list.length}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}
