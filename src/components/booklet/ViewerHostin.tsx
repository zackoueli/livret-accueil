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

// ── Constantes visuelles ───────────────────────────────────────────────────
const BG = "#eef0f7";
const WHITE = "#ffffff";
const SANS = "system-ui, -apple-system, sans-serif";

type TabId = "home" | "practical" | "checkin" | "neighborhood" | "equipment";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "practical", label: "Pratique", icon: Info },
  { id: "checkin", label: "Arrivée", icon: Key },
  { id: "neighborhood", label: "Quartier", icon: MapPin },
  { id: "equipment", label: "Équipements", icon: Wrench },
];

// Card blanche générique
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl overflow-hidden ${className}`}
    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
    {children}
  </div>
);

// Étape numérotée
const Step = ({ n, title, body, accent }: { n: number; title: string; body: string; accent: string }) => (
  <div className="flex gap-4 mb-6">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0"
        style={{ backgroundColor: accent }}>
        {n}
      </div>
      <div className="w-0.5 flex-1 mt-2" style={{ backgroundColor: `${accent}25` }} />
    </div>
    <div className="flex-1 pb-4">
      <p className="font-bold text-base mb-1" style={{ color: "#1a1a2e" }}>{title}</p>
      <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{body}</p>
    </div>
  </div>
);

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

  // ── TOP BAR ───────────────────────────────────────────────────────────────
  const TopBar = ({ title }: { title?: string }) => (
    <div className="shrink-0 flex items-center justify-between px-4 pt-10 pb-3 bg-white"
      style={{ borderBottom: "1px solid #f1f3f8" }}>
      <span className="font-black text-lg" style={{ color: ACCENT }}>
        {title || (booklet.propertyName || booklet.title)}
      </span>
      {availableLangs.length > 1 && (
        <div className="relative">
          <button onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border"
            style={{ borderColor: "#e5e7eb", color: "#374151" }}>
            <Globe className="w-3 h-3" /> {currentLang?.flag}
          </button>
          {showLangMenu && (
            <div className="absolute top-8 right-0 z-50 bg-white rounded-2xl shadow-xl py-1 min-w-[130px] border border-gray-100">
              {availableLangs.map((l) => (
                <button key={l.code} onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
                  style={{ color: lang === l.code ? ACCENT : "#374151", fontWeight: lang === l.code ? "700" : "400" }}>
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── TAB BAR ───────────────────────────────────────────────────────────────
  const TabBar = () => (
    <div className="shrink-0 bg-white border-t flex"
      style={{ borderColor: "#f1f3f8", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors"
            style={{ color: active ? ACCENT : "#9ca3af" }}>
            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-xs font-semibold">{label}</span>
            {active && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: ACCENT }} />}
          </button>
        );
      })}
    </div>
  );

  // ── TAB : ACCUEIL ─────────────────────────────────────────────────────────
  const TabHome = () => {
    const welcome = getM("welcome");
    const practical = getM("practical");
    const checkin = getM("checkin");

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: BG }}>
        <div className="px-4 pt-4 pb-6 space-y-3">

          {/* Hero photo */}
          <Card>
            <div className="relative rounded-2xl overflow-hidden" style={{ height: 200 }}>
              {bgUrl ? (
                <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              ) : (
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${ACCENT}80, ${ACCENT}40)` }} />
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)" }} />
              <div className="absolute bottom-0 left-0 p-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Bienvenue
                </p>
                <h1 className="font-black text-white text-xl leading-tight">
                  {booklet.propertyName || booklet.title}
                </h1>
              </div>
            </div>
          </Card>

          {/* Message de bienvenue */}
          {welcome && get("welcome", "message") && (
            <div className="rounded-2xl p-4" style={{ backgroundColor: ACCENT }}>
              <p className="text-sm leading-relaxed font-medium italic" style={{ color: "rgba(255,255,255,0.95)" }}>
                {get("welcome", "message")}
              </p>
            </div>
          )}

          {/* Procédure d'arrivée — badge "à lire en premier" */}
          {checkin && (
            <div className="relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                <span className="text-xs font-black uppercase tracking-wide px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: "#f97316" }}>
                  À lire en premier
                </span>
              </div>
              <Card>
                <button onClick={() => setActiveTab("checkin")}
                  className="w-full flex items-center gap-4 px-4 py-4 pt-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${ACCENT}15` }}>
                    <Key className="w-5 h-5" style={{ color: ACCENT }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm" style={{ color: "#1a1a2e" }}>Procédure d'arrivée</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>Codes, accès et étapes pour entrer dans le logement</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#d1d5db" }} />
                </button>
              </Card>
            </div>
          )}

          {/* Consigne importante (si note dans welcome) */}
          {welcome && get("welcome", "title") && (
            <div className="rounded-2xl p-4 flex items-start gap-3"
              style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
              <div>
                <p className="font-bold text-sm mb-0.5" style={{ color: "#92400e" }}>Consigne importante</p>
                <p className="text-sm leading-relaxed" style={{ color: "#b45309" }}>{get("welcome", "title")}</p>
              </div>
            </div>
          )}

          {/* Adresse */}
          {booklet.address && (
            <Card>
              <div className="px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Adresse</p>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                    <p className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>{booklet.address}</p>
                  </div>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booklet.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0 text-white"
                    style={{ backgroundColor: ACCENT }}>
                    Y aller ↗
                  </a>
                </div>
              </div>
            </Card>
          )}

          {/* Horaires check-in / check-out */}
          {checkin && (get("checkin", "checkin_time") || get("checkin", "checkout_time")) && (
            <Card>
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                {get("checkin", "checkin_time") && (
                  <div className="px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Arrivée</p>
                    <p className="font-black text-2xl" style={{ color: "#1a1a2e" }}>{get("checkin", "checkin_time")}</p>
                  </div>
                )}
                {get("checkin", "checkout_time") && (
                  <div className="px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Départ</p>
                    <p className="font-black text-2xl" style={{ color: "#1a1a2e" }}>{get("checkin", "checkout_time")}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* WiFi */}
          {practical && get("practical", "wifi_name") && (
            <Card>
              <div className="px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wifi className="w-4 h-4" style={{ color: ACCENT }} />
                  <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#9ca3af" }}>Wi-Fi</p>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: "#9ca3af" }}>Réseau</p>
                <p className="font-bold text-sm mb-3" style={{ color: "#1a1a2e" }}>{get("practical", "wifi_name")}</p>
                {get("practical", "wifi_password") && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: "#9ca3af" }}>Mot de passe</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm" style={{ color: "#1a1a2e" }}>{get("practical", "wifi_password")}</p>
                      <button onClick={() => copyToClipboard(get("practical", "wifi_password"))}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: copied ? "#22c55e" : "#9ca3af" }}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Contact propriétaire */}
          {getM("contacts") && get("contacts", "owner_name") && (
            <Card>
              <button onClick={() => setActiveTab("practical")} className="w-full flex items-center gap-4 px-4 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${ACCENT}15` }}>
                  <Phone className="w-5 h-5" style={{ color: ACCENT }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: "#9ca3af" }}>Contact</p>
                  <p className="font-bold text-sm" style={{ color: "#1a1a2e" }}>
                    {get("contacts", "owner_phone") ? "Afficher le numéro de téléphone" : get("contacts", "owner_name")}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#d1d5db" }} />
              </button>
            </Card>
          )}

          {/* Règles essentielles */}
          {getM("rules") && get("rules", "rules") && (
            <div>
              <h3 className="font-black text-base mb-3 px-1" style={{ color: "#1a1a2e" }}>Règles essentielles</h3>
              <div className="grid grid-cols-2 gap-2">
                {get("rules", "rules").split("\n").filter(Boolean).slice(0, 6).map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      <span className="text-base">{["🚭", "🔇", "🐾", "👟", "♻️", "🔒"][i] || "✓"}</span>
                    </div>
                    <p className="text-xs font-medium leading-tight" style={{ color: "#374151" }}>{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Check-in en ligne */}
          <button onClick={() => setShowCheckIn(true)}
            className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-2xl"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: ACCENT }}>
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm" style={{ color: "#1a1a2e" }}>Check-in en ligne</p>
              <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>Enregistrez votre arrivée</p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#d1d5db" }} />
          </button>
        </div>
      </div>
    );
  };

  // ── TAB : PRATIQUE ────────────────────────────────────────────────────────
  const TabPractical = () => {
    const [openSection, setOpenSection] = useState<string | null>(null);
    const guide = getM("guide");
    const contacts = getM("contacts");
    const faq = getM("faq");
    const rules = getM("rules");
    const checkin = getM("checkin");

    const accordion = (id: string, icon: string, title: string, content: string) => {
      if (!content) return null;
      const open = openSection === id;
      return (
        <Card className="mb-2">
          <button onClick={() => setOpenSection(open ? null : id)}
            className="w-full flex items-center gap-3 px-4 py-4">
            <span className="text-xl shrink-0">{icon}</span>
            <p className="font-semibold text-sm flex-1 text-left" style={{ color: "#1a1a2e" }}>{title}</p>
            <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
              style={{ color: "#d1d5db" }} />
          </button>
          {open && (
            <div className="px-4 pb-4 border-t" style={{ borderColor: "#f1f3f8" }}>
              <p className="text-sm leading-relaxed pt-3 whitespace-pre-line" style={{ color: "#6b7280" }}>{content}</p>
            </div>
          )}
        </Card>
      );
    };

    // Urgences
    const emergencyNumbers = [
      { label: "SAMU", number: "15" },
      { label: "Pompiers", number: "18" },
      { label: "Police", number: "17" },
      { label: "Urgences (EU)", number: "112" },
    ];

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: BG }}>
        <div className="px-4 pt-5 pb-6">
          <h2 className="font-black text-2xl mb-1" style={{ color: "#1a1a2e" }}>Infos pratiques</h2>
          <p className="text-sm mb-5" style={{ color: "#9ca3af" }}>Tout ce qu'il faut savoir pour un séjour serein.</p>

          {/* Accordéons */}
          {accordion("rules", "📋", "Règles de la maison", get("rules", "rules"))}
          {accordion("guide_trash", "♻️", "Éco-responsabilité", get("guide", "trash"))}
          {accordion("faq", "ℹ️", "Bon à savoir", get("faq", "faq"))}
          {accordion("guide_heating", "🌡️", "Chauffage", get("guide", "heating"))}
          {accordion("guide_appliances", "🍳", "Électroménager", get("guide", "appliances"))}
          {accordion("guide_other", "🏠", "Autres infos", get("guide", "other"))}

          {/* Heure de départ */}
          {get("checkin", "checkout_time") && (
            <Card className="mb-4 mt-4">
              <div className="px-4 py-5 text-center">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>
                  Procédure de départ
                </p>
                <p className="font-black" style={{ fontSize: 48, color: ACCENT, lineHeight: 1 }}>
                  {get("checkin", "checkout_time")}
                </p>
                <p className="text-xs mt-2" style={{ color: "#9ca3af" }}>Heure de check-out à respecter</p>
              </div>
            </Card>
          )}

          {/* Étapes de départ */}
          {get("checkin", "checkout_process") && (
            <div className="mb-4">
              {get("checkin", "checkout_process").split("\n").filter(Boolean).map((step, i) => (
                <Step key={i} n={i + 1} title={step} body="" accent={ACCENT} />
              ))}
            </div>
          )}

          {/* Contact */}
          {get("contacts", "owner_name") && (
            <Card className="mb-4">
              <div className="px-4 py-4">
                <p className="font-bold text-sm mb-2" style={{ color: "#1a1a2e" }}>{get("contacts", "owner_name")}</p>
                {get("contacts", "owner_phone") && (
                  <a href={`tel:${get("contacts", "owner_phone")}`}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
                    style={{ backgroundColor: ACCENT }}>
                    <Phone className="w-4 h-4" /> {get("contacts", "owner_phone")}
                  </a>
                )}
              </div>
            </Card>
          )}

          {/* Urgences */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="w-4 h-4" style={{ color: "#ef4444" }} />
              <h3 className="font-black text-base" style={{ color: "#1a1a2e" }}>Numéros d'urgence</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {emergencyNumbers.map((e) => (
                <div key={e.label} className="bg-white rounded-xl flex items-center justify-between px-4 py-3"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <span className="text-sm font-medium" style={{ color: "#374151" }}>{e.label}</span>
                  <a href={`tel:${e.number}`} className="font-black text-base" style={{ color: "#ef4444" }}>{e.number}</a>
                </div>
              ))}
            </div>
          </div>

          {/* Urgence custom */}
          {get("contacts", "emergency") && (
            <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#dc2626" }}>🚨 Urgence</p>
              <p className="text-sm whitespace-pre-line" style={{ color: "#b91c1c" }}>{get("contacts", "emergency")}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── TAB : ARRIVÉE ─────────────────────────────────────────────────────────
  const TabCheckin = () => {
    const mod = getM("checkin");
    const photos = mod?.images ?? [];

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: BG }}>
        <div className="px-4 pt-5 pb-6">
          <h2 className="font-black text-2xl mb-1" style={{ color: "#1a1a2e" }}>Arrivée</h2>
          <p className="text-sm mb-5" style={{ color: "#9ca3af" }}>Suivez ces étapes pour accéder au logement.</p>

          {/* Adresse + bouton Y aller */}
          {booklet.address && (
            <Card className="mb-4">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${ACCENT}15` }}>
                  <MapPin className="w-4 h-4" style={{ color: ACCENT }} />
                </div>
                <p className="text-sm font-semibold flex-1 truncate" style={{ color: "#1a1a2e" }}>{booklet.address}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booklet.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-full text-white shrink-0"
                  style={{ backgroundColor: ACCENT }}>
                  Y aller ↗
                </a>
              </div>
            </Card>
          )}

          {/* Horaires */}
          {(get("checkin", "checkin_time") || get("checkin", "checkout_time")) && (
            <Card className="mb-4">
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                {get("checkin", "checkin_time") && (
                  <div className="px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Arrivée</p>
                    <p className="font-black text-3xl" style={{ color: "#1a1a2e" }}>{get("checkin", "checkin_time")}</p>
                  </div>
                )}
                {get("checkin", "checkout_time") && (
                  <div className="px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Départ</p>
                    <p className="font-black text-3xl" style={{ color: "#1a1a2e" }}>{get("checkin", "checkout_time")}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Étapes d'arrivée numérotées */}
          {get("checkin", "checkin_process") && (
            <div className="mb-4">
              {get("checkin", "checkin_process").split("\n").filter(Boolean).map((step, i) => (
                <div key={i} className="flex gap-4 mb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0"
                      style={{ backgroundColor: ACCENT }}>
                      {i + 1}
                    </div>
                    {i < get("checkin", "checkin_process").split("\n").filter(Boolean).length - 1 && (
                      <div className="w-0.5 flex-1 mt-2 mb-0" style={{ backgroundColor: `${ACCENT}25`, minHeight: 24 }} />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="font-bold text-sm mb-1" style={{ color: "#1a1a2e" }}>{step}</p>
                    {/* Photo associée */}
                    {photos[i] && (
                      <div className="mt-2 rounded-2xl overflow-hidden aspect-video">
                        <img src={photos[i]} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Code porte */}
          {get("practical", "door_code") && (
            <Card className="mb-4">
              <div className="px-4 py-5 text-center">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>Code d'entrée</p>
                <p className="font-black tracking-[0.3em]" style={{ fontSize: 48, color: ACCENT, lineHeight: 1 }}>
                  {get("practical", "door_code")}
                </p>
              </div>
            </Card>
          )}

          {/* Documents */}
          {getM("checkin")?.documents?.map((doc, i) => (
            <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer">
              <Card className="mb-2">
                <div className="flex items-center gap-3 px-4 py-3">
                  <FileText className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                  <span className="text-sm font-semibold flex-1 truncate" style={{ color: "#1a1a2e" }}>{doc.name}</span>
                  <Download className="w-4 h-4 shrink-0" style={{ color: "#9ca3af" }} />
                </div>
              </Card>
            </a>
          ))}
        </div>
      </div>
    );
  };

  // ── TAB : QUARTIER ────────────────────────────────────────────────────────
  const TabNeighborhood = () => {
    const activities = getM("activities");
    const gooddeals = getM("gooddeals");
    const transport = getM("transport");

    const PlaceList = ({ title, icon, items }: { title: string; icon: string; items: { name: string; address: string }[] }) => (
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">{icon}</span>
          <h3 className="font-black text-base" style={{ color: "#1a1a2e" }}>{title}</h3>
        </div>
        {items.map((p, i) => (
          <Card key={i} className="mb-2">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                <MapPin className="w-5 h-5" style={{ color: ACCENT }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: "#1a1a2e" }}>{p.name}</p>
                {p.address && <p className="text-xs mt-0.5 truncate" style={{ color: ACCENT }}>{p.address}</p>}
              </div>
              {p.address && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="shrink-0 p-2 rounded-full"
                  style={{ backgroundColor: `${ACCENT}12` }}>
                  <MapPin className="w-4 h-4" style={{ color: ACCENT }} />
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    );

    const actPlaces = activities && get("activities", "places") ? parsePlaces(get("activities", "places")) : [];
    const gdPlaces = gooddeals && get("gooddeals", "places") ? parsePlaces(get("gooddeals", "places")) : [];

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: BG }}>
        <div className="px-4 pt-5 pb-6">
          <h2 className="font-black text-2xl mb-1" style={{ color: "#1a1a2e" }}>Explorer le quartier</h2>
          <p className="text-sm mb-5" style={{ color: "#9ca3af" }}>Nos adresses préférées autour du logement.</p>

          {/* Lien Google Maps */}
          {booklet.address && (
            <Card className="mb-5">
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booklet.address)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold"
                style={{ color: ACCENT }}>
                <MapPin className="w-4 h-4" /> Ouvrir dans Maps ↗
              </a>
            </Card>
          )}

          {actPlaces.length > 0 && <PlaceList title="À faire" icon="🎉" items={actPlaces} />}
          {gdPlaces.length > 0 && <PlaceList title="Restaurants" icon="🍽️" items={gdPlaces} />}

          {gooddeals && get("gooddeals", "restaurants") && (
            <Card className="mb-4">
              <div className="px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#9ca3af" }}>Restaurants</p>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#374151" }}>{get("gooddeals", "restaurants")}</p>
              </div>
            </Card>
          )}

          {gooddeals && get("gooddeals", "shops") && (
            <Card className="mb-4">
              <div className="px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#9ca3af" }}>Commerces</p>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#374151" }}>{get("gooddeals", "shops")}</p>
              </div>
            </Card>
          )}

          {transport && (
            <div className="mb-4">
              <h3 className="font-black text-base mb-3" style={{ color: "#1a1a2e" }}>Transports</h3>
              {get("transport", "by_car") && (
                <Card className="mb-2">
                  <div className="px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#9ca3af" }}>🚗 En voiture</p>
                    <p className="text-sm" style={{ color: "#374151" }}>{get("transport", "by_car")}</p>
                  </div>
                </Card>
              )}
              {get("transport", "by_train") && (
                <Card className="mb-2">
                  <div className="px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#9ca3af" }}>🚆 En train</p>
                    <p className="text-sm" style={{ color: "#374151" }}>{get("transport", "by_train")}</p>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── TAB : ÉQUIPEMENTS ─────────────────────────────────────────────────────
  const TabEquipment = () => {
    const [selected, setSelected] = useState<string | null>(null);
    const guide = getM("guide");
    if (!guide) return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: BG }}>
        <p className="text-sm" style={{ color: "#9ca3af" }}>Aucun équipement renseigné</p>
      </div>
    );

    const items = [
      { id: "heating", icon: "🌡️", title: "Chauffage", content: get("guide", "heating") },
      { id: "appliances", icon: "🍳", title: "Électroménager", content: get("guide", "appliances") },
      { id: "trash", icon: "♻️", title: "Tri des déchets", content: get("guide", "trash") },
      { id: "other", icon: "🏠", title: "Autres", content: get("guide", "other") },
    ].filter((i) => i.content);

    const photos = guide.images ?? [];

    if (selected) {
      const item = items.find((i) => i.id === selected)!;
      return (
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: BG }}>
          <div className="px-4 pt-5 pb-6">
            <button onClick={() => setSelected(null)}
              className="flex items-center gap-1.5 text-sm font-semibold mb-5"
              style={{ color: ACCENT }}>
              <ArrowLeft className="w-4 h-4" /> Retour aux équipements
            </button>
            <h2 className="font-black text-2xl mb-4" style={{ color: "#1a1a2e" }}>{item.title}</h2>
            {photos[0] && (
              <Card className="mb-4">
                <div className="aspect-video overflow-hidden rounded-2xl">
                  <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                </div>
              </Card>
            )}
            <Card>
              <div className="px-4 py-4">
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#374151" }}>{item.content}</p>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: BG }}>
        <div className="px-4 pt-5 pb-6">
          <h2 className="font-black text-2xl mb-1" style={{ color: "#1a1a2e" }}>Équipements</h2>
          <p className="text-sm mb-5" style={{ color: "#9ca3af" }}>Les guides d'utilisation des équipements du logement.</p>

          <div className="grid grid-cols-2 gap-3">
            {items.map((item, i) => (
              <button key={item.id} onClick={() => setSelected(item.id)}
                className="flex flex-col text-left overflow-hidden bg-white rounded-2xl transition-all active:scale-95"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                {photos[i] && (
                  <div className="w-full aspect-video overflow-hidden">
                    <img src={photos[i]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {!photos[i] && (
                  <div className="w-full aspect-video flex items-center justify-center text-4xl"
                    style={{ backgroundColor: `${ACCENT}10` }}>
                    {item.icon}
                  </div>
                )}
                <div className="px-3 py-2.5">
                  <p className="font-semibold text-sm" style={{ color: "#1a1a2e" }}>{item.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      {showCheckIn && (
        <CheckInForm bookletId={booklet.id} accent={ACCENT} theme="light" onClose={() => setShowCheckIn(false)} />
      )}
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: BG, fontFamily: SANS }}>
        <TopBar />
        {activeTab === "home" && <TabHome />}
        {activeTab === "practical" && <TabPractical />}
        {activeTab === "checkin" && <TabCheckin />}
        {activeTab === "neighborhood" && <TabNeighborhood />}
        {activeTab === "equipment" && <TabEquipment />}
        <TabBar />
      </div>
    </>
  );
}
