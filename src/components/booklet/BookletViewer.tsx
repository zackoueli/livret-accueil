"use client";

import { Booklet } from "@/types";
import { ViewerSimple } from "./ViewerSimple";
import { ViewerGrid } from "./ViewerGrid";
import { ViewerPastel } from "./ViewerPastel";
import { useBookletTracking } from "./useBookletTracking";

const VIEWERS: Record<string, typeof ViewerSimple> = {
  simple: ViewerSimple,
  grid: ViewerGrid,
  pastel: ViewerPastel,
};

export function BookletViewer({ booklet }: { booklet: Booklet }) {
  const { trackSection } = useBookletTracking(booklet.id);
  const Viewer = VIEWERS[booklet.templateId ?? "simple"] ?? ViewerSimple;

  return <Viewer booklet={booklet} onTabChange={trackSection} />;
}
