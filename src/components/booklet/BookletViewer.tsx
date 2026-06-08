"use client";

import { Booklet } from "@/types";
import { ViewerSimple } from "./ViewerSimple";
import { ViewerGrid } from "./ViewerGrid";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";
import { useBookletTracking } from "./useBookletTracking";

export function BookletViewer({ booklet }: { booklet: Booklet }) {
  const { trackSection } = useBookletTracking(booklet.id);

  return (
    <>
      {booklet.templateId === "grid"
        ? <ViewerGrid booklet={booklet} onTabChange={trackSection} />
        : <ViewerSimple booklet={booklet} onTabChange={trackSection} />}
      <ChatbotWidget booklet={booklet} />
    </>
  );
}
