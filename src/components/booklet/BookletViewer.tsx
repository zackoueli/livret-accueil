"use client";

import { useState, useEffect } from "react";
import { Booklet } from "@/types";
import { MODULE_META, LANGUAGES } from "@/lib/modules";
import { ArrowLeft, Globe, ChevronRight, MapPin, Phone, FileText, Download, Navigation, ClipboardCheck } from "lucide-react";
import { CheckInForm } from "./CheckInForm";
import { getTemplate } from "@/lib/templates";
import { ViewerNature } from "./ViewerNature";
import { ViewerMagazine } from "./ViewerMagazine";
import { ViewerModerne } from "./ViewerModerne";
import { ViewerTempo } from "./ViewerTempo";
import { ViewerApp } from "./ViewerApp";
import { ViewerHostin } from "./ViewerHostin";

type Screen = "splash" | "home" | "module" | "nearby";

export function BookletViewer({ booklet }: { booklet: Booklet }) {
  const templateId = booklet.templateId;
  if (templateId === "hostin") return <ViewerHostin booklet={booklet} />;
  if (templateId === "app") return <ViewerApp booklet={booklet} />;
  if (templateId === "tempo") return <ViewerTempo booklet={booklet} />;
  if (templateId === "nature") return <ViewerNature booklet={booklet} />;
  if (templateId === "magazine") return <ViewerMagazine booklet={booklet} />;
  if (templateId === "moderne") return <ViewerModerne booklet={booklet} />;
  const [screen, setScreen] = useState<Screen>("splash");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lang, setLang] = useState(booklet.defaultLanguage || "fr");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    fetch("/api/booklets/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookletId: booklet.id }),
    }).catch(() => {});
  }, [booklet.id]);

  const enabledModules = [...booklet.modules]
    .filter((m) => m.enabled)
    .sort((a, b) => a.order - b.order);

  const availableLangs = LANGUAGES.filter((l) =>
    booklet.availableLanguages.includes(l.code)
  );
  const currentLang = LANGUAGES.find((l) => l.code === lang);

  const get = (moduleId: string, key: string) => {
    const mod = booklet.modules.find((m) => m.id === moduleId);
    if (!mod) return "";
    // Champs sans langue (video, places) stockés sans suffixe
    if (mod.content[key] !== undefined) return mod.content[key];
    return mod.content[`${key}_${lang}`] || mod.content[`${key}_fr`] || "";
  };

  const activeModule = enabledModules.find((m) => m.id === activeModuleId);

  // Collecte tous les places de tous les modules pour "Autour de moi"
  const allPlaces = enabledModules.flatMap((m) => {
    const raw = m.content["places"];
    if (!raw) return [];
    const category = MODULE_META[m.type].label;
    return raw.split("\n")
      .map((line: string) => {
        const [name, address] = line.split("|").map((s: string) => s.trim());
        return name ? { name, address, category } : null;
      })
      .filter(Boolean) as { name: string; address: string; category: string }[];
  });

  const openModule = (id: string) => {
    setActiveModuleId(id);
    setScreen("module");
  };

  const tpl = getTemplate(booklet.templateId);
  const accent = booklet.accentColor ?? tpl.accentColor;
  const sp = booklet.splashConfig ?? {};

  // Helpers template pour le home screen
  const cardRadiusMap = { none: "0", sm: "8px", md: "12px", lg: "16px", full: "20px" };
  const cardBorderRadius = cardRadiusMap[tpl.cardRadius];
  const fontStyle = tpl.fontFamily === "serif"
    ? { fontFamily: "Georgia, 'Times New Roman', serif" }
    : tpl.fontFamily === "mono"
    ? { fontFamily: "ui-monospace, monospace" }
    : {};

  // Helpers splashConfig
  const overlayMap = { none: "0", light: "0.25", medium: "0.5", dark: "0.75" };
  const overlayAlpha = overlayMap[sp.overlayOpacity ?? tpl.splashOverlay];
  const fontMap = { sans: "font-sans", serif: "font-serif", mono: "font-mono" };
  const sizeMap = { sm: "text-2xl", md: "text-3xl", lg: "text-4xl", xl: "text-5xl" };
  const weightMap = { normal: "font-normal", semibold: "font-semibold", bold: "font-bold", black: "font-black" };
  const titleClass = `${fontMap[sp.titleFont ?? tpl.splashTitleFont]} ${sizeMap[sp.titleSize ?? tpl.splashTitleSize]} ${weightMap[sp.titleWeight ?? tpl.splashTitleWeight]}`;
  const titleColor = sp.titleColor ?? tpl.splashTitleColor;
  const subtitleColor = sp.subtitleColor ?? tpl.splashSubtitleColor;
  const btnBg = sp.buttonColor ?? tpl.splashButtonColor;
  const btnText = sp.buttonTextColor ?? tpl.splashButtonTextColor;
  const hasSplashMedia = !!(sp.mediaUrl || sp.youtubeUrl);
  const bgColor = hasSplashMedia ? "#000" : accent;

  // ─── SPLASH ───────────────────────────────────────────────────────────────
  if (screen === "splash") {
    return (
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: bgColor }}>

        {/* Background média */}
        {sp.youtubeUrl ? (
          <div className="absolute inset-0 overflow-hidden">
            <iframe
              src={toYoutubeEmbed(sp.youtubeUrl)}
              className="absolute w-[300%] h-[300%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              allow="autoplay; mute; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : sp.mediaUrl && sp.mediaType === "video" ? (
          <video src={sp.mediaUrl} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
        ) : sp.mediaUrl ? (
          <div className="absolute inset-0"
            style={{ backgroundImage: `url(${sp.mediaUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        ) : booklet.coverImage ? (
          <div className="absolute inset-0"
            style={{ backgroundImage: `url(${booklet.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        ) : null}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
          style={{ opacity: overlayAlpha }} />

        {/* Lang picker */}
        {availableLangs.length > 1 && (
          <div className="relative z-10 flex justify-end p-5">
            <button onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-semibold">
              <Globe className="w-3.5 h-3.5" />
              {currentLang?.flag} {currentLang?.label}
            </button>
            {showLangMenu && (
              <div className="absolute top-14 right-5 z-20 bg-white rounded-2xl shadow-2xl py-1.5 min-w-[140px] overflow-hidden">
                {availableLangs.map((l) => (
                  <button key={l.code}
                    onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${lang === l.code ? "font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                    style={lang === l.code ? { color: accent } : {}}>
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom content */}
        <div className="relative z-10 mt-auto p-8 pb-12">

          {/* Logo */}
          {sp.logoUrl && (
            <div className="mb-4">
              <img
                src={sp.logoUrl}
                alt="logo"
                className={`rounded-2xl object-contain ${
                  sp.logoSize === "sm" ? "w-12 h-12" :
                  sp.logoSize === "lg" ? "w-24 h-24" : "w-16 h-16"
                }`}
              />
            </div>
          )}

          {/* Badge */}
          <p className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: subtitleColor }}>
            {sp.badgeText || "Livret d'accueil"}
          </p>

          {/* Titre */}
          <h1 className={`${titleClass} leading-tight mb-3`} style={{ color: titleColor }}>
            {sp.customTitle || booklet.propertyName || booklet.title}
          </h1>

          {/* Sous-titre */}
          {(sp.customSubtitle || booklet.description || booklet.address) && (
            <p className="text-sm leading-relaxed mb-8 whitespace-pre-line" style={{ color: subtitleColor }}>
              {sp.customSubtitle || booklet.description || booklet.address}
            </p>
          )}

          {/* Bouton */}
          <button
            onClick={() => setScreen("home")}
            className="w-full py-4 rounded-2xl text-base font-bold transition-all active:scale-95 shadow-lg"
            style={{ backgroundColor: btnBg, color: btnText }}>
            {sp.buttonText || "Ouvrir le livret →"}
          </button>
        </div>
      </div>
    );
  }

  // ─── HOME — tour de contrôle ───────────────────────────────────────────────
  if (screen === "home") {
    return (<>
      {showCheckIn && <CheckInForm bookletId={booklet.id} accent={accent} onClose={() => setShowCheckIn(false)} />}
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: tpl.moduleBg }}>

        {/* Header */}
        <div className="shrink-0 px-5 pt-10 pb-6" style={{ backgroundColor: tpl.headerBg, ...fontStyle }}>
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={() => setScreen("splash")}
              className="text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            {availableLangs.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-semibold">
                  <Globe className="w-3.5 h-3.5" />
                  {currentLang?.flag}
                </button>
                {showLangMenu && (
                  <div className="absolute top-10 right-0 z-20 bg-white rounded-2xl shadow-2xl py-1.5 min-w-[140px] overflow-hidden">
                    {availableLangs.map((l) => (
                      <button key={l.code}
                        onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${lang === l.code ? "font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                        style={lang === l.code ? { color: accent } : {}}>
                        <span>{l.flag}</span> {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <h2 className="text-white font-bold text-xl">
            {booklet.propertyName || booklet.title}
          </h2>
          <p className="text-white/60 text-xs mt-0.5">
            {enabledModules.length} sections disponibles
          </p>
        </div>

        {/* Module grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            {enabledModules.map((m) => {
              const meta = MODULE_META[m.type];
              const hasContent = Object.keys(m.content).some((k) => m.content[k]);
              return (
                <button
                  key={m.id}
                  onClick={() => openModule(m.id)}
                  className="p-4 text-left active:scale-95 transition-all flex flex-col gap-2.5 group"
                  style={{
                    backgroundColor: tpl.cardBg,
                    border: `1px solid ${tpl.cardBorder}`,
                    borderRadius: cardBorderRadius,
                    boxShadow: tpl.cardShadow ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                    ...fontStyle,
                  }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: accent + "18" }}>
                    {meta.emoji}
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-tight" style={{ color: tpl.cardBg === "#1a1612" ? "#f5e6b2" : "#1f2937" }}>{meta.label}</p>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: tpl.cardBg === "#1a1612" ? "#a08060" : "#9ca3af" }}>{meta.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: hasContent ? accent : tpl.cardBorder }} />
                    <ChevronRight className="w-4 h-4 transition-colors" style={{ color: tpl.cardBorder }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bouton Check-in */}
          <button
            onClick={() => setShowCheckIn(true)}
            className="w-full mt-3 flex items-center gap-3 rounded-2xl p-4 border border-gray-100 bg-white shadow-sm active:scale-95 transition-all"
            style={{ borderColor: accent + "30" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: accent + "18" }}>
              <ClipboardCheck className="w-5 h-5" style={{ color: accent }} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 text-sm">Check-in en ligne</p>
              <p className="text-xs text-gray-400">Enregistrez votre arrivée</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
          </button>

          {/* Bouton Autour de moi */}
          {allPlaces.length > 0 && (
            <button
              onClick={() => setScreen("nearby")}
              className="w-full mt-3 flex items-center gap-3 rounded-2xl p-4 border border-gray-100 bg-white shadow-sm active:scale-95 transition-all"
              style={{ borderColor: accent + "30" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: accent + "18" }}>
                📍
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-sm">Autour de moi</p>
                <p className="text-xs text-gray-400">{allPlaces.length} lieu{allPlaces.length > 1 ? "x" : ""} recommandé{allPlaces.length > 1 ? "s" : ""}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
            </button>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-gray-300 mt-8 pb-4">
            Créé avec{" "}
            <span className="font-semibold" style={{ color: accent }}>
              Livret.
            </span>
          </p>
        </div>
      </div>
    </>);
  }

  // ─── NEARBY — Autour de moi ─────────────────────────────────────────────────
  if (screen === "nearby") {
    return (
      <div className="fixed inset-0 flex flex-col bg-gray-50">
        <div className="shrink-0 px-5 pt-10 pb-5 bg-white border-b border-gray-100">
          <button onClick={() => setScreen("home")}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: accent + "18" }}>📍</div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Autour de moi</h2>
              <p className="text-xs text-gray-400">{allPlaces.length} lieu{allPlaces.length > 1 ? "x" : ""} recommandé{allPlaces.length > 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-3">
          {allPlaces.map((place, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 px-4 py-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: accent + "18" }}>
                    <MapPin className="w-4 h-4" style={{ color: accent }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{place.name}</p>
                    {place.address && <p className="text-xs text-gray-400 mt-0.5">{place.address}</p>}
                    <p className="text-xs mt-1 font-medium" style={{ color: accent }}>{place.category}</p>
                  </div>
                </div>
                {place.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                    style={{ backgroundColor: accent + "15", color: accent }}>
                    <Navigation className="w-3.5 h-3.5" /> Y aller
                  </a>
                )}
              </div>
            </div>
          ))}

          <p className="text-center text-xs text-gray-300 mt-6 pb-4">
            Créé avec <span className="font-semibold" style={{ color: accent }}>Livret.</span>
          </p>
        </div>
      </div>
    );
  }

  // ─── MODULE DETAIL ─────────────────────────────────────────────────────────
  if (screen === "module" && activeModule) {
    const meta = MODULE_META[activeModule.type];
    return (
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: tpl.moduleBg, ...fontStyle }}>

        {/* Header */}
        <div className="shrink-0 px-5 pt-10 pb-5 bg-white border-b border-gray-100">
          <button
            onClick={() => setScreen("home")}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: accent + "18" }}>
              {meta.emoji}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg leading-tight">{meta.label}</h2>
              <p className="text-xs text-gray-400">{meta.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <ModuleContent
            module={activeModule}
            accent={accent}
            tpl={tpl}
            get={(key) => get(activeModule.id, key)}
          />
          <p className="text-center text-xs text-gray-300 mt-10 pb-4">
            Créé avec{" "}
            <span className="font-semibold" style={{ color: accent }}>Livret.</span>
          </p>
        </div>
      </div>
    );
  }

  return showCheckIn ? (
    <CheckInForm bookletId={booklet.id} accent={accent} onClose={() => setShowCheckIn(false)} />
  ) : null;
}

// ─── MODULE CONTENT ──────────────────────────────────────────────────────────

function ModuleContent({ module, accent, tpl, get }: {
  module: Booklet["modules"][0];
  accent: string;
  tpl: import("@/lib/templates").BookletTemplate;
  get: (key: string) => string;
}) {
  const photos = module.images ?? [];
  const docs = module.documents ?? [];
  const IC = ({ emoji, label, highlight, children }: { emoji: string; label: string; highlight?: boolean; children: React.ReactNode }) => (
    <InfoCard emoji={emoji} label={label} accent={accent} highlight={highlight} infoBg={tpl.infoBg} infoBorder={tpl.infoBorder}>
      {children}
    </InfoCard>
  );

  switch (module.type) {
    case "welcome":
      return (
        <div className="space-y-4">
          {get("title") && (
            <h3 className="text-2xl font-bold text-gray-900">{get("title")}</h3>
          )}
          {get("message") && (
            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
              {get("message")}
            </p>
          )}
          <DocumentList documents={docs} accent={accent} />
          <PhotoGallery images={photos} />
          {get("video") && <VideoEmbed url={get("video")} />}
          {!get("title") && !get("message") && !photos.length && <EmptyModule />}
        </div>
      );

    case "practical":
      return (
        <div className="space-y-3">
          {get("wifi_name") && (
            <IC emoji="📶" label="WiFi">
              <p className="font-bold text-gray-900 text-base">{get("wifi_name")}</p>
              {get("wifi_password") && (
                <p className="text-sm text-gray-500 mt-1">
                  Mot de passe :{" "}
                  <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-lg">
                    {get("wifi_password")}
                  </span>
                </p>
              )}
            </IC>
          )}
          {get("door_code") && (
            <IC emoji="🔑" label="Code d'entrée" >
              <p className="font-mono font-bold text-3xl text-gray-900 tracking-[0.3em]">
                {get("door_code")}
              </p>
            </IC>
          )}
          {get("parking") && (
            <IC emoji="🅿️" label="Parking" >
              <p className="text-sm text-gray-600 leading-relaxed">{get("parking")}</p>
            </IC>
          )}
          {get("other") && (
            <IC emoji="ℹ️" label="Autres infos" >
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("other")}</p>
            </IC>
          )}
          {!get("wifi_name") && !get("door_code") && !photos.length && <EmptyModule />}
          <DocumentList documents={docs} accent={accent} />
          <PhotoGallery images={photos} />
        </div>
      );

    case "checkin":
      return (
        <div className="space-y-4">
          {(get("checkin_time") || get("checkout_time")) && (
            <div className="grid grid-cols-2 gap-3">
              {get("checkin_time") && (
                <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: accent + "15" }}>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Arrivée</p>
                  <p className="text-2xl font-bold text-gray-900">{get("checkin_time")}</p>
                </div>
              )}
              {get("checkout_time") && (
                <div className="bg-gray-100 rounded-2xl p-5 text-center">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Départ</p>
                  <p className="text-2xl font-bold text-gray-900">{get("checkout_time")}</p>
                </div>
              )}
            </div>
          )}
          {get("checkin_process") && (
            <IC emoji="🗝️" label="Procédure d'arrivée" >
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("checkin_process")}</p>
            </IC>
          )}
          {get("checkout_process") && (
            <IC emoji="👋" label="Procédure de départ" >
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("checkout_process")}</p>
            </IC>
          )}
          {!get("checkin_time") && !get("checkin_process") && !photos.length && <EmptyModule />}
          <DocumentList documents={docs} accent={accent} />
          <PhotoGallery images={photos} />
        </div>
      );

    case "rules":
      return (
        <div className="space-y-3">
          {get("rules")
            ? <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">{get("rules")}</div>
            : !photos.length ? <EmptyModule /> : null}
          <DocumentList documents={docs} accent={accent} />
          <PhotoGallery images={photos} />
        </div>
      );

    case "guide":
      return (
        <div className="space-y-3">
          {get("heating") && <IC emoji="🌡️" label="Chauffage" ><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("heating")}</p></IC>}
          {get("appliances") && <IC emoji="🍳" label="Électroménager" ><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("appliances")}</p></IC>}
          {get("trash") && <IC emoji="♻️" label="Tri des déchets" ><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("trash")}</p></IC>}
          {get("other") && <IC emoji="🏠" label="Autres infos" ><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("other")}</p></IC>}
          {get("video") && <VideoEmbed url={get("video")} />}
          <DocumentList documents={docs} accent={accent} />
          <PhotoGallery images={photos} />
          {!get("heating") && !get("appliances") && !get("trash") && !get("video") && !photos.length && <EmptyModule />}
        </div>
      );

    case "contacts":
      return (
        <div className="space-y-3">
          {get("owner_name") && (
            <IC emoji="👤" label={get("owner_name")} >
              {get("owner_phone") && (
                <a href={`tel:${get("owner_phone")}`}
                  className="inline-flex items-center gap-2 text-sm font-bold py-2 px-4 rounded-xl mt-1 active:scale-95 transition-all"
                  style={{ backgroundColor: accent + "15", color: accent }}>
                  <Phone className="w-4 h-4" /> {get("owner_phone")}
                </a>
              )}
            </IC>
          )}
          {get("emergency") && (
            <IC emoji="🚨" label="Urgences"  highlight>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">{get("emergency")}</p>
            </IC>
          )}
          {get("doctor") && <IC emoji="⚕️" label="Médecin" ><p className="text-sm text-gray-600">{get("doctor")}</p></IC>}
          {get("neighbors") && <IC emoji="🏘️" label="Voisins" ><p className="text-sm text-gray-600 whitespace-pre-line">{get("neighbors")}</p></IC>}
          {!get("owner_name") && !get("emergency") && !photos.length && <EmptyModule />}
          <DocumentList documents={docs} accent={accent} />
          <PhotoGallery images={photos} />
        </div>
      );

    case "activities":
      return (
        <div className="space-y-3">
          {get("activities") && (
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              {get("activities")}
            </div>
          )}
          {get("places") && <PlacesList raw={get("places")} accent={accent} />}
          <DocumentList documents={docs} accent={accent} />
          <PhotoGallery images={photos} />
          {!get("activities") && !get("places") && !photos.length && <EmptyModule />}
        </div>
      );

    case "gooddeals":
      return (
        <div className="space-y-3">
          {get("restaurants") && <IC emoji="🍽️" label="Restaurants" ><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("restaurants")}</p></IC>}
          {get("shops") && <IC emoji="🛒" label="Commerces" ><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("shops")}</p></IC>}
          {get("others") && <IC emoji="⭐" label="Autres bons plans" ><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("others")}</p></IC>}
          {get("places") && <PlacesList raw={get("places")} accent={accent} />}
          <DocumentList documents={docs} accent={accent} />
          <PhotoGallery images={photos} />
          {!get("restaurants") && !get("shops") && !get("places") && !photos.length && <EmptyModule />}
        </div>
      );

    case "transport":
      return (
        <div className="space-y-3">
          {get("by_car") && <IC emoji="🚗" label="En voiture" ><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("by_car")}</p></IC>}
          {get("by_train") && <IC emoji="🚆" label="En train" ><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("by_train")}</p></IC>}
          {get("taxi") && <IC emoji="🚕" label="Taxi / VTC" ><p className="text-sm text-gray-600">{get("taxi")}</p></IC>}
          {get("airport") && <IC emoji="✈️" label="Aéroport" ><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("airport")}</p></IC>}
          <DocumentList documents={docs} accent={accent} />
          <PhotoGallery images={photos} />
          {!get("by_car") && !get("by_train") && !photos.length && <EmptyModule />}
        </div>
      );

    case "faq":
      return (
        <div className="space-y-3">
          {get("faq")
            ? <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">{get("faq")}</div>
            : !photos.length ? <EmptyModule /> : null}
          <DocumentList documents={docs} accent={accent} />
          <PhotoGallery images={photos} />
        </div>
      );

    case "upselling": {
      const items = (get("items") || "").split("\n").map((line: string) => {
        const [name, desc, price, link] = line.split("|").map((s: string) => s.trim());
        return name ? { name, desc, price, link } : null;
      }).filter(Boolean) as { name: string; desc: string; price: string; link: string }[];

      return (
        <div className="space-y-3">
          {get("intro") && (
            <p className="text-sm text-gray-600 leading-relaxed">{get("intro")}</p>
          )}
          {items.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-bold text-gray-800 text-base">{item.name}</p>
                    {item.desc && <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>}
                  </div>
                  {item.price && (
                    <span className="shrink-0 text-sm font-black px-3 py-1 rounded-xl"
                      style={{ backgroundColor: accent + "15", color: accent }}>
                      {item.price}
                    </span>
                  )}
                </div>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer"
                    className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                    style={{ backgroundColor: accent }}>
                    Réserver →
                  </a>
                )}
              </div>
            </div>
          ))}
          <DocumentList documents={docs} accent={accent} />
          <PhotoGallery images={photos} />
          {!get("intro") && !items.length && !photos.length && <EmptyModule />}
        </div>
      );
    }

    default:
      return photos.length ? <PhotoGallery images={photos} /> : <EmptyModule />;
  }
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function InfoCard({ emoji, label, accent, highlight, infoBg, infoBorder, children }: {
  emoji: string;
  label: string;
  accent: string;
  highlight?: boolean;
  infoBg?: string;
  infoBorder?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-4 border shadow-sm"
      style={{
        backgroundColor: highlight ? "#fef2f2" : (infoBg ?? "#ffffff"),
        borderColor: highlight ? "#fecaca" : (infoBorder ?? "#f3f4f6"),
      }}>
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
          style={{ backgroundColor: highlight ? "#fee2e2" : accent + "15" }}>
          {emoji}
        </div>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: highlight ? "#ef4444" : "#6b7280" }}>{label}</p>
      </div>
      {children}
    </div>
  );
}

function PlacesList({ raw, accent }: { raw: string; accent: string }) {
  const places = raw.split("\n")
    .map((line) => {
      const [name, address] = line.split("|").map((s) => s.trim());
      return { name, address };
    })
    .filter((p) => p.name);

  if (!places.length) return null;

  return (
    <div className="space-y-2">
      {places.map((place, i) => (
        <div key={i} className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: accent + "15" }}>
              <MapPin className="w-4 h-4" style={{ color: accent }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{place.name}</p>
              {place.address && <p className="text-xs text-gray-400 mt-0.5">{place.address}</p>}
            </div>
          </div>
          {place.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 ml-3 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
              style={{ backgroundColor: accent + "15", color: accent }}>
              Maps
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function VideoEmbed({ url }: { url: string }) {
  const embedUrl = toEmbedUrl(url);
  if (!embedUrl) return null;
  return (
    <div className="rounded-2xl overflow-hidden aspect-video bg-black">
      <iframe src={embedUrl} className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen />
    </div>
  );
}

function toYoutubeEmbed(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id = u.hostname.includes("youtu.be") ? u.pathname.slice(1) : u.searchParams.get("v");
      if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1&enablejsapi=0`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&background=1&title=0&byline=0`;
    }
  } catch { /* invalid url */ }
  return url;
}

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id = u.hostname.includes("youtu.be") ? u.pathname.slice(1) : u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch { /* invalid url */ }
  return null;
}

function DocumentList({ documents, accent }: { documents: import("@/types").BookletDocument[]; accent: string }) {
  if (!documents.length) return null;
  return (
    <div className="space-y-2 mt-3">
      {documents.map((doc, i) => (
        <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 shadow-sm active:scale-98 transition-all">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
            <p className="text-xs text-gray-400">PDF · Appuyez pour ouvrir</p>
          </div>
          <Download className="w-4 h-4 shrink-0" style={{ color: accent }} />
        </a>
      ))}
    </div>
  );
}

function PhotoGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  if (!images.length) return null;
  return (
    <>
      <div className={`grid gap-2 mt-4 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {images.map((url, i) => (
          <div key={i} onClick={() => setActive(url)}
            className="aspect-video rounded-2xl overflow-hidden cursor-pointer">
            <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          </div>
        ))}
      </div>
      {active && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActive(null)}>
          <img src={active} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </>
  );
}

function EmptyModule() {
  return (
    <div className="text-center py-16 text-gray-300">
      <p className="text-5xl mb-3">✏️</p>
      <p className="text-sm">Aucun contenu renseigné.</p>
    </div>
  );
}
