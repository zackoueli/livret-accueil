"use client";

import { useState } from "react";
import { X, Languages, Loader2, Check, AlertCircle } from "lucide-react";
import { Booklet, SupportedLang, SUPPORTED_LANGS, BookletTranslations } from "@/types";
import { updateBooklet } from "@/lib/booklets";
import toast from "react-hot-toast";

interface Props {
  booklet: Booklet;
  onClose: () => void;
  onTranslated: (translations: Partial<BookletTranslations>) => void;
}

export function TranslateModal({ booklet, onClose, onTranslated }: Props) {
  const existingLangs = Object.keys(booklet.translations ?? {}) as SupportedLang[];
  const [selected, setSelected] = useState<Set<SupportedLang>>(new Set(existingLangs));
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Record<SupportedLang, "idle" | "loading" | "done" | "error">>({
    fr: "idle", en: "idle", es: "idle", de: "idle", it: "idle", ar: "idle",
  });

  const toggleLang = (code: SupportedLang) => {
    if (code === "fr") return; // fr est la langue source
    setSelected(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const handleTranslate = async () => {
    const targets = Array.from(selected).filter(l => l !== "fr");
    if (targets.length === 0) return;

    setLoading(true);

    // Collecter tous les textes à traduire depuis les modules activés
    const allTranslations: Partial<BookletTranslations> = { ...(booklet.translations ?? {}) };

    for (const lang of targets) {
      setProgress(p => ({ ...p, [lang]: "loading" }));
      try {
        // Construire la liste des textes : pour chaque module, chaque champ non vide
        const entries: { moduleId: string; field: string; text: string }[] = [];
        for (const mod of booklet.modules) {
          if (!mod.enabled) continue;
          for (const [field, value] of Object.entries(mod.content)) {
            if (value && typeof value === "string" && value.trim()) {
              entries.push({ moduleId: mod.id, field, text: value });
            }
          }
        }
        // Titre et description du livret
        if (booklet.title) entries.push({ moduleId: "__booklet__", field: "title", text: booklet.title });
        if (booklet.description) entries.push({ moduleId: "__booklet__", field: "description", text: booklet.description });

        const texts = entries.map(e => e.text);

        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts, targetLang: lang }),
        });

        if (!res.ok) throw new Error("API error");
        const { translations } = await res.json();

        // Reconstruire par moduleId/field
        const langMap: Record<string, Record<string, string>> = {};
        entries.forEach((entry, i) => {
          if (!langMap[entry.moduleId]) langMap[entry.moduleId] = {};
          langMap[entry.moduleId][entry.field] = translations[i];
        });

        allTranslations[lang] = langMap;
        setProgress(p => ({ ...p, [lang]: "done" }));
      } catch {
        setProgress(p => ({ ...p, [lang]: "error" }));
      }
    }

    // Sauvegarder dans Firestore
    try {
      await updateBooklet(booklet.id, { ...booklet, translations: allTranslations });
      onTranslated(allTranslations);
      toast.success("Traductions enregistrées !");
      onClose();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }

    setLoading(false);
  };

  const targetCount = Array.from(selected).filter(l => l !== "fr").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <Languages className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Traduire le livret</h2>
              <p className="text-xs text-gray-400 mt-0.5">Sélectionnez les langues cibles</p>
            </div>
          </div>
          {!loading && (
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Info source */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Langue source :</span> 🇫🇷 Français
            {" · "}{booklet.modules.filter(m => m.enabled).length} modules · {
              Object.values(booklet.modules.reduce((acc, m) => ({ ...acc, ...m.content }), {}))
                .filter(v => v && typeof v === "string" && v.trim()).length
            } champs à traduire
          </p>
        </div>

        {/* Langues */}
        <div className="px-6 py-5 grid grid-cols-2 gap-3">
          {SUPPORTED_LANGS.map(lang => {
            const isFr = lang.code === "fr";
            const isSelected = selected.has(lang.code);
            const state = progress[lang.code];
            return (
              <button
                key={lang.code}
                onClick={() => !loading && !isFr && toggleLang(lang.code)}
                disabled={isFr || loading}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                  isFr
                    ? "border-gray-200 bg-gray-50 opacity-50 cursor-default"
                    : isSelected
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                }`}>
                <span className="text-xl">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{lang.label}</p>
                  {isFr && <p className="text-xs text-gray-400">Source</p>}
                </div>
                {!isFr && (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    state === "done" ? "bg-green-500" :
                    state === "error" ? "bg-red-400" :
                    state === "loading" ? "bg-orange-100" :
                    isSelected ? "bg-orange-500" : "bg-gray-100"
                  }`}>
                    {state === "loading" ? <Loader2 className="w-3 h-3 text-orange-500 animate-spin" /> :
                     state === "done" ? <Check className="w-3 h-3 text-white" /> :
                     state === "error" ? <AlertCircle className="w-3 h-3 text-white" /> :
                     isSelected ? <Check className="w-3 h-3 text-white" /> : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            {targetCount === 0 ? "Sélectionnez au moins une langue" : `${targetCount} langue${targetCount > 1 ? "s" : ""} sélectionnée${targetCount > 1 ? "s" : ""}`}
          </p>
          <button
            onClick={handleTranslate}
            disabled={loading || targetCount === 0}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Traduction...</>
              : <><Languages className="w-4 h-4" /> Traduire</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
