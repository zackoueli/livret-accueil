"use client";

import { useState } from "react";
import { X, Loader2, ArrowRight, Check, Lock } from "lucide-react";
import { TEMPLATES, BookletTemplate } from "@/lib/templates";
import { usePlan } from "@/hooks/usePlan";
import { UpgradeModal } from "@/components/ui/UpgradeModal";

interface Props {
  onClose: () => void;
  onCreate: (title: string, templateId: string, layoutId: string) => Promise<void>;
}

type Step = "layout" | "template" | "title";

const LAYOUTS = [
  {
    id: "simple",
    label: "Scroll",
    desc: "Vue défilante classique. Toutes les infos se lisent de haut en bas, comme une belle page web.",
    previewUrl: "https://app.bunkly.co/b/9gM1r69Boa",
  },
  {
    id: "grid",
    label: "Grille",
    desc: "Interface style app mobile. Des boutons en grille ouvrent des fiches détaillées.",
    previewUrl: "https://app.bunkly.co/b/QKs4XkhmHr",
  },
];

function PhoneFrame({ url }: { url: string }) {
  return (
    <div className="relative w-full" style={{ paddingBottom: "216%" }}>
      {/* Cadre téléphone */}
      <div className="absolute inset-0 rounded-[2rem] border-[6px] border-gray-800 bg-gray-800 shadow-xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-xl z-10" />
        {/* Écran */}
        <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden bg-white">
          <iframe
            src={url}
            className="w-full h-full border-0"
            style={{
              transform: "scale(0.55)",
              transformOrigin: "top left",
              width: "182%",
              height: "182%",
              pointerEvents: "none",
            }}
            scrolling="no"
          />
        </div>
      </div>
    </div>
  );
}

export function CreateBookletModal({ onClose, onCreate }: Props) {
  const { templateCount } = usePlan();
  const [step, setStep] = useState<Step>("layout");
  const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
  const [selected, setSelected] = useState<BookletTemplate>(TEMPLATES[0]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // "blank" est toujours accessible ; les modèles préremplis suivants sont limités par le plan
  const unlockedIds = new Set([
    "blank",
    ...TEMPLATES.filter(t => t.id !== "blank").slice(0, Math.max(0, templateCount - 1)).map(t => t.id),
  ]);

  const handleCreate = async () => {
    const t = title.trim() || selected.propertyName || "Mon livret";
    setLoading(true);
    await onCreate(t, selected.id, selectedLayout.id);
    setLoading(false);
  };

  const stepIndex = { layout: 0, template: 1, title: 2 }[step];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {step === "layout" && "Choisir un design"}
              {step === "template" && "Choisir un modèle"}
              {step === "title" && "Nommer votre livret"}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {step === "layout" && "Comment souhaitez-vous présenter votre livret ?"}
              {step === "template" && "Partez d'un modèle prérempli ou d'une page vierge."}
              {step === "title" && `${selectedLayout.label} · ${selected.emoji} ${selected.name}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-6 pt-3 shrink-0">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-all ${
                stepIndex === i ? "bg-orange-500" : stepIndex > i ? "bg-orange-200" : "bg-gray-100"
              }`}
            />
          ))}
        </div>

        {/* Step 1 — Layout */}
        {step === "layout" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-5">
              {LAYOUTS.map(layout => {
                const isSelected = selectedLayout.id === layout.id;
                return (
                  <button
                    key={layout.id}
                    onClick={() => setSelectedLayout(layout)}
                    className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all text-left ${
                      isSelected
                        ? "border-orange-400 shadow-md shadow-orange-100"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    {/* Checkmark */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}

                    {/* Phone preview */}
                    <div className={`w-full p-5 pb-3 transition-colors ${isSelected ? "bg-orange-50" : "bg-gray-50"}`}>
                      <PhoneFrame url={layout.previewUrl} />
                    </div>

                    {/* Label */}
                    <div className={`px-4 py-3 border-t transition-colors ${isSelected ? "border-orange-200 bg-white" : "border-gray-100 bg-white"}`}>
                      <p className="font-bold text-sm text-gray-900 mb-0.5">{layout.label}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{layout.desc}</p>
                    </div>
                  </button>
                );
              })}

              {/* Carte bientôt disponible — pleine largeur */}
              <div className="col-span-2 flex items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xl shrink-0">✨</div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Nouveaux designs à venir</p>
                  <p className="text-xs text-gray-400 mt-0.5">D'autres templates arrivent bientôt — suivez-nous sur Instagram pour les découvrir en avant-première.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Template contenu */}
        {step === "template" && (
          <div className="overflow-y-auto flex-1 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATES.map(tpl => {
                const isSelected = selected.id === tpl.id;
                const isLocked = !unlockedIds.has(tpl.id);
                return (
                  <button
                    key={tpl.id}
                    onClick={() => isLocked ? setShowUpgrade(true) : setSelected(tpl)}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                      isLocked
                        ? "border-gray-100 opacity-60"
                        : isSelected
                          ? "border-orange-400 bg-orange-50 shadow-sm"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {isSelected && !isLocked && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {isLocked && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" /> Verrouillé
                      </div>
                    )}
                    <div className="w-full h-1.5 rounded-full mb-4" style={{ background: tpl.accentColor }} />
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{tpl.emoji}</span>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{tpl.name}</p>
                        {tpl.id !== "blank" && (
                          <p className="text-xs text-gray-400 mt-0.5">Prérempli</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{tpl.description}</p>
                    {tpl.id !== "blank" && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {["Arrivée", "WiFi", "Règles", "Activités", "Contact"].map(tag => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-100 text-gray-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3 — Nom */}
        {step === "title" && (
          <div className="flex-1 p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du logement
              </label>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && handleCreate()}
                placeholder={selected.propertyName || "Ex : Villa Les Pins, Mon Appart..."}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
              />
              <p className="text-xs text-gray-400 mt-2">
                Vous pourrez le modifier à tout moment dans l&apos;éditeur.
              </p>
            </div>

            {/* Récap */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex gap-3 items-center">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 text-lg">
                {selectedLayout.id === "grid" ? "📱" : "📜"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Votre sélection</p>
                <p className="font-semibold text-gray-800 text-sm">{selectedLayout.label} · {selected.emoji} {selected.name}</p>
                {selected.id !== "blank" && (
                  <p className="text-xs text-gray-400 mt-0.5">8 modules préremplis</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          {step === "layout" && (
            <>
              <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-4 py-2">
                Annuler
              </button>
              <button
                onClick={() => setStep("template")}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-3 rounded-2xl transition-colors shadow-sm shadow-orange-200">
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
          {step === "template" && (
            <>
              <button onClick={() => setStep("layout")} className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-4 py-2">
                ← Retour
              </button>
              <button
                onClick={() => setStep("title")}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-3 rounded-2xl transition-colors shadow-sm shadow-orange-200">
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
          {step === "title" && (
            <>
              <button onClick={() => setStep("template")} className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-4 py-2">
                ← Retour
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-3 rounded-2xl transition-colors shadow-sm shadow-orange-200 disabled:opacity-60">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</>
                  : <><span>Créer le livret</span> <ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </>
          )}
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          reason="Ce modèle est réservé à un plan supérieur"
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
