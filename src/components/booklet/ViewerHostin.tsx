"use client";

import { useState, useEffect } from "react";
import { Booklet } from "@/types";
import { MODULE_META } from "@/lib/modules";
import { getContent, parsePlaces, getAvailableLangs } from "./viewerUtils";
import { CheckInForm } from "./CheckInForm";
import {
  Home, Info, Key, MapPin, Wrench, Globe, ChevronRight,
  Wifi, Phone, AlertTriangle, Copy, Check, ArrowLeft,
  FileText, Download, ClipboardCheck,
} from "lucide-react";
import { getPalette } from "@/lib/palettes";

// ── Système typographique iOS (SF Pro) ────────────────────────────────────
// Large Title : 34px / bold  → titres de page
// Title 1     : 28px / bold  → h1
// Title 2     : 22px / bold  → h2
// Title 3     : 20px / semibold
// Headline    : 17px / semibold
// Body        : 17px / regular
// Callout     : 16px / regular
// Subhead     : 15px / regular
// Footnote    : 13px / regular
// Caption     : 12px / regular

const T = {
  largeTitle: { fontSize: 34, fontWeight: 700, letterSpacing: -0.5, lineHeight: "41px" },
  title1:     { fontSize: 28, fontWeight: 700, letterSpacing: -0.3, lineHeight: "34px" },
  title2:     { fontSize: 22, fontWeight: 700, letterSpacing: -0.2, lineHeight: "28px" },
  title3:     { fontSize: 20, fontWeight: 600, lineHeight: "25px" },
  headline:   { fontSize: 17, fontWeight: 600, lineHeight: "22px" },
  body:       { fontSize: 17, fontWeight: 400, lineHeight: "22px" },
  callout:    { fontSize: 16, fontWeight: 400, lineHeight: "21px" },
  subhead:    { fontSize: 15, fontWeight: 400, lineHeight: "20px" },
  footnote:   { fontSize: 13, fontWeight: 400, lineHeight: "18px" },
  caption:    { fontSize: 12, fontWeight: 400, lineHeight: "16px" },
  captionBold:{ fontSize: 12, fontWeight: 600, lineHeight: "16px", letterSpacing: 0.1 },
} as const;

// ── Couleurs système iOS ───────────────────────────────────────────────────
const C = {
  bg:           "#f2f2f7",   // systemGroupedBackground
  bg2:          "#ffffff",   // secondarySystemGroupedBackground
  bg3:          "#f2f2f7",   // tertiarySystemGroupedBackground
  label:        "#000000",   // label
  label2:       "#3c3c43cc", // secondaryLabel (80%)
  label3:       "#3c3c4399", // tertiaryLabel (60%)
  separator:    "#3c3c4349", // separator
  fill:         "#78788033", // quaternarySystemFill
  tabBar:       "rgba(249,249,249,0.94)",
  tabBarBorder: "rgba(0,0,0,0.12)",
};

const FONT = "-apple-system, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif";

type TabId = "home" | "practical" | "checkin" | "neighborhood" | "equipment";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "home",         label: "Accueil",    icon: Home },
  { id: "practical",    label: "Pratique",   icon: Info },
  { id: "checkin",      label: "Arrivée",    icon: Key },
  { id: "neighborhood", label: "Quartier",   icon: MapPin },
  { id: "equipment",    label: "Équipements",icon: Wrench },
];

// ── Composants atomiques ───────────────────────────────────────────────────

// Group iOS (rounded rect avec sections séparées)
const Group = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl overflow-hidden bg-white ${className}`}
    style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)" }}>
    {children}
  </div>
);

// Row iOS avec séparateur inset
const Row = ({
  icon, label, value, accent, chevron = false, onPress, danger = false,
}: {
  icon?: React.ReactNode; label: string; value?: string;
  accent?: string; chevron?: boolean; onPress?: () => void; danger?: boolean;
}) => {
  const El = onPress ? "button" : "div";
  return (
    <El onClick={onPress}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left ${onPress ? "active:bg-gray-50 transition-colors" : ""}`}>
      {icon && (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: accent ? `${accent}18` : C.fill }}>
          <span style={{ color: danger ? "#ff3b30" : accent }}>{icon}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p style={{ ...T.subhead, color: danger ? "#ff3b30" : C.label }}>{label}</p>
        {value && <p className="mt-0.5 truncate" style={{ ...T.footnote, color: C.label3 }}>{value}</p>}
      </div>
      {chevron && <ChevronRight className="w-4 h-4 shrink-0" style={{ color: C.label3 }} />}
    </El>
  );
};

// Séparateur inset iOS
const Sep = ({ inset = 16 }: { inset?: number }) => (
  <div style={{ height: 0.5, backgroundColor: C.separator, marginLeft: inset }} />
);

// Section header iOS
const SectionHeader = ({ title }: { title: string }) => (
  <p className="px-4 pt-5 pb-1.5 uppercase" style={{ ...T.footnote, color: C.label2, letterSpacing: 0.4 }}>
    {title}
  </p>
);

// ── Viewer ─────────────────────────────────────────────────────────────────
export function ViewerHostin({ booklet }: { booklet: Booklet }) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [lang, setLang] = useState(booklet.defaultLanguage || "fr");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [copied, setCopied] = useState(false);

  const _p = { ...getPalette(booklet.paletteId ?? "lavande"), ...booklet.customPalette };
  const ACCENT = _p.primary;

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── NAV BAR iOS ────────────────────────────────────────────────────────────
  const NavBar = ({ title, backLabel, onBack }: { title: string; backLabel?: string; onBack?: () => void }) => (
    <div className="shrink-0 relative"
      style={{ backgroundColor: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      {/* Séparateur fin */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 0.5, backgroundColor: C.tabBarBorder }} />
      <div className="flex items-center justify-between px-4 pt-12 pb-3 relative">
        {onBack ? (
          <button onClick={onBack} className="flex items-center gap-1 -ml-1" style={{ color: ACCENT }}>
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
            <span style={{ ...T.callout, color: ACCENT }}>{backLabel || "Retour"}</span>
          </button>
        ) : <div className="w-20" />}
        <p className="absolute left-1/2 -translate-x-1/2" style={{ ...T.headline, color: C.label }}>{title}</p>
        {availableLangs.length > 1 && (
          <div className="relative">
            <button onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: C.fill }}>
              <Globe className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span style={{ ...T.caption, color: ACCENT }}>{currentLang?.flag}</span>
            </button>
            {showLangMenu && (
              <div className="absolute top-10 right-0 z-50 rounded-2xl overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", minWidth: 150 }}>
                {availableLangs.map((l, i) => (
                  <div key={l.code}>
                    <button onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3"
                      style={{ color: C.label }}>
                      <span style={T.callout}>{l.flag} {l.label}</span>
                      {lang === l.code && <Check className="w-4 h-4" style={{ color: ACCENT }} />}
                    </button>
                    {i < availableLangs.length - 1 && <Sep />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── TAB BAR iOS ────────────────────────────────────────────────────────────
  const TabBar = () => (
    <div className="shrink-0 relative"
      style={{ backgroundColor: C.tabBar, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
      <div className="absolute top-0 left-0 right-0" style={{ height: 0.5, backgroundColor: C.tabBarBorder }} />
      <div className="flex pt-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center gap-0.5 pb-1 transition-all active:opacity-60"
              style={{ color: active ? ACCENT : C.label3 }}>
              <Icon className="w-6 h-6" strokeWidth={active ? 2 : 1.5} />
              <span style={{ ...T.captionBold, color: active ? ACCENT : C.label3 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── TAB : ACCUEIL ──────────────────────────────────────────────────────────
  const TabHome = () => {
    const checkin = getM("checkin");
    const practical = getM("practical");
    const welcome = getM("welcome");

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
        {/* Hero */}
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden"
          style={{ height: 220, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
          {bgUrl ? (
            <div className="w-full h-full" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}>
              <div className="w-full h-full" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }}>
                <div className="h-full flex flex-col justify-end p-5">
                  <p style={{ ...T.caption, color: "rgba(255,255,255,0.7)", letterSpacing: 1, textTransform: "uppercase" }}>Bienvenue</p>
                  <p style={{ ...T.title1, color: "#fff" }}>{booklet.propertyName || booklet.title}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-end p-5"
              style={{ background: `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT}88)` }}>
              <p style={{ ...T.caption, color: "rgba(255,255,255,0.7)", letterSpacing: 1, textTransform: "uppercase" }}>Bienvenue</p>
              <p style={{ ...T.title1, color: "#fff" }}>{booklet.propertyName || booklet.title}</p>
            </div>
          )}
        </div>

        {/* Message bienvenue */}
        {welcome && get("welcome", "message") && (
          <div className="mx-4 mt-3 rounded-2xl px-4 py-3.5"
            style={{ backgroundColor: ACCENT, boxShadow: `0 2px 12px ${ACCENT}40` }}>
            <p style={{ ...T.callout, color: "rgba(255,255,255,0.95)", fontStyle: "italic" }}>
              {get("welcome", "message")}
            </p>
          </div>
        )}

        {/* Consigne importante */}
        {welcome && get("welcome", "title") && (
          <div className="mx-4 mt-3 rounded-2xl px-4 py-3.5 flex items-start gap-3"
            style={{ backgroundColor: "#fff9e6", border: "1px solid #f0c040" }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#f0a000" }} />
            <div>
              <p style={{ ...T.footnote, fontWeight: 600, color: "#7a5000" }}>Consigne importante</p>
              <p style={{ ...T.footnote, color: "#7a5000", marginTop: 2 }}>{get("welcome", "title")}</p>
            </div>
          </div>
        )}

        {/* Procédure d'arrivée */}
        {checkin && (
          <>
            <SectionHeader title="À lire en premier" />
            <Group className="mx-4">
              <Row
                icon={<Key className="w-4 h-4" />}
                label="Procédure d'arrivée"
                value="Codes, accès et étapes pour entrer"
                accent={ACCENT}
                chevron
                onPress={() => setActiveTab("checkin")}
              />
            </Group>
          </>
        )}

        {/* Horaires */}
        {checkin && (get("checkin", "checkin_time") || get("checkin", "checkout_time")) && (
          <>
            <SectionHeader title="Horaires" />
            <Group className="mx-4">
              <div className="grid grid-cols-2 divide-x" style={{ borderColor: C.separator }}>
                {get("checkin", "checkin_time") && (
                  <div className="px-4 py-4">
                    <p style={{ ...T.caption, color: C.label2, textTransform: "uppercase", letterSpacing: 0.4 }}>Arrivée</p>
                    <p style={{ ...T.title2, color: C.label, marginTop: 2 }}>{get("checkin", "checkin_time")}</p>
                  </div>
                )}
                {get("checkin", "checkout_time") && (
                  <div className="px-4 py-4">
                    <p style={{ ...T.caption, color: C.label2, textTransform: "uppercase", letterSpacing: 0.4 }}>Départ</p>
                    <p style={{ ...T.title2, color: C.label, marginTop: 2 }}>{get("checkin", "checkout_time")}</p>
                  </div>
                )}
              </div>
            </Group>
          </>
        )}

        {/* WiFi */}
        {practical && get("practical", "wifi_name") && (
          <>
            <SectionHeader title="Connexion" />
            <Group className="mx-4">
              <div className="px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wifi className="w-4 h-4" style={{ color: ACCENT }} />
                  <p style={{ ...T.footnote, color: C.label2, textTransform: "uppercase", letterSpacing: 0.4 }}>Wi-Fi</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: C.bg }}>
                    <p style={{ ...T.caption, color: C.label2 }}>Réseau</p>
                    <p style={{ ...T.subhead, fontWeight: 600, color: C.label, marginTop: 2 }}>{get("practical", "wifi_name")}</p>
                  </div>
                  {get("practical", "wifi_password") && (
                    <div className="rounded-xl px-3 py-2.5 relative" style={{ backgroundColor: C.bg }}>
                      <p style={{ ...T.caption, color: C.label2 }}>Mot de passe</p>
                      <p style={{ ...T.subhead, fontFamily: "monospace", color: ACCENT, marginTop: 2 }}>{get("practical", "wifi_password")}</p>
                      <button onClick={() => copyToClipboard(get("practical", "wifi_password"))}
                        className="absolute top-2 right-2 p-1 rounded-md"
                        style={{ color: copied ? "#34c759" : C.label3 }}>
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Group>
          </>
        )}

        {/* Adresse */}
        {booklet.address && (
          <>
            <SectionHeader title="Adresse" />
            <Group className="mx-4">
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}18` }}>
                  <MapPin className="w-4 h-4" style={{ color: ACCENT }} />
                </div>
                <p style={{ ...T.subhead, color: C.label, flex: 1 }}>{booklet.address}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booklet.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full font-semibold shrink-0"
                  style={{ backgroundColor: ACCENT, color: "#fff", fontSize: 13 }}>
                  Y aller
                </a>
              </div>
            </Group>
          </>
        )}

        {/* Contact */}
        {getM("contacts") && get("contacts", "owner_name") && (
          <>
            <SectionHeader title="Contact" />
            <Group className="mx-4">
              <Row
                icon={<Phone className="w-4 h-4" />}
                label={get("contacts", "owner_name")}
                value={get("contacts", "owner_phone") || undefined}
                accent={ACCENT}
                chevron
                onPress={() => setActiveTab("practical")}
              />
            </Group>
          </>
        )}

        {/* Règles */}
        {getM("rules") && get("rules", "rules") && (() => {
          const rules = get("rules", "rules").split("\n").filter(Boolean).slice(0, 6);
          return (
            <>
              <SectionHeader title="Règles essentielles" />
              <div className="mx-4 grid grid-cols-2 gap-2">
                {rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-xl px-3 py-3 bg-white"
                    style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
                    <span style={{ fontSize: 16 }}>{["🚭","🔇","🐾","👟","♻️","🔒"][i] ?? "✓"}</span>
                    <p style={{ ...T.footnote, color: C.label, fontWeight: 500, lineHeight: "16px" }}>{rule}</p>
                  </div>
                ))}
              </div>
            </>
          );
        })()}

        {/* Check-in en ligne */}
        <div className="mx-4 mt-3 mb-8">
          <button onClick={() => setShowCheckIn(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl active:opacity-70 transition-opacity"
            style={{ backgroundColor: ACCENT, boxShadow: `0 4px 16px ${ACCENT}50` }}>
            <ClipboardCheck className="w-5 h-5 text-white shrink-0" />
            <div className="flex-1 text-left">
              <p style={{ ...T.headline, color: "#fff" }}>Check-in en ligne</p>
              <p style={{ ...T.caption, color: "rgba(255,255,255,0.75)" }}>Enregistrez votre arrivée</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white opacity-70 shrink-0" />
          </button>
        </div>
      </div>
    );
  };

  // ── TAB : PRATIQUE ─────────────────────────────────────────────────────────
  const TabPractical = () => {
    const [openId, setOpenId] = useState<string | null>(null);

    const Accordion = ({ id, icon, title, content }: { id: string; icon: string; title: string; content: string }) => {
      if (!content) return null;
      const open = openId === id;
      return (
        <div>
          <button onClick={() => setOpenId(open ? null : id)}
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors">
            <span style={{ fontSize: 20, width: 28, textAlign: "center" as const }}>{icon}</span>
            <p style={{ ...T.subhead, color: C.label, flex: 1, textAlign: "left" as const }}>{title}</p>
            <ChevronRight className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
              style={{ color: C.label3 }} />
          </button>
          {open && (
            <div className="px-4 pb-4 pt-1" style={{ backgroundColor: "#f9f9f9" }}>
              <p style={{ ...T.callout, color: C.label2, whiteSpace: "pre-wrap" as const }}>{content}</p>
            </div>
          )}
          <Sep inset={52} />
        </div>
      );
    };

    const emergencyNumbers = [
      { label: "SAMU", number: "15" },
      { label: "Pompiers", number: "18" },
      { label: "Police", number: "17" },
      { label: "Urgences (EU)", number: "112" },
    ];

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
        <div className="pb-8">
          {/* Accordéons */}
          <SectionHeader title="Guide du logement" />
          <Group className="mx-4">
            <Accordion id="rules"     icon="📋" title="Règles de la maison"   content={get("rules", "rules")} />
            <Accordion id="eco"       icon="♻️" title="Éco-responsabilité"    content={get("guide", "trash")} />
            <Accordion id="faq"       icon="ℹ️" title="Bon à savoir"          content={get("faq", "faq")} />
            <Accordion id="heating"   icon="🌡️" title="Chauffage"             content={get("guide", "heating")} />
            <Accordion id="appliance" icon="🍳" title="Électroménager"        content={get("guide", "appliances")} />
            <Accordion id="other"     icon="🏠" title="Autres infos"          content={get("guide", "other")} />
          </Group>

          {/* Heure de départ */}
          {get("checkin", "checkout_time") && (
            <>
              <SectionHeader title="Procédure de départ" />
              <Group className="mx-4">
                <div className="px-4 py-5 text-center">
                  <p style={{ ...T.caption, color: C.label2, textTransform: "uppercase", letterSpacing: 0.4 }}>
                    Check-out avant
                  </p>
                  <p style={{ fontSize: 56, fontWeight: 700, color: ACCENT, lineHeight: "64px", letterSpacing: -2 }}>
                    {get("checkin", "checkout_time")}
                  </p>
                </div>
                {get("checkin", "checkout_process") && (
                  <div style={{ borderTop: `0.5px solid ${C.separator}` }}>
                    {get("checkin", "checkout_process").split("\n").filter(Boolean).map((step, i, arr) => (
                      <div key={i}>
                        <div className="flex gap-4 px-4 py-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: ACCENT }}>
                            <span style={{ ...T.captionBold, color: "#fff" }}>{i + 1}</span>
                          </div>
                          <p style={{ ...T.subhead, color: C.label, flex: 1 }}>{step}</p>
                        </div>
                        {i < arr.length - 1 && <Sep inset={52} />}
                      </div>
                    ))}
                  </div>
                )}
              </Group>
            </>
          )}

          {/* Contact propriétaire */}
          {get("contacts", "owner_name") && (
            <>
              <SectionHeader title="Contact" />
              <Group className="mx-4">
                <div className="px-4 py-3">
                  <p style={{ ...T.headline, color: C.label }}>{get("contacts", "owner_name")}</p>
                  {get("contacts", "owner_phone") && (
                    <a href={`tel:${get("contacts", "owner_phone")}`}
                      className="flex items-center justify-center gap-2 mt-3 py-3 rounded-xl"
                      style={{ backgroundColor: ACCENT }}>
                      <Phone className="w-4 h-4 text-white" />
                      <span style={{ ...T.headline, color: "#fff" }}>{get("contacts", "owner_phone")}</span>
                    </a>
                  )}
                </div>
              </Group>
            </>
          )}

          {/* Numéros d'urgence */}
          <SectionHeader title="Urgences" />
          <Group className="mx-4">
            {emergencyNumbers.map((e, i) => (
              <div key={e.label}>
                <div className="flex items-center justify-between px-4 py-3">
                  <p style={{ ...T.subhead, color: C.label }}>{e.label}</p>
                  <a href={`tel:${e.number}`} style={{ ...T.title3, color: "#ff3b30" }}>{e.number}</a>
                </div>
                {i < emergencyNumbers.length - 1 && <Sep inset={16} />}
              </div>
            ))}
          </Group>

          {get("contacts", "emergency") && (
            <div className="mx-4 mt-3 rounded-2xl px-4 py-3.5 flex items-start gap-3"
              style={{ backgroundColor: "#fff2f2", border: "0.5px solid #ffb3b3" }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#ff3b30" }} />
              <p style={{ ...T.footnote, color: "#cc2200" }}>{get("contacts", "emergency")}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── TAB : ARRIVÉE ──────────────────────────────────────────────────────────
  const TabCheckin = () => {
    const mod = getM("checkin");
    const photos = mod?.images ?? [];
    const steps = get("checkin", "checkin_process").split("\n").filter(Boolean);

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
        <div className="pb-8">
          {/* Adresse */}
          {booklet.address && (
            <>
              <SectionHeader title="Adresse" />
              <Group className="mx-4">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}18` }}>
                    <MapPin className="w-4 h-4" style={{ color: ACCENT }} />
                  </div>
                  <p style={{ ...T.subhead, color: C.label, flex: 1 }}>{booklet.address}</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booklet.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: ACCENT, color: "#fff", ...T.footnote, fontWeight: 600 }}>
                    Y aller
                  </a>
                </div>
              </Group>
            </>
          )}

          {/* Horaires */}
          {(get("checkin", "checkin_time") || get("checkin", "checkout_time")) && (
            <>
              <SectionHeader title="Horaires" />
              <Group className="mx-4">
                <div className="grid grid-cols-2 divide-x" style={{ borderColor: C.separator }}>
                  {get("checkin", "checkin_time") && (
                    <div className="px-4 py-4">
                      <p style={{ ...T.caption, color: C.label2, textTransform: "uppercase", letterSpacing: 0.4 }}>Arrivée</p>
                      <p style={{ fontSize: 36, fontWeight: 700, color: C.label, letterSpacing: -1, lineHeight: "44px" }}>
                        {get("checkin", "checkin_time")}
                      </p>
                    </div>
                  )}
                  {get("checkin", "checkout_time") && (
                    <div className="px-4 py-4">
                      <p style={{ ...T.caption, color: C.label2, textTransform: "uppercase", letterSpacing: 0.4 }}>Départ</p>
                      <p style={{ fontSize: 36, fontWeight: 700, color: C.label, letterSpacing: -1, lineHeight: "44px" }}>
                        {get("checkin", "checkout_time")}
                      </p>
                    </div>
                  )}
                </div>
              </Group>
            </>
          )}

          {/* Code d'entrée */}
          {get("practical", "door_code") && (
            <>
              <SectionHeader title="Accès" />
              <Group className="mx-4">
                <div className="px-4 py-5 text-center">
                  <p style={{ ...T.caption, color: C.label2, textTransform: "uppercase", letterSpacing: 0.4 }}>Code d'entrée</p>
                  <p style={{ fontSize: 52, fontWeight: 700, color: ACCENT, letterSpacing: 8, lineHeight: "64px" }}>
                    {get("practical", "door_code")}
                  </p>
                </div>
              </Group>
            </>
          )}

          {/* Étapes */}
          {steps.length > 0 && (
            <>
              <SectionHeader title="Étapes d'arrivée" />
              <Group className="mx-4">
                {steps.map((step, i) => (
                  <div key={i}>
                    <div className="flex gap-4 px-4 py-3.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: ACCENT }}>
                        <span style={{ ...T.captionBold, color: "#fff" }}>{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p style={{ ...T.subhead, color: C.label }}>{step}</p>
                        {photos[i] && (
                          <div className="mt-3 rounded-2xl overflow-hidden aspect-video">
                            <img src={photos[i]} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                    {i < steps.length - 1 && <Sep inset={52} />}
                  </div>
                ))}
              </Group>
            </>
          )}

          {/* Documents */}
          {(getM("checkin")?.documents?.length ?? 0) > 0 && (
            <>
              <SectionHeader title="Documents" />
              <Group className="mx-4">
                {getM("checkin")!.documents!.map((doc, i, arr) => (
                  <div key={i}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 active:bg-gray-50">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${ACCENT}18` }}>
                        <FileText className="w-4 h-4" style={{ color: ACCENT }} />
                      </div>
                      <p style={{ ...T.subhead, color: C.label, flex: 1 }}>{doc.name}</p>
                      <Download className="w-4 h-4 shrink-0" style={{ color: C.label3 }} />
                    </a>
                    {i < arr.length - 1 && <Sep inset={52} />}
                  </div>
                ))}
              </Group>
            </>
          )}
        </div>
      </div>
    );
  };

  // ── TAB : QUARTIER ─────────────────────────────────────────────────────────
  const TabNeighborhood = () => {
    const actPlaces = get("activities", "places") ? parsePlaces(get("activities", "places")) : [];
    const gdPlaces  = get("gooddeals", "places")  ? parsePlaces(get("gooddeals", "places"))  : [];

    const PlaceGroup = ({ title, icon, items }: { title: string; icon: string; items: { name: string; address: string }[] }) => (
      <>
        <SectionHeader title={`${icon}  ${title}`} />
        <Group className="mx-4">
          {items.map((p, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p style={{ ...T.subhead, fontWeight: 600, color: C.label }}>{p.name}</p>
                  {p.address && <p style={{ ...T.footnote, color: ACCENT, marginTop: 1 }}>{p.address}</p>}
                </div>
                {p.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, ...T.caption, fontWeight: 600 }}>
                    Maps
                  </a>
                )}
              </div>
              {i < items.length - 1 && <Sep inset={16} />}
            </div>
          ))}
        </Group>
      </>
    );

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
        <div className="pb-8">
          {/* Maps */}
          {booklet.address && (
            <>
              <SectionHeader title="Localisation" />
              <Group className="mx-4">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booklet.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3.5 active:bg-gray-50">
                  <MapPin className="w-4 h-4" style={{ color: ACCENT }} />
                  <span style={{ ...T.callout, color: ACCENT, fontWeight: 600 }}>Ouvrir dans Maps</span>
                </a>
              </Group>
            </>
          )}

          {actPlaces.length > 0 && <PlaceGroup title="Activités" icon="🎉" items={actPlaces} />}
          {gdPlaces.length > 0  && <PlaceGroup title="Restaurants & commerces" icon="🍽️" items={gdPlaces} />}

          {get("gooddeals", "restaurants") && (
            <>
              <SectionHeader title="🍽️  Restaurants" />
              <Group className="mx-4">
                <div className="px-4 py-3">
                  <p style={{ ...T.callout, color: C.label, whiteSpace: "pre-wrap" }}>{get("gooddeals", "restaurants")}</p>
                </div>
              </Group>
            </>
          )}

          {get("gooddeals", "shops") && (
            <>
              <SectionHeader title="🛒  Commerces" />
              <Group className="mx-4">
                <div className="px-4 py-3">
                  <p style={{ ...T.callout, color: C.label, whiteSpace: "pre-wrap" }}>{get("gooddeals", "shops")}</p>
                </div>
              </Group>
            </>
          )}

          {(get("transport", "by_car") || get("transport", "by_train") || get("transport", "taxi") || get("transport", "airport")) && (
            <>
              <SectionHeader title="Transports" />
              <Group className="mx-4">
                {[
                  ["🚗", "En voiture", get("transport", "by_car")],
                  ["🚆", "En train",   get("transport", "by_train")],
                  ["🚕", "Taxi / VTC", get("transport", "taxi")],
                  ["✈️", "Aéroport",   get("transport", "airport")],
                ].filter(([,, v]) => v).map(([icon, label, value], i, arr) => (
                  <div key={label as string}>
                    <div className="px-4 py-3">
                      <p style={{ ...T.footnote, color: C.label2, marginBottom: 2 }}>{icon} {label}</p>
                      <p style={{ ...T.callout, color: C.label, whiteSpace: "pre-wrap" }}>{value}</p>
                    </div>
                    {i < arr.length - 1 && <Sep inset={16} />}
                  </div>
                ))}
              </Group>
            </>
          )}
        </div>
      </div>
    );
  };

  // ── TAB : ÉQUIPEMENTS ──────────────────────────────────────────────────────
  const TabEquipment = () => {
    const [selected, setSelected] = useState<string | null>(null);
    const guide = getM("guide");
    const photos = guide?.images ?? [];

    const items = [
      { id: "heating",    icon: "🌡️", title: "Chauffage",        content: get("guide", "heating") },
      { id: "appliances", icon: "🍳", title: "Électroménager",   content: get("guide", "appliances") },
      { id: "trash",      icon: "♻️", title: "Tri des déchets",  content: get("guide", "trash") },
      { id: "other",      icon: "🏠", title: "Autres",           content: get("guide", "other") },
    ].filter((i) => i.content);

    if (!guide || items.length === 0) return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: C.bg }}>
        <p style={{ ...T.callout, color: C.label3 }}>Aucun équipement renseigné</p>
      </div>
    );

    // Vue détail
    if (selected) {
      const item = items.find((i) => i.id === selected)!;
      const idx = items.indexOf(item);
      return (
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
          <div className="pb-8">
            {photos[idx] && (
              <div className="mx-4 mt-4 rounded-2xl overflow-hidden aspect-video"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                <img src={photos[idx]} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <SectionHeader title={item.title} />
            <Group className="mx-4">
              <div className="px-4 py-4">
                <p style={{ ...T.callout, color: C.label, whiteSpace: "pre-wrap" }}>{item.content}</p>
              </div>
            </Group>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
        <div className="pb-8">
          <SectionHeader title="Équipements" />
          <div className="mx-4 grid grid-cols-2 gap-3">
            {items.map((item, i) => (
              <button key={item.id} onClick={() => setSelected(item.id)}
                className="flex flex-col text-left overflow-hidden rounded-2xl bg-white active:scale-95 transition-transform"
                style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)" }}>
                {photos[i] ? (
                  <div className="w-full aspect-video overflow-hidden">
                    <img src={photos[i]} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center text-4xl"
                    style={{ backgroundColor: `${ACCENT}10` }}>
                    {item.icon}
                  </div>
                )}
                <div className="px-3 py-2.5">
                  <p style={{ ...T.subhead, fontWeight: 600, color: C.label }}>{item.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  const PAGE_TITLES: Record<TabId, string> = {
    home:         booklet.propertyName || booklet.title || "Accueil",
    practical:    "Infos pratiques",
    checkin:      "Arrivée",
    neighborhood: "Quartier",
    equipment:    "Équipements",
  };

  return (
    <>
      {showCheckIn && (
        <CheckInForm bookletId={booklet.id} accent={ACCENT} theme="light" onClose={() => setShowCheckIn(false)} />
      )}
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: C.bg, fontFamily: FONT }}>
        <NavBar title={PAGE_TITLES[activeTab]} />
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
