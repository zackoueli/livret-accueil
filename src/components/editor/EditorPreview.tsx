"use client";

import { useEffect, useRef, useState } from "react";
import { Smartphone, Monitor, RefreshCw } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

export function EditorPreview() {
  const { booklet } = useEditorStore();
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Dimensions cibles selon device
  const TARGET = device === "mobile"
    ? { w: 390, h: 844 }   // iPhone 14 Pro
    : { w: 1280, h: 800 };

  // Calcule le scale pour que l'iframe rentre dans le conteneur
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const available = { w: el.clientWidth - 32, h: el.clientHeight - 32 };
      const scaleW = available.w / TARGET.w;
      const scaleH = available.h / TARGET.h;
      setScale(Math.min(scaleW, scaleH, 1));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [device]);

  // Recharge l'iframe quand le booklet change
  useEffect(() => {
    if (!booklet) return;
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        try {
          iframeRef.current.contentWindow?.location.reload();
        } catch {
          setKey((k) => k + 1);
        }
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [
    booklet?.templateId,
    booklet?.paletteId,
    booklet?.customPalette,
    booklet?.coverImage,
    booklet?.splashConfig,
    booklet?.propertyName,
  ]);

  if (!booklet?.slug) {
    return (
      <aside className="w-full lg:w-80 bg-gray-100 border-l border-gray-200 flex flex-col items-center justify-center shrink-0">
        <p className="text-xs text-gray-400 text-center px-6">
          Définissez un slug dans les réglages pour activer l'aperçu.
        </p>
      </aside>
    );
  }

  const url = `/b/${booklet.slug}`;

  return (
    <aside className="w-full lg:w-80 bg-gray-100 border-l border-gray-200 flex flex-col shrink-0">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aperçu</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setKey((k) => k + 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors" title="Rafraîchir">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setDevice("mobile")}
              className={`p-1.5 rounded-md transition-colors ${device === "mobile" ? "bg-white shadow-sm text-orange-500" : "text-gray-400"}`}>
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setDevice("desktop")}
              className={`p-1.5 rounded-md transition-colors ${device === "desktop" ? "bg-white shadow-sm text-orange-500" : "text-gray-400"}`}>
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Conteneur du preview */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <div
          style={{
            width: TARGET.w,
            height: TARGET.h,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            flexShrink: 0,
          }}>
          {/* Cadre device */}
          <div className={`w-full h-full overflow-hidden shadow-2xl ${
            device === "mobile"
              ? "rounded-[44px] border-[10px] border-gray-800"
              : "rounded-xl border border-gray-300"
          }`}>
            {/* Notch mobile */}
            {device === "mobile" && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-2xl z-10" />
            )}
            <iframe
              key={key}
              ref={iframeRef}
              src={url}
              className="w-full h-full border-0 bg-white"
              style={{ display: "block" }}
              title="Aperçu du livret"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
