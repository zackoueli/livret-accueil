"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { bookletUrl } from "@/lib/url";

export function EditorSidebar({ onModuleSelect }: { onModuleSelect?: () => void } = {}) {
  const { booklet, activeModuleId, setActiveModule, toggleModule, reorderModules, addModule } = useEditorStore();
  const [tab, setTab] = useState<"modules" | "appearance">("appearance");

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

      {/* Tabs — seulement Modules + Apparence */}
      <div className="flex border-b border-gray-100 p-2 gap-1">
        <button onClick={() => setTab("appearance")}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${tab === "appearance" ? "bg-orange-50 text-orange-600" : "text-gray-400 hover:text-gray-600"}`}>
          Apparence
        </button>
        <button onClick={() => setTab("modules")}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${tab === "modules" ? "bg-orange-50 text-orange-600" : "text-gray-400 hover:text-gray-600"}`}>
          Modules
        </button>
      </div>

      {tab === "modules" && (
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs text-gray-400 px-2 mb-3">
            Glissez pour réordonner · cliquez pour éditer
          </p>

          {/* Modules actifs */}
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

          {/* Séparateur + modules optionnels */}
          {OPTIONAL_MODULES.some(t => !existingTypes.has(t)) && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">À ajouter</p>
              {OPTIONAL_MODULES.filter(t => !existingTypes.has(t)).map((type) => {
                const meta = MODULE_META[type];
                return (
                  <div key={type} className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1 hover:bg-gray-50 transition-colors">
                    <span className="text-base leading-none">{meta.emoji}</span>
                    <span className="flex-1 text-sm text-gray-500 truncate">{meta.label}</span>
                    <button
                      onClick={() => addModule(type)}
                      className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-colors shrink-0">
                      + Ajouter
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
      className={`flex items-center gap-2 px-2 py-2 rounded-xl mb-1 cursor-pointer transition-colors ${
        isActive
          ? "bg-orange-50 border border-orange-100"
          : module.enabled
            ? "hover:bg-gray-50"
            : "bg-gray-50 opacity-60 hover:opacity-80"
      }`}
      onClick={onClick}>
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 p-0.5"
        onClick={(e) => e.stopPropagation()}>
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <span className="text-base leading-none shrink-0">{meta.emoji}</span>

      <span className={`flex-1 text-sm font-medium truncate ${isActive ? "text-orange-700" : module.enabled ? "text-gray-700" : "text-gray-400"}`}>
        {meta.label}
      </span>

      {/* Toggle visibility — toujours visible */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`shrink-0 p-1.5 rounded-lg transition-all ${
          module.enabled
            ? "bg-green-50 text-green-600 hover:bg-green-100"
            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
        }`}>
        {module.enabled
          ? <Eye className="w-3.5 h-3.5" />
          : <EyeOff className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function AddressForm({ address, onChange, ibase }: { address: string; onChange: (full: string) => void; ibase: string }) {
  // Parse l'adresse existante en champs séparés (format : "rue, CP ville, pays")
  const parse = (addr: string) => {
    const parts = addr.split(",").map(s => s.trim());
    const street = parts[0] ?? "";
    const cpCity = parts[1] ?? "";
    const country = parts[2] ?? "France";
    const cpMatch = cpCity.match(/^(\d{4,5})\s+(.+)$/);
    return {
      street,
      zip: cpMatch ? cpMatch[1] : "",
      city: cpMatch ? cpMatch[2] : cpCity,
      country,
    };
  };

  const parsed = parse(address);
  const [street, setStreet] = useState(parsed.street);
  const [zip, setZip] = useState(parsed.zip);
  const [city, setCity] = useState(parsed.city);
  const [country, setCountry] = useState(parsed.country || "France");

  const rebuild = (s: string, z: string, ci: string, co: string) => {
    const parts = [s, [z, ci].filter(Boolean).join(" "), co].filter(Boolean);
    onChange(parts.join(", "));
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Adresse</label>
      <div className="space-y-2">
        <input type="text" value={street} placeholder="Rue, numéro" className={ibase}
          onChange={e => { setStreet(e.target.value); rebuild(e.target.value, zip, city, country); }} />
        <div className="grid grid-cols-2 gap-2">
          <input type="text" value={zip} placeholder="Code postal" className={ibase}
            onChange={e => { setZip(e.target.value); rebuild(street, e.target.value, city, country); }} />
          <input type="text" value={city} placeholder="Ville" className={ibase}
            onChange={e => { setCity(e.target.value); rebuild(street, zip, e.target.value, country); }} />
        </div>
        <input type="text" value={country} placeholder="Pays" className={ibase}
          onChange={e => { setCountry(e.target.value); rebuild(street, zip, city, e.target.value); }} />
        {address && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span>📍</span> {address}
          </p>
        )}
      </div>
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

        {/* Adresse structurée */}
        <AddressForm
          address={booklet.address || ""}
          onChange={(full) => updateBookletField("address", full)}
          ibase={ibase}
        />

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

        {/* Template */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Design du livret</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "simple", label: "Scroll", desc: "Vue défilante classique", emoji: "📜" },
              { id: "grid",   label: "Grille", desc: "App mobile avec drawers", emoji: "📱" },
            ].map((t) => {
              const isActive = (booklet.templateId ?? "simple") === t.id;
              return (
                <button key={t.id} onClick={() => updateBookletField("templateId", t.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center ${isActive ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <span className="text-2xl">{t.emoji}</span>
                  <span className={`text-xs font-bold ${isActive ? "text-orange-500" : "text-gray-600"}`}>{t.label}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{t.desc}</span>
                </button>
              );
            })}
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
            {slugStatus === "available" ? "URL disponible ✓" : slugStatus === "taken" ? "URL déjà utilisée" : slugStatus === "too_short" ? "Minimum 3 caractères" : bookletUrl(slugInput || booklet.slug)}
          </p>
        </div>
      </div>
    </div>
  );
}
