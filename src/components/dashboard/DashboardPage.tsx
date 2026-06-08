"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Suspense } from "react";
import {
  Plus, BookOpen, Eye, Pencil, Trash2, Share2, Lock,
  LogOut, Crown, Globe, Clock, MoreHorizontal, Settings, BarChart2, Copy, HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { getUserBooklets, createBooklet, deleteBooklet, duplicateBooklet } from "@/lib/booklets";
import { signOut } from "@/lib/auth";
import { Booklet } from "@/types";
import { ShareModal } from "./ShareModal";
import { BunklyLogo } from "@/components/ui/BunklyLogo";
import { bookletUrl } from "@/lib/url";
import { CreateBookletModal } from "./CreateBookletModal";
import { AnalyticsModal } from "./AnalyticsModal";

function DashboardPageInner() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuthStore();
  const [booklets, setBooklets] = useState<Booklet[]>([]);
  const [loadingBooklets, setLoadingBooklets] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [shareBooklet, setShareBooklet] = useState<Booklet | null>(null);
  const [analyticsBooklet, setAnalyticsBooklet] = useState<Booklet | null>(null);

  const isFree = profile?.plan === "free";
  const canCreate = !isFree || booklets.length < 3;

  useEffect(() => {
    if (!loading && !user) router.push(`/${locale}/auth`);
  }, [user, loading, router, locale]);

  useEffect(() => {
    if (user) {
      getUserBooklets(user.uid)
        .then(setBooklets)
        .finally(() => setLoadingBooklets(false));
    }
  }, [user]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success("Abonnement activé ! Bienvenue dans le plan Actif 🎉");
      router.replace(`/${locale}/dashboard`);
    } else if (checkout === "cancel") {
      toast("Paiement annulé.", { icon: "ℹ️" });
      router.replace(`/${locale}/dashboard`);
    }
  }, [searchParams, locale, router]);

  const handleCreate = async (title: string, templateId: string) => {
    if (!user) return;
    setCreating(true);
    try {
      const id = await createBooklet(user.uid, title, templateId);
      router.push(`/${locale}/editor/${id}`);
    } catch {
      toast.error("Erreur lors de la création");
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce livret ?")) return;
    await deleteBooklet(id);
    setBooklets((prev) => prev.filter((b) => b.id !== id));
    toast.success("Livret supprimé");
  };

  const handleDuplicate = async (booklet: Booklet) => {
    try {
      const newId = await duplicateBooklet(booklet);
      const updated = await getUserBooklets(user!.uid);
      setBooklets(updated);
      toast.success("Livret dupliqué !");
      router.push(`/${locale}/editor/${newId}`);
    } catch {
      toast.error("Erreur lors de la duplication");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}`);
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href={`/${locale}`}>
            <BunklyLogo height={28} />
          </a>

          <div className="flex items-center gap-3">
            {isFree && (
              <button
                onClick={() => router.push(`/${locale}/dashboard/settings`)}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors border border-orange-100">
                <Crown className="w-3.5 h-3.5" />
                Passer au plan Actif
              </button>
            )}

            <button
              onClick={() => router.push(`/${locale}/dashboard/settings`)}
              className="flex items-center gap-2.5 border border-gray-200 rounded-xl px-3 py-2 bg-white hover:bg-gray-50 transition-colors">
              <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white">
                {(profile?.displayName || user.email || "?")[0].toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm text-gray-600 font-medium max-w-[140px] truncate">
                {profile?.displayName || user.email}
              </span>
              <Settings className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
            </button>

            <button
              onClick={() => router.push(`/${locale}/support`)}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              title="Support">
              <HelpCircle className="w-4 h-4" />
            </button>
            <button onClick={handleSignOut}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10">

        {/* Page title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes livrets</h1>
            {isFree && (
              <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                {booklets.length}/3 livrets utilisés · Plan gratuit
              </p>
            )}
          </div>
          <button
            onClick={() => canCreate ? setShowNewModal(true) : toast.error("Limite atteinte — passez au plan Actif")}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-5 py-3 rounded-2xl transition-colors shadow-sm shadow-orange-200">
            <Plus className="w-4 h-4" />
            Nouveau livret
          </button>
        </div>

        {/* Upgrade banner */}
        {isFree && booklets.length > 0 && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Activez vos livrets</p>
                <p className="text-xs text-gray-500 mt-0.5">Passez au plan Actif pour partager vos livrets avec vos voyageurs</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/${locale}/dashboard/settings`)}
              className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
              Voir les tarifs
            </button>
          </div>
        )}

        {/* Grid */}
        {loadingBooklets ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-52 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : booklets.length === 0 ? (
          <EmptyState onCreate={() => setShowNewModal(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {booklets.map((booklet) => (
              <BookletCard
                key={booklet.id}
                booklet={booklet}
                isFree={isFree}
                onEdit={() => router.push(`/${locale}/editor/${booklet.id}`)}
                onPreview={() => {
                  if (!booklet.isPublished) {
                    toast("Publiez ce livret pour le voir en ligne.", { icon: "🔒" });
                    return;
                  }
                  window.open(bookletUrl(booklet.slug), "_blank");
                }}
                onShare={() => setShareBooklet(booklet)}
                onAnalytics={() => setAnalyticsBooklet(booklet)}
                onDuplicate={() => handleDuplicate(booklet)}
                onDelete={() => handleDelete(booklet.id)}
              />
            ))}

            {canCreate && (
              <button
                onClick={() => setShowNewModal(true)}
                className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/30 flex flex-col items-center justify-center gap-3 p-8 transition-all group"
                style={{ minHeight: "200px" }}>
                <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
                <span className="text-sm font-medium text-gray-400 group-hover:text-orange-500 transition-colors">
                  Nouveau livret
                </span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Share modal */}
      {shareBooklet && (
        <ShareModal booklet={shareBooklet} onClose={() => setShareBooklet(null)} />
      )}

      {/* Analytics modal */}
      {analyticsBooklet && (
        <AnalyticsModal booklet={analyticsBooklet} onClose={() => setAnalyticsBooklet(null)} />
      )}

      {/* New booklet modal */}
      {showNewModal && (
        <CreateBookletModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

export function DashboardPage() {
  return (
    <Suspense>
      <DashboardPageInner />
    </Suspense>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-24">
      <div className="w-20 h-20 rounded-3xl bg-orange-50 border-2 border-orange-100 flex items-center justify-center mx-auto mb-6">
        <BookOpen className="w-9 h-9 text-orange-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Créez votre premier livret</h3>
      <p className="text-gray-400 text-sm max-w-sm mx-auto mb-8">
        Offrez une expérience inoubliable à vos voyageurs avec un livret d'accueil digital personnalisé.
      </p>
      <button onClick={onCreate}
        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-3.5 rounded-2xl transition-colors shadow-sm shadow-orange-200">
        <Plus className="w-4 h-4" />
        Créer mon premier livret
      </button>
    </div>
  );
}

function BookletCard({ booklet, isFree, onEdit, onPreview, onShare, onAnalytics, onDuplicate, onDelete }: {
  booklet: Booklet;
  isFree: boolean;
  onEdit: () => void;
  onPreview: () => void;
  onShare: () => void;
  onAnalytics: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
      {/* Color bar top */}
      <div className="h-2 w-full rounded-t-2xl" style={{ backgroundColor: booklet.accentColor }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: booklet.accentColor + "20" }}>
              <BookOpen className="w-5 h-5" style={{ color: booklet.accentColor }} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{booklet.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  isFree
                    ? "bg-amber-50 text-amber-600"
                    : booklet.isPublished
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-500"
                }`}>
                  {isFree ? <><Lock className="w-2.5 h-2.5" /> Brouillon</> : booklet.isPublished ? "● Publié" : "Brouillon"}
                </span>
              </div>
            </div>
          </div>

          {/* Menu contextuel */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute top-8 right-0 z-20 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 w-44 overflow-hidden">
                  <button onClick={() => { onEdit(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Pencil className="w-4 h-4 text-gray-400" /> Modifier
                  </button>
                  <button onClick={() => { onPreview(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4 text-gray-400" /> Aperçu
                  </button>
                  <button onClick={() => { onAnalytics(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <BarChart2 className="w-4 h-4 text-gray-400" /> Analytics
                  </button>
                  {!isFree && (
                    <button onClick={() => { onShare(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      <Share2 className="w-4 h-4 text-gray-400" /> Partager
                    </button>
                  )}
                  <button onClick={() => { onDuplicate(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Copy className="w-4 h-4 text-gray-400" /> Dupliquer
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  <button onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(booklet.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </span>
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {booklet.modules.filter((m) => m.enabled).length} modules
          </span>
          {booklet.viewCount !== undefined && booklet.viewCount > 0 && (
            <span className="flex items-center gap-1">
              <BarChart2 className="w-3 h-3" />
              {booklet.viewCount} vue{booklet.viewCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Modifier
          </button>
          <button onClick={onPreview}
            className="flex items-center justify-center p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          {!isFree && booklet.isPublished && (
            <button onClick={onShare}
              className="flex items-center justify-center p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
