"use client";

import { useState, useEffect } from "react";
import { Booklet } from "@/types";
import { MODULE_META } from "@/lib/modules";
import { getContent, parsePlaces, getAvailableLangs } from "./viewerUtils";
import { CheckInForm } from "./CheckInForm";
import { ArrowLeft, Globe, MapPin, FileText, Download, ClipboardCheck, X } from "lucide-react";

type Screen = "splash" | "home" | "module";

const ORANGE = "#f97316";
const ORANGE_DARK = "#ea6a0a";
const ORANGE_LIGHT = "#fff7ed";
const ORANGE_MID = "#fed7aa";
const TEXT = "#1c0f00";
const MUTED = "#92400e";
const WHITE = "#ffffff";

export function ViewerModerne({ booklet }: { booklet: Booklet }) {
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

  const enabledModules = [...booklet.modules].filter((m) => m.enabled).sort((a, b) => a.order - b.order);
  const availableLangs = getAvailableLangs(booklet);
  const currentLang = availableLangs.find((l) => l.code === lang);
  const activeModule = enabledModules.find((m) => m.id === activeModuleId);
  const sp = booklet.splashConfig ?? {};
  const bgUrl = sp.mediaUrl || booklet.coverImage;

  const get = (moduleId: string, key: string) => getContent(booklet, moduleId, key, lang);

  const allPlaces = enabledModules.flatMap((m) => {
    const raw = m.content["places"];
    if (!raw) return [];
    return parsePlaces(raw).map((p) => ({ ...p, category: MODULE_META[m.type].label }));
  });

  const openModule = (id: string) => { setActiveModuleId(id); setScreen("module"); };

  const LangPicker = ({ dark = false }: { dark?: boolean }) => (
    availableLangs.length > 1 ? (
      <div className="relative">
        <button onClick={() => setShowLangMenu(!showLangMenu)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{ backgroundColor: dark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)", color: WHITE, backdropFilter: "blur(8px)" }}>
          <Globe className="w-3.5 h-3.5" />
          {currentLang?.flag} {currentLang?.label}
        </button>
        {showLangMenu && (
          <div className="absolute top-9 right-0 z-50 rounded-2xl shadow-2xl py-1.5 overflow-hidden min-w-[140px]"
            style={{ backgroundColor: WHITE, border: `2px solid ${ORANGE_MID}` }}>
            {availableLangs.map((l) => (
              <button key={l.code} onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-orange-50"
                style={{ color: lang === l.code ? ORANGE : TEXT, fontWeight: lang === l.code ? "700" : "400" }}>
                <span>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
    ) : null
  );

  // ── SPLASH ─────────────────────────────────────────────────────────────────
  if (screen === "splash") {
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: ORANGE }}>
        {/* Formes décoratives */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ backgroundColor: WHITE, transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: WHITE, transform: "translate(-30%, 30%)" }} />
        <div className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: WHITE }} />

        {/* Photo overlay */}
        {bgUrl && (
          <>
            <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.25 }} />
          </>
        )}

        <div className="relative z-10 flex justify-end p-5">
          <LangPicker dark />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-8 py-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 self-start"
            style={{ backgroundColor: "rgba(0,0,0,0.15)" }}>
            <span className="text-sm">🏠</span>
            <span className="text-xs font-bold uppercase tracking-wider text-white">Livret d'accueil</span>
          </div>

          <h1 className="font-black leading-none mb-4 text-white" style={{ fontSize: 52, letterSpacing: "-2px" }}>
            {sp.customTitle || booklet.propertyName || booklet.title}
          </h1>

          {(sp.customSubtitle || booklet.description || booklet.address) && (
            <p className="text-base leading-relaxed mb-2 font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
              {sp.customSubtitle || booklet.description || booklet.address}
            </p>
          )}
        </div>

        <div className="relative z-10 px-8 pb-14">
          <button onClick={() => setScreen("home")}
            className="w-full py-4.5 rounded-2xl text-base font-black transition-all active:scale-95 shadow-lg"
            style={{ backgroundColor: WHITE, color: ORANGE, padding: "1.1rem 2rem", fontSize: 16, borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}>
            {sp.buttonText || "Ouvrir le livret →"}
          </button>
        </div>
      </div>
    );
  }

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === "home") {
    const moduleColors = [
      "#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#f43f5e",
      "#f59e0b", "#06b6d4", "#84cc16", "#ec4899", "#6366f1",
    ];

    return (
      <>
        {showCheckIn && <CheckInForm bookletId={booklet.id} accent={ORANGE} onClose={() => setShowCheckIn(false)} />}
        <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: ORANGE_LIGHT, fontFamily: "system-ui, sans-serif" }}>

          {/* Header */}
          <div className="shrink-0 px-5 pt-12 pb-6 relative overflow-hidden" style={{ backgroundColor: ORANGE }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20" style={{ backgroundColor: WHITE, transform: "translate(20%, -20%)" }} />
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Bonjour ! 👋
                </p>
                <h1 className="font-black text-white leading-tight" style={{ fontSize: 26, letterSpacing: "-0.5px" }}>
                  {booklet.propertyName || booklet.title}
                </h1>
                {booklet.address && (
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <MapPin className="w-3 h-3" /> {booklet.address}
                  </p>
                )}
              </div>
              <LangPicker dark />
            </div>
          </div>

          {/* Grille modules */}
          <div className="flex-1 overflow-y-auto px-4 py-5">
            {/* Check-in + Autour de moi */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button onClick={() => setShowCheckIn(true)}
                className="flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-2xl transition-all active:scale-95"
                style={{ backgroundColor: WHITE, boxShadow: "0 2px 12px rgba(249,115,22,0.15)", border: `2px solid ${ORANGE_MID}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ORANGE}15` }}>
                  <ClipboardCheck className="w-5 h-5" style={{ color: ORANGE }} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black" style={{ color: TEXT }}>Check-in</p>
                  <p className="text-xs" style={{ color: MUTED }}>Arrivée en ligne</p>
                </div>
              </button>

              {allPlaces.length > 0 && (
                <button onClick={() => openModule(enabledModules.find((m) => m.content["places"])?.id || enabledModules[0].id)}
                  className="flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-2xl transition-all active:scale-95"
                  style={{ backgroundColor: ORANGE, boxShadow: `0 2px 12px ${ORANGE}40` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-white">Autour</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>{allPlaces.length} lieux</p>
                  </div>
                </button>
              )}
            </div>

            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>
              Informations
            </p>

            <div className="grid grid-cols-2 gap-3">
              {enabledModules.map((m, i) => {
                const meta = MODULE_META[m.type];
                const color = moduleColors[i % moduleColors.length];
                const hasContent = Object.keys(m.content).some((k) => m.content[k]);
                return (
                  <button key={m.id} onClick={() => openModule(m.id)}
                    className="flex flex-col items-start gap-3 p-4 rounded-2xl text-left transition-all active:scale-95"
                    style={{ backgroundColor: WHITE, boxShadow: hasContent ? "0 2px 12px rgba(0,0,0,0.06)" : "none", border: hasContent ? "none" : `2px dashed ${ORANGE_MID}`, opacity: hasContent ? 1 : 0.5 }}>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${color}15` }}>
                      {meta.emoji}
                    </div>
                    <div>
                      <p className="font-black text-sm leading-tight" style={{ color: TEXT }}>{meta.label}</p>
                      <p className="text-xs mt-0.5 leading-tight" style={{ color: MUTED }}>{meta.description}</p>
                    </div>
                    {hasContent && <div className="w-6 h-1.5 rounded-full self-end" style={{ backgroundColor: color }} />}
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs py-8 font-bold uppercase tracking-widest" style={{ color: ORANGE_MID }}>
              Livret. 🟠
            </p>
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

    const chip = (label: string, value: string, color = ORANGE) => (
      <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: WHITE, border: `2px solid ${color}20`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: color }}>{label}</p>
        <p className="text-sm leading-relaxed" style={{ color: TEXT }}>{value}</p>
      </div>
    );

    const renderContent = () => {
      switch (activeModule.type) {
        case "welcome": return <>
          {g("title") && <h2 className="font-black text-2xl leading-tight mb-3" style={{ color: TEXT }}>{g("title")}</h2>}
          {g("message") && <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("message")}</p>}
        </>;
        case "practical": return <>
          {g("wifi_name") && (
            <div className="rounded-2xl p-5 mb-3" style={{ backgroundColor: "#eff6ff", border: "2px solid #bfdbfe" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3b82f6" }}>📶 WiFi</p>
              <p className="font-black text-lg" style={{ color: TEXT }}>{g("wifi_name")}</p>
              {g("wifi_password") && <p className="text-sm mt-1.5 font-mono font-bold px-3 py-1.5 rounded-lg inline-block mt-2" style={{ backgroundColor: "#3b82f610", color: "#3b82f6" }}>
                🔑 {g("wifi_password")}
              </p>}
            </div>
          )}
          {g("door_code") && (
            <div className="rounded-2xl p-5 mb-3 text-center" style={{ backgroundColor: ORANGE, boxShadow: `0 4px 20px ${ORANGE}40` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 text-white opacity-80">Code d'entrée</p>
              <p className="font-black tracking-[0.4em] text-white" style={{ fontSize: 40 }}>{g("door_code")}</p>
            </div>
          )}
          {g("parking") && chip("🅿️ Parking", g("parking"), "#10b981")}
          {g("other") && chip("ℹ️ Infos pratiques", g("other"))}
        </>;
        case "checkin": return <>
          {(g("checkin_time") || g("checkout_time")) && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              {g("checkin_time") && <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: ORANGE, boxShadow: `0 4px 20px ${ORANGE}30` }}>
                <p className="text-xs font-bold mb-1 text-white opacity-80 uppercase tracking-wide">Arrivée</p>
                <p className="text-2xl font-black text-white">{g("checkin_time")}</p>
              </div>}
              {g("checkout_time") && <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: WHITE, border: `2px solid ${ORANGE_MID}` }}>
                <p className="text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: MUTED }}>Départ</p>
                <p className="text-2xl font-black" style={{ color: TEXT }}>{g("checkout_time")}</p>
              </div>}
            </div>
          )}
          {g("checkin_process") && chip("🗝️ Arrivée", g("checkin_process"), "#10b981")}
          {g("checkout_process") && chip("👋 Départ", g("checkout_process"), "#f59e0b")}
        </>;
        case "rules": return g("rules") ? chip("📋 Règlement", g("rules"), "#6366f1") : null;
        case "guide": return <>
          {g("heating") && chip("🌡️ Chauffage", g("heating"), "#f43f5e")}
          {g("appliances") && chip("🍳 Électroménager", g("appliances"), "#f59e0b")}
          {g("trash") && chip("♻️ Déchets", g("trash"), "#10b981")}
          {g("other") && chip("🏠 Autres", g("other"))}
        </>;
        case "contacts": return <>
          {g("owner_name") && (
            <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: WHITE, border: `2px solid ${ORANGE_MID}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <p className="font-black text-base mb-2" style={{ color: TEXT }}>{g("owner_name")}</p>
              {g("owner_phone") && <a href={`tel:${g("owner_phone")}`}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                style={{ backgroundColor: ORANGE, color: WHITE }}>
                📞 {g("owner_phone")}
              </a>}
            </div>
          )}
          {g("emergency") && (
            <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: "#fef2f2", border: "2px solid #fecaca" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#ef4444" }}>🚨 Urgences</p>
              <p className="text-sm font-semibold leading-relaxed whitespace-pre-line" style={{ color: "#dc2626" }}>{g("emergency")}</p>
            </div>
          )}
          {g("doctor") && chip("⚕️ Médecin", g("doctor"), "#3b82f6")}
          {g("neighbors") && chip("🏘️ Voisins", g("neighbors"), "#8b5cf6")}
        </>;
        case "activities": return <>
          {g("activities") && chip("🎉 Activités", g("activities"), "#ec4899")}
          {g("places") && parsePlaces(g("places")).map((p, i) => (
            <div key={i} className="flex items-center gap-3 mb-2 p-3 rounded-xl" style={{ backgroundColor: WHITE, border: `1px solid ${ORANGE_MID}` }}>
              <div className="flex-1">
                <p className="text-sm font-black" style={{ color: TEXT }}>{p.name}</p>
                {p.address && <p className="text-xs" style={{ color: MUTED }}>{p.address}</p>}
              </div>
              {p.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
                style={{ backgroundColor: ORANGE, color: WHITE }}>Maps</a>}
            </div>
          ))}
        </>;
        case "gooddeals": return <>
          {g("restaurants") && chip("🍽️ Restaurants", g("restaurants"), "#f59e0b")}
          {g("shops") && chip("🛒 Commerces", g("shops"), "#10b981")}
          {g("others") && chip("⭐ Bons plans", g("others"), "#8b5cf6")}
          {g("places") && parsePlaces(g("places")).map((p, i) => (
            <div key={i} className="flex items-center gap-3 mb-2 p-3 rounded-xl" style={{ backgroundColor: WHITE, border: `1px solid ${ORANGE_MID}` }}>
              <div className="flex-1">
                <p className="text-sm font-black" style={{ color: TEXT }}>{p.name}</p>
                {p.address && <p className="text-xs" style={{ color: MUTED }}>{p.address}</p>}
              </div>
              {p.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
                style={{ backgroundColor: ORANGE, color: WHITE }}>Maps</a>}
            </div>
          ))}
        </>;
        case "transport": return <>
          {g("by_car") && chip("🚗 En voiture", g("by_car"), "#f97316")}
          {g("by_train") && chip("🚆 En train", g("by_train"), "#3b82f6")}
          {g("taxi") && chip("🚕 Taxi / VTC", g("taxi"), "#f59e0b")}
          {g("airport") && chip("✈️ Aéroport", g("airport"), "#06b6d4")}
        </>;
        case "faq": return g("faq") ? chip("❓ FAQ", g("faq"), "#6366f1") : null;
        case "upselling": {
          const items = (g("items") || "").split("\n").map((line: string) => {
            const [name, desc, price, link] = line.split("|").map((s: string) => s.trim());
            return name ? { name, desc, price, link } : null;
          }).filter(Boolean) as { name: string; desc: string; price: string; link: string }[];
          return <>
            {g("intro") && <p className="text-sm leading-relaxed mb-4" style={{ color: MUTED }}>{g("intro")}</p>}
            {items.map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden mb-3" style={{ backgroundColor: WHITE, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: `2px solid ${ORANGE_MID}` }}>
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <p className="font-black" style={{ color: TEXT }}>{item.name}</p>
                    {item.price && <span className="text-xs font-black px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: ORANGE, color: WHITE }}>{item.price}</span>}
                  </div>
                  {item.desc && <p className="text-xs mb-3" style={{ color: MUTED }}>{item.desc}</p>}
                  {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer"
                    className="block text-center py-2.5 rounded-xl text-sm font-black"
                    style={{ backgroundColor: ORANGE, color: WHITE }}>
                    Réserver →
                  </a>}
                </div>
              </div>
            ))}
          </>;
        }
        default: return null;
      }
    };

    return (
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: ORANGE_LIGHT }}>
        {/* Header */}
        <div className="shrink-0 pt-10 pb-5 px-5 relative overflow-hidden" style={{ backgroundColor: ORANGE }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20" style={{ backgroundColor: WHITE, transform: "translate(20%, -20%)" }} />
          <div className="relative z-10">
            <button onClick={() => setScreen("home")} className="flex items-center gap-2 text-sm font-bold mb-4 text-white opacity-80 transition-opacity hover:opacity-100">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                {meta.emoji}
              </div>
              <div>
                <h2 className="font-black text-white leading-tight" style={{ fontSize: 22 }}>{meta.label}</h2>
                <p className="text-xs text-white opacity-70 mt-0.5">{meta.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {renderContent()}

          {docs.length > 0 && (
            <div className="mt-4 space-y-2">
              {docs.map((doc, i) => (
                <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl"
                  style={{ backgroundColor: WHITE, border: `2px solid ${ORANGE_MID}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ORANGE}15` }}>
                    <FileText className="w-5 h-5" style={{ color: ORANGE }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate" style={{ color: TEXT }}>{doc.name}</p>
                    <p className="text-xs" style={{ color: MUTED }}>PDF · Appuyez pour ouvrir</p>
                  </div>
                  <Download className="w-4 h-4 shrink-0" style={{ color: ORANGE }} />
                </a>
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <div className={`mt-4 grid gap-2 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {photos.map((url, i) => (
                <div key={i} className="aspect-video rounded-2xl overflow-hidden" style={{ border: `2px solid ${ORANGE_MID}` }}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs py-8 font-bold uppercase tracking-widest" style={{ color: ORANGE_MID }}>
            Livret. 🟠
          </p>
        </div>
      </div>
    );
  }

  return null;
}
