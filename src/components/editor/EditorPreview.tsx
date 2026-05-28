"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { MODULE_META, LANGUAGES } from "@/lib/modules";
import { BookletModule } from "@/types";

export function EditorPreview() {
  const { booklet, activeModuleId, activeLanguage } = useEditorStore();
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  if (!booklet) return null;

  const enabledModules = [...booklet.modules]
    .filter((m) => m.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <aside className="w-full lg:w-80 bg-gray-100 border-l border-gray-200 flex flex-col shrink-0">
      {/* Preview header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aperçu</span>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setDevice("mobile")}
            className={`p-1.5 rounded-md transition-colors ${device === "mobile" ? "bg-white shadow-sm text-orange-500" : "text-gray-400"}`}>
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice("desktop")}
            className={`p-1.5 rounded-md transition-colors ${device === "desktop" ? "bg-white shadow-sm text-orange-500" : "text-gray-400"}`}>
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Phone/screen frame */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center p-4">
        <div className={`bg-white shadow-xl overflow-hidden ${
          device === "mobile"
            ? "w-full max-w-[260px] rounded-3xl border-4 border-gray-800"
            : "w-full rounded-xl border border-gray-200"
        }`}>
          {/* Booklet cover */}
          <div className="h-28 flex flex-col items-center justify-center text-white text-center px-4"
            style={{ backgroundColor: booklet.accentColor }}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Livret d'accueil</p>
            <p className="font-bold text-sm leading-tight">{booklet.propertyName || booklet.title}</p>
            {booklet.address && (
              <p className="text-xs opacity-70 mt-1 truncate w-full text-center">{booklet.address}</p>
            )}
          </div>

          {/* Module nav */}
          <div className="flex gap-1 overflow-x-auto p-2 border-b border-gray-100 scrollbar-hide">
            {enabledModules.map((m) => {
              const meta = MODULE_META[m.type];
              return (
                <button key={m.id}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg shrink-0 text-center transition-colors ${
                    m.id === activeModuleId
                      ? "text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  style={m.id === activeModuleId ? { backgroundColor: booklet.accentColor } : {}}>
                  <span className="text-xs">{meta.emoji}</span>
                  <span className="text-[9px] font-medium leading-tight">{meta.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Active module content */}
          <div className="p-3 min-h-[200px]">
            {activeModuleId && <ModulePreview
              module={booklet.modules.find((m) => m.id === activeModuleId)!}
              language={activeLanguage}
              accentColor={booklet.accentColor}
            />}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-3 text-center">
            <p className="text-[9px] text-gray-300">Livret.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ModulePreview({ module, language, accentColor }: {
  module: BookletModule;
  language: string;
  accentColor: string;
}) {
  const meta = MODULE_META[module.type];

  const get = (key: string) =>
    module.content[`${key}_${language}`]
    || module.content[`${key}_fr`]
    || "";

  const renderContent = () => {
    switch (module.type) {
      case "welcome":
        return (
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-2">{get("title") || "Bienvenue !"}</h3>
            <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{get("message") || "Votre message d'accueil apparaîtra ici..."}</p>
          </div>
        );

      case "practical":
        return (
          <div className="space-y-2">
            {get("wifi_name") && (
              <InfoRow emoji="📶" label="WiFi" value={`${get("wifi_name")} · ${get("wifi_password")}`} accent={accentColor} />
            )}
            {get("door_code") && (
              <InfoRow emoji="🔑" label="Code d'entrée" value={get("door_code")} accent={accentColor} />
            )}
            {get("parking") && (
              <InfoRow emoji="🅿️" label="Parking" value={get("parking")} accent={accentColor} />
            )}
            {!get("wifi_name") && !get("door_code") && (
              <p className="text-xs text-gray-300 italic">Renseignez vos infos pratiques...</p>
            )}
          </div>
        );

      case "checkin":
        return (
          <div className="space-y-2">
            {(get("checkin_time") || get("checkout_time")) && (
              <div className="flex gap-2">
                {get("checkin_time") && (
                  <div className="flex-1 p-2 rounded-xl text-center text-xs" style={{ backgroundColor: accentColor + "15" }}>
                    <p className="text-gray-400 mb-0.5">Arrivée</p>
                    <p className="font-bold text-gray-800">{get("checkin_time")}</p>
                  </div>
                )}
                {get("checkout_time") && (
                  <div className="flex-1 p-2 rounded-xl text-center text-xs bg-gray-50">
                    <p className="text-gray-400 mb-0.5">Départ</p>
                    <p className="font-bold text-gray-800">{get("checkout_time")}</p>
                  </div>
                )}
              </div>
            )}
            {get("checkin_process") && (
              <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{get("checkin_process")}</p>
            )}
            {!get("checkin_time") && !get("checkin_process") && (
              <p className="text-xs text-gray-300 italic">Renseignez vos horaires...</p>
            )}
          </div>
        );

      case "contacts":
        return (
          <div className="space-y-2">
            {get("owner_name") && (
              <InfoRow emoji="👤" label={get("owner_name")} value={get("owner_phone")} accent={accentColor} />
            )}
            {get("emergency") && (
              <InfoRow emoji="🚨" label="Urgences" value={get("emergency")} accent={accentColor} />
            )}
            {!get("owner_name") && <p className="text-xs text-gray-300 italic">Ajoutez vos contacts...</p>}
          </div>
        );

      default:
        const firstField = Object.values(module.content).find((v) => v);
        return firstField
          ? <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{firstField}</p>
          : <p className="text-xs text-gray-300 italic">Commencez à saisir votre contenu...</p>;
    }
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm">{meta.emoji}</span>
        <h3 className="text-xs font-bold text-gray-800">{meta.label}</h3>
      </div>
      {renderContent()}
    </div>
  );
}

function InfoRow({ emoji, label, value, accent }: { emoji: string; label: string; value: string; accent: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-xl" style={{ backgroundColor: accent + "10" }}>
      <span className="text-sm shrink-0">{emoji}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-medium">{label}</p>
        <p className="text-xs text-gray-700 font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}
