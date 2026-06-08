"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, Save, Eye, CheckCircle, Loader2, Globe, Sparkles } from "lucide-react";
import { BunklyLogo } from "@/components/ui/BunklyLogo";
import { bookletUrl } from "@/lib/url";
import { useEditorStore } from "@/store/editorStore";
import { useAuthStore } from "@/store/authStore";
import { updateBooklet } from "@/lib/booklets";
import toast from "react-hot-toast";
import { ImportListingModal } from "./ImportListingModal";

export function EditorHeader({ onSave }: { onSave: () => void }) {
  const router = useRouter();
  const locale = useLocale();
  const { booklet, isDirty, isSaving, updateBookletField } = useEditorStore();
  const { profile } = useAuthStore();
  const [showImport, setShowImport] = useState(false);

  if (!booklet) return null;

  const togglePublish = async () => {
    // Sauvegarde d'abord pour s'assurer que tous les champs (templateId…) sont en base
    if (isDirty) await onSave();
    const newVal = !booklet.isPublished;
    updateBookletField("isPublished", newVal);
    await updateBooklet(booklet.id, { ...booklet, isPublished: newVal });
    toast.success(newVal ? "Livret publié ! Vos voyageurs peuvent y accéder." : "Livret dépublié");
  };

  return (
    <>
    <header className="bg-white border-b border-gray-100 h-16 flex items-center px-5 gap-4 z-30 shrink-0">
      {/* Back */}
      <button
        onClick={() => router.push(`/${locale}/dashboard`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mr-2">
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Mes livrets</span>
      </button>

      {/* Logo + titre */}
      <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
        <BunklyLogo height={28} variant="icon" />
        <span className="hidden sm:block text-sm truncate max-w-[180px] font-semibold text-gray-700">
          {booklet.title}
        </span>
      </div>

      <div className="flex-1" />

      {/* Import from listing */}
      <button
        onClick={() => setShowImport(true)}
        className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors">
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">Importer</span>
      </button>

      {/* Save status */}
      <div className="flex items-center gap-1.5 text-xs">
        {isSaving ? (
          <><Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" /><span className="text-gray-400">Sauvegarde...</span></>
        ) : isDirty ? (
          <><div className="w-2 h-2 rounded-full bg-orange-400" /><span className="text-gray-400">Non sauvegardé</span></>
        ) : (
          <><CheckCircle className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600 hidden sm:inline">Sauvegardé</span></>
        )}
      </div>

      {/* Actions */}
      <button
        onClick={onSave}
        disabled={!isDirty || isSaving}
        className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-40">
        <Save className="w-4 h-4" />
        <span className="hidden sm:inline">Enregistrer</span>
      </button>

      <button
        onClick={() => {
          if (!booklet.isPublished) {
            toast("Publiez d'abord votre livret pour le voir en ligne.", { icon: "🔒" });
            return;
          }
          window.open(bookletUrl(booklet.slug), "_blank");
        }}
        className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
        <Eye className="w-4 h-4" />
        <span className="hidden sm:inline">Aperçu</span>
      </button>

      <button
        onClick={togglePublish}
        className={`flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-xl transition-colors ${
          booklet.isPublished
            ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
            : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}>
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">
          {booklet.isPublished ? "Publié" : "Publier"}
        </span>
      </button>
    </header>

    {showImport && <ImportListingModal onClose={() => setShowImport(false)} />}
    </>
  );
}
