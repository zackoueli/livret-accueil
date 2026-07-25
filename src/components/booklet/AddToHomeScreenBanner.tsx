"use client";

import { useEffect, useState } from "react";
import { X, Share, PlusSquare } from "lucide-react";

const DISMISS_KEY = "hideAddToHomeScreenBanner";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function AddToHomeScreenBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || !isIos()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 flex items-start gap-3 rounded-2xl bg-neutral-900/95 p-4 text-white shadow-lg backdrop-blur">
      <div className="flex-1 text-sm leading-snug">
        Pour profiter du plein écran, ajoute ce livret à ton écran d&apos;accueil :
        appuie sur <Share className="mx-1 inline h-4 w-4 -translate-y-0.5" aria-hidden />
        puis choisis <PlusSquare className="mx-1 inline h-4 w-4 -translate-y-0.5" aria-hidden />{" "}
        &laquo; Sur l&apos;écran d&apos;accueil &raquo;.
      </div>
      <button
        onClick={dismiss}
        aria-label="Fermer"
        className="shrink-0 rounded-full p-1 text-white/70 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
