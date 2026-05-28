"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { MODULE_META, MODULE_FIELDS, LANGUAGES } from "@/lib/modules";
import { EyeOff, Languages, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id = u.hostname.includes("youtu.be")
        ? u.pathname.slice(1)
        : u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch { /* invalid url */ }
  return null;
}

export function EditorForm() {
  const { booklet, activeModuleId, activeLanguage, setActiveLanguage, updateModule } = useEditorStore();
  const [translating, setTranslating] = useState(false);

  if (!booklet) return null;

  const activeModule = booklet.modules.find((m) => m.id === activeModuleId);

  if (!activeModule) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-4xl mb-3">👈</p>
          <p className="text-gray-500 text-sm">Sélectionnez un module à gauche</p>
        </div>
      </div>
    );
  }

  if (!activeModule.enabled) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <EyeOff className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Module désactivé</p>
          <p className="text-gray-400 text-xs mt-1">Activez-le dans la liste pour l'éditer</p>
        </div>
      </div>
    );
  }

  const meta = MODULE_META[activeModule.type];
  const fields = MODULE_FIELDS[activeModule.type];

  const handleChange = (key: string, value: string) => {
    updateModule(activeModule.id, {
      [`${key}_${activeLanguage}`]: value,
    });
  };

  const getFieldValue = (key: string) =>
    activeModule.content[`${key}_${activeLanguage}`] ?? "";

  const hasFrContent = fields.some((f) => !!activeModule.content[`${f.key}_fr`]);

  const handleAutoTranslate = async () => {
    setTranslating(true);
    try {
      const updates: Record<string, string> = {};
      await Promise.all(
        fields.map(async (field) => {
          const frValue = activeModule.content[`${field.key}_fr`];
          if (!frValue) return;
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: frValue, targetLang: activeLanguage }),
          });
          const data = await res.json();
          if (data.translated) updates[`${field.key}_${activeLanguage}`] = data.translated;
        })
      );
      updateModule(activeModule.id, updates);
      toast.success("Traduction appliquée !");
    } catch {
      toast.error("Erreur de traduction");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">

        {/* Module header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-2xl shadow-sm">
            {meta.emoji}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{meta.label}</h2>
            <p className="text-sm text-gray-400">{meta.description}</p>
          </div>
        </div>

        {/* Language tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-1 mb-6 flex gap-1 overflow-x-auto">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setActiveLanguage(lang.code)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeLanguage === lang.code
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}>
              <span>{lang.flag}</span>
              <span className="hidden sm:inline">{lang.label}</span>
              <span className="sm:hidden">{lang.code.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* Auto-translate button */}
        {activeLanguage !== "fr" && hasFrContent && (
          <button
            onClick={handleAutoTranslate}
            disabled={translating}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-semibold transition-colors disabled:opacity-50 mb-6 border border-blue-100">
            {translating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Traduction en cours...</>
              : <><Languages className="w-4 h-4" /> Traduire depuis le français</>}
          </button>
        )}

        {/* Fields */}
        <div className="space-y-5">
          {fields.map((field) => (
            <div key={field.key} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {field.label}
                {activeLanguage !== "fr" && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    — {LANGUAGES.find((l) => l.code === activeLanguage)?.label}
                  </span>
                )}
              </label>

              {field.type === "text" && (
                <input
                  type="text"
                  value={getFieldValue(field.key)}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                />
              )}

              {(field.type === "textarea" || field.type === "richtext") && (
                <textarea
                  value={getFieldValue(field.key)}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={field.type === "richtext" ? 6 : 3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300 resize-none leading-relaxed"
                />
              )}

              {field.type === "places" && (
                <textarea
                  value={activeModule.content[field.key] ?? ""}
                  onChange={(e) => updateModule(activeModule.id, { [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300 resize-none leading-relaxed font-mono"
                />
              )}

              {field.type === "video" && (
                <div className="space-y-3">
                  <input
                    type="url"
                    value={activeModule.content[field.key] ?? ""}
                    onChange={(e) => updateModule(activeModule.id, { [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                  />
                  {activeModule.content[field.key] && toEmbedUrl(activeModule.content[field.key]) && (
                    <div className="rounded-xl overflow-hidden aspect-video bg-black">
                      <iframe
                        src={toEmbedUrl(activeModule.content[field.key])!}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              )}

              {/* FR fallback hint */}
              {activeLanguage !== "fr" && !getFieldValue(field.key) && (
                <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-medium mb-1">Contenu FR (référence)</p>
                  <p className="text-xs text-blue-500 leading-relaxed">
                    {activeModule.content[`${field.key}_fr`] || <span className="italic opacity-60">Non renseigné en français</span>}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-300 mt-8">
          Sauvegarde automatique · Ctrl+S pour sauvegarder manuellement
        </p>
      </div>
    </div>
  );
}
