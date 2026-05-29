"use client";

import { useState, useEffect } from "react";
import { Booklet } from "@/types";
import { MODULE_META } from "@/lib/modules";
import { getContent, parsePlaces, getAvailableLangs, formatTime } from "./viewerUtils";
import { CheckInFormInline } from "./CheckInForm";
import { ArrowLeft, Globe, MapPin, FileText, Download, ChevronRight } from "lucide-react";
import { getPalette, patternToCss, BookletPalette } from "@/lib/palettes";

type Screen = "splash" | "home" | "module";

const SERIF = "Georgia, 'Times New Roman', serif";

function usePalette(booklet: Booklet): BookletPalette {
  const base = getPalette(booklet.paletteId);
  if (!booklet.customPalette) return base;
  return { ...base, ...booklet.customPalette };
}

export function ViewerNature({ booklet }: { booklet: Booklet }) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lang, setLang] = useState(booklet.defaultLanguage || "fr");
  const [showLangMenu, setShowLangMenu] = useState(false);

  const p = usePalette(booklet);
  const ACCENT = p.primary;
  const BG = patternToCss(p);
  const SURFACE = p.surface;
  const SURFACE_ALT = p.secondary;
  const BORDER = p.border;
  const TEXT = p.text;
  const MUTED = p.muted;

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

  const get = (moduleId: string, key: string) => getContent(booklet, moduleId, key, lang);

  const allPlaces = enabledModules.flatMap((m) => {
    const raw = m.content["places"];
    if (!raw) return [];
    return parsePlaces(raw).map((pp) => ({ ...pp, category: MODULE_META[m.type].label }));
  });

  const openModule = (id: string) => { setActiveModuleId(id); setScreen("module"); };

  const LangMenu = () => (
    showLangMenu ? (
      <div className="absolute top-10 right-0 z-20 rounded-2xl shadow-xl py-1.5 min-w-[140px] overflow-hidden border"
        style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
        {availableLangs.map((l) => (
          <button key={l.code} onClick={() => { setLang(l.code); setShowLangMenu(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70"
            style={{ color: lang === l.code ? ACCENT : MUTED, fontWeight: lang === l.code ? "600" : "400" }}>
            <span>{l.flag}</span> {l.label}
          </button>
        ))}
      </div>
    ) : null
  );

  // ── SPLASH ──────────────────────────────────────────────────────────────────
  if (screen === "splash") {
    const bgUrl = sp.mediaUrl || booklet.coverImage;
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: BG, fontFamily: SERIF }}>
        {bgUrl && (
          <>
            <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${p.secondary}50 0%, ${p.secondary}dd 60%, ${p.secondary}ff 100%)` }} />
          </>
        )}

        {availableLangs.length > 1 && (
          <div className="relative z-10 flex justify-end p-5">
            <button onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
              style={{ backgroundColor: `${SURFACE}e0`, borderColor: BORDER, color: ACCENT, backdropFilter: "blur(8px)" }}>
              <Globe className="w-3.5 h-3.5" /> {currentLang?.flag} {currentLang?.label}
            </button>
            <div className="relative"><LangMenu /></div>
          </div>
        )}

        <div className="relative z-10 mt-auto p-8 pb-14">
          <div className="flex gap-2 mb-4 text-xl">🌿 <span style={{ color: ACCENT, fontSize: 12, fontStyle: "italic", alignSelf: "flex-end", marginBottom: 2 }}>Livret d'accueil</span></div>
          <h1 className="leading-tight mb-3" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 700, color: TEXT, letterSpacing: "-0.5px" }}>
            {sp.customTitle || booklet.propertyName || booklet.title}
          </h1>
          {(sp.customSubtitle || booklet.description || booklet.address) && (
            <p className="text-sm leading-relaxed mb-8" style={{ fontStyle: "italic", color: MUTED }}>
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
        <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: BG, fontFamily: SERIF }}>

          <div className="shrink-0 px-6 pt-12 pb-8" style={{ backgroundColor: SURFACE_ALT, borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs uppercase tracking-widest mb-2" style={{ color: ACCENT, fontFamily: "system-ui, sans-serif" }}>🌿 Bienvenue</div>
                <h1 className="leading-tight" style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: TEXT }}>
                  {booklet.propertyName || booklet.title}
                </h1>
                {booklet.address && (
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ fontStyle: "italic", color: MUTED }}>
                    <MapPin className="w-3 h-3" /> {booklet.address}
                  </p>
                )}
              </div>
              {availableLangs.length > 1 && (
                <div className="relative ml-3">
                  <button onClick={() => setShowLangMenu(!showLangMenu)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border"
                    style={{ borderColor: BORDER, color: ACCENT, backgroundColor: SURFACE }}>
                    <Globe className="w-3.5 h-3.5" /> {currentLang?.flag}
                  </button>
                  <LangMenu />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-6 pt-6 pb-2">
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: MUTED, fontFamily: "system-ui, sans-serif" }}>Sommaire</p>
            </div>

            {enabledModules.map((m, i) => {
              const meta = MODULE_META[m.type];
              const hasContent = Object.keys(m.content).some((k) => m.content[k]);
              return (
                <div key={m.id}>
                  <button onClick={() => openModule(m.id)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left transition-all active:opacity-70 group">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ backgroundColor: hasContent ? ACCENT : "transparent", border: `2px solid ${ACCENT}`, color: hasContent ? "#fff" : ACCENT }}>
                      {i + 1}
                    </div>
                    <span className="text-2xl shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold leading-tight" style={{ fontFamily: SERIF, color: TEXT, fontSize: 15 }}>{meta.label}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ fontStyle: "italic", color: MUTED }}>{meta.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: BORDER }} />
                  </button>
                  <div className="mx-6" style={{ borderBottom: `1px dashed ${BORDER}` }} />
                </div>
              );
            })}

            <div className="px-6 pt-4 pb-2 space-y-3">
              {allPlaces.length > 0 && (
                <button onClick={() => openModule(enabledModules[0]?.id)}
                  className="w-full flex items-center gap-4 py-4 px-5 rounded-2xl border transition-all active:scale-95"
                  style={{ backgroundColor: SURFACE_ALT, borderColor: BORDER }}>
                  <MapPin className="w-5 h-5 shrink-0" style={{ color: ACCENT }} />
                  <div className="text-left">
                    <p className="font-bold text-sm" style={{ fontFamily: SERIF, color: TEXT }}>Autour de moi</p>
                    <p className="text-xs" style={{ fontStyle: "italic", color: MUTED }}>{allPlaces.length} lieux recommandés</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" style={{ color: BORDER }} />
                </button>
              )}
            </div>

            <p className="text-center text-xs py-8" style={{ fontStyle: "italic", color: MUTED }}>
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

    const card = (emoji: string, label: string, children: React.ReactNode, danger = false) => (
      <div className="mb-3 rounded-2xl overflow-hidden"
        style={{ backgroundColor: danger ? "#fef2f2" : SURFACE, borderLeft: `3px solid ${danger ? "#ef4444" : ACCENT}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="px-5 pt-4 pb-1 flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: danger ? "#ef4444" : ACCENT, fontFamily: "system-ui" }}>{label}</p>
        </div>
        <div className="px-5 pb-4">{children}</div>
      </div>
    );

    const g = (key: string) => get(activeModule.id, key);

    const renderContent = () => {
      switch (activeModule.type) {
        case "welcome": return <>
          {g("title") && <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: SERIF, color: TEXT }}>{g("title")}</h2>}
          {g("message") && <p className="text-sm leading-relaxed mb-4 whitespace-pre-line" style={{ color: MUTED }}>{g("message")}</p>}
        </>;
        case "practical": return <>
          {g("wifi_name") && card("📶", "WiFi", <>
            <p className="font-bold text-lg" style={{ fontFamily: "monospace", color: TEXT }}>{g("wifi_name")}</p>
            {g("wifi_password") && <p className="text-sm mt-1" style={{ color: MUTED }}>Mot de passe : <span className="font-mono font-bold" style={{ color: ACCENT }}>{g("wifi_password")}</span></p>}
          </>)}
          {g("door_code") && card("🔑", "Code d'entrée", <p className="font-mono font-black text-3xl tracking-widest" style={{ color: ACCENT }}>{g("door_code")}</p>)}
          {g("parking") && card("🅿️", "Parking", <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{g("parking")}</p>)}
          {g("other") && card("ℹ️", "Infos", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("other")}</p>)}
        </>;
        case "checkin": return <>
          {(g("checkin_time") || g("checkout_time")) && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              {g("checkin_time") && <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: ACCENT, fontFamily: "system-ui" }}>Arrivée</p>
                <p className="font-bold text-xl" style={{ fontFamily: SERIF, color: TEXT }}>{formatTime(g("checkin_time"))}</p>
              </div>}
              {g("checkout_time") && <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: SURFACE_ALT, border: `1px solid ${BORDER}` }}>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: MUTED, fontFamily: "system-ui" }}>Départ</p>
                <p className="font-bold text-xl" style={{ fontFamily: SERIF, color: TEXT }}>{formatTime(g("checkout_time"))}</p>
              </div>}
            </div>
          )}
          {g("checkin_process") && card("🗝️", "Procédure d'arrivée", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("checkin_process")}</p>)}
          {g("checkout_process") && card("👋", "Procédure de départ", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("checkout_process")}</p>)}
          <CheckInFormInline bookletId={booklet.id} accent={ACCENT} theme="light" />
        </>;
        case "rules": return g("rules") ? <div className="rounded-2xl p-5" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("rules")}</p>
        </div> : null;
        case "guide": return <>
          {g("heating") && card("🌡️", "Chauffage", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("heating")}</p>)}
          {g("appliances") && card("🍳", "Électroménager", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("appliances")}</p>)}
          {g("trash") && card("♻️", "Tri des déchets", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("trash")}</p>)}
          {g("other") && card("🏠", "Autres infos", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("other")}</p>)}
        </>;
        case "contacts": return <>
          {g("owner_name") && card("👤", g("owner_name"), g("owner_phone") && <a href={`tel:${g("owner_phone")}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mt-1" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>📞 {g("owner_phone")}</a>)}
          {g("emergency") && card("🚨", "Urgences", <p className="text-sm leading-relaxed whitespace-pre-line font-semibold" style={{ color: "#dc2626" }}>{g("emergency")}</p>, true)}
          {g("doctor") && card("⚕️", "Médecin", <p className="text-sm" style={{ color: MUTED }}>{g("doctor")}</p>)}
          {g("neighbors") && card("🏘️", "Voisins", <p className="text-sm whitespace-pre-line" style={{ color: MUTED }}>{g("neighbors")}</p>)}
        </>;
        case "activities": return <>
          {g("activities") && <div className="rounded-2xl p-5 mb-3" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("activities")}</p>
          </div>}
          {g("places") && parsePlaces(g("places")).map((pp, i) => (
            <div key={i} className="flex items-center justify-between mb-2 p-3 rounded-xl" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
              <div><p className="text-sm font-semibold" style={{ fontFamily: SERIF, color: TEXT }}>{pp.name}</p>{pp.address && <p className="text-xs" style={{ color: MUTED, fontStyle: "italic" }}>{pp.address}</p>}</div>
              {pp.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pp.address)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-3 py-1.5 rounded-full ml-2" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>Maps</a>}
            </div>
          ))}
        </>;
        case "gooddeals": return <>
          {g("restaurants") && card("🍽️", "Restaurants", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("restaurants")}</p>)}
          {g("shops") && card("🛒", "Commerces", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("shops")}</p>)}
          {g("others") && card("⭐", "Bons plans", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("others")}</p>)}
          {g("places") && parsePlaces(g("places")).map((pp, i) => (
            <div key={i} className="flex items-center justify-between mb-2 p-3 rounded-xl" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
              <div><p className="text-sm font-semibold" style={{ fontFamily: SERIF, color: TEXT }}>{pp.name}</p>{pp.address && <p className="text-xs" style={{ color: MUTED, fontStyle: "italic" }}>{pp.address}</p>}</div>
              {pp.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pp.address)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-3 py-1.5 rounded-full ml-2" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>Maps</a>}
            </div>
          ))}
        </>;
        case "transport": return <>
          {g("by_car") && card("🚗", "En voiture", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("by_car")}</p>)}
          {g("by_train") && card("🚆", "En train", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("by_train")}</p>)}
          {g("taxi") && card("🚕", "Taxi / VTC", <p className="text-sm" style={{ color: MUTED }}>{g("taxi")}</p>)}
          {g("airport") && card("✈️", "Aéroport", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("airport")}</p>)}
        </>;
        case "faq": return g("faq") ? <div className="rounded-2xl p-5" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("faq")}</p>
        </div> : null;
        case "upselling": {
          const items = (g("items") || "").split("\n").map((line: string) => {
            const [name, desc, price, link] = line.split("|").map((s: string) => s.trim());
            return name ? { name, desc, price, link } : null;
          }).filter(Boolean) as { name: string; desc: string; price: string; link: string }[];
          return <>
            {g("intro") && <p className="text-sm leading-relaxed mb-4" style={{ fontStyle: "italic", color: MUTED }}>{g("intro")}</p>}
            {items.map((item, i) => (
              <div key={i} className="mb-3 rounded-2xl overflow-hidden" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <p className="font-bold" style={{ fontFamily: SERIF, color: TEXT }}>{item.name}</p>
                    {item.price && <span className="text-sm font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>{item.price}</span>}
                  </div>
                  {item.desc && <p className="text-xs mb-3" style={{ fontStyle: "italic", color: MUTED }}>{item.desc}</p>}
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
      <div className="fixed inset-0 flex flex-col" style={{ background: BG, fontFamily: SERIF }}>
        <div className="shrink-0 px-5 pt-10 pb-5 border-b" style={{ backgroundColor: SURFACE_ALT, borderColor: BORDER }}>
          <button onClick={() => setScreen("home")} className="flex items-center gap-2 text-sm mb-4 hover:opacity-70" style={{ color: ACCENT, fontFamily: "system-ui" }}>
            <ArrowLeft className="w-4 h-4" /> Retour au sommaire
          </button>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{meta.emoji}</span>
            <div>
              <h2 className="font-bold leading-tight" style={{ fontFamily: SERIF, fontSize: 22, color: TEXT }}>{meta.label}</h2>
              <p className="text-xs mt-0.5" style={{ fontStyle: "italic", color: MUTED }}>{meta.description}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {renderContent()}
          {docs.length > 0 && (
            <div className="mt-4 space-y-2">
              {docs.map((doc, i) => (
                <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
                    <FileText className="w-4 h-4" style={{ color: ACCENT }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ fontFamily: SERIF, color: TEXT }}>{doc.name}</p>
                    <p className="text-xs" style={{ fontStyle: "italic", color: MUTED }}>PDF · Appuyez pour ouvrir</p>
                  </div>
                  <Download className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                </a>
              ))}
            </div>
          )}
          {photos.length > 0 && (
            <div className={`mt-4 grid gap-2 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {photos.map((url, i) => (
                <div key={i} className="aspect-video rounded-2xl overflow-hidden border" style={{ borderColor: BORDER }}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
          <p className="text-center text-xs py-8" style={{ fontStyle: "italic", color: MUTED }}>
            🌿 Créé avec <span style={{ color: ACCENT }}>Livret.</span>
          </p>
        </div>
      </div>
    );
  }

  return null;
}
