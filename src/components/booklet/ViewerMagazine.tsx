"use client";

import { useState, useEffect } from "react";
import { Booklet } from "@/types";
import { MODULE_META } from "@/lib/modules";
import { getContent, parsePlaces, getAvailableLangs, formatTime } from "./viewerUtils";
import { CheckInFormInline } from "./CheckInForm";
import { ArrowLeft, Globe, MapPin, FileText, Download } from "lucide-react";
import { getPalette, patternToCss } from "@/lib/palettes";

type Screen = "splash" | "home" | "module";

export function ViewerMagazine({ booklet }: { booklet: Booklet }) {
  const _p = { ...getPalette(booklet.paletteId), ...booklet.customPalette };
  const BG = _p.secondary;
  const ACCENT = _p.primary;
  const TEXT = _p.text;
  const MUTED = _p.muted;
  const CARD = _p.surface;
  const BORDER = _p.border;
  const BG_CSS = patternToCss(_p as any);
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

  const enabledModules = [...booklet.modules].filter((m) => m.enabled).sort((a, b) => a.order - b.order);
  const availableLangs = getAvailableLangs(booklet);
  const currentLang = availableLangs.find((l) => l.code === lang);
  const activeModule = enabledModules.find((m) => m.id === activeModuleId);
  const sp = booklet.splashConfig ?? {};

  const get = (moduleId: string, key: string) => getContent(booklet, moduleId, key, lang);

  const allPlaces = enabledModules.flatMap((m) => {
    const raw = m.content["places"];
    if (!raw) return [];
    return parsePlaces(raw).map((p) => ({ ...p, category: MODULE_META[m.type].label }));
  });

  const openModule = (id: string) => { setActiveModuleId(id); setScreen("module"); };

  const bgUrl = sp.mediaUrl || booklet.coverImage;

  // ── SPLASH ──────────────────────────────────────────────────────────────────
  if (screen === "splash") {
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: BG_CSS, fontFamily: "'Georgia', serif" }}>
        {bgUrl && (
          <>
            <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${BG}30 0%, ${BG}b0 50%, ${BG}f8 100%)` }} />
          </>
        )}

        {availableLangs.length > 1 && (
          <div className="relative z-10 flex justify-end p-5">
            <button onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest border"
              style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: "transparent" }}>
              <Globe className="w-3.5 h-3.5" /> {currentLang?.flag}
            </button>
            {showLangMenu && (
              <div className="absolute top-14 right-5 z-20 shadow-2xl py-1 overflow-hidden border"
                style={{ backgroundColor: CARD, borderColor: BORDER, minWidth: 140 }}>
                {availableLangs.map((l) => (
                  <button key={l.code} onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm uppercase tracking-wide transition-colors hover:bg-white/5"
                    style={{ color: lang === l.code ? ACCENT : MUTED, fontWeight: lang === l.code ? "700" : "400" }}>
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="relative z-10 mt-auto p-8 pb-12">
          <div className="text-xs uppercase tracking-[0.3em] mb-6 font-bold" style={{ color: ACCENT }}>
            — Guide d'accueil
          </div>
          <h1 className="leading-none mb-4" style={{ fontSize: 48, fontWeight: 900, color: TEXT, letterSpacing: "-1px", textTransform: "uppercase", lineHeight: 1 }}>
            {(sp.customTitle || booklet.propertyName || booklet.title).split(" ").map((w, i) => (
              <span key={i} style={{ display: "block" }}>{w}</span>
            ))}
          </h1>
          {(sp.customSubtitle || booklet.description || booklet.address) && (
            <p className="text-sm leading-relaxed mb-8 border-l-2 pl-4" style={{ color: MUTED, borderColor: ACCENT }}>
              {sp.customSubtitle || booklet.description || booklet.address}
            </p>
          )}
          <button onClick={() => setScreen("home")}
            className="flex items-center gap-3 py-3.5 px-6 text-sm font-bold uppercase tracking-widest transition-all active:scale-95"
            style={{ backgroundColor: ACCENT, color: BG }}>
            {sp.buttonText || "Explorer"} →
          </button>
        </div>
      </div>
    );
  }

  // ── HOME ────────────────────────────────────────────────────────────────────
  if (screen === "home") {
    return (
      <>
        <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: BG_CSS }}>

          {/* Header avec photo */}
          <div className="shrink-0 relative" style={{ height: 200 }}>
            {bgUrl ? (
              <>
                <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 20%, ${BG} 100%)` }} />
              </>
            ) : (
              <div className="absolute inset-0" style={{ background: BG_CSS }} />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] font-bold mb-1" style={{ color: ACCENT }}>Guide</p>
                  <h1 className="font-black uppercase leading-none" style={{ fontSize: 26, color: TEXT, letterSpacing: "-0.5px" }}>
                    {booklet.propertyName || booklet.title}
                  </h1>
                </div>
                {availableLangs.length > 1 && (
                  <div className="relative">
                    <button onClick={() => setShowLangMenu(!showLangMenu)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold uppercase border"
                      style={{ borderColor: ACCENT, color: ACCENT }}>
                      <Globe className="w-3 h-3" /> {currentLang?.flag}
                    </button>
                    {showLangMenu && (
                      <div className="absolute top-9 right-0 z-20 border shadow-2xl" style={{ backgroundColor: CARD, borderColor: BORDER, minWidth: 130 }}>
                        {availableLangs.map((l) => (
                          <button key={l.code} onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wide"
                            style={{ color: lang === l.code ? ACCENT : MUTED }}>
                            <span>{l.flag}</span> {l.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Module list */}
          <div className="flex-1 overflow-y-auto">
            {enabledModules.map((m, i) => {
              const meta = MODULE_META[m.type];
              const hasContent = Object.keys(m.content).some((k) => m.content[k]);
              return (
                <button key={m.id} onClick={() => openModule(m.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all active:bg-white/5 border-b"
                  style={{ borderColor: BORDER }}>
                  <span className="text-2xl shrink-0 w-8 text-center">{meta.emoji}</span>
                  <div className="flex-1">
                    <p className="font-black uppercase text-sm tracking-wide" style={{ color: hasContent ? TEXT : MUTED }}>{meta.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>{meta.description}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: hasContent ? ACCENT : BORDER }} />
                </button>
              );
            })}

            {/* Actions */}
            <div className="p-5 space-y-2 border-t" style={{ borderColor: BORDER }}>
              {allPlaces.length > 0 && (
                <button onClick={() => openModule(enabledModules[0]?.id)}
                  className="w-full flex items-center gap-3 py-3.5 px-4 border transition-all"
                  style={{ borderColor: ACCENT, backgroundColor: "transparent" }}>
                  <MapPin className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                  <div className="text-left">
                    <p className="text-sm font-bold uppercase tracking-wide" style={{ color: ACCENT }}>Autour de moi</p>
                    <p className="text-xs" style={{ color: MUTED }}>{allPlaces.length} lieux</p>
                  </div>
                </button>
              )}
            </div>

            <p className="text-center text-xs py-6 uppercase tracking-widest" style={{ color: BORDER }}>
              Livret.
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

    const row = (label: string, value: string) => (
      <div className="flex justify-between items-start py-3 border-b" style={{ borderColor: BORDER }}>
        <span className="text-xs uppercase tracking-wide font-bold shrink-0 mr-4" style={{ color: MUTED }}>{label}</span>
        <span className="text-sm text-right font-medium" style={{ color: TEXT }}>{value}</span>
      </div>
    );

    const section = (title: string, children: React.ReactNode) => (
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] font-bold mb-3 pb-2 border-b" style={{ color: ACCENT, borderColor: ACCENT + "40" }}>{title}</p>
        {children}
      </div>
    );

    const g = (key: string) => get(activeModule.id, key);

    const renderContent = () => {
      switch (activeModule.type) {
        case "welcome": return <>
          {g("title") && <h2 className="font-black uppercase text-2xl leading-none mb-4" style={{ color: TEXT, letterSpacing: "-0.5px" }}>{g("title")}</h2>}
          {g("message") && <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("message")}</p>}
        </>;
        case "practical": return <>
          {g("wifi_name") && section("Connexion WiFi", <>
            {row("Réseau", g("wifi_name"))}
            {g("wifi_password") && row("Mot de passe", g("wifi_password"))}
          </>)}
          {g("door_code") && section("Accès", <div className="py-4 text-center" style={{ backgroundColor: CARD }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: MUTED }}>Code d'entrée</p>
            <p className="font-black tracking-[0.5em] text-4xl" style={{ color: ACCENT }}>{g("door_code")}</p>
          </div>)}
          {g("parking") && section("Parking", <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{g("parking")}</p>)}
          {g("other") && section("Autres infos", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("other")}</p>)}
        </>;
        case "checkin": return <>
          {(g("checkin_time") || g("checkout_time")) && section("Horaires", <div className="grid grid-cols-2 gap-3">
            {g("checkin_time") && <div className="p-4" style={{ backgroundColor: CARD, border: `1px solid ${ACCENT}40` }}>
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: ACCENT }}>Arrivée</p>
              <p className="font-black text-2xl" style={{ color: TEXT }}>{formatTime(g("checkin_time"))}</p>
            </div>}
            {g("checkout_time") && <div className="p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: MUTED }}>Départ</p>
              <p className="font-black text-2xl" style={{ color: TEXT }}>{formatTime(g("checkout_time"))}</p>
            </div>}
          </div>)}
          {g("checkin_process") && section("Procédure d'arrivée", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("checkin_process")}</p>)}
          {g("checkout_process") && section("Procédure de départ", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("checkout_process")}</p>)}
          <CheckInFormInline bookletId={booklet.id} accent={ACCENT} theme="dark" />
        </>;
        case "rules": return g("rules") ? section("Règlement", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("rules")}</p>) : null;
        case "guide": return <>
          {g("heating") && section("Chauffage", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("heating")}</p>)}
          {g("appliances") && section("Électroménager", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("appliances")}</p>)}
          {g("trash") && section("Tri des déchets", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("trash")}</p>)}
          {g("other") && section("Autres", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("other")}</p>)}
        </>;
        case "contacts": return <>
          {g("owner_name") && section(g("owner_name"), g("owner_phone") && <a href={`tel:${g("owner_phone")}`} className="flex items-center gap-2 text-sm font-bold py-3 px-4 mt-1" style={{ backgroundColor: ACCENT, color: BG, display: "inline-flex" }}>📞 {g("owner_phone")}</a>)}
          {g("emergency") && section("Urgences", <p className="text-sm font-semibold leading-relaxed whitespace-pre-line" style={{ color: "#ff6b6b" }}>{g("emergency")}</p>)}
          {g("doctor") && section("Médecin", <p className="text-sm" style={{ color: MUTED }}>{g("doctor")}</p>)}
          {g("neighbors") && section("Voisins", <p className="text-sm whitespace-pre-line" style={{ color: MUTED }}>{g("neighbors")}</p>)}
        </>;
        case "activities": return <>
          {g("activities") && section("Activités", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("activities")}</p>)}
          {g("places") && section("Lieux", parsePlaces(g("places")).map((p, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b" style={{ borderColor: BORDER }}>
              <div><p className="text-sm font-bold uppercase" style={{ color: TEXT }}>{p.name}</p>{p.address && <p className="text-xs" style={{ color: MUTED }}>{p.address}</p>}</div>
              {p.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-3 py-1.5 ml-2 shrink-0" style={{ backgroundColor: ACCENT, color: BG }}>→</a>}
            </div>
          )))}
        </>;
        case "gooddeals": return <>
          {g("restaurants") && section("Restaurants", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("restaurants")}</p>)}
          {g("shops") && section("Commerces", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("shops")}</p>)}
          {g("others") && section("Bons plans", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("others")}</p>)}
          {g("places") && section("Adresses", parsePlaces(g("places")).map((p, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b" style={{ borderColor: BORDER }}>
              <div><p className="text-sm font-bold uppercase" style={{ color: TEXT }}>{p.name}</p>{p.address && <p className="text-xs" style={{ color: MUTED }}>{p.address}</p>}</div>
              {p.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-3 py-1.5 ml-2 shrink-0" style={{ backgroundColor: ACCENT, color: BG }}>→</a>}
            </div>
          )))}
        </>;
        case "transport": return <>
          {g("by_car") && section("En voiture", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("by_car")}</p>)}
          {g("by_train") && section("En train", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("by_train")}</p>)}
          {g("taxi") && section("Taxi / VTC", <p className="text-sm" style={{ color: MUTED }}>{g("taxi")}</p>)}
          {g("airport") && section("Aéroport", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("airport")}</p>)}
        </>;
        case "faq": return g("faq") ? section("FAQ", <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: MUTED }}>{g("faq")}</p>) : null;
        case "upselling": {
          const items = (g("items") || "").split("\n").map((line: string) => {
            const [name, desc, price, link] = line.split("|").map((s: string) => s.trim());
            return name ? { name, desc, price, link } : null;
          }).filter(Boolean) as { name: string; desc: string; price: string; link: string }[];
          return <>
            {g("intro") && <p className="text-sm leading-relaxed mb-6" style={{ color: MUTED }}>{g("intro")}</p>}
            {items.map((item, i) => (
              <div key={i} className="mb-4 p-4 border" style={{ borderColor: BORDER, backgroundColor: CARD }}>
                <div className="flex justify-between items-start mb-2">
                  <p className="font-black uppercase text-base" style={{ color: TEXT }}>{item.name}</p>
                  {item.price && <span className="text-sm font-black ml-2 shrink-0" style={{ color: ACCENT }}>{item.price}</span>}
                </div>
                {item.desc && <p className="text-xs mb-3" style={{ color: MUTED }}>{item.desc}</p>}
                {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest px-4 py-2 inline-block" style={{ backgroundColor: ACCENT, color: BG }}>Réserver →</a>}
              </div>
            ))}
          </>;
        }
        default: return null;
      }
    };

    return (
      <div className="fixed inset-0 flex flex-col" style={{ background: BG_CSS }}>
        {/* Hero header */}
        <div className="shrink-0 relative" style={{ height: 140 }}>
          {bgUrl ? (
            <>
              <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center", filter: "grayscale(30%) brightness(40%)" }} />
            </>
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: CARD }} />
          )}
          <div className="absolute inset-0 p-5 flex flex-col justify-between">
            <button onClick={() => setScreen("home")} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest w-fit" style={{ color: ACCENT }}>
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-end gap-4">
              <span className="text-5xl leading-none">{meta.emoji}</span>
              <h2 className="font-black uppercase leading-none" style={{ fontSize: 24, color: TEXT, letterSpacing: "-0.5px" }}>{meta.label}</h2>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {renderContent()}

          {docs.length > 0 && (
            <div className="mt-4 space-y-2">
              {docs.map((doc, i) => (
                <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border" style={{ borderColor: BORDER, backgroundColor: CARD }}>
                  <FileText className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                  <span className="text-sm font-bold uppercase flex-1 truncate" style={{ color: TEXT }}>{doc.name}</span>
                  <Download className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
                </a>
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <div className={`mt-4 grid gap-1 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {photos.map((url, i) => (
                <div key={i} className="aspect-video overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" style={{ filter: "grayscale(20%)" }} />
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs py-8 uppercase tracking-[0.3em]" style={{ color: BORDER }}>
            Livret.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
