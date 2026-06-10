"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

export function EditorPreview() {
  const { booklet } = useEditorStore();
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const TARGET = { w: 390, h: 844 };

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
  }, []);

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
    booklet?.coverImage,
    booklet?.propertyName,
    booklet?.accentColor,
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
    <aside className="w-full lg:w-80 bg-gray-100 border-l border-gray-200 flex flex-col shrink-0 sticky top-0 h-screen">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aperçu</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300 whitespace-nowrap">Pensez à rafraîchir →</span>
          <button onClick={() => setKey((k) => k + 1)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors text-xs font-medium whitespace-nowrap">
            <RefreshCw className="w-3 h-3 shrink-0" />
            <span>Rafraîchir</span>
          </button>
        </div>
      </div>

      {/* Conteneur du preview */}
      <div ref={containerRef} className="flex-1 overflow-hidden p-4" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: TARGET.w * scale,
          height: TARGET.h * scale,
          flexShrink: 0,
          position: "relative",
        }}>
        <div
          style={{
            width: TARGET.w,
            height: TARGET.h,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
          }}>
          {/* Cadre device */}
          <div className="w-full h-full overflow-hidden shadow-2xl rounded-[44px] border-[10px] border-gray-800">
            {/* Notch mobile */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-2xl z-10" />
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
      </div>
    </aside>
  );
}
