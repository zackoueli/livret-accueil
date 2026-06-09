"use client";

import { Booklet } from "@/types";
import { ViewerSimple } from "./ViewerSimple";
import { ViewerGrid } from "./ViewerGrid";
import { useBookletTracking } from "./useBookletTracking";

export function BookletViewer({ booklet }: { booklet: Booklet }) {
  const { trackSection } = useBookletTracking(booklet.id);

  return (
    <>
      {booklet.templateId === "grid"
        ? <ViewerGrid booklet={booklet} onTabChange={trackSection} />
        : <ViewerSimple booklet={booklet} onTabChange={trackSection} />}
    </>
  );
}
