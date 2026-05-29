"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { uploadMedia } from "@/lib/upload";
import { TEMPLATES } from "@/lib/templates";
import { PALETTES, patternToCss, BookletPalette, DEFAULT_PALETTE } from "@/lib/palettes";
import toast from "react-hot-toast";

const PATTERN_LABELS: Record<string, string> = {
  solid: "Uni", stripes: "Bandes", gradient: "Dégradé", circles: "Bulles",
};

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 transition-colors">
        {title}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function AppearanceEditor() {
  const { booklet, updateBookletField } = useEditorStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [customColors, setCustomColors] = useState<Partial<BookletPalette>>(booklet?.customPalette ?? {});

  if (!booklet) return null;

  const sp = booklet.splashConfig ?? {};
  const setSp = (key: string, val: string) => updateBookletField("splashConfig", { ...sp, [key]: val });

  const currentPalette: BookletPalette = {
    ...PALETTES.find((p) => p.id === (booklet.paletteId ?? "creme")) ?? DEFAULT_PALETTE,
    ...customColors,
  };
  const bgPreview = patternToCss(currentPalette);
  const bgUrl = sp.mediaUrl || booklet.coverImage;

  const applyPalette = (id: string) => {
    updateBookletField("paletteId", id);
    setCustomColors({});
    updateBookletField("customPalette", {});
    const pal = PALETTES.find((p) => p.id === id);
    if (pal) updateBookletField("accentColor", pal.primary);
  };

  const setCustomColor = (key: keyof BookletPalette, val: string) => {
    const next = { ...customColors, [key]: val };
    setCustomColors(next);
    updateBookletField("customPalette", next);
    if (key === "primary") updateBookletField("accentColor", val);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadMedia(file, `covers/${booklet.id}`);
      updateBookletField("splashConfig", { ...sp, mediaUrl: url });
      updateBookletField("coverImage", url);
    } catch {
      toast.error("Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const currentTemplate = TEMPLATES.find((t) => t.id === booklet.templateId) ?? TEMPLATES[0];

  return (
    <div className="flex-1 overflow-y-auto">

      {/* ── TEMPLATE ────────────────────────────────────────────────────── */}
      <Section title="Layout">
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((tpl) => {
            const active = booklet.templateId === tpl.id;
            return (
              <button key={tpl.id}
                onClick={() => updateBookletField("templateId", tpl.id)}
                className={`relative flex flex-col overflow-hidden rounded-xl transition-all text-left ${
                  active ? "ring-2 ring-orange-500 ring-offset-1" : "hover:ring-1 hover:ring-gray-300"
                }`}>
                {/* Mini splash preview */}
                <div className="w-full relative overflow-hidden" style={{ height: 80, background: bgPreview }}>
                  {bgUrl && (
                    <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.5 }} />
                  )}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
                  {/* Simuler le layout */}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    {tpl.id === "magazine" ? (
                      <p className="font-black text-white uppercase text-xs leading-tight" style={{ letterSpacing: "-0.3px" }}>
                        VILLA<br />ROSA
                      </p>
                    ) : tpl.id === "tempo" ? (
                      <div className="flex items-end gap-1">
                        <p className="font-black text-white text-xs">Livret</p>
                        <p className="text-white text-xs opacity-70 font-thin">d'accueil</p>
                      </div>
                    ) : tpl.id === "hostin" ? (
                      <div>
                        <p className="text-white text-xs opacity-70" style={{ fontSize: 8 }}>Bienvenue</p>
                        <p className="font-black text-white text-xs">Villa Rosa</p>
                      </div>
                    ) : (
                      <p className="font-black text-white text-xs leading-tight">
                        Villa Rosa
                      </p>
                    )}
                  </div>
                  {/* Bouton simulé */}
                  <div className="absolute bottom-1.5 right-2 px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: currentPalette.primary, fontSize: 7, fontWeight: 700 }}>
                    Ouvrir
                  </div>
                </div>
                {/* Nom */}
                <div className={`px-2 py-1.5 flex items-center gap-1.5 ${active ? "bg-orange-50" : "bg-gray-50"}`}>
                  <span className="text-sm">{tpl.preview}</span>
                  <p className={`text-xs font-bold truncate ${active ? "text-orange-600" : "text-gray-700"}`}>
                    {tpl.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── COULEURS ────────────────────────────────────────────────────── */}
      <Section title="Couleurs & motif">
        {/* Swatches groupés par motif */}
        {(["solid", "stripes", "gradient", "circles"] as const).map((pat) => {
          const pals = PALETTES.filter((p) => p.pattern === pat);
          if (!pals.length) return null;
          return (
            <div key={pat} className="mb-3">
              <p className="text-xs text-gray-400 mb-1.5">{PATTERN_LABELS[pat]}</p>
              <div className="flex flex-wrap gap-2">
                {pals.map((pal) => {
                  const active = booklet.paletteId === pal.id;
                  return (
                    <button key={pal.id} onClick={() => applyPalette(pal.id)}
                      title={pal.name}
                      className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${active ? "ring-2 ring-orange-500 ring-offset-1 scale-110" : ""}`}
                      style={{ background: patternToCss(pal), border: "1px solid rgba(0,0,0,0.08)" }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Color pickers custom */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Personnaliser</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["primary", "Principale"],
              ["secondary", "Fond"],
              ["surface", "Cards"],
              ["text", "Texte"],
              ["patternColor", "2ème couleur"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="color"
                  value={(customColors[key] ?? currentPalette[key] ?? "#ffffff") as string}
                  onChange={(e) => setCustomColor(key, e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                />
                <span className="text-xs text-gray-500 truncate">{label}</span>
              </label>
            ))}
          </div>
          {/* Slider bandes */}
          {currentPalette.pattern === "stripes" && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-1">
                Taille bandes : {(customColors.patternSize ?? currentPalette.patternSize ?? 40)}px
              </p>
              <input type="range" min={10} max={100} step={5}
                value={(customColors.patternSize ?? currentPalette.patternSize ?? 40) as number}
                onChange={(e) => {
                  const next = { ...customColors, patternSize: Number(e.target.value) };
                  setCustomColors(next);
                  updateBookletField("customPalette", next);
                }}
                className="w-full accent-orange-500" />
            </div>
          )}
          {Object.keys(customColors).length > 0 && (
            <button onClick={() => { setCustomColors({}); updateBookletField("customPalette", {}); }}
              className="mt-2 text-xs text-gray-400 hover:text-red-400 transition-colors underline">
              Réinitialiser
            </button>
          )}
        </div>
      </Section>

      {/* ── SPLASH ──────────────────────────────────────────────────────── */}
      <Section title="Page d'accueil">
        {/* Mini preview live */}
        <div className="rounded-2xl overflow-hidden mb-4 relative" style={{ height: 120 }}>
          {bgUrl ? (
            <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          ) : (
            <div className="absolute inset-0" style={{ background: bgPreview }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="font-black text-white leading-tight text-sm truncate">
              {sp.customTitle || booklet.propertyName || "Villa Rosa"}
            </p>
            {(sp.customSubtitle || booklet.description) && (
              <p className="text-white text-xs opacity-70 truncate">
                {sp.customSubtitle || booklet.description}
              </p>
            )}
            <div className="mt-1.5 inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: currentPalette.primary }}>
              {sp.buttonText || "Ouvrir le livret"}
            </div>
          </div>
        </div>

        {/* Photo */}
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-1.5">Photo de couverture</p>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
          {bgUrl ? (
            <div className="flex items-center gap-2">
              <div className="w-12 h-8 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                <img src={bgUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="text-xs text-orange-500 font-semibold hover:underline">Changer</button>
              <button onClick={() => { updateBookletField("coverImage", ""); updateBookletField("splashConfig", { ...sp, mediaUrl: "" }); }}
                className="ml-auto p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 text-gray-400 hover:text-orange-500 transition-colors text-xs font-semibold">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {uploading ? "Upload…" : "Ajouter une photo"}
            </button>
          )}
        </div>

        {/* Titre */}
        <div className="mb-2">
          <label className="block text-xs text-gray-400 mb-1">Titre</label>
          <input type="text"
            value={sp.customTitle || ""}
            onChange={(e) => setSp("customTitle", e.target.value)}
            placeholder={booklet.propertyName || "Nom du logement"}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Sous-titre */}
        <div className="mb-2">
          <label className="block text-xs text-gray-400 mb-1">Sous-titre</label>
          <input type="text"
            value={sp.customSubtitle || ""}
            onChange={(e) => setSp("customSubtitle", e.target.value)}
            placeholder={booklet.description || "Votre séjour en quelques mots"}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Texte bouton */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Texte du bouton</label>
          <input type="text"
            value={sp.buttonText || ""}
            onChange={(e) => setSp("buttonText", e.target.value)}
            placeholder="Ouvrir le livret"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </Section>
    </div>
  );
}
