"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { MODULE_META, MODULE_FIELDS, LANGUAGES } from "@/lib/modules";
import { EyeOff, Languages, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { ModulePhotoUploader } from "./ModulePhotoUploader";
import { ModuleDocumentUploader } from "./ModuleDocumentUploader";

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
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#ebebeb" }}>
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

        {/* Traductions — indisponible */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Languages className="w-4 h-4" />
            <span className="font-medium">Traductions multilingues</span>
          </div>
          <span className="text-xs font-semibold bg-gray-200 text-gray-500 px-2.5 py-1 rounded-full">Bientôt disponible</span>
        </div>

        {/* Fields */}
        <div className="space-y-5">
          {fields.map((field) => (
            <div key={field.key} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {field.label}
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

              {field.type === "time" && (
                <input
                  type="time"
                  value={getFieldValue(field.key)}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-40 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
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

            </div>
          ))}
        </div>

        {/* Photos du module */}
        <ModulePhotoUploader
          bookletId={booklet.id}
          moduleId={activeModule.id}
          images={activeModule.images ?? []}
        />

        {/* Documents PDF */}
        <ModuleDocumentUploader
          bookletId={booklet.id}
          moduleId={activeModule.id}
          documents={activeModule.documents ?? []}
        />

        <p className="text-center text-xs text-gray-300 mt-8">
          Sauvegarde automatique · Ctrl+S pour sauvegarder manuellement
        </p>
      </div>
    </div>
  );
}
