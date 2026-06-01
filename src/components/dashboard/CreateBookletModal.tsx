"use client";

import { useState } from "react";
import { X, Loader2, ArrowRight, Check } from "lucide-react";
import { TEMPLATES, BookletTemplate } from "@/lib/templates";

interface Props {
  onClose: () => void;
  onCreate: (title: string, templateId: string) => Promise<void>;
}

export function CreateBookletModal({ onClose, onCreate }: Props) {
  const [step, setStep] = useState<"template" | "title">("template");
  const [selected, setSelected] = useState<BookletTemplate>(TEMPLATES[0]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const t = title.trim() || selected.propertyName || "Mon livret";
    setLoading(true);
    await onCreate(t, selected.id);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {step === "template" ? "Choisir un modèle" : "Nommer votre livret"}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {step === "template"
                ? "Partez d'un modèle prérempli ou d'une page vierge."
                : `Modèle sélectionné : ${selected.emoji} ${selected.name}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1 — Choix du template */}
        {step === "template" && (
          <div className="overflow-y-auto flex-1 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATES.map(tpl => {
                const isSelected = selected.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelected(tpl)}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-orange-400 bg-orange-50 shadow-sm"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Accent color bar */}
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

        {/* Step 2 — Nom du livret */}
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
                Vous pourrez le modifier à tout moment dans l'éditeur.
              </p>
            </div>

            {/* Aperçu du template */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Aperçu du modèle</p>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{selected.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{selected.name}</p>
                  <p className="text-xs text-gray-400">{selected.description}</p>
                </div>
              </div>
              {selected.id !== "blank" && (
                <div className="mt-3 space-y-1.5">
                  {[
                    { label: "Couleur", value: <span className="inline-block w-3 h-3 rounded-full ml-1" style={{ backgroundColor: selected.accentColor }} /> },
                    { label: "Modules", value: "8 modules préremplis" },
                    { label: "Contenu", value: "Textes d'exemple à personnaliser" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="text-gray-400">{row.label} :</span>
                      <span className="font-medium text-gray-700 flex items-center">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          {step === "template" ? (
            <>
              <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-4 py-2">
                Annuler
              </button>
              <button
                onClick={() => setStep("title")}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-3 rounded-2xl transition-colors shadow-sm shadow-orange-200">
                Continuer
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
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
    </div>
  );
}
