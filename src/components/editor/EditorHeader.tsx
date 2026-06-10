"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, Eye, Save, Loader2, Globe, Sparkles, Lock } from "lucide-react";
import { BunklyLogo } from "@/components/ui/BunklyLogo";
import { bookletUrl } from "@/lib/url";
import { useEditorStore } from "@/store/editorStore";
import { updateBooklet, getUserBooklets } from "@/lib/booklets";
import toast from "react-hot-toast";
import { ImportListingModal } from "./ImportListingModal";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { usePlan } from "@/hooks/usePlan";
import { useAuthStore } from "@/store/authStore";
import { PLAN_LIMITS } from "@/lib/plans";

export function EditorHeader({ onSave }: { onSave: () => void }) {
  const router = useRouter();
  const locale = useLocale();
  const { booklet, isDirty, isSaving, updateBookletField } = useEditorStore();
  const [showImport, setShowImport] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);
  const { can, plan } = usePlan();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    getUserBooklets(user.uid).then(all => {
      setPublishedCount(all.filter(b => b.isPublished).length);
    });
  }, [user]);

  if (!booklet) return null;

  const limit = PLAN_LIMITS[plan].booklets;
  const canPublish = booklet.isPublished || publishedCount < limit;

  const togglePublish = async () => {
    if (!booklet.isPublished && !canPublish) {
      setShowUpgrade(true);
      return;
    }
    setPublishing(true);
    try {
      if (isDirty) await onSave();
      const newVal = !booklet.isPublished;
      updateBookletField("isPublished", newVal);
      await updateBooklet(booklet.id, { ...booklet, isPublished: newVal });
      if (newVal) setPublishedCount(c => c + 1);
      else setPublishedCount(c => c - 1);
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
        onClick={() => can("ai_import") ? setShowImport(true) : setShowUpgrade(true)}
        className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border transition-colors ${
          can("ai_import")
            ? "border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600"
            : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-400"
        }`}>
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">Importer</span>
        {!can("ai_import") && <Lock className="w-3 h-3" />}
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
        title={!canPublish ? `Limite de ${limit} livret${limit > 1 ? "s" : ""} publiés atteinte` : undefined}
        className={`flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-60 ${
          booklet.isPublished
            ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
            : !canPublish
              ? "bg-gray-100 text-gray-400 border border-gray-200"
              : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}>
        {publishing
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : !canPublish
            ? <Lock className="w-4 h-4" />
            : <Globe className="w-4 h-4" />
        }
        <span className="hidden sm:inline">
          {booklet.isPublished ? "Publié" : "Publier"}
        </span>
      </button>
    </header>

    {showImport && <ImportListingModal onClose={() => setShowImport(false)} />}
    {showUpgrade && <UpgradeModal reason={!can("ai_import") ? "L'import IA est réservé au plan Pro" : `Limite de ${limit} livret${limit > 1 ? "s" : ""} publiés atteinte`} onClose={() => setShowUpgrade(false)} />}
    </>
  );
}
