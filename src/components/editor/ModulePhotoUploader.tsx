"use client";

import { useRef, useState } from "react";
import { ImageIcon, X, Plus, Loader2, GripVertical } from "lucide-react";
import { uploadImage } from "@/lib/upload";
import { useAuthStore } from "@/store/authStore";
import { useEditorStore } from "@/store/editorStore";
import toast from "react-hot-toast";

interface Props {
  bookletId: string;
  moduleId: string;
  images: string[];
}

export function ModulePhotoUploader({ bookletId, moduleId, images }: Props) {
  const { user } = useAuthStore();
  const { updateModuleImages } = useEditorStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) return toast.error("Image uniquement");
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10 Mo");
    setUploading(true);
    try {
      const path = `users/${user.uid}/booklets/${bookletId}/modules/${moduleId}/${Date.now()}_${file.name}`;
      const url = await uploadImage(file, path);
      updateModuleImages(moduleId, [...images, url]);
      toast.success("Photo ajoutée !");
    } catch (err: any) {
      toast.error(err.message || "Erreur d'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(handleFile);
  };

  const removePhoto = (index: number) => {
    updateModuleImages(moduleId, images.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Photos du module
      </label>

      {/* Grid photos existantes */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Zone upload */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer transition-all ${
          dragOver ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
        }`}>
        {uploading ? (
          <><Loader2 className="w-4 h-4 text-orange-400 animate-spin" /><span className="text-xs text-gray-400">Upload...</span></>
        ) : (
          <><Plus className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-500">Ajouter des photos</span></>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => Array.from(e.target.files ?? []).forEach(handleFile)} />
    </div>
  );
}
