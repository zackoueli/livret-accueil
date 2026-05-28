"use client";

import { useRef, useState } from "react";
import { FileText, X, Plus, Loader2 } from "lucide-react";
import { uploadDocument } from "@/lib/upload";
import { useAuthStore } from "@/store/authStore";
import { useEditorStore } from "@/store/editorStore";
import { BookletDocument } from "@/types";
import toast from "react-hot-toast";

interface Props {
  bookletId: string;
  moduleId: string;
  documents: BookletDocument[];
}

export function ModuleDocumentUploader({ bookletId, moduleId, documents }: Props) {
  const { user } = useAuthStore();
  const { updateModuleDocuments } = useEditorStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!user) return;
    if (file.type !== "application/pdf") return toast.error("PDF uniquement");
    setUploading(true);
    try {
      const path = `users/${user.uid}/booklets/${bookletId}/documents/${moduleId}/${Date.now()}_${file.name}`;
      const url = await uploadDocument(file, path);
      const doc: BookletDocument = { url, name: file.name, size: file.size };
      updateModuleDocuments(moduleId, [...documents, doc]);
      toast.success("Document ajouté !");
    } catch (err: any) {
      toast.error(err.message || "Erreur d'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const removeDoc = (index: number) => {
    updateModuleDocuments(moduleId, documents.filter((_, i) => i !== index));
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    return bytes < 1024 * 1024
      ? `${Math.round(bytes / 1024)} Ko`
      : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Documents PDF
      </label>

      {documents.length > 0 && (
        <div className="space-y-2 mb-3">
          {documents.map((doc, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{doc.name}</p>
                {doc.size && <p className="text-xs text-gray-400">{formatSize(doc.size)}</p>}
              </div>
              <button onClick={() => removeDoc(i)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 transition-all">
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

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
          <><Plus className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-500">Ajouter un PDF · max 20 Mo</span></>
        )}
      </div>

      <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}
