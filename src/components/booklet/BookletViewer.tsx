"use client";

import { Booklet } from "@/types";
import { ViewerSimple } from "./ViewerSimple";
import { ViewerGrid } from "./ViewerGrid";

export function BookletViewer({ booklet }: { booklet: Booklet }) {
  if (booklet.templateId === "grid") return <ViewerGrid booklet={booklet} />;
  return <ViewerSimple booklet={booklet} />;
}
