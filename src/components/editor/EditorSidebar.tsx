"use client";

import { useState, useEffect, useRef } from "react";
import { GripVertical, Eye, EyeOff, Settings, Check, X, Loader2, Link } from "lucide-react";
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
import { MODULE_META } from "@/lib/modules";
import { BookletModule } from "@/types";
import { SplashEditor } from "./SplashEditor";

export function EditorSidebar({ onModuleSelect }: { onModuleSelect?: () => void } = {}) {
  const { booklet, activeModuleId, setActiveModule, toggleModule, reorderModules } = useEditorStore();
  const [tab, setTab] = useState<"modules" | "splash" | "settings">("modules");

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

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100 p-2 gap-1">
        <button onClick={() => setTab("modules")}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${tab === "modules" ? "bg-orange-50 text-orange-600" : "text-gray-400 hover:text-gray-600"}`}>
          Modules
        </button>
        <button onClick={() => setTab("splash")}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${tab === "splash" ? "bg-orange-50 text-orange-600" : "text-gray-400 hover:text-gray-600"}`}>
          Accueil
        </button>
        <button onClick={() => setTab("settings")}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${tab === "settings" ? "bg-orange-50 text-orange-600" : "text-gray-400 hover:text-gray-600"}`}>
          Réglages
        </button>
      </div>

      {tab === "splash" && (
        <div className="flex-1 overflow-y-auto">
          <SplashEditor />
        </div>
      )}

      {tab === "modules" ? (
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
      ) : tab === "settings" ? (
        <SidebarSettings />
      ) : null}
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

function SidebarSettings() {
  const { booklet, updateBookletField } = useEditorStore();
  const [slugInput, setSlugInput] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "too_short">("idle");
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
      if (data.available) {
        setSlugStatus("available");
        updateBookletField("slug", clean);
      } else {
        setSlugStatus(data.reason === "too_short" ? "too_short" : "taken");
      }
    }, 500);
  };

  if (!booklet) return null;

  const COLORS = ["#f97316", "#ef4444", "#8b5cf6", "#3b82f6", "#10b981", "#ec4899", "#1a1a1a"];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Nom du logement
        </label>
        <input
          type="text"
          value={booklet.propertyName}
          onChange={(e) => updateBookletField("propertyName", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          URL du livret
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Link className="w-3.5 h-3.5 text-gray-300" />
          </div>
          <input
            type="text"
            value={slugInput}
            onChange={(e) => checkSlug(e.target.value)}
            className={`w-full border rounded-xl pl-8 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              slugStatus === "available" ? "border-green-300 focus:ring-green-400" :
              slugStatus === "taken" || slugStatus === "too_short" ? "border-red-300 focus:ring-red-400" :
              "border-gray-200 focus:ring-orange-400"
            }`}
            placeholder="villa-les-lavandes"
            spellCheck={false}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {slugStatus === "checking" && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
            {slugStatus === "available" && <Check className="w-3.5 h-3.5 text-green-500" />}
            {(slugStatus === "taken" || slugStatus === "too_short") && <X className="w-3.5 h-3.5 text-red-400" />}
          </div>
        </div>
        <p className={`text-xs mt-1.5 ${
          slugStatus === "available" ? "text-green-500" :
          slugStatus === "taken" ? "text-red-400" :
          slugStatus === "too_short" ? "text-red-400" :
          "text-gray-400"
        }`}>
          {slugStatus === "available" ? "URL disponible ✓" :
           slugStatus === "taken" ? "URL déjà utilisée" :
           slugStatus === "too_short" ? "Minimum 3 caractères" :
           `…/b/${slugInput || booklet.slug}`}
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Couleur principale
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => updateBookletField("accentColor", c)}
              className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${booklet.accentColor === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Adresse
        </label>
        <textarea
          value={booklet.address || ""}
          onChange={(e) => updateBookletField("address", e.target.value)}
          rows={2}
          placeholder="123 route des Alpilles, 13520 Les Baux"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Description courte
        </label>
        <textarea
          value={booklet.description || ""}
          onChange={(e) => updateBookletField("description", e.target.value)}
          rows={3}
          placeholder="Un gîte au cœur des Alpilles..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
        />
      </div>
    </div>
  );
}
