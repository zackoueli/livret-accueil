"use client";

import { useState, useEffect } from "react";
import { Booklet } from "@/types";
import { MODULE_META } from "@/lib/modules";
import { getContent, parsePlaces, getAvailableLangs } from "./viewerUtils";
import { CheckInForm } from "./CheckInForm";
import {
  Home, Info, Key, MapPin, Wrench, Globe,
  ChevronRight, Wifi, Phone, AlertTriangle,
  Copy, Check, ArrowLeft, FileText, Download,
  ClipboardCheck, Thermometer, UtensilsCrossed,
  Recycle, HelpCircle, Flame,
} from "lucide-react";
import { getPalette } from "@/lib/palettes";

const FONT = "-apple-system, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif";

type TabId = "home" | "practical" | "checkin" | "neighborhood" | "equipment";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "home",         label: "Accueil",   icon: Home },
  { id: "practical",    label: "Pratique",  icon: Info },
  { id: "checkin",      label: "Arrivée",   icon: Key },
  { id: "neighborhood", label: "Quartier",  icon: MapPin },
  { id: "equipment",    label: "Équipements", icon: Wrench },
];

// ── Couleurs iOS système ───────────────────────────────────────────────────
const C = {
  bg:        "#f2f2f7",
  card:      "#ffffff",
  label:     "#000000",
  label2:    "rgba(60,60,67,0.6)",
  label3:    "rgba(60,60,67,0.3)",
  sep:       "rgba(60,60,67,0.18)",
  tabBg:     "rgba(250,250,250,0.95)",
  danger:    "#ff3b30",
  warn:      "#ff9500",
};

// ── Helpers UI ─────────────────────────────────────────────────────────────

const Card = ({ children, className = "", style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) => (
  <div className={`bg-white rounded-2xl overflow-hidden ${className}`}
    style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.06)", ...style }}>
    {children}
  </div>
);

const Div = ({ inset = 16 }: { inset?: number }) => (
  <div style={{ height: 0.5, backgroundColor: C.sep, marginLeft: inset }} />
);

const SecLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="px-4 pt-6 pb-2 uppercase"
    style={{ fontSize: 12, fontWeight: 400, letterSpacing: 0.5, color: C.label2 }}>
    {children}
  </p>
);

// ── Composant principal ────────────────────────────────────────────────────
export function ViewerHostin({ booklet }: { booklet: Booklet }) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [lang, setLang] = useState(booklet.defaultLanguage || "fr");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [copied, setCopied] = useState(false);

  const _p = { ...getPalette(booklet.paletteId ?? "lavande"), ...booklet.customPalette };
  const A = _p.primary; // accent

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
  const sp = booklet.splashConfig ?? {};
  const bgUrl = sp.mediaUrl || booklet.coverImage;

  const getM = (type: string) => enabledModules.find((m) => m.type === type);
  const get = (type: string, key: string) => {
    const mod = getM(type);
    if (!mod) return "";
    return getContent(booklet, mod.id, key, lang);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── NAV BAR ───────────────────────────────────────────────────────────────
  const NavBar = ({ title, onBack }: { title: string; onBack?: () => void }) => (
    <div className="shrink-0 relative z-10"
      style={{ backgroundColor: C.tabBg, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: `0.5px solid ${C.sep}` }}>
      <div className="flex items-center px-4 pt-14 pb-3">
        {onBack ? (
          <button onClick={onBack} className="flex items-center gap-1 mr-3" style={{ color: A }}>
            <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
            <span style={{ fontSize: 17, color: A }}>Retour</span>
          </button>
        ) : (
          <div className="w-16" />
        )}
        <p className="flex-1 text-center font-semibold" style={{ fontSize: 17, color: C.label }}>{title}</p>
        {availableLangs.length > 1 ? (
          <div className="relative w-16 flex justify-end">
            <button onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${A}18` }}>
              <Globe className="w-3.5 h-3.5" style={{ color: A }} />
              <span style={{ fontSize: 13, color: A }}>{currentLang?.flag}</span>
            </button>
            {showLangMenu && (
              <div className="absolute top-9 right-0 rounded-2xl overflow-hidden z-50"
                style={{ backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", minWidth: 160 }}>
                {availableLangs.map((l, i) => (
                  <div key={l.code}>
                    <button onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                      className="w-full flex items-center justify-between px-4 py-3">
                      <span style={{ fontSize: 16, color: C.label }}>{l.flag} {l.label}</span>
                      {lang === l.code && <Check className="w-4 h-4" style={{ color: A }} />}
                    </button>
                    {i < availableLangs.length - 1 && <Div />}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : <div className="w-16" />}
      </div>
    </div>
  );

  // ── TAB BAR ───────────────────────────────────────────────────────────────
  const TabBar = () => (
    <div className="shrink-0 relative z-10"
      style={{ backgroundColor: C.tabBg, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: `0.5px solid ${C.sep}`, paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
      <div className="flex pt-2 pb-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center gap-0.5 active:opacity-50 transition-opacity">
              <Icon className="w-6 h-6" strokeWidth={active ? 2.2 : 1.5} style={{ color: active ? A : C.label2 }} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? A : C.label2, letterSpacing: 0.1 }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── HOME ──────────────────────────────────────────────────────────────────
  const TabHome = () => {
    const checkin = getM("checkin");
    const practical = getM("practical");
    const welcome = getM("welcome");

    const checkinTime = get("checkin", "checkin_time");
    const checkoutTime = get("checkin", "checkout_time");
    const wifiName = get("practical", "wifi_name");
    const wifiPass = get("practical", "wifi_password");
    const welcomeMsg = get("welcome", "message");
    const welcomeTitle = get("welcome", "title");

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
        <div className="pb-10">

          {/* Hero */}
          <div className="mx-4 mt-4 rounded-3xl overflow-hidden"
            style={{ height: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            {bgUrl ? (
              <div className="w-full h-full relative">
                <div className="absolute inset-0"
                  style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
                <div className="absolute bottom-0 left-0 p-5">
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", marginBottom: 4 }}>
                    Bienvenue
                  </p>
                  <p style={{ fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: "32px", letterSpacing: -0.4 }}>
                    {booklet.propertyName || booklet.title}
                  </p>
                  {booklet.address && (
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                      📍 {booklet.address}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col justify-end p-5"
                style={{ background: `linear-gradient(160deg, ${A}dd 0%, ${A}88 100%)` }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", marginBottom: 4 }}>
                  Bienvenue
                </p>
                <p style={{ fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: "32px", letterSpacing: -0.4 }}>
                  {booklet.propertyName || booklet.title}
                </p>
              </div>
            )}
          </div>

          {/* Message bienvenue */}
          {welcomeMsg && (
            <div className="mx-4 mt-3 rounded-2xl px-4 py-3.5"
              style={{ backgroundColor: A, boxShadow: `0 4px 16px ${A}45` }}>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.95)", fontStyle: "italic", lineHeight: "22px" }}>
                {welcomeMsg}
              </p>
            </div>
          )}

          {/* Consigne importante */}
          {welcomeTitle && (
            <div className="mx-4 mt-3 rounded-2xl px-4 py-3.5 flex items-start gap-3"
              style={{ backgroundColor: "#fffbeb", border: `1px solid ${C.warn}40` }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.warn }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#7c4a00", marginBottom: 2 }}>Consigne importante</p>
                <p style={{ fontSize: 14, color: "#7c4a00", lineHeight: "20px" }}>{welcomeTitle}</p>
              </div>
            </div>
          )}

          {/* Procédure d'arrivée */}
          {checkin && (
            <>
              <SecLabel>À lire en premier</SecLabel>
              <Card className="mx-4">
                <button onClick={() => setActiveTab("checkin")}
                  className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${A}18` }}>
                    <Key className="w-4.5 h-4.5" style={{ color: A }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ fontSize: 16, fontWeight: 600, color: C.label }}>Procédure d'arrivée</p>
                    <p style={{ fontSize: 13, color: C.label2, marginTop: 1 }}>Codes, accès et étapes pour entrer</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: C.label3 }} />
                </button>
              </Card>
            </>
          )}

          {/* Horaires — layout corrigé */}
          {(checkinTime || checkoutTime) && (
            <>
              <SecLabel>Horaires</SecLabel>
              <Card className="mx-4">
                <div className="flex divide-x" style={{ borderColor: C.sep }}>
                  {checkinTime && (
                    <div className="flex-1 px-5 py-4">
                      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.6, color: C.label2, textTransform: "uppercase", marginBottom: 4 }}>
                        Arrivée
                      </p>
                      <p style={{ fontSize: 28, fontWeight: 700, color: C.label, letterSpacing: -0.5, lineHeight: "33px" }}>
                        {checkinTime}
                      </p>
                    </div>
                  )}
                  {checkoutTime && (
                    <div className="flex-1 px-5 py-4">
                      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.6, color: C.label2, textTransform: "uppercase", marginBottom: 4 }}>
                        Départ
                      </p>
                      <p style={{ fontSize: 28, fontWeight: 700, color: C.label, letterSpacing: -0.5, lineHeight: "33px" }}>
                        {checkoutTime}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {/* WiFi */}
          {wifiName && (
            <>
              <SecLabel>Connexion</SecLabel>
              <Card className="mx-4">
                <div className="px-4 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wifi className="w-4 h-4" style={{ color: A }} />
                    <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: C.label2, textTransform: "uppercase" }}>
                      Wi-Fi
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: C.bg }}>
                      <p style={{ fontSize: 11, color: C.label2, marginBottom: 3 }}>Réseau</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.label }}>{wifiName}</p>
                    </div>
                    {wifiPass && (
                      <div className="rounded-xl px-3 py-2.5 relative" style={{ backgroundColor: C.bg }}>
                        <p style={{ fontSize: 11, color: C.label2, marginBottom: 3 }}>Mot de passe</p>
                        <p style={{ fontSize: 14, fontFamily: "monospace", color: A, paddingRight: 20 }}>{wifiPass}</p>
                        <button onClick={() => copy(wifiPass)}
                          className="absolute top-2 right-2 p-1 rounded-md active:opacity-50"
                          style={{ color: copied ? "#34c759" : C.label3 }}>
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Contact */}
          {get("contacts", "owner_name") && (
            <>
              <SecLabel>Contact</SecLabel>
              <Card className="mx-4">
                <button onClick={() => setActiveTab("practical")}
                  className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${A}18` }}>
                    <Phone className="w-4 h-4" style={{ color: A }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ fontSize: 16, fontWeight: 600, color: C.label }}>{get("contacts", "owner_name")}</p>
                    {get("contacts", "owner_phone") && (
                      <p style={{ fontSize: 13, color: A, marginTop: 1 }}>{get("contacts", "owner_phone")}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: C.label3 }} />
                </button>
              </Card>
            </>
          )}

          {/* Règles */}
          {get("rules", "rules") && (() => {
            const rules = get("rules", "rules").split("\n").filter(Boolean).slice(0, 6);
            const ruleEmojis = ["🚭", "🔇", "🐾", "👟", "♻️", "🔒"];
            return (
              <>
                <SecLabel>Règles essentielles</SecLabel>
                <div className="mx-4 grid grid-cols-2 gap-2">
                  {rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-white rounded-2xl px-3.5 py-3"
                      style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{ruleEmojis[i] ?? "✓"}</span>
                      <p style={{ fontSize: 13, fontWeight: 500, color: C.label, lineHeight: "17px" }}>{rule}</p>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}

          {/* Check-in CTA */}
          <div className="mx-4 mt-4">
            <button onClick={() => setShowCheckIn(true)}
              className="w-full flex items-center gap-3.5 px-4 py-4 rounded-2xl active:opacity-80 transition-opacity"
              style={{ backgroundColor: A, boxShadow: `0 4px 20px ${A}50` }}>
              <ClipboardCheck className="w-5 h-5 text-white shrink-0" />
              <div className="flex-1 text-left">
                <p style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Check-in en ligne</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>Enregistrez votre arrivée</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white opacity-60 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── PRATIQUE ──────────────────────────────────────────────────────────────
  const TabPractical = () => {
    const [openId, setOpenId] = useState<string | null>(null);

    const accordionItems = [
      { id: "rules",     emoji: "📋", label: "Règles de la maison",  content: get("rules", "rules") },
      { id: "eco",       emoji: "♻️", label: "Éco-responsabilité",   content: get("guide", "trash") },
      { id: "faq",       emoji: "ℹ️", label: "Bon à savoir",         content: get("faq", "faq") },
      { id: "heating",   emoji: "🌡️", label: "Chauffage",            content: get("guide", "heating") },
      { id: "appliance", emoji: "🍳", label: "Électroménager",       content: get("guide", "appliances") },
      { id: "other",     emoji: "🏠", label: "Autres infos",         content: get("guide", "other") },
    ].filter((i) => i.content);

    const emergencies = [
      { label: "SAMU", n: "15" }, { label: "Pompiers", n: "18" },
      { label: "Police", n: "17" }, { label: "Urgences (EU)", n: "112" },
    ];

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
        <div className="pb-10">

          {/* Accordéons */}
          {accordionItems.length > 0 && (
            <>
              <SecLabel>Guide du logement</SecLabel>
              <Card className="mx-4">
                {accordionItems.map((item, i) => {
                  const open = openId === item.id;
                  return (
                    <div key={item.id}>
                      <button onClick={() => setOpenId(open ? null : item.id)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors">
                        <span style={{ fontSize: 19, width: 24, textAlign: "center" }}>{item.emoji}</span>
                        <p style={{ fontSize: 16, fontWeight: 400, color: C.label, flex: 1, textAlign: "left" }}>{item.label}</p>
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                          style={{ color: C.label3 }} />
                      </button>
                      {open && (
                        <div className="px-4 pb-4" style={{ backgroundColor: "#fafafa", borderTop: `0.5px solid ${C.sep}` }}>
                          <p style={{ fontSize: 15, color: C.label, lineHeight: "22px", paddingTop: 12, whiteSpace: "pre-wrap" }}>
                            {item.content}
                          </p>
                        </div>
                      )}
                      {i < accordionItems.length - 1 && <Div inset={52} />}
                    </div>
                  );
                })}
              </Card>
            </>
          )}

          {/* Départ */}
          {get("checkin", "checkout_time") && (
            <>
              <SecLabel>Procédure de départ</SecLabel>
              <Card className="mx-4">
                <div className="px-4 py-5 text-center">
                  <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1, color: C.label2, textTransform: "uppercase", marginBottom: 6 }}>
                    Check-out avant
                  </p>
                  <p style={{ fontSize: 54, fontWeight: 700, color: A, letterSpacing: -2, lineHeight: "60px" }}>
                    {get("checkin", "checkout_time")}
                  </p>
                </div>
                {get("checkin", "checkout_process") && (
                  <div style={{ borderTop: `0.5px solid ${C.sep}` }}>
                    {get("checkin", "checkout_process").split("\n").filter(Boolean).map((step, i, arr) => (
                      <div key={i}>
                        <div className="flex gap-3.5 px-4 py-3.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: A }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{i + 1}</span>
                          </div>
                          <p style={{ fontSize: 15, color: C.label, lineHeight: "22px", flex: 1 }}>{step}</p>
                        </div>
                        {i < arr.length - 1 && <Div inset={48} />}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          {/* Contact */}
          {get("contacts", "owner_name") && (
            <>
              <SecLabel>Contact</SecLabel>
              <Card className="mx-4">
                <div className="px-4 py-4">
                  <p style={{ fontSize: 17, fontWeight: 600, color: C.label, marginBottom: 10 }}>
                    {get("contacts", "owner_name")}
                  </p>
                  {get("contacts", "owner_phone") && (
                    <a href={`tel:${get("contacts", "owner_phone")}`}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl active:opacity-80"
                      style={{ backgroundColor: A }}>
                      <Phone className="w-4 h-4 text-white" />
                      <span style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>
                        {get("contacts", "owner_phone")}
                      </span>
                    </a>
                  )}
                </div>
              </Card>
            </>
          )}

          {/* Urgences */}
          <SecLabel>Urgences</SecLabel>
          <Card className="mx-4">
            {emergencies.map((e, i) => (
              <div key={e.label}>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <p style={{ fontSize: 16, color: C.label }}>{e.label}</p>
                  <a href={`tel:${e.n}`} style={{ fontSize: 20, fontWeight: 700, color: C.danger }}>
                    {e.n}
                  </a>
                </div>
                {i < emergencies.length - 1 && <Div />}
              </div>
            ))}
          </Card>
          {get("contacts", "emergency") && (
            <div className="mx-4 mt-2 rounded-2xl px-4 py-3 flex items-start gap-3"
              style={{ backgroundColor: "#fff2f2", border: `1px solid ${C.danger}25` }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.danger }} />
              <p style={{ fontSize: 14, color: "#cc0000", lineHeight: "20px" }}>{get("contacts", "emergency")}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── ARRIVÉE ───────────────────────────────────────────────────────────────
  const TabCheckin = () => {
    const mod = getM("checkin");
    const photos = mod?.images ?? [];
    const steps = get("checkin", "checkin_process").split("\n").filter(Boolean);
    const checkinTime = get("checkin", "checkin_time");
    const checkoutTime = get("checkin", "checkout_time");
    const doorCode = get("practical", "door_code");

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
        <div className="pb-10">

          {/* Adresse */}
          {booklet.address && (
            <>
              <SecLabel>Adresse</SecLabel>
              <Card className="mx-4">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${A}18` }}>
                    <MapPin className="w-4 h-4" style={{ color: A }} />
                  </div>
                  <p style={{ fontSize: 15, color: C.label, flex: 1, lineHeight: "20px" }}>{booklet.address}</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booklet.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 rounded-full shrink-0 active:opacity-70"
                    style={{ backgroundColor: A }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Y aller</span>
                  </a>
                </div>
              </Card>
            </>
          )}

          {/* Horaires — une ligne chacun */}
          {(checkinTime || checkoutTime) && (
            <>
              <SecLabel>Horaires</SecLabel>
              <Card className="mx-4">
                <div className="flex divide-x" style={{ borderColor: C.sep }}>
                  {checkinTime && (
                    <div className="flex-1 px-5 py-4">
                      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.6, color: C.label2, textTransform: "uppercase", marginBottom: 4 }}>Arrivée</p>
                      <p style={{ fontSize: 32, fontWeight: 700, color: C.label, letterSpacing: -1, lineHeight: "38px" }}>{checkinTime}</p>
                    </div>
                  )}
                  {checkoutTime && (
                    <div className="flex-1 px-5 py-4">
                      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.6, color: C.label2, textTransform: "uppercase", marginBottom: 4 }}>Départ</p>
                      <p style={{ fontSize: 32, fontWeight: 700, color: C.label, letterSpacing: -1, lineHeight: "38px" }}>{checkoutTime}</p>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {/* Code d'entrée */}
          {doorCode && (
            <>
              <SecLabel>Accès</SecLabel>
              <Card className="mx-4">
                <div className="px-4 py-5 text-center">
                  <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1, color: C.label2, textTransform: "uppercase", marginBottom: 8 }}>
                    Code d'entrée
                  </p>
                  <p style={{ fontSize: 56, fontWeight: 700, color: A, letterSpacing: 10, lineHeight: "64px" }}>
                    {doorCode}
                  </p>
                </div>
              </Card>
            </>
          )}

          {/* Étapes */}
          {steps.length > 0 && (
            <>
              <SecLabel>Étapes d'arrivée</SecLabel>
              <Card className="mx-4">
                {steps.map((step, i) => (
                  <div key={i}>
                    <div className="flex gap-4 px-4 py-4">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: A }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p style={{ fontSize: 15, fontWeight: 500, color: C.label, lineHeight: "22px" }}>{step}</p>
                        {photos[i] && (
                          <div className="mt-3 rounded-2xl overflow-hidden aspect-video">
                            <img src={photos[i]} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                    {i < steps.length - 1 && <Div inset={52} />}
                  </div>
                ))}
              </Card>
            </>
          )}

          {/* Documents */}
          {(mod?.documents?.length ?? 0) > 0 && (
            <>
              <SecLabel>Documents</SecLabel>
              <Card className="mx-4">
                {mod!.documents!.map((doc, i, arr) => (
                  <div key={i}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${A}18` }}>
                        <FileText className="w-4 h-4" style={{ color: A }} />
                      </div>
                      <p style={{ fontSize: 15, color: C.label, flex: 1 }}>{doc.name}</p>
                      <Download className="w-4 h-4 shrink-0" style={{ color: C.label3 }} />
                    </a>
                    {i < arr.length - 1 && <Div inset={52} />}
                  </div>
                ))}
              </Card>
            </>
          )}
        </div>
      </div>
    );
  };

  // ── QUARTIER ──────────────────────────────────────────────────────────────
  const TabNeighborhood = () => {
    const actPlaces = get("activities", "places") ? parsePlaces(get("activities", "places")) : [];
    const gdPlaces  = get("gooddeals", "places")  ? parsePlaces(get("gooddeals", "places"))  : [];

    const PlaceGroup = ({ title: groupTitle, items }: { title: string; items: { name: string; address: string }[] }) => {
      if (!items.length) return null;
      return (
        <>
          <SecLabel>{groupTitle}</SecLabel>
          <Card className="mx-4">
            {items.map((p, i) => (
              <div key={i}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 16, fontWeight: 500, color: C.label }}>{p.name}</p>
                    {p.address && <p style={{ fontSize: 13, color: A, marginTop: 2 }}>{p.address}</p>}
                  </div>
                  {p.address && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full shrink-0 active:opacity-70"
                      style={{ backgroundColor: `${A}18`, color: A, fontSize: 13, fontWeight: 600 }}>
                      Maps
                    </a>
                  )}
                </div>
                {i < items.length - 1 && <Div />}
              </div>
            ))}
          </Card>
        </>
      );
    };

    const hasContent = actPlaces.length || gdPlaces.length
      || get("gooddeals", "restaurants") || get("gooddeals", "shops")
      || get("activities", "activities")
      || get("transport", "by_car") || get("transport", "by_train");

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
        <div className="pb-10">

          {booklet.address && (
            <>
              <SecLabel>Localisation</SecLabel>
              <Card className="mx-4">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booklet.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3.5 active:bg-gray-50">
                  <MapPin className="w-4 h-4" style={{ color: A }} />
                  <span style={{ fontSize: 16, color: A, fontWeight: 500 }}>Ouvrir dans Maps</span>
                </a>
              </Card>
            </>
          )}

          <PlaceGroup title="🎉  Activités" items={actPlaces} />
          <PlaceGroup title="📍  Lieux recommandés" items={gdPlaces} />

          {get("activities", "activities") && (
            <>
              <SecLabel>À faire & à voir</SecLabel>
              <Card className="mx-4">
                <div className="px-4 py-4">
                  <p style={{ fontSize: 15, color: C.label, lineHeight: "22px", whiteSpace: "pre-wrap" }}>
                    {get("activities", "activities")}
                  </p>
                </div>
              </Card>
            </>
          )}

          {get("gooddeals", "restaurants") && (
            <>
              <SecLabel>🍽️  Restaurants</SecLabel>
              <Card className="mx-4">
                <div className="px-4 py-4">
                  <p style={{ fontSize: 15, color: C.label, lineHeight: "22px", whiteSpace: "pre-wrap" }}>
                    {get("gooddeals", "restaurants")}
                  </p>
                </div>
              </Card>
            </>
          )}

          {get("gooddeals", "shops") && (
            <>
              <SecLabel>🛒  Commerces</SecLabel>
              <Card className="mx-4">
                <div className="px-4 py-4">
                  <p style={{ fontSize: 15, color: C.label, lineHeight: "22px", whiteSpace: "pre-wrap" }}>
                    {get("gooddeals", "shops")}
                  </p>
                </div>
              </Card>
            </>
          )}

          {(get("transport", "by_car") || get("transport", "by_train") || get("transport", "taxi") || get("transport", "airport")) && (
            <>
              <SecLabel>Transports</SecLabel>
              <Card className="mx-4">
                {[
                  { emoji: "🚗", label: "En voiture",  val: get("transport", "by_car") },
                  { emoji: "🚆", label: "En train",    val: get("transport", "by_train") },
                  { emoji: "🚕", label: "Taxi / VTC",  val: get("transport", "taxi") },
                  { emoji: "✈️", label: "Aéroport",    val: get("transport", "airport") },
                ].filter((t) => t.val).map((t, i, arr) => (
                  <div key={t.label}>
                    <div className="px-4 py-3.5">
                      <p style={{ fontSize: 13, color: C.label2, marginBottom: 3 }}>{t.emoji} {t.label}</p>
                      <p style={{ fontSize: 15, color: C.label, lineHeight: "22px", whiteSpace: "pre-wrap" }}>{t.val}</p>
                    </div>
                    {i < arr.length - 1 && <Div />}
                  </div>
                ))}
              </Card>
            </>
          )}

          {!hasContent && (
            <div className="flex items-center justify-center py-20">
              <p style={{ fontSize: 15, color: C.label2 }}>Aucune adresse renseignée</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── ÉQUIPEMENTS ───────────────────────────────────────────────────────────
  const TabEquipment = () => {
    const [selected, setSelected] = useState<string | null>(null);
    const guide = getM("guide");
    const photos = guide?.images ?? [];

    const EQUIP_ICONS: Record<string, React.ElementType> = {
      heating: Thermometer, appliances: UtensilsCrossed, trash: Recycle, other: HelpCircle,
    };

    const items = [
      { id: "heating",    label: "Chauffage",       content: get("guide", "heating") },
      { id: "appliances", label: "Électroménager",  content: get("guide", "appliances") },
      { id: "trash",      label: "Tri des déchets", content: get("guide", "trash") },
      { id: "other",      label: "Autres infos",    content: get("guide", "other") },
    ].filter((i) => i.content);

    if (!guide || !items.length) return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: C.bg }}>
        <p style={{ fontSize: 15, color: C.label2 }}>Aucun équipement renseigné</p>
      </div>
    );

    // Vue détail
    if (selected) {
      const item = items.find((i) => i.id === selected)!;
      const idx = items.indexOf(item);
      const IconComp = EQUIP_ICONS[item.id] ?? HelpCircle;
      return (
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
          <div className="pb-10">
            {photos[idx] ? (
              <div className="mx-4 mt-4 rounded-2xl overflow-hidden"
                style={{ aspectRatio: "16/9", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
                <img src={photos[idx]} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="mx-4 mt-4 rounded-2xl flex items-center justify-center"
                style={{ aspectRatio: "16/9", backgroundColor: `${A}12` }}>
                <IconComp className="w-16 h-16" style={{ color: A, opacity: 0.5 }} strokeWidth={1} />
              </div>
            )}
            <SecLabel>{item.label}</SecLabel>
            <Card className="mx-4">
              <div className="px-4 py-4">
                <p style={{ fontSize: 15, color: C.label, lineHeight: "22px", whiteSpace: "pre-wrap" }}>
                  {item.content}
                </p>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    // Vue liste
    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
        <div className="pb-10">
          <SecLabel>Équipements</SecLabel>
          <div className="mx-4 grid grid-cols-2 gap-3">
            {items.map((item, i) => {
              const IconComp = EQUIP_ICONS[item.id] ?? HelpCircle;
              return (
                <button key={item.id} onClick={() => setSelected(item.id)}
                  className="flex flex-col overflow-hidden rounded-2xl bg-white text-left active:scale-95 transition-transform"
                  style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                  {photos[i] ? (
                    <div className="w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <img src={photos[i]} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-center py-8"
                      style={{ backgroundColor: `${A}0d` }}>
                      <IconComp className="w-10 h-10" style={{ color: A }} strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="px-3.5 py-3">
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.label }}>{item.label}</p>
                    <p style={{ fontSize: 12, color: C.label2, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.content.substring(0, 40)}…
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  const titles: Record<TabId, string> = {
    home:         booklet.propertyName || booklet.title || "Accueil",
    practical:    "Infos pratiques",
    checkin:      "Arrivée",
    neighborhood: "Quartier",
    equipment:    "Équipements",
  };

  return (
    <>
      {showCheckIn && (
        <CheckInForm bookletId={booklet.id} accent={A} theme="light" onClose={() => setShowCheckIn(false)} />
      )}
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: C.bg, fontFamily: FONT }}>
        <NavBar title={titles[activeTab]} />
        {activeTab === "home"         && <TabHome />}
        {activeTab === "practical"    && <TabPractical />}
        {activeTab === "checkin"      && <TabCheckin />}
        {activeTab === "neighborhood" && <TabNeighborhood />}
        {activeTab === "equipment"    && <TabEquipment />}
        <TabBar />
      </div>
    </>
  );
}
