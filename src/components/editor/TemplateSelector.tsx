"use client";

import { useState } from "react";
import { X, Check, Sparkles, ChevronRight, Palette, Layout } from "lucide-react";
import { TEMPLATES } from "@/lib/templates";
import { PALETTES, patternToCss, BookletPalette, DEFAULT_PALETTE } from "@/lib/palettes";
import { useEditorStore } from "@/store/editorStore";

type Step = "template" | "palette";

const PATTERN_LABELS: Record<string, string> = {
  solid: "Uni",
  stripes: "Bandes",
  gradient: "Dégradé",
  circles: "Bulles",
};

const PATTERN_ICONS: Record<string, string> = {
  solid: "⬛",
  stripes: "🟫",
  gradient: "🌅",
  circles: "🔵",
};

interface Props {
  onClose: () => void;
}

export function TemplateSelector({ onClose }: Props) {
  const { booklet, updateBookletField } = useEditorStore();

  const [step, setStep] = useState<Step>("template");
  const [selectedTemplate, setSelectedTemplate] = useState(booklet?.templateId ?? "moderne");
  const [selectedPaletteId, setSelectedPaletteId] = useState(booklet?.paletteId ?? "creme");
  const [customColors, setCustomColors] = useState<Partial<BookletPalette>>(booklet?.customPalette ?? {});

  const currentPalette: BookletPalette = {
    ...PALETTES.find((p) => p.id === selectedPaletteId) ?? DEFAULT_PALETTE,
    ...customColors,
  };

  const apply = () => {
    const tpl = TEMPLATES.find((t) => t.id === selectedTemplate);
    if (!tpl) return;
    updateBookletField("templateId", tpl.id);
    updateBookletField("accentColor", currentPalette.primary);
    updateBookletField("paletteId", selectedPaletteId);
    if (Object.keys(customColors).length > 0) {
      updateBookletField("customPalette", customColors);
    }
    onClose();
  };

  const setCustomColor = (key: keyof BookletPalette, val: string) => {
    setCustomColors((prev) => ({ ...prev, [key]: val }));
  };

  const bgPreview = patternToCss(currentPalette);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Personnaliser l'apparence</h2>
              <p className="text-sm text-gray-400">Layout + couleurs + motifs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button onClick={() => setStep("template")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 ${
              step === "template" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            <Layout className="w-4 h-4" /> Layout
          </button>
          <button onClick={() => setStep("palette")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 ${
              step === "palette" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            <Palette className="w-4 h-4" /> Couleurs & Motifs
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* ── STEP TEMPLATE ─────────────────────────────────────────────────── */}
          {step === "template" && (
            <>
              <div className="w-52 border-r border-gray-100 overflow-y-auto p-3 shrink-0">
                {TEMPLATES.map((tpl) => (
                  <button key={tpl.id} onClick={() => setSelectedTemplate(tpl.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl mb-1 text-left transition-all ${
                      selectedTemplate === tpl.id ? "bg-orange-50 border border-orange-200" : "hover:bg-gray-50 border border-transparent"
                    }`}>
                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-xl"
                      style={{ backgroundColor: tpl.accentColor + "20", border: `2px solid ${tpl.accentColor}40` }}>
                      {tpl.preview}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold truncate ${selectedTemplate === tpl.id ? "text-orange-600" : "text-gray-800"}`}>
                        {tpl.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{tpl.description}</p>
                    </div>
                    {selectedTemplate === tpl.id && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Preview template */}
              <div className="flex-1 p-5 bg-gray-50 overflow-y-auto">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Aperçu du layout</p>
                <div className="rounded-2xl overflow-hidden shadow-md mb-3" style={{ height: 140 }}>
                  <div className="w-full h-full flex flex-col justify-end p-4"
                    style={{ background: bgPreview }}>
                    <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: currentPalette.primary }}>
                      {selectedTemplate === "magazine" ? "— Guide d'accueil" : "🌿 Bienvenue"}
                    </p>
                    <p className="text-lg font-black leading-none" style={{ color: currentPalette.text,
                      fontFamily: selectedTemplate === "nature" ? "Georgia, serif" : "inherit" }}>
                      Villa Les Lavandes
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-md">
                  <div className="px-4 py-3" style={{ backgroundColor: currentPalette.primary }}>
                    <p className="font-black text-white text-sm uppercase tracking-wide">Villa Les Lavandes</p>
                  </div>
                  {selectedTemplate === "moderne" ? (
                    <div className="p-3 grid grid-cols-2 gap-2" style={{ background: bgPreview }}>
                      {["👋 Bienvenue", "📋 Infos", "🗝️ Check-in", "📞 Contacts"].map((m) => (
                        <div key={m} className="rounded-2xl p-3 flex flex-col gap-1.5"
                          style={{ backgroundColor: currentPalette.surface, border: `1px solid ${currentPalette.border}` }}>
                          <span className="text-base">{m.split(" ")[0]}</span>
                          <p className="text-xs font-bold truncate" style={{ color: currentPalette.text }}>{m.split(" ").slice(1).join(" ")}</p>
                        </div>
                      ))}
                    </div>
                  ) : selectedTemplate === "magazine" ? (
                    <div style={{ background: bgPreview }}>
                      {["👋 Bienvenue", "📋 Infos pratiques", "🗝️ Check-in"].map((m) => (
                        <div key={m} className="flex items-center gap-3 px-4 py-2.5 border-b"
                          style={{ borderColor: currentPalette.border }}>
                          <span>{m.split(" ")[0]}</span>
                          <p className="text-xs font-black uppercase tracking-wide flex-1" style={{ color: currentPalette.text }}>{m.split(" ").slice(1).join(" ")}</p>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentPalette.primary }} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y" style={{ background: bgPreview }}>
                      {["👋 Bienvenue", "📋 Infos pratiques", "🗝️ Check-in"].map((m, i) => (
                        <div key={m} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: currentPalette.primary, color: "#fff" }}>{i + 1}</div>
                          <span>{m.split(" ")[0]}</span>
                          <p className="text-xs font-bold flex-1" style={{ color: currentPalette.text, fontFamily: "Georgia, serif" }}>{m.split(" ").slice(1).join(" ")}</p>
                          <ChevronRight className="w-3 h-3" style={{ color: currentPalette.border }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={() => setStep("palette")}
                  className="w-full mt-4 py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  style={{ backgroundColor: currentPalette.primary + "15", color: currentPalette.primary }}>
                  Choisir les couleurs <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ── STEP PALETTE ──────────────────────────────────────────────────── */}
          {step === "palette" && (
            <>
              {/* Liste palettes */}
              <div className="w-52 border-r border-gray-100 overflow-y-auto p-3 shrink-0">
                {/* Grouper par motif */}
                {(["solid", "stripes", "gradient", "circles"] as const).map((pat) => {
                  const palettes = PALETTES.filter((p) => p.pattern === pat);
                  if (!palettes.length) return null;
                  return (
                    <div key={pat} className="mb-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-1.5">
                        {PATTERN_ICONS[pat]} {PATTERN_LABELS[pat]}
                      </p>
                      {palettes.map((pal) => (
                        <button key={pal.id} onClick={() => { setSelectedPaletteId(pal.id); setCustomColors({}); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all ${
                            selectedPaletteId === pal.id ? "bg-orange-50 border border-orange-200" : "hover:bg-gray-50 border border-transparent"
                          }`}>
                          {/* Swatch */}
                          <div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden border border-gray-200">
                            <div className="w-full h-full" style={{ background: patternToCss(pal) }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${selectedPaletteId === pal.id ? "text-orange-600" : "text-gray-700"}`}>
                              {pal.name}
                            </p>
                          </div>
                          {selectedPaletteId === pal.id && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Preview + custom */}
              <div className="flex-1 p-5 bg-gray-50 overflow-y-auto">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Aperçu</p>

                {/* Preview fond */}
                <div className="rounded-2xl h-20 mb-4 shadow-inner border border-gray-200 overflow-hidden">
                  <div className="w-full h-full" style={{ background: bgPreview }} />
                </div>

                {/* Personnaliser couleurs */}
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Personnaliser</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {([
                    ["primary", "Couleur principale"],
                    ["secondary", "Fond principal"],
                    ["surface", "Fond des cards"],
                    ["text", "Texte"],
                    ["muted", "Texte secondaire"],
                    ["border", "Bordures"],
                    ["patternColor", "2ème couleur motif"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100 cursor-pointer hover:border-gray-300 transition-colors">
                      <input type="color"
                        value={(customColors[key] ?? currentPalette[key] ?? "#ffffff") as string}
                        onChange={(e) => setCustomColor(key, e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                        style={{ appearance: "none" }}
                      />
                      <span className="text-xs text-gray-600 flex-1 truncate">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Taille des bandes */}
                {currentPalette.pattern === "stripes" && (
                  <div className="bg-white rounded-xl p-3 border border-gray-100 mb-3">
                    <label className="text-xs font-semibold text-gray-500 block mb-2">
                      Taille des bandes : {customColors.patternSize ?? currentPalette.patternSize ?? 40}px
                    </label>
                    <input type="range" min={10} max={120} step={5}
                      value={(customColors.patternSize ?? currentPalette.patternSize ?? 40) as number}
                      onChange={(e) => setCustomColors((prev) => ({ ...prev, patternSize: Number(e.target.value) }))}
                      className="w-full accent-orange-500"
                    />
                  </div>
                )}

                {Object.keys(customColors).length > 0 && (
                  <button onClick={() => setCustomColors({})}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors underline">
                    Réinitialiser les couleurs
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={apply}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: currentPalette.primary }}>
            <Check className="w-4 h-4" /> Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}
