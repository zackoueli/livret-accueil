"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check, Sparkles } from "lucide-react";
import { TEMPLATES } from "@/lib/templates";
import { useEditorStore } from "@/store/editorStore";

interface Props {
  onClose: () => void;
}

export function TemplateSelector({ onClose }: Props) {
  const { booklet, updateBookletField } = useEditorStore();
  const [selected, setSelected] = useState(booklet?.templateId ?? "hostin");
  const [iframeKey, setIframeKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);

  const slug = booklet?.slug;

  // Calcule le scale pour fitter l'iframe dans le conteneur
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const w = el.clientWidth;
      setScale(w / 390);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Recharge l'iframe quand on change de template
  useEffect(() => {
    setIframeKey((k) => k + 1);
  }, [selected]);

  const apply = () => {
    updateBookletField("templateId", selected);
    onClose();
  };

  const current = TEMPLATES.find((t) => t.id === selected);

  // Descriptions visuelles par template
  const PREVIEWS: Record<string, { bg: string; lines: string[] }> = {
    jade:     { bg: "#ffffff", lines: ["#f8f9fa", "#e5e7eb", "#f8f9fa"] },
    oree:     { bg: "#f5f0e8", lines: ["#e8e0d4", "#f5f0e8", "#e8e0d4"] },
    hostin:   { bg: "#f2f2f7", lines: ["#ffffff", "#f2f2f7", "#ffffff"] },
    app:      { bg: "#0d1b2a", lines: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.12)"] },
    tempo:    { bg: "#f5f0e8", lines: ["#e8ddd0", "#ffffff", "#e8ddd0"] },
    nature:   { bg: "#faf7f2", lines: ["#f0ebe3", "#faf7f2", "#f0ebe3"] },
    magazine: { bg: "#0f1a14", lines: ["rgba(200,232,107,0.3)", "rgba(255,255,255,0.08)", "rgba(200,232,107,0.2)"] },
    moderne:  { bg: "#fff7ed", lines: ["#fed7aa", "#ffffff", "#fed7aa"] },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Choisir un template</h2>
              <p className="text-xs text-gray-400">Design et structure du livret</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Liste + Preview */}
        <div className="flex flex-1 overflow-hidden">

          {/* Liste templates */}
          <div className="w-56 border-r border-gray-100 overflow-y-auto p-3 shrink-0">
            {TEMPLATES.map((tpl) => {
              const active = selected === tpl.id;
              return (
                <button key={tpl.id} onClick={() => setSelected(tpl.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl mb-1 text-left transition-all ${
                    active ? "bg-orange-50 border border-orange-200" : "hover:bg-gray-50 border border-transparent"
                  }`}>
                  {/* Vignette */}
                  <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden border border-gray-100">
                    <div className="w-full h-full flex flex-col"
                      style={{ backgroundColor: PREVIEWS[tpl.id]?.bg ?? "#f5f5f5" }}>
                      {(PREVIEWS[tpl.id]?.lines ?? []).map((c, i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold truncate ${active ? "text-orange-600" : "text-gray-800"}`}>
                      {tpl.preview} {tpl.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{tpl.description}</p>
                  </div>
                  {active && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Aperçu iframe */}
          <div className="flex-1 bg-gray-100 flex flex-col overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aperçu</p>
              <p className="text-xs text-gray-400">{current?.name}</p>
            </div>

            {slug ? (
              <div ref={containerRef} className="flex-1 flex items-start justify-center px-4 pb-4 overflow-hidden">
                {/* Cadre iPhone */}
                <div className="relative rounded-[28px] overflow-hidden border-[6px] border-gray-800 shadow-2xl bg-white shrink-0"
                  style={{
                    width: 390 * scale,
                    height: 844 * scale,
                  }}>
                  <iframe
                    key={`${selected}-${iframeKey}`}
                    src={`/b/${slug}?templateOverride=${selected}`}
                    className="absolute top-0 left-0 origin-top-left border-0"
                    style={{
                      width: 390,
                      height: 844,
                      transform: `scale(${scale})`,
                      pointerEvents: "none",
                    }}
                    title="Aperçu template"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-white border border-gray-200">
                  {current?.preview}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-700">{current?.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{current?.description}</p>
                </div>
                <p className="text-xs text-gray-400 text-center bg-white rounded-xl px-3 py-2 border border-gray-200">
                  Définissez un slug dans les réglages pour voir l'aperçu en direct
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={apply}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: current?.accentColor ?? "#5B5BD6" }}>
            <Check className="w-4 h-4" /> Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}
