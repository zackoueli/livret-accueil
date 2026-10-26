"use client";

import { Booklet, SupportedLang } from "@/types";
import { ViewerSimple } from "./ViewerSimple";
import { ViewerGrid } from "./ViewerGrid";
import { ViewerPastel } from "./ViewerPastel";
import { ViewerClean } from "./ViewerClean";
import { useBookletTracking } from "./useBookletTracking";
import { AddToHomeScreenBanner } from "./AddToHomeScreenBanner";
import { InitialLangCtx } from "./langContext";

const VIEWERS: Record<string, typeof ViewerSimple> = {
  simple: ViewerSimple,
  grid: ViewerGrid,
  pastel: ViewerPastel,
  clean: ViewerClean,
};

export function BookletViewer({ booklet, initialLang }: { booklet: Booklet; initialLang?: SupportedLang }) {
  const { trackSection } = useBookletTracking(booklet.id);
  const Viewer = VIEWERS[booklet.templateId ?? "simple"] ?? ViewerSimple;

  return (
    <InitialLangCtx.Provider value={initialLang ?? null}>
      <Viewer booklet={booklet} onTabChange={trackSection} />
      <AddToHomeScreenBanner />
    </InitialLangCtx.Provider>
  );
}
