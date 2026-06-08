"use client";

import { useState } from "react";
import { X, Sparkles, Loader2, ClipboardPaste } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import toast from "react-hot-toast";

interface ImportListingModalProps {
  onClose: () => void;
}

// Maps extracted fields to module/content keys
type FieldMapping = {
  moduleType: string;
  fieldKey: string;
};

const FIELD_MAP: Record<string, FieldMapping> = {
  checkin_time:    { moduleType: "arrival",       fieldKey: "checkin_time" },
  checkout_time:   { moduleType: "arrival",       fieldKey: "checkout_time" },
  welcome_message: { moduleType: "arrival",       fieldKey: "welcome_message" },
  access_code:     { moduleType: "arrival",       fieldKey: "access_code" },
  key_location:    { moduleType: "arrival",       fieldKey: "key_location" },
  parking:         { moduleType: "arrival",       fieldKey: "parking" },
  wifi_name:       { moduleType: "accommodation", fieldKey: "wifi_name" },
  wifi_password:   { moduleType: "accommodation", fieldKey: "wifi_password" },
  heating:         { moduleType: "accommodation", fieldKey: "heating" },
  ac:              { moduleType: "accommodation", fieldKey: "ac" },
  tv:              { moduleType: "accommodation", fieldKey: "tv" },
  max_guests:      { moduleType: "rules",         fieldKey: "max_guests" },
  smoking:         { moduleType: "rules",         fieldKey: "smoking" },
  pets:            { moduleType: "rules",         fieldKey: "pets" },
  noise:           { moduleType: "rules",         fieldKey: "noise" },
  equipment:       { moduleType: "kitchen",       fieldKey: "equipment" },
  transport:       { moduleType: "neighborhood",  fieldKey: "transport" },
  hidden_gems:     { moduleType: "neighborhood",  fieldKey: "hidden_gems" },
  host_name:       { moduleType: "contact",       fieldKey: "host_name" },
  host_phone:      { moduleType: "contact",       fieldKey: "host_phone" },
  host_email:      { moduleType: "contact",       fieldKey: "host_email" },
};

export function ImportListingModal({ onClose }: ImportListingModalProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { booklet, updateModule, updateBookletField } = useEditorStore();

  const handleImport = async () => {
    if (!booklet || text.trim().length < 20) {
      toast.error("Collez une description plus longue.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/import-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("Erreur API");
      const { data } = await res.json();

      let filledCount = 0;

      // Update top-level booklet fields
      if (data.propertyName) {
        updateBookletField("propertyName", data.propertyName);
        filledCount++;
      }
      if (data.address) {
        updateBookletField("address", data.address);
        filledCount++;
      }

      // Update module fields
      for (const [extractedKey, mapping] of Object.entries(FIELD_MAP)) {
        const value = data[extractedKey];
        if (!value || typeof value !== "string") continue;

        const module = booklet.modules.find(
          (m) => m.type === mapping.moduleType
        );
        if (!module) continue;

        // Don't overwrite existing non-empty content
        if (module.content[mapping.fieldKey]) continue;

        updateModule(module.id, { [mapping.fieldKey]: value });
        filledCount++;
      }

      if (filledCount === 0) {
        toast("Aucune information extraite. Essayez avec un texte plus détaillé.", { icon: "⚠️" });
      } else {
        toast.success(`${filledCount} champ${filledCount > 1 ? "s" : ""} rempli${filledCount > 1 ? "s" : ""} automatiquement !`);
        onClose();
      }
    } catch {
      toast.error("Erreur lors de l'extraction. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Importer depuis une annonce</h2>
              <p className="text-xs text-gray-500">Airbnb, Booking, VRBO ou autre</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            Copiez-collez la description de votre annonce ci-dessous. L&apos;IA extraira automatiquement les informations pour remplir votre livret.
          </p>

          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Copiez ici le texte de votre annonce Airbnb ou Booking...&#10;&#10;Exemple : « Bienvenue dans notre appartement lumineux de 60m²... WiFi : MonReseau / motdepasse123... Arrivée à partir de 16h... »"
              rows={12}
              className="w-full text-sm border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder:text-gray-400"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-300">
              {text.length} caractères
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 text-xs text-orange-700 space-y-1">
            <p className="font-medium">✨ Comment ça marche</p>
            <p>• Seuls les champs <strong>vides</strong> seront remplis — vos données existantes sont préservées</p>
            <p>• Plus votre description est détaillée, mieux c&apos;est</p>
            <p>• Vous pouvez modifier les champs après import</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Annuler
          </button>
          <button
            onClick={handleImport}
            disabled={loading || text.trim().length < 20}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Extraction en cours...</>
            ) : (
              <><ClipboardPaste className="w-4 h-4" />Remplir automatiquement</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
