"use client";

import { useState, useEffect, useRef } from "react";
import { GripVertical, Eye, EyeOff, Check, X, Loader2, Link, ImagePlus, Trash2 } from "lucide-react";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditorStore } from "@/store/editorStore";
import { MODULE_META, CORE_MODULES, OPTIONAL_MODULES } from "@/lib/modules";
import { BookletModule, ModuleType } from "@/types";

export function EditorSidebar({ onModuleSelect }: { onModuleSelect?: () => void } = {}) {
  const { booklet, activeModuleId, setActiveModule, toggleModule, reorderModules, addModule } = useEditorStore();
  const [tab, setTab] = useState<"modules" | "optional" | "appearance">("modules");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!booklet) return null;

  const sortedModules = [...booklet.modules].sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedModules.findIndex((m) => m.id === active.id);
    const newIndex = sortedModules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(sortedModules, oldIndex, newIndex).map((m, i) => ({ ...m, order: i }));
    reorderModules(reordered);
  };

  const existingTypes = new Set(booklet?.modules.map((m) => m.type) ?? []);

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden">

      {/* Tabs */}
      <div className="flex border-b border-gray-100 p-2 gap-1">
        <button onClick={() => setTab("modules")}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${tab === "modules" ? "bg-orange-50 text-orange-600" : "text-gray-400 hover:text-gray-600"}`}>
          Modules
        </button>
        <button onClick={() => setTab("optional")}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${tab === "optional" ? "bg-orange-50 text-orange-600" : "text-gray-400 hover:text-gray-600"}`}>
          Options
        </button>
        <button onClick={() => setTab("appearance")}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${tab === "appearance" ? "bg-orange-50 text-orange-600" : "text-gray-400 hover:text-gray-600"}`}>
          Apparence
        </button>
      </div>

      {tab === "modules" && (
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs text-gray-400 px-2 mb-3">
            Glissez pour réordonner · cliquez pour éditer
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedModules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              {sortedModules.map((module) => (
                <SortableModuleItem
                  key={module.id}
                  module={module}
                  isActive={module.id === activeModuleId}
                  onClick={() => { setActiveModule(module.id); onModuleSelect?.(); }}
                  onToggle={() => toggleModule(module.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {tab === "optional" && (
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs text-gray-400 px-2 mb-3">Modules optionnels à ajouter</p>
          {OPTIONAL_MODULES.map((type) => {
            const meta = MODULE_META[type];
            const already = existingTypes.has(type);
            return (
              <div key={type} className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-1">
                <span className="text-base leading-none">{meta.emoji}</span>
                <span className="flex-1 text-sm text-gray-700 truncate">{meta.label}</span>
                {already ? (
                  <span className="text-xs text-gray-300 font-medium">Ajouté</span>
                ) : (
                  <button
                    onClick={() => addModule(type)}
                    className="text-xs font-bold text-orange-500 hover:text-orange-700 transition-colors">
                    + Ajouter
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "appearance" && <SidebarAppearance />}
    </aside>
  );
}

function SortableModuleItem({
  module, isActive, onClick, onToggle,
}: {
  module: BookletModule;
  isActive: boolean;
  onClick: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });
  const meta = MODULE_META[module.type];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl mb-1 cursor-pointer group transition-colors ${
        isActive
          ? "bg-orange-50 border border-orange-100"
          : module.enabled
            ? "hover:bg-gray-50"
            : "opacity-50 hover:bg-gray-50"
      }`}
      onClick={onClick}>
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
        onClick={(e) => e.stopPropagation()}>
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <span className="text-base leading-none">{meta.emoji}</span>

      <span className={`flex-1 text-sm font-medium truncate ${isActive ? "text-orange-700" : "text-gray-700"}`}>
        {meta.label}
      </span>

      {/* Toggle visibility */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {module.enabled
          ? <Eye className="w-3.5 h-3.5" />
          : <EyeOff className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function SidebarAppearance() {
  const { booklet, updateBookletField } = useEditorStore();
  const [slugInput, setSlugInput] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "too_short">("idle");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (booklet) setSlugInput(booklet.slug);
  }, [booklet?.id]);

  const checkSlug = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    setSlugInput(clean);
    if (clean === booklet?.slug) { setSlugStatus("idle"); return; }
    if (clean.length < 3) { setSlugStatus("too_short"); return; }
    setSlugStatus("checking");
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/booklets/check-slug?slug=${clean}&excludeId=${booklet?.id}`);
      const data = await res.json();
      if (data.available) { setSlugStatus("available"); updateBookletField("slug", clean); }
      else setSlugStatus(data.reason === "too_short" ? "too_short" : "taken");
    }, 500);
  };

  const uploadCover = async (file: File) => {
    if (!booklet) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `booklets/${booklet.id}/cover-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      updateBookletField("coverImage", url);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const removeCover = async () => {
    if (!booklet?.coverImage) return;
    try {
      const storageRef = ref(storage, booklet.coverImage);
      await deleteObject(storageRef).catch(() => {});
    } finally {
      updateBookletField("coverImage", "");
    }
  };

  if (!booklet) return null;

  const COLORS = [
    { hex: "#007AFF", name: "Bleu iOS" },
    { hex: "#f97316", name: "Orange" },
    { hex: "#ef4444", name: "Rouge" },
    { hex: "#8b5cf6", name: "Violet" },
    { hex: "#10b981", name: "Vert" },
    { hex: "#ec4899", name: "Rose" },
    { hex: "#1a1a1a", name: "Noir" },
    { hex: "#34C759", name: "Vert iOS" },
  ];

  const ibase = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent";

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── Photo de couverture ── */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Photo de couverture</p>

        {booklet.coverImage ? (
          <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <img src={booklet.coverImage} alt="Couverture" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-2 right-2 flex gap-1.5">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/90 text-gray-700 text-xs font-semibold hover:bg-white transition-colors">
                <ImagePlus className="w-3.5 h-3.5" /> Changer
              </button>
              <button
                onClick={removeCover}
                className="p-1.5 rounded-lg bg-white/90 text-red-400 hover:text-red-600 hover:bg-white transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-400 hover:bg-orange-50 transition-all disabled:opacity-50">
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
            <span className="text-sm font-medium">{uploading ? "Envoi en cours..." : "Ajouter une photo"}</span>
            <span className="text-xs text-gray-300">JPG, PNG, WebP · max 5MB</span>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }}
        />
      </div>

      <div className="p-4 space-y-4">
        {/* Nom */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nom du logement</label>
          <input type="text" value={booklet.propertyName} onChange={(e) => updateBookletField("propertyName", e.target.value)}
            placeholder="Villa Les Pins" className={ibase} />
        </div>

        {/* Adresse */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Adresse</label>
          <input type="text" value={booklet.address || ""} onChange={(e) => updateBookletField("address", e.target.value)}
            placeholder="5 chemin des Oliviers, 84220 Gordes" className={ibase} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description courte</label>
          <textarea value={booklet.description || ""} onChange={(e) => updateBookletField("description", e.target.value)}
            rows={2} placeholder="Magnifique villa provençale avec piscine..." className={`${ibase} resize-none`} />
        </div>

        {/* Couleur */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Couleur principale</label>
          <div className="grid grid-cols-4 gap-2">
            {COLORS.map((c) => (
              <button key={c.hex} onClick={() => updateBookletField("accentColor", c.hex)}
                title={c.name}
                className={`relative h-8 rounded-xl transition-transform hover:scale-105 ${booklet.accentColor === c.hex ? "ring-2 ring-offset-2 ring-gray-400 scale-105" : ""}`}
                style={{ backgroundColor: c.hex }}>
                {booklet.accentColor === c.hex && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white drop-shadow" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {/* Couleur personnalisée */}
          <div className="flex items-center gap-2 mt-2">
            <input type="color" value={booklet.accentColor || "#007AFF"}
              onChange={(e) => updateBookletField("accentColor", e.target.value)}
              className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
            <span className="text-xs text-gray-400">Couleur personnalisée</span>
            <span className="text-xs font-mono text-gray-500 ml-auto">{booklet.accentColor}</span>
          </div>
        </div>

        {/* URL */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">URL du livret</label>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
            <input type="text" value={slugInput} onChange={(e) => checkSlug(e.target.value)}
              className={`w-full border rounded-xl pl-8 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                slugStatus === "available" ? "border-green-300 focus:ring-green-400" :
                slugStatus === "taken" || slugStatus === "too_short" ? "border-red-300 focus:ring-red-400" :
                "border-gray-200 focus:ring-orange-400"
              }`}
              placeholder="villa-les-pins" spellCheck={false} />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {slugStatus === "checking" && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
              {slugStatus === "available" && <Check className="w-3.5 h-3.5 text-green-500" />}
              {(slugStatus === "taken" || slugStatus === "too_short") && <X className="w-3.5 h-3.5 text-red-400" />}
            </div>
          </div>
          <p className={`text-xs mt-1.5 ${slugStatus === "available" ? "text-green-500" : slugStatus === "taken" || slugStatus === "too_short" ? "text-red-400" : "text-gray-400"}`}>
            {slugStatus === "available" ? "URL disponible ✓" : slugStatus === "taken" ? "URL déjà utilisée" : slugStatus === "too_short" ? "Minimum 3 caractères" : `app.bunkly.co/b/${slugInput || booklet.slug}`}
          </p>
        </div>
      </div>
    </div>
  );
}
