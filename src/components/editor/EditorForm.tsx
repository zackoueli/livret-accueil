"use client";

import { useState, useRef } from "react";
import { useEditorStore } from "@/store/editorStore";
import { MODULE_META, MODULE_FIELDS, ACTIVITY_CATEGORIES, SERVICE_EMOJIS, parseActivities, parseServices, Activity, Service } from "@/lib/modules";
import { EyeOff, ExternalLink, Plus, Trash2, ChevronDown, ChevronUp, ImagePlus, Loader2, X, GripVertical, Search } from "lucide-react";
import { nanoid } from "nanoid";
import { uploadImage } from "@/lib/upload";
import { useAuthStore } from "@/store/authStore";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Composant upload photo générique ─────────────────────────────────────────

function PhotoUploader({ bookletId, storagePath, value, onChange, aspectRatio = "16/9", circular = false }: {
  bookletId: string;
  storagePath: string;   // sous-dossier dans users/{uid}/booklets/{id}/
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: string;
  circular?: boolean;
}) {
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;
    setUploading(true);
    try {
      const path = `users/${user.uid}/booklets/${bookletId}/${storagePath}/${Date.now()}_${file.name}`;
      const url = await uploadImage(file, path);
      onChange(url);
    } catch (e) {
      console.error(e);
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

  const radius = circular ? "50%" : "12px";

  if (value) {
    return (
      <div className="relative group" style={{ borderRadius: radius, overflow: "hidden", aspectRatio: circular ? "1/1" : aspectRatio, width: circular ? 80 : "100%" }}>
        <img src={value} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button onClick={() => inputRef.current?.click()}
            className="p-1.5 rounded-lg bg-white/90 text-gray-700 hover:bg-white transition-colors" title="Changer">
            <ImagePlus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onChange("")}
            className="p-1.5 rounded-lg bg-white/90 text-red-400 hover:bg-white hover:text-red-600 transition-colors" title="Supprimer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      </div>
    );
  }

  return (
    <>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border-2 border-dashed ${
          dragOver ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/40"
        }`}
        style={{ borderRadius: radius, aspectRatio: circular ? "1/1" : aspectRatio, width: circular ? 80 : "100%", padding: circular ? 0 : "24px 0" }}>
        {uploading
          ? <Loader2 className={`${circular ? "w-4 h-4" : "w-5 h-5"} text-orange-400 animate-spin`} />
          : <>
              <ImagePlus className={`${circular ? "w-4 h-4" : "w-5 h-5"} text-gray-400`} />
              {!circular && <>
                <span className="text-xs text-gray-500 font-medium">Glisser une photo ou cliquer</span>
                <span className="text-xs text-gray-300">JPG, PNG, WebP · max 10 Mo</span>
              </>}
            </>
        }
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </>
  );
}

// ── Recherche Google Places ───────────────────────────────────────────────────

function PlacesSearch({ onSelect }: { onSelect: (data: Partial<Activity>) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ placeId: string; name: string; address: string; rating?: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setResults([]);
    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const pick = async (placeId: string) => {
    setLoadingId(placeId);
    try {
      const res = await fetch(`/api/places?placeId=${placeId}`);
      const data = await res.json();
      onSelect(data);
      setQuery("");
      setResults([]);
      setSearched(false);
    } catch { /* ignore */ }
    finally { setLoadingId(null); }
  };

  return (
    <div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">🔍 Recherche automatique</p>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Ex : Saut en parachute Perpignan..."
          className="flex-1 text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
        <button onClick={search} disabled={loading || !query.trim()}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Chercher
        </button>
      </div>
      {searched && !loading && results.length === 0 && (
        <p className="text-xs text-gray-400 mt-2">Aucun résultat trouvé.</p>
      )}
      {results.length > 0 && (
        <div className="mt-2 space-y-1">
          {results.map(r => (
            <button key={r.placeId} onClick={() => pick(r.placeId)} disabled={loadingId === r.placeId}
              className="w-full text-left px-3 py-2 bg-white hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{r.name}</p>
                <p className="text-xs text-gray-400 truncate">{r.address}</p>
              </div>
              {loadingId === r.placeId
                ? <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                : <span className="text-xs text-blue-500 font-semibold shrink-0">Sélectionner →</span>
              }
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Éditeur d'activités ───────────────────────────────────────────────────────

function SortableActivityItem({ item, expanded, onToggle, onRemove, onUpdate, bookletId }: {
  item: Activity;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<Activity>) => void;
  bookletId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const catEmoji = ACTIVITY_CATEGORIES.find(c => c.value === item.category)?.emoji ?? "📍";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={onToggle}>
        <button {...attributes} {...listeners} onClick={e => e.stopPropagation()}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0">
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-xl">{catEmoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{item.name || "Nouveau lieu"}</p>
          <p className="text-xs text-gray-400 truncate">
            {ACTIVITY_CATEGORIES.find(c => c.value === item.category)?.label}
            {item.distance && ` · ${item.distance}`}
          </p>
        </div>
        {item.recommended && <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">★ Coup de cœur</span>}
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <PlacesSearch onSelect={patch => onUpdate(patch)} />
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_CATEGORIES.map(cat => (
                <button key={cat.value}
                  onClick={() => onUpdate({ category: cat.value as Activity["category"] })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${item.category === cat.value ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <Field label="Nom du lieu *" value={item.name} onChange={v => onUpdate({ name: v })} placeholder="Le Bistrot de la Place" />

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Photo</label>
            <PhotoUploader bookletId={bookletId} storagePath="activities" value={item.photo} onChange={url => onUpdate({ photo: url })} aspectRatio="16/9" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Description</label>
            <textarea value={item.description} onChange={e => onUpdate({ description: e.target.value })}
              placeholder="Notre coup de cœur pour les soirées romantiques..." rows={2} className={`${input} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Adresse" value={item.address} onChange={v => onUpdate({ address: v })} placeholder="5 rue de la Paix" />
            <Field label="Distance" value={item.distance} onChange={v => onUpdate({ distance: v })} placeholder="5 min à pied" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Horaires" value={item.openHours} onChange={v => onUpdate({ openHours: v })} placeholder="12h-14h · 19h-22h" />
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Prix</label>
              <div className="flex gap-1">
                {["€", "€€", "€€€"].map(p => (
                  <button key={p} onClick={() => onUpdate({ priceRange: item.priceRange === p ? "" : p })}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${item.priceRange === p ? "bg-orange-500 text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Field label="Téléphone" value={item.phone} onChange={v => onUpdate({ phone: v })} placeholder="+33 5 56 XX XX XX" type="tel" />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Site web</label>
              <UrlField value={item.website} onChange={v => onUpdate({ website: v })} placeholder="https://..." />
            </div>
            <Field label="Instagram" value={item.instagram} onChange={v => onUpdate({ instagram: v })} placeholder="@bistrotdelaplace" />
          </div>

          <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer">
            <div onClick={() => onUpdate({ recommended: !item.recommended })}
              className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${item.recommended ? "bg-orange-500" : "border-2 border-gray-300"}`}>
              {item.recommended && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">★ Coup de cœur</p>
              <p className="text-xs text-gray-400">Affiché en premier avec un badge</p>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}

function ActivityEditor({ value, onChange, bookletId }: { value: string; onChange: (v: string) => void; bookletId: string }) {
  const items = parseActivities(value);
  const [expanded, setExpanded] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const save = (next: Activity[]) => onChange(JSON.stringify(next));

  const add = () => {
    const item: Activity = {
      id: nanoid(), category: "restaurant", name: "", description: "",
      address: "", distance: "", phone: "", website: "", instagram: "",
      photo: "", openHours: "", priceRange: "", recommended: false,
    };
    save([...items, item]);
    setExpanded(item.id);
  };

  const update = (id: string, patch: Partial<Activity>) => save(items.map(it => it.id === id ? { ...it, ...patch } : it));
  const remove = (id: string) => { save(items.filter(it => it.id !== id)); if (expanded === id) setExpanded(null); };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(it => it.id === active.id);
    const newIndex = items.findIndex(it => it.id === over.id);
    save(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-2xl mb-2">📍</p>
          <p className="text-sm text-gray-400">Aucune recommandation ajoutée</p>
          <p className="text-xs text-gray-300 mt-1">Restaurants, activités, commerces...</p>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(it => it.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <SortableActivityItem
              key={item.id}
              item={item}
              expanded={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              onRemove={() => remove(item.id)}
              onUpdate={patch => update(item.id, patch)}
              bookletId={bookletId}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button onClick={add}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-orange-200 text-orange-500 font-semibold text-sm hover:bg-orange-50 transition-colors">
        <Plus className="w-4 h-4" /> Ajouter un lieu
      </button>
    </div>
  );
}

// ── Éditeur de services ───────────────────────────────────────────────────────

function ServiceEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const items = parseServices(value);
  const save = (next: Service[]) => onChange(JSON.stringify(next));

  const add = () => save([...items, { id: nanoid(), emoji: "🏊", name: "", description: "" }]);
  const update = (id: string, patch: Partial<Service>) => save(items.map(it => it.id === id ? { ...it, ...patch } : it));
  const remove = (id: string) => save(items.filter(it => it.id !== id));

  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-2xl mb-1">🏊</p>
          <p className="text-sm text-gray-400">Piscine, parking, BBQ, terrasse...</p>
        </div>
      )}

      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl border border-gray-100 px-3 py-2.5">
          {/* Emoji picker */}
          <select value={item.emoji} onChange={e => update(item.id, { emoji: e.target.value })}
            className="w-14 text-center text-xl bg-white border border-gray-200 rounded-lg py-1.5 cursor-pointer">
            {SERVICE_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <div className="flex-1 grid grid-cols-2 gap-2">
            <input type="text" value={item.name} onChange={e => update(item.id, { name: e.target.value })}
              placeholder="Nom (ex: Piscine)" className={`${input} text-sm`} />
            <input type="text" value={item.description} onChange={e => update(item.id, { description: e.target.value })}
              placeholder="Détail (ex: 8h – 22h)" className={`${input} text-sm`} />
          </div>

          <button onClick={() => remove(item.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button onClick={add}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-orange-200 text-orange-500 font-semibold text-sm hover:bg-orange-50 transition-colors">
        <Plus className="w-4 h-4" /> Ajouter un service
      </button>
    </div>
  );
}

// ── Composants réutilisables ──────────────────────────────────────────────────

const input = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300";

function UrlField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const isValid = !value || /^https?:\/\/.+\..+/.test(value);

  const handleBlur = () => {
    if (value && !value.startsWith("http://") && !value.startsWith("https://")) {
      onChange("https://" + value);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`${input} ${!isValid ? "border-red-300 focus:ring-red-400" : ""} pr-8`}
        />
        {value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid
              ? <div className="w-2 h-2 rounded-full bg-green-400" />
              : <div className="w-2 h-2 rounded-full bg-red-400" />
            }
          </div>
        )}
      </div>
      {!isValid && <p className="text-xs text-red-400">URL invalide — doit commencer par https://</p>}
      {value && isValid && (
        <a href={value} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-700">
          <ExternalLink className="w-3 h-3" /> Vérifier le lien
        </a>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={input} />
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function EditorForm() {
  const { booklet, activeModuleId, updateModule } = useEditorStore();

  if (!booklet) return null;

  const activeModule = booklet.modules.find((m) => m.id === activeModuleId);

  if (!activeModule) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#ebebeb" }}>
        <div className="text-center">
          <p className="text-4xl mb-3">👈</p>
          <p className="text-gray-500 text-sm">Sélectionnez un module à gauche</p>
        </div>
      </div>
    );
  }

  if (!activeModule.enabled) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#ebebeb" }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <EyeOff className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Module désactivé</p>
          <p className="text-gray-400 text-xs mt-1">Activez-le dans la liste pour l'éditer</p>
        </div>
      </div>
    );
  }

  const meta = MODULE_META[activeModule.type];
  const fields = MODULE_FIELDS[activeModule.type] ?? [];

  const get = (key: string) => activeModule.content[key] ?? "";
  const set = (key: string, val: string) => updateModule(activeModule.id, { [key]: val });

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#ebebeb" }}>
      <div className="max-w-2xl mx-auto p-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-2xl shadow-sm">
            {meta.emoji}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{meta.label}</h2>
            <p className="text-sm text-gray-400">{meta.description}</p>
          </div>
        </div>

        {/* Champs */}
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-1">{field.label}</label>
              {field.hint && <p className="text-xs text-gray-400 mb-3 leading-relaxed">{field.hint}</p>}

              {/* ── Types spéciaux ── */}
              {field.type === "activities" && (
                <ActivityEditor value={get(field.key)} onChange={v => set(field.key, v)} bookletId={booklet.id} />
              )}

              {field.type === "services" && (
                <ServiceEditor value={get(field.key)} onChange={v => set(field.key, v)} />
              )}

              {/* ── Types standard ── */}
              {field.type === "time" && (
                <div className="flex items-center gap-3">
                  <input type="time" value={get(field.key)} onChange={e => set(field.key, e.target.value)}
                    className="w-36 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                  {get(field.key) && <span className="text-sm text-gray-400">{get(field.key).replace(":", "h")}</span>}
                </div>
              )}

              {field.type === "text" && (
                <input type="text" value={get(field.key)} onChange={e => set(field.key, e.target.value)}
                  placeholder={field.placeholder} className={input} />
              )}

              {field.type === "phone" && (
                <input type="tel" value={get(field.key)} onChange={e => set(field.key, e.target.value)}
                  placeholder={field.placeholder} className={input} />
              )}

              {field.type === "photo" && (
                <div className="flex items-center gap-4">
                  <PhotoUploader
                    bookletId={booklet.id}
                    storagePath={field.key}
                    value={get(field.key)}
                    onChange={v => set(field.key, v)}
                    circular={field.key.includes("photo")}
                    aspectRatio="1/1"
                  />
                  {get(field.key) && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 truncate">{get(field.key)}</p>
                      <button onClick={() => set(field.key, "")} className="text-xs text-red-400 hover:text-red-600 mt-1 flex items-center gap-1">
                        <X className="w-3 h-3" /> Supprimer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {field.type === "url" && (
                <UrlField value={get(field.key)} onChange={v => set(field.key, v)} placeholder={field.placeholder} />
              )}

              {field.type === "number" && (
                <input type="number" value={get(field.key)} onChange={e => set(field.key, e.target.value)}
                  placeholder={field.placeholder} className={`${input} w-32`} />
              )}

              {field.type === "textarea" && (
                <textarea value={get(field.key)} onChange={e => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={["process", "message", "about", "description", "checkin_process"].some(k => field.key.includes(k)) ? 5 : 3}
                  className={`${input} resize-none leading-relaxed`} />
              )}

              {field.type === "places" && (
                <div className="space-y-2">
                  <textarea value={get(field.key)} onChange={e => set(field.key, e.target.value)}
                    placeholder={field.placeholder} rows={4}
                    className={`${input} resize-none font-mono text-xs leading-relaxed`} />
                  {get(field.key) && (
                    <div className="space-y-1.5">
                      {get(field.key).split("\n").filter(Boolean).map((line, i) => {
                        const [name, address] = line.split("|").map(s => s.trim());
                        if (!name) return null;
                        return (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                            <span className="text-sm">📍</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
                              {address && <p className="text-xs text-gray-400 truncate">{address}</p>}
                            </div>
                            {address && (
                              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 shrink-0">
                                Maps ↗
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8 pb-4">
          Sauvegarde automatique · Ctrl+S pour sauvegarder manuellement
        </p>
      </div>
    </div>
  );
}
