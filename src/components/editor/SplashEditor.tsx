"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon, Video, Film, Link, Check } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useAuthStore } from "@/store/authStore";
import { uploadMedia } from "@/lib/upload";
import { SplashConfig, SplashOverlay, SplashTitleFont, SplashTitleSize, SplashTitleWeight } from "@/types";
import toast from "react-hot-toast";

const FONTS: { value: SplashTitleFont; label: string; class: string }[] = [
  { value: "sans",  label: "Sans-serif",  class: "font-sans" },
  { value: "serif", label: "Serif",       class: "font-serif" },
  { value: "mono",  label: "Monospace",   class: "font-mono" },
];

const SIZES: { value: SplashTitleSize; label: string }[] = [
  { value: "sm", label: "Petit" },
  { value: "md", label: "Moyen" },
  { value: "lg", label: "Grand" },
  { value: "xl", label: "XL" },
];

const WEIGHTS: { value: SplashTitleWeight; label: string }[] = [
  { value: "normal",   label: "Normal" },
  { value: "semibold", label: "Semi-gras" },
  { value: "bold",     label: "Gras" },
  { value: "black",    label: "Black" },
];

const OVERLAYS: { value: SplashOverlay; label: string }[] = [
  { value: "none",   label: "Aucun" },
  { value: "light",  label: "Léger" },
  { value: "medium", label: "Moyen" },
  { value: "dark",   label: "Sombre" },
];

export function SplashEditor() {
  const { booklet, updateBookletField } = useEditorStore();
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDragOver, setLogoDragOver] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [mediaTab, setMediaTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");

  if (!booklet) return null;

  const splash: SplashConfig = booklet.splashConfig ?? {};
  // Sync urlInput si un youtubeUrl existe déjà
  const syncedUrl = splash.youtubeUrl ?? "";

  const update = (patch: Partial<SplashConfig>) => {
    updateBookletField("splashConfig", { ...splash, ...patch });
  };

  const handleFile = async (file: File) => {
    if (!user) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isImage && !isVideo) return toast.error("Fichier non supporté");

    setUploading(true);
    setProgress(0);
    try {
      const ext = file.name.split(".").pop();
      const path = `users/${user.uid}/booklets/${booklet.id}/splash/${Date.now()}.${ext}`;
      const url = await uploadMedia(file, path, setProgress);
      update({ mediaUrl: url, mediaType: isVideo ? "video" : "image" });
      toast.success(isVideo ? "Vidéo uploadée !" : "Image uploadée !");
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

  const removeMedia = () => update({ mediaUrl: undefined, mediaType: undefined });
  const removeYoutube = () => { update({ youtubeUrl: undefined }); setUrlInput(""); };

  const handleLogoFile = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) return toast.error("Image uniquement");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5 Mo");
    setLogoUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `users/${user.uid}/booklets/${booklet.id}/logo/${Date.now()}.${ext}`;
      const url = await uploadMedia(file, path);
      update({ logoUrl: url });
      toast.success("Logo uploadé !");
    } catch (err: any) {
      toast.error(err.message || "Erreur d'upload");
    } finally {
      setLogoUploading(false);
    }
  };

  const applyUrl = () => {
    const val = urlInput.trim();
    if (!val) return;
    // YouTube ou Vimeo → fond vidéo embed
    const isYT = val.includes("youtube.com") || val.includes("youtu.be");
    const isVimeo = val.includes("vimeo.com");
    if (isYT || isVimeo) {
      update({ youtubeUrl: val, mediaUrl: undefined, mediaType: undefined });
      toast.success("Vidéo YouTube/Vimeo appliquée !");
    } else {
      // URL image directe
      update({ mediaUrl: val, mediaType: "image", youtubeUrl: undefined });
      toast.success("Image appliquée !");
    }
  };

  const toEmbedUrl = (url: string): string | null => {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
        const id = u.hostname.includes("youtu.be") ? u.pathname.slice(1) : u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0` : null;
      }
      if (u.hostname.includes("vimeo.com")) {
        const id = u.pathname.split("/").filter(Boolean).pop();
        return id ? `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&background=1` : null;
      }
    } catch { /* invalid url */ }
    return null;
  };

  return (
    <div className="space-y-5 p-4">

      {/* ── Média de fond ── */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Fond (image ou vidéo)
        </label>

        {/* Onglets Upload / URL */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-3">
          <button onClick={() => setMediaTab("upload")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mediaTab === "upload" ? "bg-white shadow-sm text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>
            <Upload className="w-3.5 h-3.5" /> Upload
          </button>
          <button onClick={() => setMediaTab("url")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mediaTab === "url" ? "bg-white shadow-sm text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>
            <Link className="w-3.5 h-3.5" /> URL / YouTube
          </button>
        </div>

        {/* Prévisualisation média actuel */}
        {(splash.mediaUrl || splash.youtubeUrl) && (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 group mb-3">
            {splash.youtubeUrl ? (
              <div className="w-full h-32 bg-black flex items-center justify-center relative overflow-hidden">
                <iframe
                  src={toEmbedUrl(splash.youtubeUrl) ?? ""}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  allow="autoplay; encrypted-media"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-lg z-10">
                  <Film className="w-3 h-3" /> YouTube/Vimeo
                </div>
              </div>
            ) : splash.mediaType === "video" ? (
              <video src={splash.mediaUrl} className="w-full h-32 object-cover" muted loop autoPlay playsInline />
            ) : (
              <img src={splash.mediaUrl} alt="" className="w-full h-32 object-cover" />
            )}
            {!splash.youtubeUrl && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                {splash.mediaType === "video" ? <><Film className="w-3 h-3" /> Vidéo</> : <><ImageIcon className="w-3 h-3" /> Image</>}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={splash.youtubeUrl ? removeYoutube : removeMedia}
                className="bg-red-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-red-600">
                <X className="w-3.5 h-3.5" /> Retirer
              </button>
            </div>
            {uploading && (
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        )}

        {/* Onglet Upload */}
        {mediaTab === "upload" && (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                dragOver ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
              }`}>
              {uploading ? (
                <><Loader2 className="w-7 h-7 text-orange-400 animate-spin" /><p className="text-xs text-gray-400">{progress}%</p></>
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Video className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-500 text-center">Glissez ou cliquez</p>
                  <p className="text-xs text-gray-400 text-center">JPG, PNG, WebP · MP4, MOV<br />Image 10 Mo max · Vidéo 100 Mo max</p>
                </>
              )}
            </div>
            <input ref={inputRef} type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </>
        )}

        {/* Onglet URL */}
        {mediaTab === "url" && (
          <div className="space-y-2">
            <input
              type="url"
              value={urlInput || syncedUrl}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyUrl()}
              placeholder="https://youtube.com/watch?v=... ou URL image"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
            />
            <button
              onClick={applyUrl}
              disabled={!urlInput.trim()}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors disabled:opacity-40">
              <Check className="w-3.5 h-3.5" /> Appliquer
            </button>
            <p className="text-xs text-gray-400 text-center">YouTube · Vimeo · URL image directe</p>
          </div>
        )}
      </div>

      {/* ── Contenu texte ── */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
          Textes de la page d'accueil
        </label>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Badge (petit texte au-dessus)</label>
          <input
            type="text"
            value={splash.badgeText ?? ""}
            onChange={(e) => update({ badgeText: e.target.value || undefined })}
            placeholder="Livret d'accueil"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Titre principal</label>
          <input
            type="text"
            value={splash.customTitle ?? ""}
            onChange={(e) => update({ customTitle: e.target.value || undefined })}
            placeholder={booklet.propertyName || booklet.title}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
          />
          <p className="text-xs text-gray-400 mt-1">Laissez vide pour utiliser le nom du logement</p>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Sous-titre / description</label>
          <textarea
            value={splash.customSubtitle ?? ""}
            onChange={(e) => update({ customSubtitle: e.target.value || undefined })}
            placeholder={booklet.description || booklet.address || "Votre description..."}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Texte du bouton</label>
          <input
            type="text"
            value={splash.buttonText ?? ""}
            onChange={(e) => update({ buttonText: e.target.value || undefined })}
            placeholder="Ouvrir le livret →"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
          />
        </div>
      </div>

      {/* ── Logo ── */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Logo / icône
        </label>

        {splash.logoUrl ? (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 group">
            <div className="w-full h-24 bg-gray-50 flex items-center justify-center">
              <img src={splash.logoUrl} alt="logo" className="max-h-20 max-w-full object-contain" />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button onClick={() => logoInputRef.current?.click()}
                className="bg-white text-gray-800 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-gray-50">
                <Upload className="w-3.5 h-3.5" /> Changer
              </button>
              <button onClick={() => update({ logoUrl: undefined })}
                className="bg-red-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-red-600">
                <X className="w-3.5 h-3.5" /> Retirer
              </button>
            </div>
          </div>
        ) : (
          <div
            onDrop={(e) => { e.preventDefault(); setLogoDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleLogoFile(f); }}
            onDragOver={(e) => { e.preventDefault(); setLogoDragOver(true); }}
            onDragLeave={() => setLogoDragOver(false)}
            onClick={() => logoInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all ${
              logoDragOver ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
            }`}>
            {logoUploading ? (
              <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs font-medium text-gray-500">Glissez votre logo ici</p>
                <p className="text-xs text-gray-400">PNG, JPG, WebP · max 5 Mo</p>
              </>
            )}
          </div>
        )}

        <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])} />

        {splash.logoUrl && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1.5">Taille</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(["sm", "md", "lg"] as const).map((s) => (
                <button key={s} onClick={() => update({ logoSize: s })}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    (splash.logoSize ?? "md") === s
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-orange-300"
                  }`}>
                  {s === "sm" ? "Petit" : s === "md" ? "Moyen" : "Grand"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Overlay ── */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Assombrissement du fond
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {OVERLAYS.map((o) => (
            <button key={o.value}
              onClick={() => update({ overlayOpacity: o.value })}
              className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                (splash.overlayOpacity ?? "dark") === o.value
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-500 border-gray-200 hover:border-orange-300"
              }`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Police du titre ── */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Police du titre
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {FONTS.map((f) => (
            <button key={f.value}
              onClick={() => update({ titleFont: f.value })}
              className={`py-2.5 rounded-xl text-xs border transition-all ${f.class} ${
                (splash.titleFont ?? "sans") === f.value
                  ? "bg-orange-500 text-white border-orange-500 font-bold"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Taille du titre ── */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Taille du titre
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {SIZES.map((s) => (
            <button key={s.value}
              onClick={() => update({ titleSize: s.value })}
              className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                (splash.titleSize ?? "lg") === s.value
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-500 border-gray-200 hover:border-orange-300"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Graisse du titre ── */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Graisse du titre
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {WEIGHTS.map((w) => (
            <button key={w.value}
              onClick={() => update({ titleWeight: w.value })}
              className={`py-2 rounded-xl text-xs border transition-all ${
                (splash.titleWeight ?? "bold") === w.value
                  ? "bg-orange-500 text-white border-orange-500 font-semibold"
                  : "bg-white text-gray-500 border-gray-200 hover:border-orange-300"
              }`}>
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Couleur du titre ── */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Couleur du titre
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={splash.titleColor ?? "#ffffff"}
            onChange={(e) => update({ titleColor: e.target.value })}
            className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"
          />
          <div className="flex gap-2 flex-wrap">
            {["#ffffff", "#1a1a1a", "#f97316", "#fbbf24", "#34d399"].map((c) => (
              <button key={c}
                onClick={() => update({ titleColor: c })}
                className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                  (splash.titleColor ?? "#ffffff") === c ? "border-gray-400 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Couleur du sous-titre ── */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Couleur du sous-titre
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={(splash.subtitleColor ?? "#aaaaaa").slice(0, 7)}
            onChange={(e) => update({ subtitleColor: e.target.value })}
            className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"
          />
          <div className="flex gap-2 flex-wrap">
            {["#ffffff", "#cccccc", "#999999", "#f97316"].map((c) => (
              <button key={c}
                onClick={() => update({ subtitleColor: c })}
                className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                  (splash.subtitleColor ?? "#ffffff") === c ? "border-gray-400 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Couleur du bouton ── */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Bouton "Ouvrir"
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={splash.buttonColor ?? "#ffffff"}
            onChange={(e) => update({ buttonColor: e.target.value })}
            className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"
          />
          <div className="flex gap-2 flex-wrap">
            {["#ffffff", "#f97316", "#1a1a1a", "#fbbf24"].map((c) => (
              <button key={c}
                onClick={() => update({ buttonColor: c })}
                className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                  (splash.buttonColor ?? "#ffffff") === c ? "border-gray-400 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
