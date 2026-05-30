"use client";

import { Booklet } from "@/types";
import { MODULE_META, formatTime } from "@/lib/modules";

export function BookletViewer({ booklet }: { booklet: Booklet }) {
  const enabled = [...booklet.modules]
    .filter((m) => m.enabled)
    .sort((a, b) => a.order - b.order);

  const accent = booklet.accentColor ?? "#f97316";
  const g = (moduleId: string, key: string) => {
    const mod = booklet.modules.find((m) => m.id === moduleId);
    if (!mod) return "";
    return mod.content[key] ?? "";
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="px-5 pt-10 pb-6 text-white" style={{ backgroundColor: accent }}>
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Livret d'accueil</p>
        <h1 className="text-2xl font-black leading-tight">{booklet.propertyName || booklet.title}</h1>
        {booklet.address && <p className="text-sm opacity-70 mt-1">{booklet.address}</p>}
      </div>

      {/* Modules */}
      <div className="px-4 py-6 space-y-4">
        {enabled.map((mod) => {
          const meta = MODULE_META[mod.type];
          const hasContent = Object.keys(mod.content).some((k) => mod.content[k]);
          return (
            <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-50">
                <span className="text-2xl">{meta.emoji}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{meta.label}</p>
                  <p className="text-xs text-gray-400">{meta.description}</p>
                </div>
              </div>
              {hasContent && (
                <div className="px-4 py-4 space-y-3">
                  {Object.entries(mod.content).map(([key, val]) =>
                    val ? (
                      <div key={key}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                          {key.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {key.includes("time") ? formatTime(val) : val}
                        </p>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
