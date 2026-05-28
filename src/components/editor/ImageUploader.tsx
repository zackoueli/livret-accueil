"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/upload";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

interface ImageUploaderProps {
  bookletId: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
  label?: string;
  folder?: string;
}

export function ImageUploader({ bookletId, currentUrl, onUpload, label = "Photo de couverture", folder = "covers" }: ImageUploaderProps) {
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);

  const handleFile = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setProgress(0);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    try {
      const path = `users/${user.uid}/booklets/${bookletId}/${folder}/${Date.now()}_${file.name}`;
      const url = await uploadImage(file, path, setProgress);
      onUpload(url);
      toast.success("Image uploadée !");
    } catch (err: any) {
      toast.error(err.message || "Erreur d'upload");
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 group">
          <img src={preview} alt="" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="bg-white text-gray-800 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-gray-50">
              <Upload className="w-3.5 h-3.5" /> Changer
            </button>
            <button
              onClick={() => { setPreview(null); onUpload(""); }}
              className="bg-red-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-red-600">
              <X className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
          {uploading && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
              <div
                className="h-full bg-orange-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/30 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all">
          {uploading ? (
            <><Loader2 className="w-8 h-8 text-orange-400 animate-spin" /><p className="text-sm text-gray-400">Upload en cours... {progress}%</p></>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Glissez une image ici</p>
                <p className="text-xs text-gray-400 mt-0.5">ou cliquez pour sélectionner · JPG, PNG, WebP · max 10 Mo</p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
