"use client";

import { useState, useEffect } from "react";
import { Booklet } from "@/types";
import { MODULE_META, LANGUAGES } from "@/lib/modules";
import { ArrowLeft, Globe, ChevronRight, MapPin, Phone } from "lucide-react";

type Screen = "splash" | "home" | "module";

export function BookletViewer({ booklet }: { booklet: Booklet }) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lang, setLang] = useState(booklet.defaultLanguage || "fr");
  const [showLangMenu, setShowLangMenu] = useState(false);

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

  const openModule = (id: string) => {
    setActiveModuleId(id);
    setScreen("module");
  };

  const accent = booklet.accentColor;
  const sp = booklet.splashConfig ?? {};

  // Helpers splashConfig
  const overlayMap = { none: "0", light: "0.25", medium: "0.5", dark: "0.75" };
  const overlayAlpha = overlayMap[sp.overlayOpacity ?? "dark"];
  const fontMap = { sans: "font-sans", serif: "font-serif", mono: "font-mono" };
  const sizeMap = { sm: "text-2xl", md: "text-3xl", lg: "text-4xl", xl: "text-5xl" };
  const weightMap = { normal: "font-normal", semibold: "font-semibold", bold: "font-bold", black: "font-black" };
  const titleClass = `${fontMap[sp.titleFont ?? "sans"]} ${sizeMap[sp.titleSize ?? "lg"]} ${weightMap[sp.titleWeight ?? "bold"]}`;
  const titleColor = sp.titleColor ?? "#ffffff";
  const subtitleColor = sp.subtitleColor ?? "rgba(255,255,255,0.65)";
  const btnBg = sp.buttonColor ?? "#ffffff";
  const btnText = sp.buttonTextColor ?? accent;
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
    return (
      <div className="fixed inset-0 flex flex-col bg-gray-50">

        {/* Header */}
        <div className="shrink-0 px-5 pt-10 pb-6" style={{ backgroundColor: accent }}>
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
                  className="bg-white rounded-2xl p-5 text-left shadow-sm border border-gray-100 active:scale-95 transition-all flex flex-col gap-3 group hover:shadow-md">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: accent + "18" }}>
                    {meta.emoji}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{meta.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{meta.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: hasContent ? accent : "#e5e7eb" }}
                    />
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-300 mt-8 pb-4">
            Créé avec{" "}
            <span className="font-semibold" style={{ color: accent }}>
              Livret.
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ─── MODULE DETAIL ─────────────────────────────────────────────────────────
  if (screen === "module" && activeModule) {
    const meta = MODULE_META[activeModule.type];
    return (
      <div className="fixed inset-0 flex flex-col bg-gray-50">

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

  return null;
}

// ─── MODULE CONTENT ──────────────────────────────────────────────────────────

function ModuleContent({ module, accent, get }: {
  module: Booklet["modules"][0];
  accent: string;
  get: (key: string) => string;
}) {
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
          {get("video") && <VideoEmbed url={get("video")} />}
          {!get("title") && !get("message") && <EmptyModule />}
        </div>
      );

    case "practical":
      return (
        <div className="space-y-3">
          {get("wifi_name") && (
            <InfoCard emoji="📶" label="WiFi" accent={accent}>
              <p className="font-bold text-gray-900 text-base">{get("wifi_name")}</p>
              {get("wifi_password") && (
                <p className="text-sm text-gray-500 mt-1">
                  Mot de passe :{" "}
                  <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-lg">
                    {get("wifi_password")}
                  </span>
                </p>
              )}
            </InfoCard>
          )}
          {get("door_code") && (
            <InfoCard emoji="🔑" label="Code d'entrée" accent={accent}>
              <p className="font-mono font-bold text-3xl text-gray-900 tracking-[0.3em]">
                {get("door_code")}
              </p>
            </InfoCard>
          )}
          {get("parking") && (
            <InfoCard emoji="🅿️" label="Parking" accent={accent}>
              <p className="text-sm text-gray-600 leading-relaxed">{get("parking")}</p>
            </InfoCard>
          )}
          {get("other") && (
            <InfoCard emoji="ℹ️" label="Autres infos" accent={accent}>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("other")}</p>
            </InfoCard>
          )}
          {!get("wifi_name") && !get("door_code") && <EmptyModule />}
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
            <InfoCard emoji="🗝️" label="Procédure d'arrivée" accent={accent}>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("checkin_process")}</p>
            </InfoCard>
          )}
          {get("checkout_process") && (
            <InfoCard emoji="👋" label="Procédure de départ" accent={accent}>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("checkout_process")}</p>
            </InfoCard>
          )}
          {!get("checkin_time") && !get("checkin_process") && <EmptyModule />}
        </div>
      );

    case "rules":
      return get("rules")
        ? <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">{get("rules")}</div>
        : <EmptyModule />;

    case "guide":
      return (
        <div className="space-y-3">
          {get("heating") && <InfoCard emoji="🌡️" label="Chauffage" accent={accent}><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("heating")}</p></InfoCard>}
          {get("appliances") && <InfoCard emoji="🍳" label="Électroménager" accent={accent}><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("appliances")}</p></InfoCard>}
          {get("trash") && <InfoCard emoji="♻️" label="Tri des déchets" accent={accent}><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("trash")}</p></InfoCard>}
          {get("other") && <InfoCard emoji="🏠" label="Autres infos" accent={accent}><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("other")}</p></InfoCard>}
          {get("video") && <VideoEmbed url={get("video")} />}
          {!get("heating") && !get("appliances") && !get("trash") && !get("video") && <EmptyModule />}
        </div>
      );

    case "contacts":
      return (
        <div className="space-y-3">
          {get("owner_name") && (
            <InfoCard emoji="👤" label={get("owner_name")} accent={accent}>
              {get("owner_phone") && (
                <a
                  href={`tel:${get("owner_phone")}`}
                  className="inline-flex items-center gap-2 text-sm font-bold py-2 px-4 rounded-xl mt-1 active:scale-95 transition-all"
                  style={{ backgroundColor: accent + "15", color: accent }}>
                  <Phone className="w-4 h-4" /> {get("owner_phone")}
                </a>
              )}
            </InfoCard>
          )}
          {get("emergency") && (
            <InfoCard emoji="🚨" label="Urgences" accent={accent} highlight>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">{get("emergency")}</p>
            </InfoCard>
          )}
          {get("doctor") && <InfoCard emoji="⚕️" label="Médecin" accent={accent}><p className="text-sm text-gray-600">{get("doctor")}</p></InfoCard>}
          {get("neighbors") && <InfoCard emoji="🏘️" label="Voisins" accent={accent}><p className="text-sm text-gray-600 whitespace-pre-line">{get("neighbors")}</p></InfoCard>}
          {!get("owner_name") && !get("emergency") && <EmptyModule />}
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
          {!get("activities") && !get("places") && <EmptyModule />}
        </div>
      );

    case "gooddeals":
      return (
        <div className="space-y-3">
          {get("restaurants") && <InfoCard emoji="🍽️" label="Restaurants" accent={accent}><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("restaurants")}</p></InfoCard>}
          {get("shops") && <InfoCard emoji="🛒" label="Commerces" accent={accent}><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("shops")}</p></InfoCard>}
          {get("others") && <InfoCard emoji="⭐" label="Autres bons plans" accent={accent}><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("others")}</p></InfoCard>}
          {get("places") && <PlacesList raw={get("places")} accent={accent} />}
          {!get("restaurants") && !get("shops") && !get("places") && <EmptyModule />}
        </div>
      );

    case "transport":
      return (
        <div className="space-y-3">
          {get("by_car") && <InfoCard emoji="🚗" label="En voiture" accent={accent}><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("by_car")}</p></InfoCard>}
          {get("by_train") && <InfoCard emoji="🚆" label="En train" accent={accent}><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("by_train")}</p></InfoCard>}
          {get("taxi") && <InfoCard emoji="🚕" label="Taxi / VTC" accent={accent}><p className="text-sm text-gray-600">{get("taxi")}</p></InfoCard>}
          {get("airport") && <InfoCard emoji="✈️" label="Aéroport" accent={accent}><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{get("airport")}</p></InfoCard>}
          {!get("by_car") && !get("by_train") && <EmptyModule />}
        </div>
      );

    case "faq":
      return get("faq")
        ? <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">{get("faq")}</div>
        : <EmptyModule />;

    default:
      return <EmptyModule />;
  }
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function InfoCard({ emoji, label, accent, highlight, children }: {
  emoji: string;
  label: string;
  accent: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-2xl p-4 border shadow-sm ${highlight ? "border-red-100 bg-red-50/30" : "border-gray-100"}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
          style={{ backgroundColor: highlight ? "#fee2e2" : accent + "15" }}>
          {emoji}
        </div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
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

function EmptyModule() {
  return (
    <div className="text-center py-16 text-gray-300">
      <p className="text-5xl mb-3">✏️</p>
      <p className="text-sm">Aucun contenu renseigné.</p>
    </div>
  );
}
