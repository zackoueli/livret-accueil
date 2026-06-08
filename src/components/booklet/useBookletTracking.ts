"use client";

import { useEffect, useRef } from "react";

export function useBookletTracking(bookletId: string) {
  const tracked = useRef(false);

  // Track page view once on mount
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    fetch("/api/booklets/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookletId }),
    }).catch(() => {});
  }, [bookletId]);

  const trackSection = (section: string) => {
    fetch("/api/booklets/section-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookletId, section }),
    }).catch(() => {});
  };

  return { trackSection };
}
