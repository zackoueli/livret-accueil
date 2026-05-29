"use client";

import { useState, useEffect } from "react";
import { Booklet } from "@/types";
import { MODULE_META } from "@/lib/modules";
import { getContent, parsePlaces, getAvailableLangs } from "./viewerUtils";
import { CheckInForm } from "./CheckInForm";
import {
  ArrowLeft, Globe, MapPin, Wifi, Key, Car, Train, Plane,
  Phone, FileText, Download, Check, ClipboardCheck,
  Home, Grid3x3, Info, ChevronRight, Star, Bed
} from "lucide-react";
import { getPalette } from "@/lib/palettes";

type Screen = "splash" | "home" | "module";

// Glassmorphism card
const glass = (opacity = 0.15): React.CSSProperties => ({
  backgroundColor: `rgba(255,255,255,${opacity})`,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
});

const glassDark = (): React.CSSProperties => ({
  backgroundColor: "rgba(0,0,0,0.35)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.1)",
});

// Couleurs fixes du thème (style screenshot)
const BLUE = "#3b9be8";
const DARK = "#0d1b2a";
const DARK2 = "#111c2d";

export function ViewerApp({ booklet }: { booklet: Booklet }) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lang, setLang] = useState(booklet.defaultLanguage || "fr");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "places" | "services">("info");

  const _p = { ...getPalette(booklet.paletteId ?? "ardoise"), ...booklet.customPalette };
  const ACCENT = _p.primary !== "#1a1a1a" ? _p.primary : BLUE;

  useEffect(() => {
    fetch("/api/booklets/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookletId: booklet.id }),
    }).catch(() => {});
  }, [booklet.id]);

  const enabledModules = [...booklet.modules].filter((m) => m.enabled).sort((a, b) => a.order - b.order);
  const availableLangs = getAvailableLangs(booklet);
  const currentLang = availableLangs.find((l) => l.code === lang);
  const activeModule = enabledModules.find((m) => m.id === activeModuleId);
  const sp = booklet.splashConfig ?? {};
  const bgUrl = sp.mediaUrl || booklet.coverImage;

  const get = (moduleId: string, key: string) => getContent(booklet, moduleId, key, lang);
  const openModule = (id: string) => { setActiveModuleId(id); setScreen("module"); };

  const allPlaces = enabledModules.flatMap((m) => {
    const raw = m.content["places"];
    if (!raw) return [];
    return parsePlaces(raw).map((p) => ({ ...p, category: MODULE_META[m.type].label }));
  });

  // ── LANG PICKER ────────────────────────────────────────────────────────────
  const LangBtn = () => availableLangs.length > 1 ? (
    <div className="relative">
      <button onClick={() => setShowLangMenu(!showLangMenu)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
        style={{ ...glass(0.2), color: "#fff" }}>
        <Globe className="w-3 h-3" /> {currentLang?.flag}
      </button>
      {showLangMenu && (
        <div className="absolute top-9 right-0 z-50 rounded-2xl shadow-2xl py-1.5 overflow-hidden min-w-[140px]"
          style={{ backgroundColor: DARK2, border: "1px solid rgba(255,255,255,0.15)" }}>
          {availableLangs.map((l) => (
            <button key={l.code} onClick={() => { setLang(l.code); setShowLangMenu(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm"
              style={{ color: lang === l.code ? ACCENT : "rgba(255,255,255,0.6)", fontWeight: lang === l.code ? "700" : "400" }}>
              <span>{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null;

  // ── SPLASH ─────────────────────────────────────────────────────────────────
  if (screen === "splash") {
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: DARK }}>
        {/* Background photo */}
        {bgUrl ? (
          <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, #1a2f4a 0%, ${DARK} 100%)` }} />
        )}
        {/* Dark overlay gradient */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(13,27,42,0.3) 0%, rgba(13,27,42,0.5) 40%, rgba(13,27,42,0.92) 75%, rgba(13,27,42,1) 100%)" }} />

        {/* Top bar */}
        <div className="relative z-10 flex justify-between items-center px-5 pt-12 pb-4">
          <div />
          <LangBtn />
        </div>

        {/* Content — poussé en bas */}
        <div className="relative z-10 mt-auto px-6 pb-14">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{ ...glass(0.2) }}>
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-white">Livret d'accueil officiel</span>
          </div>

          <h1 className="font-black text-white leading-tight mb-3" style={{ fontSize: 40, letterSpacing: "-1.5px" }}>
            {sp.customTitle || booklet.propertyName || booklet.title}
          </h1>

          {booklet.address && (
            <div className="flex items-center gap-1.5 mb-6">
              <MapPin className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{booklet.address}</p>
            </div>
          )}

          {/* Amenities pills */}
          <div className="flex gap-2 flex-wrap mb-8">
            {[
              { icon: <Bed className="w-3.5 h-3.5" />, label: "Séjour" },
              { icon: <Wifi className="w-3.5 h-3.5" />, label: "WiFi" },
              { icon: <Key className="w-3.5 h-3.5" />, label: "Accès 24h" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={glass(0.18)}>
                <span style={{ color: ACCENT }}>{item.icon}</span>
                <span className="text-xs font-medium text-white">{item.label}</span>
              </div>
            ))}
          </div>

          <button onClick={() => setScreen("home")}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95"
            style={{ backgroundColor: ACCENT, boxShadow: `0 8px 32px ${ACCENT}60` }}>
            {sp.buttonText || "Accéder au livret"}
          </button>
        </div>
      </div>
    );
  }

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === "home") {
    // Catégoriser les modules
    const infoModules = enabledModules.filter((m) =>
      ["welcome", "practical", "checkin", "rules", "guide", "contacts", "faq"].includes(m.type)
    );
    const placeModules = enabledModules.filter((m) =>
      ["activities", "gooddeals", "transport"].includes(m.type)
    );
    const serviceModules = enabledModules.filter((m) =>
      ["upselling"].includes(m.type)
    );

    const tabModules = activeTab === "info" ? infoModules : activeTab === "places" ? placeModules : serviceModules;

    return (
      <>
        {showCheckIn && <CheckInForm bookletId={booklet.id} accent={ACCENT} onClose={() => setShowCheckIn(false)} />}
        <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: DARK }}>

          {/* Background subtil */}
          {bgUrl && (
            <>
              <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.12 }} />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${DARK} 0%, transparent 30%, ${DARK} 70%)` }} />
            </>
          )}

          {/* Header */}
          <div className="relative z-10 px-5 pt-12 pb-4 shrink-0">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Bienvenue 👋</p>
                <h1 className="font-black text-white leading-tight" style={{ fontSize: 24, letterSpacing: "-0.5px" }}>
                  {booklet.propertyName || booklet.title}
                </h1>
              </div>
              <LangBtn />
            </div>

            {/* Carte hero */}
            <div className="rounded-3xl overflow-hidden relative" style={{ height: 160 }}>
              {bgUrl ? (
                <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              ) : (
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, #1a3a5c 0%, ${DARK} 100%)` }} />
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(13,27,42,0.85) 100%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                <div>
                  {booklet.address && (
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" style={{ color: ACCENT }} />
                      <p className="text-xs text-white opacity-70">{booklet.address}</p>
                    </div>
                  )}
                  <p className="font-bold text-white text-sm">{enabledModules.length} sections disponibles</p>
                </div>
                <button onClick={() => setShowCheckIn(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: ACCENT, color: "#fff" }}>
                  <ClipboardCheck className="w-3.5 h-3.5" /> Check-in
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="relative z-10 px-5 mb-4 shrink-0">
            <div className="flex gap-2">
              {[
                { key: "info", label: "Infos", count: infoModules.length },
                { key: "places", label: "Lieux", count: placeModules.length },
                { key: "services", label: "Services", count: serviceModules.length },
              ].map(({ key, label, count }) => (
                <button key={key} onClick={() => setActiveTab(key as any)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={activeTab === key
                    ? { backgroundColor: ACCENT, color: "#fff" }
                    : { ...glass(0.12), color: "rgba(255,255,255,0.6)" }}>
                  {label}
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: activeTab === key ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)", color: activeTab === key ? "#fff" : "rgba(255,255,255,0.5)" }}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Module cards */}
          <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-24">
            {tabModules.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Aucun contenu dans cette section</p>
              </div>
            )}
            <div className="space-y-3">
              {tabModules.map((m) => {
                const meta = MODULE_META[m.type];
                const hasContent = Object.keys(m.content).some((k) => m.content[k]);
                return (
                  <button key={m.id} onClick={() => openModule(m.id)}
                    className="w-full text-left rounded-3xl p-4 transition-all active:scale-98"
                    style={hasContent ? glass(0.12) : { ...glass(0.06), opacity: 0.5 }}>
                    <div className="flex items-center gap-4">
                      {/* Icône */}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                        style={{ backgroundColor: `${ACCENT}20`, border: `1px solid ${ACCENT}40` }}>
                        {meta.emoji}
                      </div>
                      {/* Texte */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm">{meta.label}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{meta.description}</p>
                      </div>
                      {/* Arrow */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: hasContent ? `${ACCENT}25` : "rgba(255,255,255,0.05)" }}>
                        <ChevronRight className="w-4 h-4" style={{ color: hasContent ? ACCENT : "rgba(255,255,255,0.2)" }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Lieux rapides si tab places */}
            {activeTab === "places" && allPlaces.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Tous les lieux recommandés
                </p>
                {allPlaces.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 mb-2 p-3 rounded-2xl" style={glass(0.1)}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}20` }}>
                      <MapPin className="w-4 h-4" style={{ color: ACCENT }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{p.category}</p>
                    </div>
                    {p.address && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                        style={{ backgroundColor: ACCENT, color: "#fff" }}>Maps</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tab bar fixe en bas */}
          <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-6 pt-3"
            style={{ background: `linear-gradient(to top, ${DARK} 60%, transparent 100%)` }}>
            <div className="flex items-center justify-around py-3 px-4 rounded-3xl"
              style={glassDark()}>
              <button onClick={() => { setActiveTab("info"); }}
                className="flex flex-col items-center gap-1 transition-all"
                style={{ color: activeTab === "info" ? ACCENT : "rgba(255,255,255,0.4)" }}>
                <Home className="w-5 h-5" />
                <span className="text-xs font-semibold">Accueil</span>
              </button>
              <button onClick={() => setActiveTab("places")}
                className="flex flex-col items-center gap-1 transition-all"
                style={{ color: activeTab === "places" ? ACCENT : "rgba(255,255,255,0.4)" }}>
                <MapPin className="w-5 h-5" />
                <span className="text-xs font-semibold">Lieux</span>
              </button>
              <button onClick={() => setActiveTab("services")}
                className="flex flex-col items-center gap-1 transition-all"
                style={{ color: activeTab === "services" ? ACCENT : "rgba(255,255,255,0.4)" }}>
                <Grid3x3 className="w-5 h-5" />
                <span className="text-xs font-semibold">Services</span>
              </button>
              <button onClick={() => setShowCheckIn(true)}
                className="flex flex-col items-center gap-1 transition-all"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                <ClipboardCheck className="w-5 h-5" />
                <span className="text-xs font-semibold">Check-in</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── MODULE ─────────────────────────────────────────────────────────────────
  if (screen === "module" && activeModule) {
    const meta = MODULE_META[activeModule.type];
    const photos = activeModule.images ?? [];
    const docs = activeModule.documents ?? [];
    const g = (key: string) => get(activeModule.id, key);

    // Helpers
    const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
      <div className="flex items-start gap-4 p-4 rounded-2xl mb-3" style={glass(0.1)}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}20` }}>
          <span style={{ color: ACCENT }}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: ACCENT }}>{label}</p>
          <p className="text-sm leading-relaxed text-white whitespace-pre-line">{value}</p>
        </div>
      </div>
    );

    const renderContent = () => {
      switch (activeModule.type) {

        case "welcome": return <>
          {g("title") && <h2 className="font-black text-white text-2xl leading-tight mb-3" style={{ letterSpacing: "-0.5px" }}>{g("title")}</h2>}
          {g("message") && <p className="text-sm leading-relaxed whitespace-pre-line mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>{g("message")}</p>}
        </>;

        case "practical": return <>
          {g("wifi_name") && (
            <div className="p-5 rounded-3xl mb-4" style={glass(0.12)}>
              <div className="flex items-center gap-2 mb-4">
                <Wifi className="w-5 h-5" style={{ color: ACCENT }} />
                <p className="font-bold text-white text-base">WiFi</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                  <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Réseau</p>
                  <p className="font-bold text-white text-sm">{g("wifi_name")}</p>
                </div>
                {g("wifi_password") && (
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                    <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Mot de passe</p>
                    <p className="font-bold font-mono text-sm" style={{ color: ACCENT }}>{g("wifi_password")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {g("door_code") && (
            <div className="p-5 rounded-3xl mb-4 text-center" style={{ background: `linear-gradient(135deg, ${ACCENT}30, ${ACCENT}15)`, border: `1px solid ${ACCENT}40` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>Code d'entrée</p>
              <p className="font-black text-white tracking-[0.4em]" style={{ fontSize: 44 }}>{g("door_code")}</p>
            </div>
          )}
          {g("parking") && <InfoRow icon={<Car className="w-5 h-5" />} label="Parking" value={g("parking")} />}
          {g("other") && <InfoRow icon={<Info className="w-5 h-5" />} label="Infos pratiques" value={g("other")} />}
        </>;

        case "checkin": return <>
          {(g("checkin_time") || g("checkout_time")) && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {g("checkin_time") && (
                <div className="p-4 rounded-3xl text-center" style={{ background: `linear-gradient(135deg, ${ACCENT}30, ${ACCENT}15)`, border: `1px solid ${ACCENT}40` }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: ACCENT }}>Arrivée</p>
                  <p className="text-3xl font-black text-white">{g("checkin_time")}</p>
                </div>
              )}
              {g("checkout_time") && (
                <div className="p-4 rounded-3xl text-center" style={glass(0.1)}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Départ</p>
                  <p className="text-3xl font-black text-white">{g("checkout_time")}</p>
                </div>
              )}
            </div>
          )}
          {g("checkin_process") && <InfoRow icon={<Key className="w-5 h-5" />} label="Procédure d'arrivée" value={g("checkin_process")} />}
          {g("checkout_process") && <InfoRow icon={<ChevronRight className="w-5 h-5" />} label="Procédure de départ" value={g("checkout_process")} />}
        </>;

        case "rules": return g("rules") ? (
          <div className="rounded-3xl overflow-hidden" style={glass(0.1)}>
            {g("rules").split("\n").filter(Boolean).map((line, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${ACCENT}25` }}>
                  <Check className="w-3 h-3" style={{ color: ACCENT }} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{line}</p>
              </div>
            ))}
          </div>
        ) : null;

        case "guide": return <>
          {g("heating") && <InfoRow icon="🌡️" label="Chauffage" value={g("heating")} />}
          {g("appliances") && <InfoRow icon="🍳" label="Électroménager" value={g("appliances")} />}
          {g("trash") && <InfoRow icon="♻️" label="Tri des déchets" value={g("trash")} />}
          {g("other") && <InfoRow icon="🏠" label="Autres infos" value={g("other")} />}
        </>;

        case "contacts": return <>
          {g("owner_name") && (
            <div className="p-5 rounded-3xl mb-3" style={glass(0.12)}>
              <p className="font-bold text-white text-base mb-3">{g("owner_name")}</p>
              {g("owner_phone") && (
                <a href={`tel:${g("owner_phone")}`}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95"
                  style={{ backgroundColor: ACCENT, color: "#fff" }}>
                  <Phone className="w-4 h-4" /> {g("owner_phone")}
                </a>
              )}
            </div>
          )}
          {g("emergency") && (
            <div className="p-4 rounded-3xl mb-3" style={{ backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#ef4444" }}>🚨 Urgences</p>
              <p className="text-sm font-semibold whitespace-pre-line" style={{ color: "#fca5a5" }}>{g("emergency")}</p>
            </div>
          )}
          {g("doctor") && <InfoRow icon={<Phone className="w-5 h-5" />} label="Médecin" value={g("doctor")} />}
          {g("neighbors") && <InfoRow icon={<MapPin className="w-5 h-5" />} label="Voisins" value={g("neighbors")} />}
        </>;

        case "activities": return <>
          {g("activities") && <p className="text-sm leading-relaxed mb-4 whitespace-pre-line" style={{ color: "rgba(255,255,255,0.7)" }}>{g("activities")}</p>}
          {g("places") && parsePlaces(g("places")).map((p, i) => (
            <div key={i} className="flex items-center gap-3 mb-3 p-4 rounded-2xl" style={glass(0.1)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}20` }}>
                <MapPin className="w-5 h-5" style={{ color: ACCENT }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{p.name}</p>
                {p.address && <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{p.address}</p>}
              </div>
              {p.address && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: ACCENT, color: "#fff" }}>Maps</a>
              )}
            </div>
          ))}
        </>;

        case "gooddeals": return <>
          {g("restaurants") && <InfoRow icon="🍽️" label="Restaurants" value={g("restaurants")} />}
          {g("shops") && <InfoRow icon="🛒" label="Commerces" value={g("shops")} />}
          {g("others") && <InfoRow icon="⭐" label="Bons plans" value={g("others")} />}
          {g("places") && parsePlaces(g("places")).map((p, i) => (
            <div key={i} className="flex items-center gap-3 mb-3 p-4 rounded-2xl" style={glass(0.1)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}20` }}>
                <MapPin className="w-5 h-5" style={{ color: ACCENT }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{p.name}</p>
                {p.address && <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{p.address}</p>}
              </div>
              {p.address && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: ACCENT, color: "#fff" }}>Maps</a>
              )}
            </div>
          ))}
        </>;

        case "transport": return <>
          {g("by_car") && <InfoRow icon={<Car className="w-5 h-5" />} label="En voiture" value={g("by_car")} />}
          {g("by_train") && <InfoRow icon={<Train className="w-5 h-5" />} label="En train" value={g("by_train")} />}
          {g("taxi") && <InfoRow icon="🚕" label="Taxi / VTC" value={g("taxi")} />}
          {g("airport") && <InfoRow icon={<Plane className="w-5 h-5" />} label="Aéroport" value={g("airport")} />}
        </>;

        case "faq": return g("faq") ? (
          <div className="rounded-3xl overflow-hidden" style={glass(0.1)}>
            {g("faq").split("\n").filter(Boolean).map((line, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${ACCENT}25` }}>
                  <Check className="w-3 h-3" style={{ color: ACCENT }} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{line}</p>
              </div>
            ))}
          </div>
        ) : null;

        case "upselling": {
          const items = (g("items") || "").split("\n").map((line: string) => {
            const [name, desc, price, link] = line.split("|").map((s: string) => s.trim());
            return name ? { name, desc, price, link } : null;
          }).filter(Boolean) as { name: string; desc: string; price: string; link: string }[];
          return <>
            {g("intro") && <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>{g("intro")}</p>}
            {items.map((item, i) => (
              <div key={i} className="p-4 rounded-3xl mb-3" style={glass(0.12)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-bold text-white">{item.name}</p>
                  {item.price && (
                    <span className="font-black text-sm px-3 py-1 rounded-full shrink-0" style={{ backgroundColor: ACCENT, color: "#fff" }}>{item.price}</span>
                  )}
                </div>
                {item.desc && <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>{item.desc}</p>}
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer"
                    className="block text-center py-3 rounded-2xl text-sm font-bold"
                    style={{ backgroundColor: ACCENT, color: "#fff" }}>
                    Réserver →
                  </a>
                )}
              </div>
            ))}
          </>;
        }

        default: return null;
      }
    };

    return (
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: DARK }}>
        {/* Background photo floutée */}
        {bgUrl && (
          <>
            <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.15, filter: "blur(2px)" }} />
            <div className="absolute inset-0" style={{ backgroundColor: `${DARK}cc` }} />
          </>
        )}

        {/* Header */}
        <div className="relative z-10 shrink-0 px-5 pt-12 pb-5">
          <button onClick={() => setScreen("home")}
            className="flex items-center gap-2 text-sm font-semibold mb-5 transition-opacity hover:opacity-70"
            style={{ color: ACCENT }}>
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ background: `linear-gradient(135deg, ${ACCENT}30, ${ACCENT}15)`, border: `1px solid ${ACCENT}40` }}>
              {meta.emoji}
            </div>
            <div>
              <h2 className="font-black text-white text-xl leading-tight">{meta.label}</h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{meta.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8">
          {renderContent()}

          {docs.length > 0 && (
            <div className="mt-4 space-y-2">
              {docs.map((doc, i) => (
                <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-2xl transition-all" style={glass(0.1)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}20` }}>
                    <FileText className="w-5 h-5" style={{ color: ACCENT }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{doc.name}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>PDF · Appuyez pour ouvrir</p>
                  </div>
                  <Download className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                </a>
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <div className={`mt-4 grid gap-2 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {photos.map((url, i) => (
                <div key={i} className="aspect-video rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs py-8" style={{ color: "rgba(255,255,255,0.15)" }}>
            Livret. ✦
          </p>
        </div>
      </div>
    );
  }

  return null;
}
