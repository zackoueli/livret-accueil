"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Plus, Loader2, Lock } from "lucide-react";
import { uploadImage } from "@/lib/upload";
import { useAuthStore } from "@/store/authStore";
import { useEditorStore } from "@/store/editorStore";
import { usePlan } from "@/hooks/usePlan";
import { countBookletPhotos } from "@/lib/plans";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import toast from "react-hot-toast";

interface Props {
  bookletId: string;
  moduleId: string;
}

// Photos d'un module (parking, rangement atypique…).
// La limite (5 en gratuit, 20 en payant) porte sur l'ensemble du livret.
export function ModulePhotoUploader({ bookletId, moduleId }: Props) {
  const t = useTranslations("editor");
  const { user } = useAuthStore();
  const { booklet, updateModuleImages } = useEditorStore();
  const { photoLimit, isFree } = usePlan();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const images = booklet?.modules.find(m => m.id === moduleId)?.images ?? [];
  const used = booklet ? countBookletPhotos(booklet.modules) : 0;
  const full = used + uploading >= photoLimit;

  // Lit l'état à jour du store : plusieurs envois peuvent se terminer en même temps
  const currentImages = () =>
    useEditorStore.getState().booklet?.modules.find(m => m.id === moduleId)?.images ?? [];
  const currentCount = () => {
    const b = useEditorStore.getState().booklet;
    return b ? countBookletPhotos(b.modules) : 0;
  };

  const handleFiles = async (files: File[]) => {
    if (!user || !files.length) return;
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    if (imageFiles.length < files.length) toast.error(t("imageOnly"));
    const sized = imageFiles.filter(f => f.size <= 10 * 1024 * 1024);
    if (sized.length < imageFiles.length) toast.error(t("photoTooBig"));

    const room = Math.max(0, photoLimit - currentCount() - uploading);
    const batch = sized.slice(0, room);
    if (sized.length > room) {
      toast.error(t("photoLimitReached", { limit: photoLimit }));
      if (isFree) setShowUpgrade(true);
    }
    if (!batch.length) return;

    setUploading(n => n + batch.length);
    let added = 0;
    await Promise.all(batch.map(async (file) => {
      try {
        const safeName = file.name.replace(/[^\w.-]+/g, "_");
        const path = `users/${user.uid}/booklets/${bookletId}/modules/${moduleId}/${Date.now()}_${safeName}`;
        const url = await uploadImage(file, path);
        updateModuleImages(moduleId, [...currentImages(), url]);
        added++;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("uploadError"));
      } finally {
        setUploading(n => n - 1);
      }
    }));
    if (added > 0) toast.success(t("photoAdded"));
  };

  const openPicker = () => {
    if (full) {
      toast.error(t("photoLimitReached", { limit: photoLimit }));
      if (isFree) setShowUpgrade(true);
      return;
    }
    inputRef.current?.click();
  };

  const removePhoto = (index: number) => {
    updateModuleImages(moduleId, currentImages().filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-1">
        <label className="block text-sm font-semibold text-gray-700">{t("modulePhotos")}</label>
        <span className={`text-xs font-medium shrink-0 ${used >= photoLimit ? "text-orange-500" : "text-gray-400"}`}>
          {t("photosUsed", { used, limit: photoLimit })}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3 leading-relaxed">{t("modulePhotosHint")}</p>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {images.map((url, i) => (
            <div key={url + i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label={t("deletePhoto")}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(Array.from(e.dataTransfer.files)); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={openPicker}
        className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer transition-all ${
          full
            ? "border-gray-100 bg-gray-50"
            : dragOver ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
        }`}>
        {uploading > 0 ? (
          <><Loader2 className="w-4 h-4 text-orange-400 animate-spin" /><span className="text-xs text-gray-400">{t("uploadingPhoto")}</span></>
        ) : full ? (
          <><Lock className="w-4 h-4 text-gray-300" /><span className="text-xs text-gray-400">{t("photoLimitReached", { limit: photoLimit })}</span></>
        ) : (
          <><Plus className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-500">{t("addPhotos")}</span><span className="text-xs text-gray-300">· {t("photoFormats10")}</span></>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { handleFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />

      {showUpgrade && (
        <UpgradeModal reason={t("photoLimitUpgrade")} onClose={() => setShowUpgrade(false)} />
      )}
    </div>
  );
}
