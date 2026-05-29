"use client";

import { useState, useEffect } from "react";
import { Booklet } from "@/types";
import { MODULE_META } from "@/lib/modules";
import { getContent, parsePlaces, getAvailableLangs } from "./viewerUtils";
import { CheckInForm } from "./CheckInForm";
import { ArrowLeft, Globe, Wifi, Key, Car, Train, Plane, MapPin, Phone, FileText, Download, Check, ClipboardCheck } from "lucide-react";
import { getPalette, patternToCss } from "@/lib/palettes";

type Screen = "splash" | "home" | "module";

const SCRIPT = "'Dancing Script', 'Brush Script MT', cursive";
const SANS = "system-ui, -apple-system, sans-serif";

// Décoration : cercle gris en coin
function CornerCircle({ pos }: { pos: "tr" | "br" | "bl" }) {
  const styles: Record<string, React.CSSProperties> = {
    tr: { top: -40, right: -40 },
    br: { bottom: -40, right: -40 },
    bl: { bottom: -40, left: -40 },
  };
  return (
    <div className="absolute w-28 h-28 rounded-full pointer-events-none"
      style={{ ...styles[pos], backgroundColor: "#e8ddd0", opacity: 0.5, zIndex: 0 }} />
  );
}

function ScriptTitle({ small, big, color = "#1a1a1a" }: { small: string; big: string; color?: string }) {
  return (
    <div className="mb-5">
      <p className="text-sm mb-0.5" style={{ fontFamily: SCRIPT, color: "#9a8a7a", fontSize: 18 }}>{small}</p>
      <h2 className="font-black uppercase leading-none" style={{ fontSize: 36, color, fontFamily: SANS, letterSpacing: "-1px" }}>{big}</h2>
    </div>
  );
}

export function ViewerTempo({ booklet }: { booklet: Booklet }) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lang, setLang] = useState(booklet.defaultLanguage || "fr");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  const _p = { ...getPalette(booklet.paletteId ?? "creme"), ...booklet.customPalette };
  const ACCENT = _p.primary;
  const BEIGE = "#f0ebe3";
  const BEIGE_DARK = "#e8ddd0";
  const TEXT = "#1a1a1a";
  const MUTED = "#7a6a5a";

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

  // ── LANG MENU ──────────────────────────────────────────────────────────────
  const LangBtn = ({ dark = false }: { dark?: boolean }) =>
    availableLangs.length > 1 ? (
      <div className="relative">
        <button onClick={() => setShowLangMenu(!showLangMenu)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
          style={{ backgroundColor: dark ? "rgba(255,255,255,0.15)" : "#fff", borderColor: dark ? "rgba(255,255,255,0.3)" : BEIGE_DARK, color: dark ? "#fff" : TEXT, backdropFilter: "blur(8px)" }}>
          <Globe className="w-3 h-3" /> {currentLang?.flag} {currentLang?.label}
        </button>
        {showLangMenu && (
          <div className="absolute top-9 right-0 z-50 rounded-2xl shadow-xl py-1.5 overflow-hidden min-w-[140px] border"
            style={{ backgroundColor: "#fff", borderColor: BEIGE_DARK }}>
            {availableLangs.map((l) => (
              <button key={l.code} onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-stone-50"
                style={{ color: lang === l.code ? ACCENT : MUTED, fontWeight: lang === l.code ? "700" : "400" }}>
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
      <div className="fixed inset-0 flex overflow-hidden" style={{ backgroundColor: "#f5f0e8", fontFamily: SANS }}>
        {/* Photo gauche (70% largeur) */}
        <div className="relative flex-1">
          {bgUrl ? (
            <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          ) : (
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${BEIGE} 0%, ${BEIGE_DARK} 100%)` }} />
          )}
          {/* Overlay bas avec cercle blanc */}
          <div className="absolute bottom-0 left-0 right-0" style={{ height: "40%" }}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(245,240,232,0.95) 0%, transparent 100%)" }} />
          </div>
          {/* Badge crème centré bas */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center z-10 px-6">
            <div className="bg-white rounded-full px-8 py-5 shadow-lg mb-3" style={{ border: `2px solid ${BEIGE_DARK}` }}>
              <p className="font-black text-xl leading-tight" style={{ fontFamily: SANS, color: TEXT }}>Livret<br />d'Accueil</p>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: MUTED }}>
              {booklet.address || booklet.propertyName}
            </p>
          </div>
          {/* Lang */}
          <div className="absolute top-5 right-5 z-10">
            <LangBtn dark />
          </div>
        </div>

        {/* Bande droite — BIENVENUE vertical */}
        <div className="w-14 flex items-center justify-center shrink-0 relative overflow-hidden" style={{ backgroundColor: "#fff" }}>
          <p className="font-black text-3xl tracking-widest select-none"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", color: TEXT, fontFamily: SANS, letterSpacing: "0.15em" }}>
            {sp.customTitle ? sp.customTitle.toUpperCase() : "BIENVENUE"}
          </p>
        </div>

        {/* Bouton entrer en bas */}
        <button onClick={() => setScreen("home")}
          className="absolute bottom-5 right-2 z-10 py-2.5 px-3 rounded-full text-xs font-bold transition-all active:scale-95"
          style={{ backgroundColor: ACCENT, color: "#fff", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
          {sp.buttonText || "Entrer →"}
        </button>
      </div>
    );
  }

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === "home") {
    return (
      <>
        {showCheckIn && <CheckInForm bookletId={booklet.id} accent={ACCENT} onClose={() => setShowCheckIn(false)} />}
        <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: "#fff", fontFamily: SANS }}>

          {/* Header */}
          <div className="shrink-0 px-6 pt-10 pb-6 relative overflow-hidden" style={{ backgroundColor: BEIGE }}>
            <CornerCircle pos="tr" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm mb-0.5" style={{ fontFamily: SCRIPT, color: MUTED, fontSize: 18 }}>Bienvenue à</p>
                <h1 className="font-black text-2xl leading-tight uppercase" style={{ color: TEXT, letterSpacing: "-0.5px" }}>
                  {booklet.propertyName || booklet.title}
                </h1>
                {booklet.address && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: MUTED }}>
                    <MapPin className="w-3 h-3" /> {booklet.address}
                  </p>
                )}
              </div>
              <LangBtn />
            </div>
          </div>

          {/* Liste modules */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {enabledModules.map((m) => {
              const meta = MODULE_META[m.type];
              const hasContent = Object.keys(m.content).some((k) => m.content[k]);
              return (
                <button key={m.id} onClick={() => openModule(m.id)}
                  className="w-full flex items-center gap-4 py-4 border-b text-left transition-all active:opacity-60"
                  style={{ borderColor: BEIGE_DARK }}>
                  <div className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-xl"
                    style={{ backgroundColor: hasContent ? BEIGE : "#f5f5f5", border: `2px solid ${hasContent ? BEIGE_DARK : "#e5e5e5"}` }}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm uppercase tracking-wide truncate" style={{ color: hasContent ? TEXT : "#aaa" }}>{meta.label}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: MUTED }}>{meta.description}</p>
                  </div>
                  {hasContent && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: ACCENT }}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}

            {/* Check-in */}
            <button onClick={() => setShowCheckIn(true)}
              className="w-full flex items-center gap-4 py-4 mt-3 rounded-2xl px-4 transition-all active:scale-95"
              style={{ backgroundColor: BEIGE, border: `1.5px solid ${BEIGE_DARK}` }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: ACCENT }}>
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-black text-sm uppercase tracking-wide" style={{ color: TEXT }}>Check-in en ligne</p>
                <p className="text-xs" style={{ color: MUTED }}>Enregistrez votre arrivée</p>
              </div>
            </button>

            <p className="text-center text-xs py-8" style={{ fontFamily: SCRIPT, color: BEIGE_DARK, fontSize: 16 }}>
              Créé avec Livret. ✦
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── MODULES ────────────────────────────────────────────────────────────────
  if (screen === "module" && activeModule) {
    const meta = MODULE_META[activeModule.type];
    const photos = activeModule.images ?? [];
    const docs = activeModule.documents ?? [];
    const g = (key: string) => get(activeModule.id, key);

    // Header commun
    const ModuleHeader = ({ children }: { children: React.ReactNode }) => (
      <div className="shrink-0 px-6 pt-10 pb-5 relative overflow-hidden" style={{ backgroundColor: "#fff" }}>
        <CornerCircle pos="tr" />
        <button onClick={() => setScreen("home")}
          className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-5 transition-opacity hover:opacity-70"
          style={{ color: ACCENT }}>
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="relative z-10">{children}</div>
      </div>
    );

    // ── WELCOME ──────────────────────────────────────────────────────────────
    if (activeModule.type === "welcome") {
      const coverPhoto = photos[0] || bgUrl;
      return (
        <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#fff", fontFamily: SANS }}>
          {/* Grande photo avec cercle découpé */}
          <div className="shrink-0 relative" style={{ height: 280 }}>
            {coverPhoto ? (
              <div className="absolute inset-0" style={{ backgroundImage: `url(${coverPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            ) : (
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${BEIGE} 0%, ${BEIGE_DARK} 100%)` }} />
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, #fff 100%)" }} />
            {/* Cercle photo décoratif */}
            {photos[1] && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg z-10">
                <img src={photos[1]} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <button onClick={() => setScreen("home")} className="absolute top-10 left-6 z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.85)", color: TEXT }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Retour
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6" style={{ paddingTop: photos[1] ? 56 : 16 }}>
            {g("title") ? (
              <h2 className="font-black text-3xl leading-tight mb-1" style={{ fontFamily: SCRIPT, color: TEXT }}>{g("title")}</h2>
            ) : (
              <h2 className="font-black text-3xl leading-tight mb-1" style={{ fontFamily: SCRIPT, color: TEXT }}>Bonjour !</h2>
            )}
            {g("message") && (
              <p className="text-sm leading-relaxed mt-4 whitespace-pre-line" style={{ color: MUTED }}>{g("message")}</p>
            )}
            {docs.length > 0 && (
              <div className="mt-4 space-y-2">
                {docs.map((doc, i) => (
                  <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border"
                    style={{ borderColor: BEIGE_DARK }}>
                    <FileText className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                    <span className="text-sm font-semibold flex-1 truncate" style={{ color: TEXT }}>{doc.name}</span>
                    <Download className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
                  </a>
                ))}
              </div>
            )}
            <p className="text-center text-xs py-10" style={{ fontFamily: SCRIPT, color: BEIGE_DARK, fontSize: 16 }}>✦</p>
          </div>
        </div>
      );
    }

    // ── PRACTICAL (WiFi) ─────────────────────────────────────────────────────
    if (activeModule.type === "practical") {
      return (
        <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#fff", fontFamily: SANS }}>
          <div className="flex flex-1 overflow-hidden">
            {/* Colonne gauche */}
            <div className="flex-1 flex flex-col px-6 pt-10 pb-6 relative overflow-hidden">
              <CornerCircle pos="bl" />
              <button onClick={() => setScreen("home")} className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-6" style={{ color: ACCENT }}>
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="relative z-10">
                <p className="text-sm mb-0" style={{ fontFamily: SCRIPT, color: MUTED, fontSize: 18 }}>Connection</p>
                <h1 className="font-black text-5xl uppercase leading-none mb-8" style={{ color: TEXT }}>WIFI</h1>
                {/* Icône WiFi SVG */}
                <div className="mb-8 flex justify-center">
                  <Wifi className="w-20 h-20" style={{ color: TEXT }} />
                </div>
                {g("wifi_name") && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: ACCENT }}>
                        <Check className="w-3 h-3" style={{ color: ACCENT }} />
                      </div>
                      <p className="font-black text-sm uppercase tracking-wide" style={{ color: TEXT }}>RÉSEAU</p>
                    </div>
                    <p className="font-bold text-sm ml-7" style={{ color: ACCENT }}>{g("wifi_name")}</p>
                  </div>
                )}
                {g("wifi_password") && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: ACCENT }}>
                        <Check className="w-3 h-3" style={{ color: ACCENT }} />
                      </div>
                      <p className="font-black text-sm uppercase tracking-wide" style={{ color: TEXT }}>MOT DE PASSE</p>
                    </div>
                    <p className="font-bold text-sm ml-7 font-mono" style={{ color: ACCENT }}>{g("wifi_password")}</p>
                  </div>
                )}
              </div>
            </div>
            {/* Colonne droite — photo */}
            {(photos[0] || bgUrl) && (
              <div className="w-2/5 shrink-0 relative">
                <div className="absolute inset-0" style={{ backgroundImage: `url(${photos[0] || bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              </div>
            )}
          </div>

          {/* Autres infos pratiques */}
          {(g("door_code") || g("parking") || g("other")) && (
            <div className="shrink-0 px-6 pb-6 pt-4 border-t" style={{ borderColor: BEIGE_DARK }}>
              {g("door_code") && (
                <div className="flex items-center gap-3 mb-3 p-3 rounded-2xl" style={{ backgroundColor: BEIGE }}>
                  <Key className="w-5 h-5 shrink-0" style={{ color: ACCENT }} />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide" style={{ color: TEXT }}>Code d'entrée</p>
                    <p className="font-mono font-black text-xl tracking-widest" style={{ color: ACCENT }}>{g("door_code")}</p>
                  </div>
                </div>
              )}
              {g("parking") && (
                <div className="flex items-start gap-3 mb-2">
                  <Car className="w-4 h-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{g("parking")}</p>
                </div>
              )}
              {g("other") && <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("other")}</p>}
            </div>
          )}
        </div>
      );
    }

    // ── CHECK-IN ─────────────────────────────────────────────────────────────
    if (activeModule.type === "checkin") {
      return (
        <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#fff", fontFamily: SANS }}>
          <ModuleHeader>
            <ScriptTitle small="Les Horaires" big="ARRIVÉE & DÉPART" />
          </ModuleHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Arrivée */}
            {(g("checkin_time") || g("checkin_process")) && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3 relative">
                  {photos[0] && (
                    <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-md">
                      <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 flex items-center justify-between rounded-2xl px-4 py-3" style={{ backgroundColor: BEIGE }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: ACCENT }}>
                        <Check className="w-3 h-3" style={{ color: ACCENT }} />
                      </div>
                      <p className="font-black text-sm uppercase tracking-wide" style={{ color: TEXT }}>VOTRE ARRIVÉE</p>
                    </div>
                    {g("checkin_time") && (
                      <div className="text-right pl-3 border-l" style={{ borderColor: BEIGE_DARK }}>
                        <p className="text-xs uppercase tracking-wide" style={{ color: MUTED }}>À partir de</p>
                        <p className="font-black text-2xl leading-none" style={{ color: TEXT }}>{g("checkin_time")}</p>
                      </div>
                    )}
                  </div>
                </div>
                {g("checkin_process") && (
                  <p className="text-sm leading-relaxed whitespace-pre-line pl-2" style={{ color: MUTED }}>{g("checkin_process")}</p>
                )}
              </div>
            )}
            {/* Départ */}
            {(g("checkout_time") || g("checkout_process")) && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center justify-between rounded-2xl px-4 py-3" style={{ backgroundColor: BEIGE }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: ACCENT }}>
                        <Check className="w-3 h-3" style={{ color: ACCENT }} />
                      </div>
                      <p className="font-black text-sm uppercase tracking-wide" style={{ color: TEXT }}>VOTRE DÉPART</p>
                    </div>
                    {g("checkout_time") && (
                      <div className="text-right pl-3 border-l" style={{ borderColor: BEIGE_DARK }}>
                        <p className="text-xs uppercase tracking-wide" style={{ color: MUTED }}>Au plus tard</p>
                        <p className="font-black text-2xl leading-none" style={{ color: TEXT }}>{g("checkout_time")}</p>
                      </div>
                    )}
                  </div>
                  {photos[1] && (
                    <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-md">
                      <img src={photos[1]} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                {g("checkout_process") && (
                  <div className="pl-2">
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("checkout_process")}</p>
                  </div>
                )}
              </div>
            )}
            {docs.length > 0 && docs.map((doc, i) => (
              <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border mb-2"
                style={{ borderColor: BEIGE_DARK }}>
                <FileText className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                <span className="text-sm font-semibold flex-1 truncate" style={{ color: TEXT }}>{doc.name}</span>
                <Download className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
              </a>
            ))}
          </div>
        </div>
      );
    }

    // ── RULES ────────────────────────────────────────────────────────────────
    if (activeModule.type === "rules") {
      return (
        <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#fff", fontFamily: SANS }}>
          <ModuleHeader>
            <ScriptTitle small="Bon" big="À SAVOIR" />
          </ModuleHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {g("rules") && g("rules").split("\n").filter(Boolean).map((line, i) => (
              <div key={i} className="flex items-start gap-4 py-4 border-b" style={{ borderColor: BEIGE_DARK }}>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5" style={{ borderColor: ACCENT }}>
                  <Check className="w-3 h-3" style={{ color: ACCENT }} />
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: MUTED }}>{line}</p>
              </div>
            ))}
            {!g("rules") && <p className="text-sm" style={{ color: MUTED }}>Aucun règlement renseigné.</p>}
          </div>
        </div>
      );
    }

    // ── GUIDE ────────────────────────────────────────────────────────────────
    if (activeModule.type === "guide") {
      const serviceItems = [
        { icon: "🌡️", label: "CHAUFFAGE", value: g("heating") },
        { icon: "🍳", label: "ÉLECTROMÉNAGER", value: g("appliances") },
        { icon: "♻️", label: "TRI DES DÉCHETS", value: g("trash") },
        { icon: "ℹ️", label: "AUTRES INFOS", value: g("other") },
      ].filter((s) => s.value);

      return (
        <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#fff", fontFamily: SANS }}>
          <ModuleHeader>
            <ScriptTitle small="Bon" big="À SAVOIR" />
          </ModuleHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {serviceItems.map((s, i) => (
              <div key={i} className="flex items-start gap-4 py-4 border-b" style={{ borderColor: BEIGE_DARK }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: BEIGE, border: `1.5px solid ${BEIGE_DARK}` }}>
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: ACCENT }}>
                      <Check className="w-2.5 h-2.5" style={{ color: ACCENT }} />
                    </div>
                    <p className="font-black text-xs uppercase tracking-wide" style={{ color: TEXT }}>{s.label}</p>
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── CONTACTS ─────────────────────────────────────────────────────────────
    if (activeModule.type === "contacts") {
      return (
        <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#fff", fontFamily: SANS }}>
          <div className="shrink-0 relative overflow-hidden" style={{ height: 180 }}>
            {(photos[0] || bgUrl) && (
              <div className="absolute inset-0" style={{ backgroundImage: `url(${photos[0] || bgUrl})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.7)" }} />
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, #fff 100%)" }} />
            {photos[1] && (
              <div className="absolute bottom-0 left-6 translate-y-1/2 w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img src={photos[1]} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <button onClick={() => setScreen("home")} className="absolute top-10 left-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.85)", color: TEXT }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Retour
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6" style={{ paddingTop: photos[1] ? 52 : 16 }}>
            <ScriptTitle small="Présentation" big="VOS HÔTES" />

            {g("owner_name") && (
              <p className="font-bold text-sm mb-1" style={{ color: TEXT }}>{g("owner_name")}</p>
            )}
            {g("owner_phone") && (
              <div className="flex items-center gap-4 p-4 rounded-2xl mt-3 mb-4" style={{ backgroundColor: BEIGE, border: `1.5px solid ${BEIGE_DARK}` }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: ACCENT }}>
                    <Check className="w-3 h-3" style={{ color: ACCENT }} />
                  </div>
                  <p className="font-black text-xs uppercase tracking-wide" style={{ color: TEXT }}>NOUS CONTACTER</p>
                </div>
                <div className="border-l pl-4" style={{ borderColor: BEIGE_DARK }}>
                  <p className="text-xs" style={{ color: MUTED }}>Téléphone :</p>
                  <a href={`tel:${g("owner_phone")}`} className="text-xs font-bold" style={{ color: ACCENT }}>{g("owner_phone")}</a>
                  {g("owner_email") && <>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>Email :</p>
                    <p className="text-xs font-bold" style={{ color: ACCENT }}>{g("owner_email")}</p>
                  </>}
                </div>
              </div>
            )}
            {g("emergency") && (
              <div className="p-4 rounded-2xl mb-3" style={{ backgroundColor: "#fef2f2", border: "1.5px solid #fecaca" }}>
                <p className="text-xs font-black uppercase tracking-wide mb-1" style={{ color: "#dc2626" }}>🚨 Urgences</p>
                <p className="text-sm font-semibold whitespace-pre-line" style={{ color: "#dc2626" }}>{g("emergency")}</p>
              </div>
            )}
            {g("doctor") && (
              <div className="flex items-start gap-3 mb-2 py-3 border-b" style={{ borderColor: BEIGE_DARK }}>
                <Phone className="w-4 h-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                <div><p className="text-xs font-black uppercase tracking-wide mb-0.5" style={{ color: TEXT }}>Médecin</p>
                  <p className="text-sm" style={{ color: MUTED }}>{g("doctor")}</p></div>
              </div>
            )}
            {g("neighbors") && (
              <div className="flex items-start gap-3 py-3" style={{ color: MUTED }}>
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                <div><p className="text-xs font-black uppercase tracking-wide mb-0.5" style={{ color: TEXT }}>Voisins</p>
                  <p className="text-sm whitespace-pre-line">{g("neighbors")}</p></div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── ACTIVITIES ───────────────────────────────────────────────────────────
    if (activeModule.type === "activities") {
      const places = g("places") ? parsePlaces(g("places")) : [];
      return (
        <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#fff", fontFamily: SANS }}>
          {/* Header photo */}
          <div className="shrink-0 relative" style={{ height: 160 }}>
            {(photos[0] || bgUrl) ? (
              <div className="absolute inset-0" style={{ backgroundImage: `url(${photos[0] || bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            ) : (
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${BEIGE} 0%, ${BEIGE_DARK} 100%)` }} />
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, #fff 100%)" }} />
            {/* Cercle blanc avec titre */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-2">
              <p className="text-base" style={{ fontFamily: SCRIPT, color: MUTED }}>À faire, à voir...</p>
              <h1 className="font-black text-3xl uppercase leading-none" style={{ color: TEXT }}>VISITES</h1>
            </div>
            <button onClick={() => setScreen("home")} className="absolute top-10 left-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.85)", color: TEXT }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Retour
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8">
            {g("activities") && <p className="text-sm leading-relaxed mb-4 whitespace-pre-line" style={{ color: MUTED }}>{g("activities")}</p>}

            {/* Grille lieux avec photos rondes */}
            {places.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {places.map((p, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    {photos[i + 1] && (
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
                        <img src={photos[i + 1]} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="font-black text-xs uppercase tracking-wide" style={{ color: TEXT }}>{p.name}</p>
                      {p.address && <p className="text-xs" style={{ color: ACCENT }}>Distance : {p.address}</p>}
                      {p.address && (
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs underline" style={{ color: MUTED }}>Voir sur Maps</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── GOODDEALS ────────────────────────────────────────────────────────────
    if (activeModule.type === "gooddeals") {
      const places = g("places") ? parsePlaces(g("places")) : [];
      return (
        <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#fff", fontFamily: SANS }}>
          <ModuleHeader>
            <ScriptTitle small="Commodités" big="À PROXIMITÉ" />
          </ModuleHeader>
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            {g("restaurants") && (
              <div className="flex items-start gap-4 mb-4 p-4 rounded-2xl" style={{ backgroundColor: BEIGE }}>
                <div className="text-2xl shrink-0">🍽️</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: ACCENT }}>
                      <Check className="w-2.5 h-2.5" style={{ color: ACCENT }} />
                    </div>
                    <p className="font-black text-xs uppercase tracking-wide" style={{ color: TEXT }}>RESTAURANTS</p>
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("restaurants")}</p>
                </div>
              </div>
            )}
            {g("shops") && (
              <div className="flex items-start gap-4 mb-4 p-4 rounded-2xl" style={{ backgroundColor: BEIGE }}>
                <div className="text-2xl shrink-0">🛒</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: ACCENT }}>
                      <Check className="w-2.5 h-2.5" style={{ color: ACCENT }} />
                    </div>
                    <p className="font-black text-xs uppercase tracking-wide" style={{ color: TEXT }}>COMMERCES</p>
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("shops")}</p>
                </div>
              </div>
            )}
            {places.map((p, i) => (
              <div key={i} className="flex items-center gap-4 mb-3 p-4 rounded-2xl" style={{ backgroundColor: BEIGE }}>
                <div className="text-2xl shrink-0">📍</div>
                <div className="flex-1">
                  <p className="font-black text-xs uppercase tracking-wide" style={{ color: TEXT }}>{p.name}</p>
                  {p.address && <p className="text-xs" style={{ color: MUTED }}>{p.address}</p>}
                </div>
                {p.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: ACCENT, color: "#fff" }}>Maps</a>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── TRANSPORT ────────────────────────────────────────────────────────────
    if (activeModule.type === "transport") {
      const items = [
        { icon: <Car className="w-6 h-6" />, label: "EN VOITURE", value: g("by_car") },
        { icon: <Train className="w-6 h-6" />, label: "EN TRAIN", value: g("by_train") },
        { icon: <Plane className="w-6 h-6" />, label: "AÉROPORT", value: g("airport") },
        { icon: <span className="text-xl">🚕</span>, label: "TAXI / VTC", value: g("taxi") },
      ].filter((s) => s.value);

      return (
        <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#fff", fontFamily: SANS }}>
          <ModuleHeader>
            <ScriptTitle small="Commodités" big="À PROXIMITÉ" />
          </ModuleHeader>
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-4 mb-4 p-4 rounded-2xl" style={{ backgroundColor: BEIGE }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#fff", border: `1.5px solid ${BEIGE_DARK}` }}>
                  <span style={{ color: MUTED }}>{item.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: ACCENT }}>
                      <Check className="w-2.5 h-2.5" style={{ color: ACCENT }} />
                    </div>
                    <p className="font-black text-xs uppercase tracking-wide" style={{ color: TEXT }}>{item.label}</p>
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── UPSELLING ────────────────────────────────────────────────────────────
    if (activeModule.type === "upselling") {
      const items = (g("items") || "").split("\n").map((line: string) => {
        const [name, desc, price, link] = line.split("|").map((s: string) => s.trim());
        return name ? { name, desc, price, link } : null;
      }).filter(Boolean) as { name: string; desc: string; price: string; link: string }[];
      return (
        <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#fff", fontFamily: SANS }}>
          <ModuleHeader>
            <ScriptTitle small="Nos" big="SERVICES" />
          </ModuleHeader>
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            {g("intro") && <p className="text-sm leading-relaxed mb-4" style={{ color: MUTED }}>{g("intro")}</p>}
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-4 mb-4 p-4 rounded-2xl" style={{ backgroundColor: BEIGE }}>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg shrink-0 border" style={{ borderColor: BEIGE_DARK }}>
                  🛍️
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-black text-xs uppercase tracking-wide" style={{ color: TEXT }}>{item.name}</p>
                    {item.price && <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: ACCENT, color: "#fff" }}>{item.price}</span>}
                  </div>
                  {item.desc && <p className="text-xs mb-2" style={{ color: MUTED }}>{item.desc}</p>}
                  {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-bold underline" style={{ color: ACCENT }}>Réserver →</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── FAQ ──────────────────────────────────────────────────────────────────
    if (activeModule.type === "faq") {
      return (
        <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#fff", fontFamily: SANS }}>
          <ModuleHeader>
            <ScriptTitle small="Bon" big="À SAVOIR" />
          </ModuleHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {g("faq") && g("faq").split("\n").filter(Boolean).map((line, i) => (
              <div key={i} className="flex items-start gap-4 py-4 border-b" style={{ borderColor: BEIGE_DARK }}>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5" style={{ borderColor: ACCENT }}>
                  <Check className="w-3 h-3" style={{ color: ACCENT }} />
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: MUTED }}>{line}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── FALLBACK générique ────────────────────────────────────────────────────
    return (
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#fff", fontFamily: SANS }}>
        <ModuleHeader>
          <ScriptTitle small="" big={meta.label.toUpperCase()} />
        </ModuleHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {Object.entries(activeModule.content).map(([key, val]) => val ? (
            <div key={key} className="mb-4 pb-4 border-b" style={{ borderColor: BEIGE_DARK }}>
              <p className="text-xs font-black uppercase tracking-wide mb-1" style={{ color: ACCENT }}>{key}</p>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{val}</p>
            </div>
          ) : null)}
          {docs.map((doc, i) => (
            <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border mb-2"
              style={{ borderColor: BEIGE_DARK }}>
              <FileText className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
              <span className="text-sm font-semibold flex-1 truncate" style={{ color: TEXT }}>{doc.name}</span>
              <Download className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
            </a>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
