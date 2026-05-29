"use client";

import { useState, useEffect } from "react";
import { Booklet } from "@/types";
import { MODULE_META } from "@/lib/modules";
import { getContent, parsePlaces, getAvailableLangs } from "./viewerUtils";
import { CheckInForm } from "./CheckInForm";
import {
  ArrowLeft, Globe, MapPin, Wifi, Key, Car, Train, Plane,
  Phone, FileText, Download, Check, ClipboardCheck, ChevronRight,
} from "lucide-react";
import { getPalette, patternToCss } from "@/lib/palettes";

type Screen = "splash" | "home" | "module";

const gl = (opacity = 0.15, blur = 20): React.CSSProperties => ({
  backgroundColor: `rgba(255,255,255,${opacity})`,
  backdropFilter: `blur(${blur}px)`,
  WebkitBackdropFilter: `blur(${blur}px)`,
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 20,
});

export function ViewerApp({ booklet }: { booklet: Booklet }) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lang, setLang] = useState(booklet.defaultLanguage || "fr");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  const _p = { ...getPalette(booklet.paletteId ?? "ardoise"), ...booklet.customPalette };
  const ACCENT = _p.primary;
  const bgCss = patternToCss(_p);

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
  const bgUrl = sp.mediaUrl || booklet.coverImage;

  const get = (moduleId: string, key: string) => getContent(booklet, moduleId, key, lang);
  const openModule = (id: string) => { setActiveModuleId(id); setScreen("module"); };

  // ── FOND COMMUN (photo ou dégradé) ────────────────────────────────────────
  const Background = () => (
    <>
      {bgUrl ? (
        <div className="absolute inset-0"
          style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      ) : (
        <div className="absolute inset-0" style={{ background: bgCss }} />
      )}
      {/* Overlay sombre pour lisibilité */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 100%)" }} />
    </>
  );

  // ── LANG PICKER ────────────────────────────────────────────────────────────
  const LangBtn = () => availableLangs.length > 1 ? (
    <div className="relative">
      <button onClick={() => setShowLangMenu(!showLangMenu)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white"
        style={gl(0.2)}>
        <Globe className="w-3 h-3" /> {currentLang?.flag} {currentLang?.label}
      </button>
      {showLangMenu && (
        <div className="absolute top-9 right-0 z-50 rounded-2xl shadow-2xl py-1.5 overflow-hidden min-w-[140px]"
          style={{ backgroundColor: "rgba(15,20,30,0.95)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {availableLangs.map((l) => (
            <button key={l.code} onClick={() => { setLang(l.code); setShowLangMenu(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm"
              style={{ color: lang === l.code ? ACCENT : "rgba(255,255,255,0.65)", fontWeight: lang === l.code ? "700" : "400" }}>
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
      <div className="fixed inset-0 flex flex-col overflow-hidden">
        <Background />

        {/* Lang */}
        <div className="relative z-10 flex justify-end px-5 pt-12">
          <LangBtn />
        </div>

        {/* Contenu bas */}
        <div className="relative z-10 mt-auto px-6 pb-14">
          <h1 className="font-black text-white leading-none mb-4"
            style={{ fontSize: 46, letterSpacing: "-2px", textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
            {sp.customTitle || booklet.propertyName || booklet.title}
          </h1>

          {(sp.customSubtitle || booklet.description || booklet.address) && (
            <p className="text-sm leading-relaxed mb-8 font-medium"
              style={{ color: "rgba(255,255,255,0.75)", textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
              {sp.customSubtitle || booklet.description || booklet.address}
            </p>
          )}

          <button onClick={() => setScreen("home")}
            className="w-full py-4 rounded-full font-bold text-white text-base transition-all active:scale-95"
            style={{ backgroundColor: ACCENT, boxShadow: `0 8px 32px ${ACCENT}70`, fontSize: 16 }}>
            {sp.buttonText || "Ouvrir le livret"}
          </button>
        </div>
      </div>
    );
  }

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === "home") {
    return (
      <>
        {showCheckIn && <CheckInForm bookletId={booklet.id} accent={ACCENT} theme="glass" onClose={() => setShowCheckIn(false)} />}
        <div className="fixed inset-0 flex flex-col overflow-hidden">
          <Background />

          {/* Header */}
          <div className="relative z-10 px-5 pt-12 pb-4 shrink-0 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                Bienvenue 👋
              </p>
              <h1 className="font-black text-white text-xl leading-tight" style={{ letterSpacing: "-0.5px" }}>
                {booklet.propertyName || booklet.title}
              </h1>
            </div>
            <LangBtn />
          </div>

          {/* Grille modules */}
          <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-6">
            <div className="grid grid-cols-2 gap-3">
              {enabledModules.map((m) => {
                const meta = MODULE_META[m.type];
                const hasContent = Object.keys(m.content).some((k) => m.content[k]);
                return (
                  <button key={m.id} onClick={() => openModule(m.id)}
                    className="flex flex-col items-start p-4 text-left transition-all active:scale-95"
                    style={{ ...gl(hasContent ? 0.18 : 0.08), opacity: hasContent ? 1 : 0.5, minHeight: 110 }}>
                    {/* Emoji grand */}
                    <span className="text-3xl mb-3 leading-none">{meta.emoji}</span>
                    <p className="font-bold text-white text-sm leading-tight">{meta.label}</p>
                    <p className="text-xs mt-1 leading-tight" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {meta.description}
                    </p>
                    {hasContent && (
                      <div className="mt-auto pt-2">
                        <div className="w-4 h-1 rounded-full" style={{ backgroundColor: ACCENT }} />
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Check-in — pleine largeur */}
              <button onClick={() => setShowCheckIn(true)}
                className="col-span-2 flex items-center gap-4 p-4 transition-all active:scale-95"
                style={{ ...gl(0.22), borderColor: `${ACCENT}50` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: ACCENT }}>
                  <ClipboardCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-white text-sm">Check-in en ligne</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Enregistrez votre arrivée</p>
                </div>
                <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
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

    // Card glassmorphism générique
    const Card = ({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) => (
      <div className="mb-3 p-4" style={accent
        ? { ...gl(0.22), borderColor: `${ACCENT}50`, borderRadius: 20 }
        : gl(0.14)}>
        {children}
      </div>
    );

    const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${ACCENT}25` }}>
            <span style={{ color: ACCENT }}>{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: ACCENT }}>{label}</p>
            <p className="text-sm leading-relaxed text-white whitespace-pre-line">{value}</p>
          </div>
        </div>
      </Card>
    );

    const renderContent = () => {
      switch (activeModule.type) {

        case "welcome": return <>
          {g("title") && (
            <h2 className="font-black text-white text-2xl leading-tight mb-3" style={{ letterSpacing: "-0.5px" }}>
              {g("title")}
            </h2>
          )}
          {g("message") && (
            <Card>
              <p className="text-sm leading-relaxed text-white whitespace-pre-line" style={{ color: "rgba(255,255,255,0.85)" }}>
                {g("message")}
              </p>
            </Card>
          )}
        </>;

        case "practical": return <>
          {g("wifi_name") && (
            <Card accent>
              <div className="flex items-center gap-2 mb-4">
                <Wifi className="w-5 h-5" style={{ color: ACCENT }} />
                <p className="font-bold text-white text-base">WiFi</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                  <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Réseau</p>
                  <p className="font-bold text-white text-sm">{g("wifi_name")}</p>
                </div>
                {g("wifi_password") && (
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                    <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Mot de passe</p>
                    <p className="font-bold font-mono text-sm" style={{ color: ACCENT }}>{g("wifi_password")}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
          {g("door_code") && (
            <div className="mb-3 p-5 rounded-3xl text-center"
              style={{ background: `linear-gradient(135deg, ${ACCENT}40, ${ACCENT}20)`, border: `1.5px solid ${ACCENT}60` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>Code d'entrée</p>
              <p className="font-black text-white tracking-[0.4em]" style={{ fontSize: 48 }}>{g("door_code")}</p>
            </div>
          )}
          {g("parking") && <Row icon={<Car className="w-4 h-4" />} label="Parking" value={g("parking")} />}
          {g("other") && <Row icon="ℹ️" label="Infos pratiques" value={g("other")} />}
        </>;

        case "checkin": return <>
          {(g("checkin_time") || g("checkout_time")) && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              {g("checkin_time") && (
                <div className="p-4 rounded-3xl text-center"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}40, ${ACCENT}20)`, border: `1.5px solid ${ACCENT}50` }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: ACCENT }}>Arrivée</p>
                  <p className="text-4xl font-black text-white">{g("checkin_time")}</p>
                </div>
              )}
              {g("checkout_time") && (
                <div className="p-4 rounded-3xl text-center" style={gl(0.12)}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Départ</p>
                  <p className="text-4xl font-black text-white">{g("checkout_time")}</p>
                </div>
              )}
            </div>
          )}
          {g("checkin_process") && <Row icon={<Key className="w-4 h-4" />} label="Procédure d'arrivée" value={g("checkin_process")} />}
          {g("checkout_process") && <Row icon={<ChevronRight className="w-4 h-4" />} label="Procédure de départ" value={g("checkout_process")} />}
        </>;

        case "rules": return g("rules") ? (
          <Card>
            {g("rules").split("\n").filter(Boolean).map((line, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b last:border-0"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${ACCENT}30` }}>
                  <Check className="w-3 h-3" style={{ color: ACCENT }} />
                </div>
                <p className="text-sm leading-relaxed text-white">{line}</p>
              </div>
            ))}
          </Card>
        ) : null;

        case "guide": return <>
          {g("heating") && <Row icon="🌡️" label="Chauffage" value={g("heating")} />}
          {g("appliances") && <Row icon="🍳" label="Électroménager" value={g("appliances")} />}
          {g("trash") && <Row icon="♻️" label="Tri des déchets" value={g("trash")} />}
          {g("other") && <Row icon="🏠" label="Autres infos" value={g("other")} />}
        </>;

        case "contacts": return <>
          {g("owner_name") && (
            <Card accent>
              <p className="font-bold text-white text-base mb-3">{g("owner_name")}</p>
              {g("owner_phone") && (
                <a href={`tel:${g("owner_phone")}`}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white active:scale-95"
                  style={{ backgroundColor: ACCENT }}>
                  <Phone className="w-4 h-4" /> {g("owner_phone")}
                </a>
              )}
            </Card>
          )}
          {g("emergency") && (
            <div className="mb-3 p-4 rounded-2xl"
              style={{ backgroundColor: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)" }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#f87171" }}>🚨 Urgences</p>
              <p className="text-sm font-semibold whitespace-pre-line" style={{ color: "#fca5a5" }}>{g("emergency")}</p>
            </div>
          )}
          {g("doctor") && <Row icon={<Phone className="w-4 h-4" />} label="Médecin" value={g("doctor")} />}
          {g("neighbors") && <Row icon={<MapPin className="w-4 h-4" />} label="Voisins" value={g("neighbors")} />}
        </>;

        case "activities": return <>
          {g("activities") && (
            <Card>
              <p className="text-sm leading-relaxed text-white whitespace-pre-line">{g("activities")}</p>
            </Card>
          )}
          {g("places") && parsePlaces(g("places")).map((p, i) => (
            <div key={i} className="flex items-center gap-3 mb-3 p-4 rounded-2xl" style={gl(0.12)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${ACCENT}25` }}>
                <MapPin className="w-5 h-5" style={{ color: ACCENT }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{p.name}</p>
                {p.address && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{p.address}</p>}
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
          {g("restaurants") && <Row icon="🍽️" label="Restaurants" value={g("restaurants")} />}
          {g("shops") && <Row icon="🛒" label="Commerces" value={g("shops")} />}
          {g("others") && <Row icon="⭐" label="Bons plans" value={g("others")} />}
          {g("places") && parsePlaces(g("places")).map((p, i) => (
            <div key={i} className="flex items-center gap-3 mb-3 p-4 rounded-2xl" style={gl(0.12)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}25` }}>
                <MapPin className="w-5 h-5" style={{ color: ACCENT }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{p.name}</p>
                {p.address && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{p.address}</p>}
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
          {g("by_car") && <Row icon={<Car className="w-4 h-4" />} label="En voiture" value={g("by_car")} />}
          {g("by_train") && <Row icon={<Train className="w-4 h-4" />} label="En train" value={g("by_train")} />}
          {g("taxi") && <Row icon="🚕" label="Taxi / VTC" value={g("taxi")} />}
          {g("airport") && <Row icon={<Plane className="w-4 h-4" />} label="Aéroport" value={g("airport")} />}
        </>;

        case "faq": return g("faq") ? (
          <Card>
            {g("faq").split("\n").filter(Boolean).map((line, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b last:border-0"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${ACCENT}30` }}>
                  <Check className="w-3 h-3" style={{ color: ACCENT }} />
                </div>
                <p className="text-sm leading-relaxed text-white">{line}</p>
              </div>
            ))}
          </Card>
        ) : null;

        case "upselling": {
          const items = (g("items") || "").split("\n").map((line: string) => {
            const [name, desc, price, link] = line.split("|").map((s: string) => s.trim());
            return name ? { name, desc, price, link } : null;
          }).filter(Boolean) as { name: string; desc: string; price: string; link: string }[];
          return <>
            {g("intro") && (
              <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>{g("intro")}</p>
            )}
            {items.map((item, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-bold text-white">{item.name}</p>
                  {item.price && (
                    <span className="font-black text-xs px-3 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: ACCENT, color: "#fff" }}>{item.price}</span>
                  )}
                </div>
                {item.desc && <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>{item.desc}</p>}
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer"
                    className="block text-center py-3 rounded-2xl text-sm font-bold text-white"
                    style={{ backgroundColor: ACCENT }}>
                    Réserver →
                  </a>
                )}
              </Card>
            ))}
          </>;
        }

        default: return null;
      }
    };

    return (
      <div className="fixed inset-0 flex flex-col">
        <Background />

        {/* Header module */}
        <div className="relative z-10 shrink-0 px-5 pt-12 pb-4">
          <button onClick={() => setScreen("home")}
            className="flex items-center gap-2 text-sm font-semibold mb-5 transition-opacity hover:opacity-70"
            style={{ color: ACCENT }}>
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ ...gl(0.2), borderColor: `${ACCENT}40` }}>
              {meta.emoji}
            </div>
            <div>
              <h2 className="font-black text-white text-xl leading-tight">{meta.label}</h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{meta.description}</p>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8">
          {renderContent()}

          {docs.length > 0 && (
            <div className="mt-2 space-y-2">
              {docs.map((doc, i) => (
                <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 transition-all" style={gl(0.12)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${ACCENT}25` }}>
                    <FileText className="w-5 h-5" style={{ color: ACCENT }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{doc.name}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Appuyez pour ouvrir</p>
                  </div>
                  <Download className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                </a>
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <div className={`mt-3 grid gap-2 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {photos.map((url, i) => (
                <div key={i} className="aspect-video rounded-2xl overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs py-8" style={{ color: "rgba(255,255,255,0.15)" }}>Livret.</p>
        </div>
      </div>
    );
  }

  return null;
}
