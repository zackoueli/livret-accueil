"use client";

import { useEditorStore } from "@/store/editorStore";
import { MODULE_META, MODULE_FIELDS } from "@/lib/modules";
import { EyeOff } from "lucide-react";
import { ModulePhotoUploader } from "./ModulePhotoUploader";
import { ModuleDocumentUploader } from "./ModuleDocumentUploader";

export function EditorForm() {
  const { booklet, activeModuleId, updateModule } = useEditorStore();

  if (!booklet) return null;

  const activeModule = booklet.modules.find((m) => m.id === activeModuleId);

  if (!activeModule) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#ebebeb" }}>
        <div className="text-center">
          <p className="text-4xl mb-3">👈</p>
          <p className="text-gray-500 text-sm">Sélectionnez un module à gauche</p>
        </div>
      </div>
    );
  }

  if (!activeModule.enabled) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#ebebeb" }}>
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
  const fields = MODULE_FIELDS[activeModule.type] ?? [];

  const get = (key: string) => activeModule.content[key] ?? "";
  const set = (key: string, val: string) => updateModule(activeModule.id, { [key]: val });

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300";

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#ebebeb" }}>
      <div className="max-w-2xl mx-auto p-6">

        {/* Header module */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-2xl shadow-sm">
            {meta.emoji}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{meta.label}</h2>
            <p className="text-sm text-gray-400">{meta.description}</p>
          </div>
        </div>

        {/* Champs */}
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {field.label}
              </label>
              {field.hint && (
                <p className="text-xs text-gray-400 mb-2">{field.hint}</p>
              )}

              {field.type === "time" && (
                <input
                  type="time"
                  value={get(field.key)}
                  onChange={(e) => set(field.key, e.target.value)}
                  className="w-36 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              )}

              {field.type === "text" && (
                <input
                  type="text"
                  value={get(field.key)}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              )}

              {field.type === "phone" && (
                <input
                  type="tel"
                  value={get(field.key)}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              )}

              {field.type === "url" && (
                <input
                  type="url"
                  value={get(field.key)}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              )}

              {field.type === "number" && (
                <input
                  type="number"
                  value={get(field.key)}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              )}

              {(field.type === "textarea") && (
                <textarea
                  value={get(field.key)}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className={`${inputClass} resize-none leading-relaxed`}
                />
              )}

              {field.type === "places" && (
                <textarea
                  value={activeModule.content[field.key] ?? ""}
                  onChange={(e) => updateModule(activeModule.id, { [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  rows={4}
                  className={`${inputClass} resize-none leading-relaxed font-mono text-xs`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Photos */}
        <ModulePhotoUploader
          bookletId={booklet.id}
          moduleId={activeModule.id}
          images={activeModule.images ?? []}
        />

        {/* Documents */}
        <ModuleDocumentUploader
          bookletId={booklet.id}
          moduleId={activeModule.id}
          documents={activeModule.documents ?? []}
        />

        <p className="text-center text-xs text-gray-400 mt-8 pb-4">
          Sauvegarde automatique · Ctrl+S pour sauvegarder manuellement
        </p>
      </div>
    </div>
  );
}
