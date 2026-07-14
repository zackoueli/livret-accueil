"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Suspense } from "react";
import {
  Plus, BookOpen, Eye, Pencil, Trash2, Share2, Lock,
  LogOut, Crown, Globe, Clock, MoreHorizontal, Settings, BarChart2, Copy, HelpCircle,
  Monitor, Smartphone, Search, ArrowRight, Star, Folder, FolderOpen, FolderPlus, X, Check, ChevronRight, AlertTriangle, Gift,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { getUserBooklets, createBooklet, deleteBooklet, duplicateBooklet, getUserFolders, createFolder, updateFolder, deleteFolder, moveBookletToFolder } from "@/lib/booklets";
import { signOut } from "@/lib/auth";
import { Booklet, Folder as FolderType } from "@/types";
import { ShareModal } from "./ShareModal";
import { BunklyLogo } from "@/components/ui/BunklyLogo";
import { bookletUrl } from "@/lib/url";
import { CreateBookletModal } from "./CreateBookletModal";
import { AnalyticsModal } from "./AnalyticsModal";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { ReferralSourceModal } from "./ReferralSourceModal";
import { usePlan } from "@/hooks/usePlan";

const SERVICES = [
  {
    icon: Monitor,
    color: "text-blue-500",
    bg: "bg-blue-50",
    title: "Site web professionnel",
    desc: "On crée votre vitrine en ligne, pensée pour convertir les visiteurs en réservations.",
  },
  {
    icon: Smartphone,
    color: "text-purple-500",
    bg: "bg-purple-50",
    title: "Application mobile",
    desc: "On développe une app à votre image pour vos voyageurs, iOS & Android.",
  },
  {
    icon: Search,
    color: "text-green-500",
    bg: "bg-green-50",
    title: "Référencement Airbnb",
    desc: "On optimise vos annonces pour apparaître en tête des résultats de recherche.",
  },
  {
    icon: Star,
    color: "text-orange-500",
    bg: "bg-orange-50",
    title: "Avis & e-réputation",
    desc: "On met en place une stratégie pour booster vos avis et fidéliser vos voyageurs.",
  },
];

function PromoSidebar() {
  return (
    <>
      {/* Card principale */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        {/* Header sobre */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">Bunkly — Au-delà du livret</p>
          <h3 className="text-sm font-bold text-gray-900 leading-snug">
            On s'occupe aussi de votre visibilité en ligne
          </h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            En plus des livrets, notre équipe vous accompagne pour développer votre location courte durée.
          </p>
        </div>

        {/* Services list */}
        <div className="divide-y divide-gray-50">
          {SERVICES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-default">
              <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 leading-snug">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-4 pb-4 pt-3">
          <a
            href="mailto:hello@bunkly.co?subject=Demande de service"
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors">
            Nous contacter
            <ArrowRight className="w-3 h-3" />
          </a>
          <p className="text-center text-xs text-gray-400 mt-2">hello@bunkly.co · Devis gratuit</p>

          {/* Réseaux sociaux */}
          <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-gray-100">
            <a href="https://www.instagram.com/bunkly_co/" target="_blank" rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-pink-50 flex items-center justify-center transition-colors" title="Instagram">
              <svg className="w-3.5 h-3.5 text-gray-500 hover:text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            <a href="https://www.linkedin.com/company/bunkly-co" target="_blank" rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-50 flex items-center justify-center transition-colors" title="LinkedIn">
              <svg className="w-3.5 h-3.5 text-gray-500 hover:text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="https://www.youtube.com/@Bunkly_co" target="_blank" rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 flex items-center justify-center transition-colors" title="YouTube — Tutoriels">
              <svg className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

    </>
  );
}

function DashboardPageInner() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuthStore();
  const [booklets, setBooklets] = useState<Booklet[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loadingBooklets, setLoadingBooklets] = useState(true);
  const [creating, setCreating] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const duplicatingRef = useRef(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [shareBooklet, setShareBooklet] = useState<Booklet | null>(null);
  const [analyticsBooklet, setAnalyticsBooklet] = useState<Booklet | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);

  const { plan, can, bookletLimit, isFree } = usePlan();
  const canCreate = booklets.length < bookletLimit;

  // Bandeau expiration
  const subscriptionEndDate = profile?.subscriptionEndDate;
  const daysUntilExpiry = subscriptionEndDate
    ? Math.ceil((subscriptionEndDate * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = !isFree && daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const isExpired = profile?.subscriptionStatus === "canceled" && isFree;
  const [upgradeReason, setUpgradeReason] = useState<string | undefined>();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [dismissedReferralModal, setDismissedReferralModal] = useState(false);
  const showReferralModal = !!user && !!profile && !profile.referralSource && !dismissedReferralModal;

  const requirePlan = (reason: string) => {
    setUpgradeReason(reason);
    setShowUpgrade(true);
  };

  useEffect(() => {
    if (!loading && !user) router.push(`/${locale}/auth`);
  }, [user, loading, router, locale]);

  useEffect(() => {
    if (user) {
      Promise.all([getUserBooklets(user.uid), getUserFolders(user.uid)])
        .then(([b, f]) => { setBooklets(b); setFolders(f); })
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

  const handleCreate = async (title: string, contentTemplateId: string, layoutId: string) => {
    if (!user) return;
    setCreating(true);
    try {
      const id = await createBooklet(user.uid, title, contentTemplateId, layoutId, plan);
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
    if (duplicatingRef.current) return;
    duplicatingRef.current = true;
    try {
      const title = prompt("Nom du nouveau livret :", `${booklet.title} (copie)`);
      if (!title) return;
      setDuplicatingId(booklet.id);
      const newId = await duplicateBooklet(booklet, title);
      const updated = await getUserBooklets(user!.uid);
      setBooklets(updated);
      toast.success("Livret dupliqué !");
      router.push(`/${locale}/editor/${newId}`);
    } catch {
      toast.error("Erreur lors de la duplication");
    } finally {
      setDuplicatingId(null);
      duplicatingRef.current = false;
    }
  };

  const handleCreateFolder = async (name: string, color: string) => {
    if (!user) return;
    const folder = await createFolder(user.uid, name, color);
    setFolders(prev => [...prev, folder]);
    setActiveFolder(folder.id);
    toast.success(`Dossier "${name}" créé`);
  };

  const handleUpdateFolder = async (folder: FolderType, name: string, color: string) => {
    await updateFolder(folder.id, { name, color });
    setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, name, color } : f));
    toast.success("Dossier mis à jour");
  };

  const handleDeleteFolder = async (folder: FolderType) => {
    if (!confirm(`Supprimer le dossier "${folder.name}" ? Les livrets ne seront pas supprimés.`)) return;
    await deleteFolder(folder.id);
    setFolders(prev => prev.filter(f => f.id !== folder.id));
    setBooklets(prev => prev.map(b => b.folderId === folder.id ? { ...b, folderId: undefined } : b));
    if (activeFolder === folder.id) setActiveFolder(null);
    toast.success("Dossier supprimé");
  };

  const handleMoveToFolder = async (booklet: Booklet, folderId: string | null) => {
    await moveBookletToFolder(booklet.id, folderId);
    setBooklets(prev => prev.map(b => b.id === booklet.id ? { ...b, folderId: folderId ?? undefined } : b));
    const folderName = folderId ? folders.find(f => f.id === folderId)?.name : null;
    toast.success(folderName ? `Déplacé dans "${folderName}"` : "Retiré du dossier");
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
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href={`/${locale}`} className="flex items-center gap-2">
            <BunklyLogo height={28} />
            <span className="hidden sm:block text-sm font-semibold text-gray-400">bunkly.co</span>
          </a>

          <div className="flex items-center gap-3">
            {isFree && (
              <button
                onClick={() => router.push(`/${locale}/dashboard/settings`)}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors border border-orange-100">
                <Crown className="w-3.5 h-3.5" />
                Passer au plan supérieur
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
              onClick={() => router.push(`/${locale}/dashboard/affiliation`)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-100"
              title="Programme d'affiliation">
              <Gift className="w-3.5 h-3.5" />
              Affiliation
            </button>

            <a
              href="https://www.youtube.com/@Bunkly_co"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
              title="Tutoriels YouTube">
              <HelpCircle className="w-4 h-4" />
            </a>
            <button onClick={handleSignOut}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-10">

        {/* Bandeau expiration imminente */}
        {isExpiringSoon && (
          <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900 text-sm">Votre abonnement expire dans {daysUntilExpiry} jour{daysUntilExpiry! > 1 ? "s" : ""}</p>
                <p className="text-xs text-amber-700 mt-0.5">Renouvelez maintenant pour ne pas interrompre l'accès à vos livrets.</p>
              </div>
            </div>
            <button onClick={() => router.push(`/${locale}/dashboard/settings`)}
              className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Renouveler
            </button>
          </div>
        )}

        {/* Bandeau abonnement expiré */}
        {isExpired && (
          <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-red-900 text-sm">Votre abonnement a expiré</p>
                <p className="text-xs text-red-700 mt-0.5">Vos livrets sont en pause. Réactivez votre abonnement pour les remettre en ligne — vos données sont intactes.</p>
              </div>
            </div>
            <button onClick={() => setShowUpgrade(true)}
              className="shrink-0 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Réactiver
            </button>
          </div>
        )}

        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
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
            onClick={() => canCreate ? setShowNewModal(true) : requirePlan(`Limite de ${bookletLimit} livret${bookletLimit > 1 ? "s" : ""} atteinte`)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-5 py-3 rounded-2xl transition-colors shadow-sm shadow-orange-200">
            <Plus className="w-4 h-4" />
            Nouveau livret
          </button>
        </div>

        {/* Onglets dossiers */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFolder(null)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
              activeFolder === null
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            Tous les livrets
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeFolder === null ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
              {booklets.length}
            </span>
          </button>

          {folders.map(folder => {
            const count = booklets.filter(b => b.folderId === folder.id).length;
            const isActive = activeFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shrink-0 group/tab ${
                  isActive ? "text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                style={isActive ? { backgroundColor: folder.color } : {}}>
                <Folder className="w-3.5 h-3.5 shrink-0" style={{ color: isActive ? "#fff" : folder.color }} />
                {folder.name}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
                {isActive && (
                  <span
                    onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); setShowFolderModal(true); }}
                    className="ml-0.5 p-0.5 rounded hover:bg-white/20 transition-colors cursor-pointer">
                    <Pencil className="w-3 h-3 text-white/70" />
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => can("folders") ? (setEditingFolder(null), setShowFolderModal(true)) : requirePlan("Les dossiers sont réservés au plan Pro")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-white border border-dashed border-gray-200 hover:border-gray-300 transition-colors shrink-0">
            <FolderPlus className="w-3.5 h-3.5" />
            Nouveau dossier
            {!can("folders") && <Lock className="w-3 h-3 text-gray-300" />}
          </button>
        </div>

        <div className="flex gap-8 items-start">

          {/* Bandeau publicitaire — masqué sur mobile */}
          <aside className="hidden lg:flex flex-col gap-4 w-60 shrink-0 sticky top-8">
            <PromoSidebar />
          </aside>

          {/* Colonne principale */}
          <div className="flex-1 min-w-0">

            {/* Upgrade banner */}
            {isFree && booklets.length > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Débloquez toutes les fonctionnalités</p>
                    <p className="text-xs text-gray-500 mt-0.5">Dossiers, tous les templates, modules optionnels… à partir de 9€/mois.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                  Voir les plans
                </button>
              </div>
            )}

            {/* Grid livrets */}
            {loadingBooklets ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl h-52 animate-pulse border border-gray-100" />
                ))}
              </div>
            ) : booklets.length === 0 ? (
              <EmptyState onCreate={() => setShowNewModal(true)} />
            ) : (() => {
              const filtered = activeFolder === null
                ? booklets
                : booklets.filter(b => b.folderId === activeFolder);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {filtered.map((booklet) => (
                    <BookletCard
                      key={booklet.id}
                      booklet={booklet}
                      folders={folders}
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
                      onAnalytics={() => can("analytics") ? setAnalyticsBooklet(booklet) : requirePlan("Les analytics sont réservés aux plans Pro et Agency")}
                      onDuplicate={() => handleDuplicate(booklet)}
                      onDelete={() => handleDelete(booklet.id)}
                      onMoveToFolder={(folderId) => handleMoveToFolder(booklet, folderId)}
                    />
                  ))}

                  {canCreate && activeFolder === null && (
                    <button
                      onClick={() => setShowNewModal(true)}
                      className="rounded-2xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/40 flex flex-col items-center justify-center gap-3 p-8 transition-all group"
                      style={{ minHeight: "200px", background: "linear-gradient(135deg, #fff 0%, #fafafa 100%)" }}>
                      <div className="w-14 h-14 rounded-2xl bg-orange-50 group-hover:bg-orange-100 border border-orange-100 flex items-center justify-center transition-colors shadow-sm">
                        <Plus className="w-7 h-7 text-orange-400 group-hover:text-orange-500 transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-600 group-hover:text-orange-500 transition-colors">
                          Nouveau livret
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Créer un livret d'accueil</p>
                      </div>
                    </button>
                  )}

                  {activeFolder === null && (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center gap-3 p-8 opacity-60" style={{ minHeight: "200px" }}>
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <span className="text-2xl">✨</span>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-500">Nouveau template</p>
                        <p className="text-xs text-gray-400 mt-0.5">Arrive bientôt</p>
                      </div>
                    </div>
                  )}

                  {filtered.length === 0 && activeFolder !== null && (
                    <div className="col-span-2 text-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <FolderOpen className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">Ce dossier est vide</p>
                      <p className="text-xs text-gray-400">Déplacez des livrets ici depuis le menu ···</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

        </div>
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

      {/* Upgrade modal */}
      {showUpgrade && (
        <UpgradeModal reason={upgradeReason} onClose={() => setShowUpgrade(false)} />
      )}

      {/* Referral source modal (nouvel utilisateur) */}
      {showReferralModal && (
        <ReferralSourceModal uid={user!.uid} onClose={() => setDismissedReferralModal(true)} />
      )}

      {/* Folder modal */}
      {showFolderModal && (
        <FolderModal
          folder={editingFolder}
          onClose={() => { setShowFolderModal(false); setEditingFolder(null); }}
          onCreate={handleCreateFolder}
          onUpdate={(name, color) => editingFolder ? handleUpdateFolder(editingFolder, name, color) : Promise.resolve()}
          onDelete={() => { if (editingFolder) handleDeleteFolder(editingFolder); }}
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

function BookletCard({ booklet, folders, isFree, onEdit, onPreview, onShare, onAnalytics, onDuplicate, onDelete, onMoveToFolder }: {
  booklet: Booklet;
  folders: FolderType[];
  isFree: boolean;
  onEdit: () => void;
  onPreview: () => void;
  onShare: () => void;
  onAnalytics: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveToFolder: (folderId: string | null) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const accent = booklet.accentColor || "#f97316";

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setShowMoveMenu(false);
    setMenuOpen(v => !v);
  };

  const currentFolder = folders.find(f => f.id === booklet.folderId);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group p-2">

      {/* Thumbnail cover */}
      <div className="relative h-36 w-full overflow-hidden rounded-xl" style={{ background: accent + "22" }}>
        {booklet.coverImage
          ? <img src={booklet.coverImage} alt="" className="w-full h-full object-cover" />
          : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}30 0%, ${accent}10 100%)` }}>
              <BookOpen className="w-10 h-10 opacity-30" style={{ color: accent }} />
            </div>
          )
        }
        {/* Overlay gradient bas */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45) 100%)" }} />

        {/* Badge publié */}
        <div className="absolute bottom-2.5 left-3">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${
            isFree
              ? "bg-amber-500/80 text-white"
              : booklet.isPublished
                ? "bg-green-500/80 text-white"
                : "bg-black/40 text-white/80"
          }`}>
            {isFree ? <><Lock className="w-2.5 h-2.5" />Brouillon</> : booklet.isPublished ? "● Publié" : "Brouillon"}
          </span>
        </div>

        {/* Menu contextuel */}
        <div className="absolute top-2.5 right-2.5">
          <button
            ref={btnRef}
            onClick={openMenu}
            className="p-1.5 rounded-lg bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown en position fixed — ne peut pas être coupé */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setMenuOpen(false); setShowMoveMenu(false); }} />
            <div className="fixed z-50 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 w-48 overflow-hidden"
              style={{ top: menuPos.top, right: menuPos.right }}>
              <button onClick={() => { onPreview(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Eye className="w-4 h-4 text-gray-400" /> Aperçu
              </button>
              <button onClick={() => { onAnalytics(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <BarChart2 className="w-4 h-4 text-gray-400" /> Analytics
              </button>
              <button onClick={() => { onDuplicate(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Copy className="w-4 h-4 text-gray-400" /> Dupliquer
              </button>

              {/* Déplacer vers dossier */}
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => setShowMoveMenu(v => !v)}
                className="w-full flex items-center justify-between gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-2.5"><Folder className="w-4 h-4 text-gray-400" /> Déplacer vers</span>
                <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showMoveMenu ? "rotate-90" : ""}`} />
              </button>
              {showMoveMenu && (
                <div className="bg-gray-50 border-t border-gray-100">
                  {booklet.folderId && (
                    <button
                      onClick={() => { onMoveToFolder(null); setMenuOpen(false); setShowMoveMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-5 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                      <X className="w-3.5 h-3.5 text-gray-400" /> Retirer du dossier
                    </button>
                  )}
                  {folders.map(f => (
                    <button key={f.id}
                      onClick={() => { onMoveToFolder(f.id); setMenuOpen(false); setShowMoveMenu(false); }}
                      className="w-full flex items-center justify-between gap-2.5 px-5 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: f.color }} />
                        {f.name}
                      </span>
                      {booklet.folderId === f.id && <Check className="w-3.5 h-3.5 text-green-500" />}
                    </button>
                  ))}
                  {folders.length === 0 && (
                    <p className="px-5 py-2 text-xs text-gray-400 italic">Aucun dossier créé</p>
                  )}
                </div>
              )}

              <div className="my-1 border-t border-gray-100" />
              <button onClick={() => { onDelete(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </>
        )}
      </div>

      {/* Infos + actions */}
      <div className="px-2 pt-3 pb-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 truncate">{booklet.title}</h3>
        {currentFolder && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mb-2"
            style={{ background: currentFolder.color + "18", color: currentFolder.color }}>
            <Folder className="w-3 h-3" /> {currentFolder.name}
          </span>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3.5">
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
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl transition-colors text-white"
            style={{ background: accent }}>
            <Pencil className="w-3.5 h-3.5" /> Modifier
          </button>
          {!isFree && booklet.isPublished && (
            <button onClick={onShare}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold transition-colors">
              <Share2 className="w-3.5 h-3.5" /> Partager
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Couleurs disponibles pour les dossiers ─────────────────────────────────────
const FOLDER_COLORS = [
  "#f97316", "#ef4444", "#ec4899", "#a855f7",
  "#6366f1", "#3b82f6", "#06b6d4", "#10b981",
  "#84cc16", "#eab308", "#78716c", "#6b7280",
];

function FolderModal({ folder, onClose, onCreate, onUpdate, onDelete }: {
  folder: FolderType | null;
  onClose: () => void;
  onCreate: (name: string, color: string) => Promise<void>;
  onUpdate: (name: string, color: string) => Promise<void>;
  onDelete: () => void;
}) {
  const [name, setName] = useState(folder?.name ?? "");
  const [color, setColor] = useState(folder?.color ?? FOLDER_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const isEdit = !!folder;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (isEdit) await onUpdate(name.trim(), color);
      else await onCreate(name.trim(), color);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? "Modifier le dossier" : "Nouveau dossier"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Preview */}
          <div className="flex items-center gap-3 p-4 rounded-2xl mb-5" style={{ background: color + "15" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color }}>
              <Folder className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">{name || "Nom du dossier"}</span>
          </div>

          {/* Nom */}
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nom</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Paris, Appartements, Été 2025…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent mb-4"
            style={{ focusRingColor: color } as React.CSSProperties}
          />

          {/* Couleur */}
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Couleur</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {FOLDER_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                style={{ background: c }}>
                {color === c && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {isEdit && (
              <button type="button" onClick={() => { onDelete(); onClose(); }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors border border-red-100">
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
            )}
            <button type="submit" disabled={!name.trim() || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40"
              style={{ background: color }}>
              {saving ? "..." : isEdit ? "Enregistrer" : "Créer le dossier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
