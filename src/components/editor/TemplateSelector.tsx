"use client";

import { useState } from "react";
import { X, Check, Sparkles } from "lucide-react";
import { TEMPLATES, BookletTemplate } from "@/lib/templates";
import { useEditorStore } from "@/store/editorStore";

interface Props {
  onClose: () => void;
}

export function TemplateSelector({ onClose }: Props) {
  const { booklet, updateBookletField } = useEditorStore();
  const [selected, setSelected] = useState<string>(booklet?.templateId ?? "moderne");
  const [preview, setPreview] = useState<BookletTemplate>(
    TEMPLATES.find((t) => t.id === (booklet?.templateId ?? "moderne")) ?? TEMPLATES[2]
  );

  const applyTemplate = () => {
    const tpl = TEMPLATES.find((t) => t.id === selected);
    if (!tpl) return;
    // Applique le templateId + la couleur accent du template
    updateBookletField("templateId", tpl.id);
    updateBookletField("accentColor", tpl.accentColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Choisir un template</h2>
              <p className="text-sm text-gray-400 mt-0.5">Personnalisable après sélection</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Liste des templates */}
          <div className="w-56 border-r border-gray-100 overflow-y-auto p-3 shrink-0">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => { setSelected(tpl.id); setPreview(tpl); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl mb-1 text-left transition-all ${
                  selected === tpl.id
                    ? "bg-orange-50 border border-orange-200"
                    : "hover:bg-gray-50 border border-transparent"
                }`}>
                {/* Miniature couleur */}
                <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-xl"
                  style={{ backgroundColor: tpl.accentColor + "20", border: `2px solid ${tpl.accentColor}40` }}>
                  {tpl.preview}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${selected === tpl.id ? "text-orange-600" : "text-gray-800"}`}>
                    {tpl.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{tpl.description}</p>
                </div>
                {selected === tpl.id && (
                  <Check className="w-4 h-4 text-orange-500 shrink-0 ml-auto" />
                )}
              </button>
            ))}
          </div>

          {/* Prévisualisation */}
          <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Aperçu</p>

            {/* Splash simulé */}
            <div className="rounded-2xl overflow-hidden mb-3 shadow-md" style={{ height: 180 }}>
              <div className="w-full h-full relative flex flex-col justify-end p-4"
                style={{
                  backgroundColor: preview.accentColor,
                  background: `linear-gradient(to bottom, ${preview.accentColor}88, ${preview.accentColor})`,
                }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: preview.splashSubtitleColor, fontFamily: preview.fontFamily === "serif" ? "Georgia, serif" : "inherit" }}>
                  {preview.splashBadgeText}
                </p>
                <p className={`text-xl leading-tight mb-3 ${
                  preview.splashTitleWeight === "black" ? "font-black" :
                  preview.splashTitleWeight === "bold" ? "font-bold" :
                  preview.splashTitleWeight === "semibold" ? "font-semibold" : "font-normal"
                }`}
                  style={{
                    color: preview.splashTitleColor,
                    fontFamily: preview.fontFamily === "serif" ? "Georgia, serif" : "inherit",
                  }}>
                  Villa Les Lavandes
                </p>
                <div className="py-2 rounded-xl text-center text-sm font-bold"
                  style={{ backgroundColor: preview.splashButtonColor, color: preview.splashButtonTextColor }}>
                  {preview.splashButtonText}
                </div>
              </div>
            </div>

            {/* Home screen simulé */}
            <div className="rounded-2xl overflow-hidden shadow-md mb-3">
              <div className="px-4 py-3" style={{ backgroundColor: preview.headerBg }}>
                <p className="text-white font-bold text-sm">Villa Les Lavandes</p>
                <p className="text-white/60 text-xs">6 sections</p>
              </div>
              <div className="p-3 grid grid-cols-3 gap-2" style={{ backgroundColor: preview.moduleBg }}>
                {["👋 Bienvenue", "📋 Infos", "🗝️ Check-in", "📜 Règles", "🏠 Guide", "📞 Contacts"].map((m) => (
                  <div key={m} className="rounded-xl p-2.5 flex flex-col gap-1.5 border"
                    style={{
                      backgroundColor: preview.cardBg,
                      borderColor: preview.cardBorder,
                      borderRadius: preview.cardRadius === "full" ? "16px" : preview.cardRadius === "lg" ? "12px" : preview.cardRadius === "md" ? "8px" : preview.cardRadius === "sm" ? "4px" : "0",
                      boxShadow: preview.cardShadow ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    }}>
                    <span className="text-base">{m.split(" ")[0]}</span>
                    <p className="text-xs font-semibold text-gray-600 truncate">{m.split(" ").slice(1).join(" ")}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* InfoCard simulée */}
            <div className="rounded-xl border p-3 mb-1"
              style={{ backgroundColor: preview.infoBg, borderColor: preview.infoBorder }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
                  style={{ backgroundColor: preview.accentColor + "20" }}>📶</div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">WiFi</p>
              </div>
              <p className="text-sm font-bold" style={{ color: preview.accentColor }}>MonRéseau2024</p>
              <p className="text-xs text-gray-500 mt-0.5">Mot de passe : <span className="font-mono">motdepasse</span></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={applyTemplate}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: preview.accentColor }}>
            Appliquer ce template ✓
          </button>
        </div>
      </div>
    </div>
  );
}
