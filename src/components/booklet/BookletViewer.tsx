"use client";

import { Booklet } from "@/types";
import { ViewerSimple } from "./ViewerSimple";
import { ViewerGrid } from "./ViewerGrid";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";

export function BookletViewer({ booklet }: { booklet: Booklet }) {
  return (
    <>
      {booklet.templateId === "grid" ? <ViewerGrid booklet={booklet} /> : <ViewerSimple booklet={booklet} />}
      <ChatbotWidget booklet={booklet} />
    </>
  );
}
