"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, Eye, Save, Loader2, Globe, Sparkles } from "lucide-react";
import { BunklyLogo } from "@/components/ui/BunklyLogo";
import { bookletUrl } from "@/lib/url";
import { useEditorStore } from "@/store/editorStore";
import { updateBooklet } from "@/lib/booklets";
import toast from "react-hot-toast";
import { ImportListingModal } from "./ImportListingModal";

export function EditorHeader({ onSave }: { onSave: () => void }) {
  const router = useRouter();
  const locale = useLocale();
  const { booklet, isDirty, isSaving, updateBookletField } = useEditorStore();
  const [showImport, setShowImport] = useState(false);
  const [publishing, setPublishing] = useState(false);

  if (!booklet) return null;

  const togglePublish = async () => {
    setPublishing(true);
    try {
      if (isDirty) await onSave();
      const newVal = !booklet.isPublished;
      updateBookletField("isPublished", newVal);
      await updateBooklet(booklet.id, { ...booklet, isPublished: newVal });
      toast.success(newVal ? "Livret publié ! Vos voyageurs peuvent y accéder." : "Livret dépublié");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
    <header className="bg-white border-b border-gray-100 h-16 flex items-center px-5 gap-3 z-30 shrink-0">
      {/* Back */}
      <button
        onClick={() => router.push(`/${locale}/dashboard`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mr-1">
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Mes livrets</span>
      </button>

      {/* Logo + titre */}
      <div className="flex items-center gap-3 border-l border-gray-100 pl-3">
        <BunklyLogo height={28} variant="icon" />
        <span className="hidden sm:block text-sm truncate max-w-[180px] font-semibold text-gray-700">
          {booklet.title}
        </span>
      </div>

      <div className="flex-1" />

      {/* Import IA */}
      <button
        onClick={() => setShowImport(true)}
        className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors">
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">Importer</span>
      </button>

      {/* Aperçu */}
      <button
        onClick={() => window.open(bookletUrl(booklet.slug), "_blank")}
        title="Voir le livret en ligne"
        className="flex items-center gap-1.5 text-sm font-medium p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
        <Eye className="w-4 h-4" />
      </button>

      {/* Enregistrer — visible seulement si modifs non sauvegardées */}
      {isDirty && (
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-40">
          {isSaving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }
          <span className="hidden sm:inline">Enregistrer</span>
        </button>
      )}

      {/* Publier / Dépublier */}
      <button
        onClick={togglePublish}
        disabled={publishing}
        className={`flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-60 ${
          booklet.isPublished
            ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
            : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}>
        {publishing
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Globe className="w-4 h-4" />
        }
        <span className="hidden sm:inline">
          {booklet.isPublished ? "Publié" : "Publier"}
        </span>
      </button>
    </header>

    {showImport && <ImportListingModal onClose={() => setShowImport(false)} />}
    </>
  );
}
