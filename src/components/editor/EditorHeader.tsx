"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Eye, Save, Loader2, Globe, Sparkles, Lock, Languages, Crown, Share2, MoreVertical } from "lucide-react";
import { BunklyLogo } from "@/components/ui/BunklyLogo";
import { bookletUrl } from "@/lib/url";
import { useEditorStore } from "@/store/editorStore";
import { updateBooklet, getUserBooklets } from "@/lib/booklets";
import toast from "react-hot-toast";
import { ImportListingModal } from "./ImportListingModal";
import { TranslateModal } from "./TranslateModal";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { ShareModal } from "@/components/dashboard/ShareModal";
import { usePlan } from "@/hooks/usePlan";
import { useAuthStore } from "@/store/authStore";
import { PLAN_LIMITS } from "@/lib/plans";
import { BookletTranslations } from "@/types";

export function EditorHeader({ onSave }: { onSave: () => void }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("editor");
  const { booklet, isDirty, isSaving, updateBookletField } = useEditorStore();
  const [showImport, setShowImport] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const { can, plan, isPaid } = usePlan();
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
  const canTranslate = can("ai_import"); // même guard : Pro/Agence

  const openUpgrade = (reason: string) => {
    setUpgradeReason(reason);
    setShowUpgrade(true);
  };

  const togglePublish = async () => {
    if (!booklet.isPublished && !canPublish) {
      openUpgrade(t("publishLimit", { limit }));
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
      toast.success(newVal ? t("publishedToast") : t("unpublishedToast"));
    } finally {
      setPublishing(false);
    }
  };

  const handleTranslated = (translations: Partial<BookletTranslations>) => {
    updateBookletField("translations", translations);
  };

  const openMenu = () => {
    if (menuBtnRef.current) {
      const r = menuBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setShowMenu(v => !v);
  };

  return (
    <>
    <header className="bg-white border-b border-gray-100 h-16 flex items-center px-3 sm:px-5 gap-2 sm:gap-3 z-30 shrink-0">
      {/* Back */}
      <button
        onClick={() => router.push(`/${locale}/dashboard`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mr-1 shrink-0">
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">{t("backToBooklets")}</span>
      </button>

      {/* Logo + titre */}
      <div className="hidden md:flex items-center gap-3 border-l border-gray-100 pl-3 shrink-0">
        <BunklyLogo height={28} variant="icon" />
        <span className="text-sm truncate max-w-[180px] font-semibold text-gray-700">
          {booklet.title}
        </span>
      </div>

      <div className="flex-1" />

      {/* Actions secondaires — visibles à partir de lg, repliées dans un menu en dessous */}
      <div className="hidden lg:flex items-center gap-3 shrink-0">
        {!isPaid && (
          <button
            onClick={() => openUpgrade(t("proReason"))}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow-sm transition-all">
            <Crown className="w-3.5 h-3.5" />
            {t("proCta")}
          </button>
        )}

        <button
          onClick={() => can("ai_import") ? setShowImport(true) : openUpgrade(t("importLocked"))}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border transition-colors ${
            can("ai_import")
              ? "border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600"
              : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-400"
          }`}>
          <Sparkles className="w-4 h-4" />
          <span>{t("import")}</span>
          {!can("ai_import") && <Lock className="w-3 h-3" />}
        </button>

        <button
          onClick={() => canTranslate ? setShowTranslate(true) : openUpgrade(t("translateLocked"))}
          title={canTranslate ? t("translateTitle") : t("proFeature")}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border transition-colors ${
            canTranslate
              ? "border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600"
              : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-400"
          }`}>
          <Languages className="w-4 h-4" />
          <span>{t("translate")}</span>
          {!canTranslate && <Lock className="w-3 h-3" />}
          {canTranslate && booklet.translations && Object.keys(booklet.translations).length > 0 && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold">
              {Object.keys(booklet.translations).length}
            </span>
          )}
        </button>

        <button
          onClick={() => window.open(bookletUrl(booklet.slug), "_blank")}
          title={t("viewOnline")}
          className="flex items-center gap-1.5 text-sm font-medium p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
          <Eye className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowShare(true)}
          title={t("share")}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
          <Share2 className="w-4 h-4" />
          <span>{t("share")}</span>
        </button>
      </div>

      {/* Menu "plus d'actions" — visible sous lg */}
      <div className="lg:hidden shrink-0">
        <button
          ref={menuBtnRef}
          onClick={openMenu}
          title={t("moreActions")}
          className="flex items-center justify-center p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Enregistrer */}
      {isDirty && (
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 text-sm font-medium px-3 sm:px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-40 shrink-0">
          {isSaving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }
          <span className="hidden sm:inline">{t("save")}</span>
        </button>
      )}

      {/* Publier / Dépublier */}
      <button
        onClick={togglePublish}
        disabled={publishing}
        title={!canPublish ? t("publishLimit", { limit }) : undefined}
        className={`flex items-center gap-2 text-sm font-semibold px-3 sm:px-5 py-2 rounded-xl transition-colors disabled:opacity-60 shrink-0 ${
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
          {booklet.isPublished ? t("published") : t("publish")}
        </span>
      </button>
    </header>

    {/* Dropdown actions secondaires (mobile/tablette) */}
    {showMenu && (
      <>
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
        <div
          className="fixed z-50 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 w-56 overflow-hidden"
          style={{ top: menuPos.top, right: menuPos.right }}>
          {!isPaid && (
            <button
              onClick={() => { openUpgrade(t("proReason")); setShowMenu(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition-colors">
              <Crown className="w-4 h-4" /> {t("proCta")}
            </button>
          )}
          <button
            onClick={() => { can("ai_import") ? setShowImport(true) : openUpgrade(t("importLocked")); setShowMenu(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Sparkles className="w-4 h-4 text-gray-400" /> {t("import")}
            {!can("ai_import") && <Lock className="w-3 h-3 ml-auto text-gray-400" />}
          </button>
          <button
            onClick={() => { canTranslate ? setShowTranslate(true) : openUpgrade(t("translateLocked")); setShowMenu(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Languages className="w-4 h-4 text-gray-400" /> {t("translate")}
            {!canTranslate && <Lock className="w-3 h-3 ml-auto text-gray-400" />}
            {canTranslate && booklet.translations && Object.keys(booklet.translations).length > 0 && (
              <span className="ml-auto flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                {Object.keys(booklet.translations).length}
              </span>
            )}
          </button>
          <button
            onClick={() => { window.open(bookletUrl(booklet.slug), "_blank"); setShowMenu(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Eye className="w-4 h-4 text-gray-400" /> {t("preview")}
          </button>
          <button
            onClick={() => { setShowShare(true); setShowMenu(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Share2 className="w-4 h-4 text-gray-400" /> {t("share")}
          </button>
        </div>
      </>
    )}

    {showImport && <ImportListingModal onClose={() => setShowImport(false)} />}
    {showTranslate && (
      <TranslateModal
        booklet={booklet}
        onClose={() => setShowTranslate(false)}
        onTranslated={handleTranslated}
      />
    )}
    {showUpgrade && (
      <UpgradeModal reason={upgradeReason} onClose={() => setShowUpgrade(false)} />
    )}
    {showShare && <ShareModal booklet={booklet} onClose={() => setShowShare(false)} />}
    </>
  );
}
