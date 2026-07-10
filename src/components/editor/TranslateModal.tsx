"use client";

import { useState, useEffect } from "react";
import { X, Languages, Loader2, Check, AlertCircle, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { Booklet, SupportedLang, SUPPORTED_LANGS, BookletTranslations } from "@/types";
import { saveBookletTranslations } from "@/lib/booklets";
import { useAuthStore } from "@/store/authStore";
import { usePlan } from "@/hooks/usePlan";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import toast from "react-hot-toast";

const MONTHLY_LIMIT = 50_000;

interface Props {
  booklet: Booklet;
  onClose: () => void;
  onTranslated: (translations: Partial<BookletTranslations>) => void;
}

type Tab = "auto" | "edit";

export function TranslateModal({ booklet, onClose, onTranslated }: Props) {
  const { user, profile } = useAuthStore();
  const { translationLangLimit } = usePlan();
  const existingLangs = Object.keys(booklet.translations ?? {}) as SupportedLang[];
  const [tab, setTab] = useState<Tab>(translationLangLimit === 0 ? "edit" : "auto");
  const [showUpgrade, setShowUpgrade] = useState(false);

  // ── Onglet Auto ──────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<SupportedLang>>(new Set(existingLangs));
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Record<SupportedLang, "idle" | "loading" | "done" | "error">>({
    fr: "idle", en: "idle", es: "idle", de: "idle", it: "idle", ar: "idle",
  });

  // Quota from profile (refreshed after translation)
  const [charsUsed, setCharsUsed] = useState<number>(() => {
    if (!profile) return 0;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return profile.translationCharsMonth === month ? (profile.translationCharsUsed ?? 0) : 0;
  });

  // ── Onglet Édition manuelle ──────────────────────────────────────────────────
  const [editLang, setEditLang] = useState<SupportedLang | null>(existingLangs[0] ?? null);
  const [editData, setEditData] = useState<Partial<BookletTranslations>>(() => booklet.translations ?? {});
  const [savingEdit, setSavingEdit] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    setEditData(booklet.translations ?? {});
  }, [booklet.translations]);

  const toggleLang = (code: SupportedLang) => {
    if (code === "fr") return;
    setSelected(prev => {
      const isAdding = !prev.has(code);
      if (isAdding && prev.size >= translationLangLimit) {
        setShowUpgrade(true);
        return prev;
      }
      const next = new Set(prev);
      isAdding ? next.add(code) : next.delete(code);
      return next;
    });
  };

  const handleTranslate = async () => {
    const targets = Array.from(selected).filter(l => l !== "fr");
    if (targets.length === 0) return;
    setLoading(true);

    const token = user ? await user.getIdToken() : null;
    const allTranslations: Partial<BookletTranslations> = { ...(booklet.translations ?? {}) };

    for (const lang of targets) {
      setProgress(p => ({ ...p, [lang]: "loading" }));
      try {
        const entries: { moduleId: string; field: string; text: string }[] = [];
        for (const mod of booklet.modules) {
          if (!mod.enabled) continue;
          for (const [field, value] of Object.entries(mod.content)) {
            if (value && typeof value === "string" && value.trim()) {
              entries.push({ moduleId: mod.id, field, text: value });
            }
          }
        }
        if (booklet.title) entries.push({ moduleId: "_meta_", field: "title", text: booklet.title });
        if (booklet.description) entries.push({ moduleId: "_meta_", field: "description", text: booklet.description });

        const res = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ texts: entries.map(e => e.text), targetLang: lang }),
        });

        if (res.status === 429) {
          const body = await res.json();
          setCharsUsed(body.charsUsed ?? MONTHLY_LIMIT);
          toast.error(`Limite mensuelle de ${MONTHLY_LIMIT.toLocaleString()} caractères atteinte`);
          setProgress(p => ({ ...p, [lang]: "error" }));
          continue;
        }
        if (!res.ok) throw new Error("API error");
        const body = await res.json();
        const { translations } = body;
        if (body.charsUsed !== undefined) setCharsUsed(body.charsUsed);

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

    try {
      await saveBookletTranslations(booklet.id, allTranslations);
      setEditData(allTranslations);
      onTranslated(allTranslations);
      toast.success("Traductions enregistrées !");
      // Basculer sur l'onglet édition pour affiner
      setTab("edit");
      setEditLang(Array.from(selected).filter(l => l !== "fr")[0] ?? null);
    } catch (e) {
      console.error("[TranslateModal] save error:", e);
      toast.error("Erreur lors de la sauvegarde");
    }
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      await saveBookletTranslations(booklet.id, editData);
      onTranslated(editData);
      toast.success("Modifications enregistrées !");
    } catch (e) {
      console.error("[TranslateModal] save edit error:", e);
      toast.error("Erreur lors de la sauvegarde");
    }
    setSavingEdit(false);
  };

  const updateField = (lang: SupportedLang, moduleId: string, field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [lang]: {
        ...(prev[lang] ?? {}),
        [moduleId]: {
          ...((prev[lang] ?? {})[moduleId] ?? {}),
          [field]: value,
        },
      },
    }));
  };

  const targetCount = Array.from(selected).filter(l => l !== "fr").length;
  const translatedLangs = Object.keys(editData) as SupportedLang[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <Languages className="w-4 h-4 text-orange-500" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Traductions</h2>
          </div>
          {!loading && (
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          <button
            onClick={() => translationLangLimit === 0 ? setShowUpgrade(true) : setTab("auto")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "auto" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} ${translationLangLimit === 0 ? "opacity-50" : ""}`}>
            <Languages className="w-3.5 h-3.5" /> Traduction auto
          </button>
          <button
            onClick={() => setTab("edit")}
            disabled={translatedLangs.length === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 ${tab === "edit" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            <Pencil className="w-3.5 h-3.5" /> Modifier manuellement
            {translatedLangs.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "edit" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                {translatedLangs.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Onglet Auto ── */}
        {tab === "auto" && (
          <>
            <div className="px-6 py-3 border-b border-gray-100 shrink-0">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">Source :</span> 🇫🇷 Français
                {" · "}{booklet.modules.filter(m => m.enabled).length} modules
                {" · "}{Object.values(booklet.modules.reduce((acc, m) => ({ ...acc, ...m.content }), {})).filter(v => v && typeof v === "string" && (v as string).trim()).length} champs
              </p>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-3 overflow-y-auto">
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
                      isFr ? "border-gray-200 bg-gray-50 opacity-50 cursor-default"
                        : isSelected ? "border-orange-400 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}>
                    <span className="text-xl">{lang.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{lang.label}</p>
                      {isFr && <p className="text-xs text-gray-400">Source</p>}
                      {!isFr && editData[lang.code] && <p className="text-xs text-green-500">Traduit</p>}
                    </div>
                    {!isFr && (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        state === "done" ? "bg-green-500" : state === "error" ? "bg-red-400" :
                        state === "loading" ? "bg-orange-100" : isSelected ? "bg-orange-500" : "bg-gray-100"
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
            <div className="px-6 pb-5 shrink-0 border-t border-gray-100 pt-4 space-y-3">
              {/* Quota bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Quota mensuel</span>
                  <span className={`text-xs font-medium ${charsUsed >= MONTHLY_LIMIT ? "text-red-500" : charsUsed >= MONTHLY_LIMIT * 0.8 ? "text-orange-500" : "text-gray-500"}`}>
                    {charsUsed.toLocaleString()} / {MONTHLY_LIMIT.toLocaleString()} car.
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${charsUsed >= MONTHLY_LIMIT ? "bg-red-400" : charsUsed >= MONTHLY_LIMIT * 0.8 ? "bg-orange-400" : "bg-green-400"}`}
                    style={{ width: `${Math.min(100, (charsUsed / MONTHLY_LIMIT) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">{targetCount} / {translationLangLimit} langues automatiques utilisées sur votre plan</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-400">
                  {charsUsed >= MONTHLY_LIMIT
                    ? "Limite atteinte — réinitialisée le 1er du mois"
                    : targetCount === 0 ? "Sélectionnez au moins une langue" : `${targetCount} langue${targetCount > 1 ? "s" : ""} sélectionnée${targetCount > 1 ? "s" : ""}`}
                </p>
                <button
                  onClick={handleTranslate}
                  disabled={loading || targetCount === 0 || charsUsed >= MONTHLY_LIMIT}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Traduction...</> : <><Languages className="w-4 h-4" /> Traduire</>}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Onglet Édition manuelle ── */}
        {tab === "edit" && (
          <>
            {/* Sélecteur de langue */}
            <div className="flex gap-2 px-6 py-3 border-b border-gray-100 shrink-0 overflow-x-auto">
              {translatedLangs.map(code => {
                const meta = SUPPORTED_LANGS.find(l => l.code === code);
                if (!meta) return null;
                return (
                  <button
                    key={code}
                    onClick={() => setEditLang(code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      editLang === code ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}>
                    {meta.flag} {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Champs éditables */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {editLang && booklet.modules.filter(m => m.enabled).map(mod => {
                const modTranslations = editData[editLang]?.[mod.id] ?? {};
                const fields = Object.entries(mod.content).filter(([, v]) => v && typeof v === "string" && v.trim());
                if (fields.length === 0) return null;
                const isExpanded = expandedModule === mod.id;
                return (
                  <div key={mod.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                      <span className="text-sm font-semibold text-gray-700 capitalize">{mod.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{fields.length} champs</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="divide-y divide-gray-100">
                        {fields.map(([field, original]) => (
                          <div key={field} className="px-4 py-3 space-y-1.5">
                            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{field}</p>
                            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed line-clamp-2">{original as string}</p>
                            <textarea
                              value={modTranslations[field] ?? ""}
                              onChange={e => updateField(editLang, mod.id, field, e.target.value)}
                              rows={2}
                              placeholder="Traduction..."
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-6 pb-5 pt-4 border-t border-gray-100 shrink-0 flex justify-end">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {savingEdit ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</> : <><Check className="w-4 h-4" /> Enregistrer</>}
              </button>
            </div>
          </>
        )}
      </div>

      {showUpgrade && (
        <UpgradeModal
          reason={translationLangLimit === 0
            ? "La traduction automatique est réservée aux plans Starter, Pro et Agence"
            : `Vous avez atteint la limite de ${translationLangLimit} langues automatiques de votre plan`}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
