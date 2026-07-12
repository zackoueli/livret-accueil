"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateBooklet } from "@/lib/booklets";
import { useAuthStore } from "@/store/authStore";
import { useEditorStore } from "@/store/editorStore";
import { Booklet } from "@/types";
import { EditorSidebar } from "./EditorSidebar";
import { EditorForm } from "./EditorForm";
import { EditorPreview } from "./EditorPreview";
import { EditorHeader } from "./EditorHeader";
import { LayoutList, PenLine, Eye } from "lucide-react";
import toast from "react-hot-toast";

type MobileTab = "modules" | "edit" | "preview";

export function EditorPage({ bookletId }: { bookletId: string }) {
  const router = useRouter();
  const locale = useLocale();
  const { user, loading: authLoading } = useAuthStore();
  const { booklet, setBooklet, resetEditor, isDirty, setIsSaving, setIsDirty } = useEditorStore();
  const [mobileTab, setMobileTab] = useState<MobileTab>("modules");

  // Load booklet
  useEffect(() => {
    if (!user) return;
    // Vide immédiatement le store partagé pour ne pas exposer/écraser le livret précédent
    // pendant le chargement asynchrone (ex: navigation dashboard -> édition après duplication).
    resetEditor();
    let cancelled = false;
    const load = async () => {
      const snap = await getDoc(doc(db, "booklets", bookletId));
      if (cancelled) return;
      if (!snap.exists()) { router.push(`/${locale}/dashboard`); return; }
      const data = { ...snap.data(), id: snap.id } as Booklet;
      if (data.userId !== user.uid) { router.push(`/${locale}/dashboard`); return; }
      setBooklet(data);
      // Sauvegarde immédiate si livret créé il y a moins de 10s (template prérempli)
      if (Date.now() - data.createdAt < 10000) {
        await updateBooklet(data.id, data);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user, bookletId]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/auth`);
  }, [user, authLoading]);

  const save = useCallback(async () => {
    if (!booklet || !isDirty || booklet.id !== bookletId) return;
    setIsSaving(true);
    try {
      await updateBooklet(booklet.id, booklet);
      setIsDirty(false);
      toast.success("Livret enregistré");
    } catch {
      toast.error("Erreur de sauvegarde");
    } finally {
      setIsSaving(false);
    }
  }, [booklet, isDirty, bookletId]);

  if (!booklet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Chargement du livret...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <EditorHeader onSave={save} />

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
        <EditorSidebar />
        <EditorForm />
        <EditorPreview />
      </div>

      {/* ── Mobile layout ── */}
      <div className="lg:hidden flex flex-col flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px - 56px)" }}>
        {mobileTab === "modules" && <EditorSidebar onModuleSelect={() => setMobileTab("edit")} />}
        {mobileTab === "edit" && <EditorForm />}
        {mobileTab === "preview" && <EditorPreview />}
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex h-14">
        {([
          { tab: "modules", icon: LayoutList, label: "Modules" },
          { tab: "edit",    icon: PenLine,    label: "Édition" },
          { tab: "preview", icon: Eye,        label: "Aperçu" },
        ] as { tab: MobileTab; icon: React.ElementType; label: string }[]).map(({ tab, icon: Icon, label }) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${
              mobileTab === tab ? "text-orange-500" : "text-gray-400"
            }`}>
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
