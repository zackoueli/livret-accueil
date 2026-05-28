"use client";

import { useState, useEffect } from "react";
import { Booklet } from "@/types";
import { MODULE_META } from "@/lib/modules";
import { getContent, parsePlaces, getAvailableLangs } from "./viewerUtils";
import { CheckInForm } from "./CheckInForm";
import { ArrowLeft, Globe, MapPin, FileText, Download, ClipboardCheck, ChevronRight } from "lucide-react";

type Screen = "splash" | "home" | "module";

const ACCENT = "#6b8f71";
const CREAM = "#faf7f2";
const CREAM_DARK = "#f5f0e8";
const BORDER = "#d4c9b0";
const SERIF = "Georgia, 'Times New Roman', serif";

export function ViewerNature({ booklet }: { booklet: Booklet }) {
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

  const availableLangs = getAvailableLangs(booklet);
  const currentLang = availableLangs.find((l) => l.code === lang);
  const activeModule = enabledModules.find((m) => m.id === activeModuleId);
  const sp = booklet.splashConfig ?? {};

  const get = (moduleId: string, key: string) =>
    getContent(booklet, moduleId, key, lang);

  const allPlaces = enabledModules.flatMap((m) => {
    const raw = m.content["places"];
    if (!raw) return [];
    return parsePlaces(raw).map((p) => ({ ...p, category: MODULE_META[m.type].label }));
  });

  const openModule = (id: string) => {
    setActiveModuleId(id);
    setScreen("module");
  };

  // ── SPLASH ──────────────────────────────────────────────────────────────────
  if (screen === "splash") {
    const bgUrl = sp.mediaUrl || booklet.coverImage;
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: CREAM, fontFamily: SERIF }}>
        {/* Background */}
        {bgUrl && (
          <>
            <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(250,247,242,0.3) 0%, rgba(250,247,242,0.85) 60%, rgba(250,247,242,1) 100%)" }} />
          </>
        )}
        {!bgUrl && (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${CREAM} 0%, #e8efe9 50%, ${CREAM_DARK} 100%)` }} />
        )}

        {/* Lang picker */}
        {availableLangs.length > 1 && (
          <div className="relative z-10 flex justify-end p-5">
            <button onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
              style={{ backgroundColor: "rgba(250,247,242,0.9)", borderColor: BORDER, color: ACCENT, backdropFilter: "blur(8px)" }}>
              <Globe className="w-3.5 h-3.5" />
              {currentLang?.flag} {currentLang?.label}
            </button>
            {showLangMenu && (
              <div className="absolute top-14 right-5 z-20 rounded-2xl shadow-xl py-1.5 min-w-[140px] overflow-hidden border"
                style={{ backgroundColor: CREAM, borderColor: BORDER }}>
                {availableLangs.map((l) => (
                  <button key={l.code} onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-white/60"
                    style={{ color: lang === l.code ? ACCENT : "#5a5a4a", fontWeight: lang === l.code ? "600" : "400" }}>
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 mt-auto p-8 pb-14">
          {/* Decorative */}
          <div className="flex gap-2 mb-4 text-xl">🌿 <span style={{ color: ACCENT, fontSize: 12, fontStyle: "italic", alignSelf: "flex-end", marginBottom: 2 }}>Livret d'accueil</span></div>

          <h1 className="leading-tight mb-3" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 700, color: "#2d3a2e", letterSpacing: "-0.5px" }}>
            {sp.customTitle || booklet.propertyName || booklet.title}
          </h1>

          {(sp.customSubtitle || booklet.description || booklet.address) && (
            <p className="text-sm leading-relaxed mb-8" style={{ fontStyle: "italic", color: "#7a7a6a" }}>
              {sp.customSubtitle || booklet.description || booklet.address}
            </p>
          )}

          <button onClick={() => setScreen("home")}
            className="w-full py-4 text-base font-semibold transition-all active:scale-95"
            style={{ backgroundColor: ACCENT, color: "#fff", borderRadius: 100, fontFamily: SERIF, letterSpacing: "0.5px", boxShadow: `0 4px 20px ${ACCENT}40` }}>
            {sp.buttonText || "Découvrir le livret 🌸"}
          </button>
        </div>
      </div>
    );
  }

  // ── HOME ────────────────────────────────────────────────────────────────────
  if (screen === "home") {
    return (
      <>
        {showCheckIn && <CheckInForm bookletId={booklet.id} accent={ACCENT} onClose={() => setShowCheckIn(false)} />}
        <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: CREAM, fontFamily: SERIF }}>

          {/* Header */}
          <div className="shrink-0 px-6 pt-12 pb-8" style={{ backgroundColor: CREAM_DARK, borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs uppercase tracking-widest mb-2" style={{ color: ACCENT, fontFamily: "system-ui, sans-serif" }}>
                  🌿 Bienvenue
                </div>
                <h1 className="leading-tight" style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: "#2d3a2e" }}>
                  {booklet.propertyName || booklet.title}
                </h1>
                {booklet.address && (
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ fontStyle: "italic", color: "#9a9a8a" }}>
                    <MapPin className="w-3 h-3" /> {booklet.address}
                  </p>
                )}
              </div>
              {availableLangs.length > 1 && (
                <div className="relative ml-3">
                  <button onClick={() => setShowLangMenu(!showLangMenu)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border"
                    style={{ borderColor: BORDER, color: ACCENT, backgroundColor: CREAM }}>
                    <Globe className="w-3.5 h-3.5" /> {currentLang?.flag}
                  </button>
                  {showLangMenu && (
                    <div className="absolute top-10 right-0 z-20 rounded-2xl shadow-xl py-1.5 min-w-[140px] overflow-hidden border"
                      style={{ backgroundColor: CREAM, borderColor: BORDER }}>
                      {availableLangs.map((l) => (
                        <button key={l.code} onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/60"
                          style={{ color: lang === l.code ? ACCENT : "#5a5a4a", fontWeight: lang === l.code ? "600" : "400" }}>
                          <span>{l.flag}</span> {l.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Module list */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 pt-6 pb-2">
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#9a9a8a", fontFamily: "system-ui, sans-serif" }}>
                Sommaire
              </p>
            </div>

            {enabledModules.map((m, i) => {
              const meta = MODULE_META[m.type];
              const hasContent = Object.keys(m.content).some((k) => m.content[k]);
              return (
                <div key={m.id}>
                  <button onClick={() => openModule(m.id)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left transition-all active:bg-white/60 group">
                    {/* Number */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ backgroundColor: hasContent ? ACCENT : "transparent", border: `2px solid ${ACCENT}`, color: hasContent ? "#fff" : ACCENT }}>
                      {i + 1}
                    </div>
                    {/* Emoji */}
                    <span className="text-2xl shrink-0">{meta.emoji}</span>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold leading-tight" style={{ fontFamily: SERIF, color: "#2d3a2e", fontSize: 15 }}>{meta.label}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ fontStyle: "italic", color: "#9a9a8a" }}>{meta.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: BORDER }} />
                  </button>
                  <div className="mx-6" style={{ borderBottom: `1px dashed ${BORDER}` }} />
                </div>
              );
            })}

            {/* Check-in + Around me */}
            <div className="px-6 pt-4 pb-2 space-y-3">
              <button onClick={() => setShowCheckIn(true)}
                className="w-full flex items-center gap-4 py-4 px-5 rounded-2xl border transition-all active:scale-98"
                style={{ backgroundColor: CREAM_DARK, borderColor: BORDER }}>
                <ClipboardCheck className="w-5 h-5 shrink-0" style={{ color: ACCENT }} />
                <div className="text-left">
                  <p className="font-bold text-sm" style={{ fontFamily: SERIF, color: "#2d3a2e" }}>Check-in en ligne</p>
                  <p className="text-xs" style={{ fontStyle: "italic", color: "#9a9a8a" }}>Enregistrez votre arrivée</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto" style={{ color: BORDER }} />
              </button>

              {allPlaces.length > 0 && (
                <button onClick={() => setScreen("module" as Screen)}
                  className="w-full flex items-center gap-4 py-4 px-5 rounded-2xl border transition-all active:scale-98"
                  style={{ backgroundColor: CREAM_DARK, borderColor: BORDER }}>
                  <MapPin className="w-5 h-5 shrink-0" style={{ color: ACCENT }} />
                  <div className="text-left">
                    <p className="font-bold text-sm" style={{ fontFamily: SERIF, color: "#2d3a2e" }}>Autour de moi</p>
                    <p className="text-xs" style={{ fontStyle: "italic", color: "#9a9a8a" }}>{allPlaces.length} lieux recommandés</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" style={{ color: BORDER }} />
                </button>
              )}
            </div>

            <p className="text-center text-xs py-8" style={{ fontStyle: "italic", color: "#c4bfb0" }}>
              Créé avec <span style={{ color: ACCENT }}>Livret.</span> 🌸
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── MODULE ───────────────────────────────────────────────────────────────────
  if (screen === "module" && activeModule) {
    const meta = MODULE_META[activeModule.type];
    const photos = activeModule.images ?? [];
    const docs = activeModule.documents ?? [];

    const renderContent = () => {
      const card = (emoji: string, label: string, children: React.ReactNode, highlight = false) => (
        <div className="mb-3 rounded-2xl overflow-hidden"
          style={{ backgroundColor: highlight ? "#fef2f2" : "#fff", borderLeft: `3px solid ${highlight ? "#ef4444" : ACCENT}`, boxShadow: "0 2px 12px rgba(107,143,113,0.08)" }}>
          <div className="px-5 pt-4 pb-1 flex items-center gap-2">
            <span className="text-base">{emoji}</span>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: highlight ? "#ef4444" : ACCENT, fontFamily: "system-ui, sans-serif" }}>{label}</p>
          </div>
          <div className="px-5 pb-4">{children}</div>
        </div>
      );

      const g = (key: string) => get(activeModule.id, key);

      switch (activeModule.type) {
        case "welcome":
          return <>
            {g("title") && <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: SERIF, color: "#2d3a2e" }}>{g("title")}</h2>}
            {g("message") && <p className="text-sm leading-relaxed mb-4 whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("message")}</p>}
          </>;
        case "practical":
          return <>
            {g("wifi_name") && card("📶", "WiFi", <>
              <p className="font-bold text-lg" style={{ fontFamily: "monospace", color: "#2d3a2e" }}>{g("wifi_name")}</p>
              {g("wifi_password") && <p className="text-sm mt-1" style={{ color: "#7a7a6a" }}>Mot de passe : <span className="font-mono font-bold" style={{ color: ACCENT }}>{g("wifi_password")}</span></p>}
            </>)}
            {g("door_code") && card("🔑", "Code d'entrée", <p className="font-mono font-black text-3xl tracking-widest" style={{ color: ACCENT }}>{g("door_code")}</p>)}
            {g("parking") && card("🅿️", "Parking", <p className="text-sm leading-relaxed" style={{ color: "#5a5a4a" }}>{g("parking")}</p>)}
            {g("other") && card("ℹ️", "Infos", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("other")}</p>)}
          </>;
        case "checkin":
          return <>
            {(g("checkin_time") || g("checkout_time")) && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {g("checkin_time") && <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: ACCENT, fontFamily: "system-ui" }}>Arrivée</p>
                  <p className="text-xl font-bold" style={{ fontFamily: SERIF, color: "#2d3a2e" }}>{g("checkin_time")}</p>
                </div>}
                {g("checkout_time") && <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: CREAM_DARK, border: `1px solid ${BORDER}` }}>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "#9a9a8a", fontFamily: "system-ui" }}>Départ</p>
                  <p className="text-xl font-bold" style={{ fontFamily: SERIF, color: "#2d3a2e" }}>{g("checkout_time")}</p>
                </div>}
              </div>
            )}
            {g("checkin_process") && card("🗝️", "Procédure d'arrivée", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("checkin_process")}</p>)}
            {g("checkout_process") && card("👋", "Procédure de départ", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("checkout_process")}</p>)}
          </>;
        case "rules":
          return g("rules") ? <div className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}`, boxShadow: "0 2px 12px rgba(107,143,113,0.08)" }}>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("rules")}</p>
          </div> : null;
        case "guide":
          return <>
            {g("heating") && card("🌡️", "Chauffage", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("heating")}</p>)}
            {g("appliances") && card("🍳", "Électroménager", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("appliances")}</p>)}
            {g("trash") && card("♻️", "Tri des déchets", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("trash")}</p>)}
            {g("other") && card("🏠", "Autres infos", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("other")}</p>)}
          </>;
        case "contacts":
          return <>
            {g("owner_name") && card("👤", g("owner_name"), g("owner_phone") && <a href={`tel:${g("owner_phone")}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mt-1" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>📞 {g("owner_phone")}</a>)}
            {g("emergency") && card("🚨", "Urgences", <p className="text-sm leading-relaxed whitespace-pre-line font-semibold" style={{ color: "#dc2626" }}>{g("emergency")}</p>, true)}
            {g("doctor") && card("⚕️", "Médecin", <p className="text-sm" style={{ color: "#5a5a4a" }}>{g("doctor")}</p>)}
            {g("neighbors") && card("🏘️", "Voisins", <p className="text-sm whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("neighbors")}</p>)}
          </>;
        case "activities":
          return <>
            {g("activities") && <div className="rounded-2xl p-5 mb-3" style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}` }}>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("activities")}</p>
            </div>}
            {g("places") && parsePlaces(g("places")).map((p, i) => (
              <div key={i} className="flex items-center justify-between mb-2 p-3 rounded-xl" style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}` }}>
                <div><p className="text-sm font-semibold" style={{ fontFamily: SERIF, color: "#2d3a2e" }}>{p.name}</p>{p.address && <p className="text-xs" style={{ color: "#9a9a8a", fontStyle: "italic" }}>{p.address}</p>}</div>
                {p.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-3 py-1.5 rounded-full ml-2" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>Maps</a>}
              </div>
            ))}
          </>;
        case "gooddeals":
          return <>
            {g("restaurants") && card("🍽️", "Restaurants", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("restaurants")}</p>)}
            {g("shops") && card("🛒", "Commerces", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("shops")}</p>)}
            {g("others") && card("⭐", "Bons plans", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("others")}</p>)}
            {g("places") && parsePlaces(g("places")).map((p, i) => (
              <div key={i} className="flex items-center justify-between mb-2 p-3 rounded-xl" style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}` }}>
                <div><p className="text-sm font-semibold" style={{ fontFamily: SERIF, color: "#2d3a2e" }}>{p.name}</p>{p.address && <p className="text-xs" style={{ color: "#9a9a8a", fontStyle: "italic" }}>{p.address}</p>}</div>
                {p.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-3 py-1.5 rounded-full ml-2" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>Maps</a>}
              </div>
            ))}
          </>;
        case "transport":
          return <>
            {g("by_car") && card("🚗", "En voiture", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("by_car")}</p>)}
            {g("by_train") && card("🚆", "En train", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("by_train")}</p>)}
            {g("taxi") && card("🚕", "Taxi / VTC", <p className="text-sm" style={{ color: "#5a5a4a" }}>{g("taxi")}</p>)}
            {g("airport") && card("✈️", "Aéroport", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("airport")}</p>)}
          </>;
        case "faq":
          return g("faq") ? <div className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}` }}>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a5a4a" }}>{g("faq")}</p>
          </div> : null;
        case "upselling": {
          const items = (g("items") || "").split("\n").map((line: string) => {
            const [name, desc, price, link] = line.split("|").map((s: string) => s.trim());
            return name ? { name, desc, price, link } : null;
          }).filter(Boolean) as { name: string; desc: string; price: string; link: string }[];
          return <>
            {g("intro") && <p className="text-sm leading-relaxed mb-4" style={{ fontStyle: "italic", color: "#7a7a6a" }}>{g("intro")}</p>}
            {items.map((item, i) => (
              <div key={i} className="mb-3 rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}` }}>
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <p className="font-bold" style={{ fontFamily: SERIF, color: "#2d3a2e" }}>{item.name}</p>
                    {item.price && <span className="text-sm font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>{item.price}</span>}
                  </div>
                  {item.desc && <p className="text-xs mb-3" style={{ fontStyle: "italic", color: "#7a7a6a" }}>{item.desc}</p>}
                  {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="block text-center py-2.5 rounded-full text-sm font-semibold" style={{ backgroundColor: ACCENT, color: "#fff" }}>Réserver →</a>}
                </div>
              </div>
            ))}
          </>;
        }
        default: return null;
      }
    };

    return (
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: CREAM, fontFamily: SERIF }}>
        {/* Header */}
        <div className="shrink-0 px-5 pt-10 pb-5 border-b" style={{ backgroundColor: CREAM_DARK, borderColor: BORDER }}>
          <button onClick={() => setScreen("home")} className="flex items-center gap-2 text-sm mb-4 transition-opacity hover:opacity-70" style={{ color: ACCENT, fontFamily: "system-ui" }}>
            <ArrowLeft className="w-4 h-4" /> Retour au sommaire
          </button>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{meta.emoji}</span>
            <div>
              <h2 className="font-bold leading-tight" style={{ fontFamily: SERIF, fontSize: 22, color: "#2d3a2e" }}>{meta.label}</h2>
              <p className="text-xs mt-0.5" style={{ fontStyle: "italic", color: "#9a9a8a" }}>{meta.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {renderContent()}

          {/* Documents */}
          {docs.length > 0 && (
            <div className="mt-4 space-y-2">
              {docs.map((doc, i) => (
                <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: "#fff", borderColor: BORDER }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
                    <FileText className="w-4 h-4" style={{ color: ACCENT }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ fontFamily: SERIF, color: "#2d3a2e" }}>{doc.name}</p>
                    <p className="text-xs" style={{ fontStyle: "italic", color: "#9a9a8a" }}>PDF · Appuyez pour ouvrir</p>
                  </div>
                  <Download className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                </a>
              ))}
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div className={`mt-4 grid gap-2 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {photos.map((url, i) => (
                <div key={i} className="aspect-video rounded-2xl overflow-hidden border" style={{ borderColor: BORDER }}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs py-8" style={{ fontStyle: "italic", color: "#c4bfb0" }}>
            🌿 Créé avec <span style={{ color: ACCENT }}>Livret.</span>
          </p>
        </div>
      </div>
    );
  }

  return null;
}
