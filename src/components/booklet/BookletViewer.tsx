"use client";

import { Booklet } from "@/types";
import { ViewerSimple } from "./ViewerSimple";

export function BookletViewer({ booklet }: { booklet: Booklet }) {
  // Pour l'instant un seul template — d'autres viendront
  return <ViewerSimple booklet={booklet} />;
}
