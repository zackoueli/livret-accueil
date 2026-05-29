"use client";

import { useState, useEffect } from "react";
import { Booklet } from "@/types";
import { MODULE_META } from "@/lib/modules";
import { getContent, parsePlaces, getAvailableLangs, formatTime } from "./viewerUtils";
import { CheckInFormInline } from "./CheckInForm";
import {
  Star, Phone, Globe, ChevronRight, ArrowLeft,
  Wifi, Key, MapPin, AlertTriangle, Copy, Check,
  FileText, Download, Settings,
  Wrench, Info, Utensils, Compass,
} from "lucide-react";
import { getPalette } from "@/lib/palettes";

const FONT = "-apple-system, 'SF Pro Text', system-ui, sans-serif";

// Couleurs Orée — beige chaud iOS
const BG      = "#f5f0e8";
const CARD    = "#ffffff";
const DARK    = "#1a1613";
const MUTED   = "#6b6155";
const BORDER  = "#e8e0d4";
const SEPIA   = "#c9bfad";

// Tab IDs — basé sur le style Maison Orée
type TabId = "home" | "phone" | "services" | "compass" | "tools" | "lang";

const TABS: { id: TabId; icon: React.ElementType; label: string }[] = [
  { id: "home",     icon: Star,    label: "Accueil"  },
  { id: "phone",    icon: Phone,   label: "Contact"  },
  { id: "services", icon: Utensils,label: "Services" },
  { id: "compass",  icon: Compass, label: "Quartier" },
  { id: "tools",    icon: Wrench,  label: "Pratique" },
];

// Widget card avec photo en fond + label noir translucide
const PhotoCard = ({
  photo, label, onClick, tall = false,
}: {
  photo?: string; label: string; onClick?: () => void; tall?: boolean;
}) => (
  <button onClick={onClick}
    className={`relative overflow-hidden rounded-2xl text-left active:scale-95 transition-transform ${tall ? "aspect-[4/3]" : "aspect-square"}`}
    style={{ backgroundColor: photo ? "transparent" : `${SEPIA}40` }}>
    {photo ? (
      <div className="absolute inset-0"
        style={{ backgroundImage: `url(${photo})`, backgroundSize: "cover", backgroundPosition: "center" }} />
    ) : (
      <div className="absolute inset-0" style={{ backgroundColor: `${SEPIA}30` }} />
    )}
    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
    <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: "17px" }}>{label}</p>
    </div>
  </button>
);

export function ViewerOree({ booklet }: { booklet: Booklet }) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [lang, setLang] = useState(booklet.defaultLanguage || "fr");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const _p = { ...getPalette(booklet.paletteId ?? "sable"), ...booklet.customPalette };
  const A = _p.primary;

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

  // ── TOP BAR ───────────────────────────────────────────────────────────────
  const TopBar = ({ title, onBack }: { title?: string; onBack?: () => void }) => (
    <div className="shrink-0 flex items-center justify-between px-4 pt-12 pb-3"
      style={{ backgroundColor: BG }}>
      {onBack ? (
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: A }}>
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: A }}>
            <Star className="w-3.5 h-3.5 text-white" />
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: DARK }}>
            {title || booklet.propertyName || booklet.title}
          </p>
        </div>
      )}
      {availableLangs.length > 1 && (
        <div className="relative">
          <button onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ border: `1px solid ${BORDER}`, color: MUTED, backgroundColor: CARD }}>
            {currentLang?.flag} {currentLang?.label?.slice(0, 2)}
          </button>
          {showLangMenu && (
            <div className="absolute top-9 right-0 z-50 rounded-2xl overflow-hidden"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 150 }}>
              {availableLangs.map((l, i) => (
                <div key={l.code}>
                  <button onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5">
                    <span style={{ fontSize: 14, color: DARK }}>{l.flag} {l.label}</span>
                    {lang === l.code && <Check className="w-3.5 h-3.5" style={{ color: A }} />}
                  </button>
                  {i < availableLangs.length - 1 && (
                    <div style={{ height: 1, backgroundColor: BORDER }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── TAB BAR ───────────────────────────────────────────────────────────────
  const TabBar = () => (
    <div className="shrink-0 flex"
      style={{ backgroundColor: BG, borderTop: `1px solid ${BORDER}`, paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
      {TABS.map(({ id, icon: Icon, label }) => {
        const active = activeTab === id;
        return (
          <button key={id} onClick={() => { setActiveTab(id); setActiveModule(null); }}
            className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-1 active:opacity-50 transition-opacity">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${active ? "" : ""}`}
              style={{ backgroundColor: active ? A : "transparent" }}>
              <Icon className="w-5 h-5" strokeWidth={active ? 2 : 1.5}
                style={{ color: active ? "#fff" : MUTED }} />
            </div>
            <span style={{ fontSize: 10, color: active ? A : MUTED, fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ── HOME ──────────────────────────────────────────────────────────────────
  const TabHome = () => {
    const photos = enabledModules.flatMap((m) => m.images ?? []).slice(0, 6);

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: BG }}>
        {/* Hero sombre */}
        <div className="relative overflow-hidden" style={{ height: 200 }}>
          {bgUrl ? (
            <div className="absolute inset-0"
              style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          ) : (
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #2d2420 0%, #1a1613 100%)" }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26,22,19,0.3) 0%, rgba(26,22,19,0.6) 100%)" }} />
          <div className="absolute bottom-0 left-0 p-5">
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 4 }}>
              {booklet.propertyName || booklet.title}
            </p>
            <p style={{ fontSize: 34, fontWeight: 700, color: "#fff", lineHeight: "40px", letterSpacing: -0.5 }}>
              {sp.customTitle || "Mon séjour"}
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
              {sp.customSubtitle || "Infos, contacts, recommandations."}
            </p>
          </div>
        </div>

        {/* Card identité logement */}
        <div className="mx-4 mt-4">
          <div className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 mb-1"
            style={{ border: `1px solid ${BORDER}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${A}18` }}>
              <Star className="w-5 h-5" style={{ color: A }} />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 15, fontWeight: 600, color: DARK }}>{booklet.propertyName || booklet.title}</p>
              <p style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>
                {booklet.description || "Livret d'accueil, services et informations."}
              </p>
            </div>
          </div>
        </div>

        {/* Section "Pendant votre séjour" */}
        <div className="px-4 mt-5">
          <p style={{ fontSize: 13, fontWeight: 600, color: MUTED, marginBottom: 10 }}>Pendant votre séjour</p>

          {/* Grille de widgets avec photos */}
          <div className="space-y-3">
            {/* Grande card — 1er module */}
            {enabledModules[0] && (
              <PhotoCard
                photo={enabledModules[0].images?.[0] || bgUrl}
                label={MODULE_META[enabledModules[0].type].label}
                tall
                onClick={() => { setActiveModule(enabledModules[0].type); setActiveTab("services"); }}
              />
            )}

            {/* 2 cards côte à côte */}
            {enabledModules.length > 1 && (
              <div className="grid grid-cols-2 gap-3">
                {enabledModules.slice(1, 3).map((m) => (
                  <PhotoCard key={m.id}
                    photo={m.images?.[0]}
                    label={MODULE_META[m.type].label}
                    onClick={() => { setActiveModule(m.type); setActiveTab("services"); }}
                  />
                ))}
              </div>
            )}

            {/* 2 cards côte à côte suivantes */}
            {enabledModules.length > 3 && (
              <div className="grid grid-cols-2 gap-3">
                {enabledModules.slice(3, 5).map((m) => (
                  <PhotoCard key={m.id}
                    photo={m.images?.[0]}
                    label={MODULE_META[m.type].label}
                    onClick={() => { setActiveModule(m.type); setActiveTab("services"); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    );
  };

  // ── CONTACT ───────────────────────────────────────────────────────────────
  const TabPhone = () => (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: BG }}>
      <div className="px-4 pt-4 pb-6">
        <p style={{ fontSize: 26, fontWeight: 700, color: DARK, marginBottom: 4 }}>Contact</p>
        <p style={{ fontSize: 14, color: MUTED, marginBottom: 16 }}>Joignez-nous à tout moment.</p>

        {get("contacts", "owner_name") && (
          <div className="bg-white rounded-2xl overflow-hidden mb-3" style={{ border: `1px solid ${BORDER}` }}>
            <div className="px-4 py-4">
              <p style={{ fontSize: 17, fontWeight: 600, color: DARK, marginBottom: 12 }}>
                {get("contacts", "owner_name")}
              </p>
              {get("contacts", "owner_phone") && (
                <a href={`tel:${get("contacts", "owner_phone")}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl"
                  style={{ backgroundColor: A }}>
                  <Phone className="w-4 h-4 text-white" />
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
                    {get("contacts", "owner_phone")}
                  </span>
                </a>
              )}
            </div>
          </div>
        )}

        {get("practical", "wifi_name") && (
          <div className="bg-white rounded-2xl px-4 py-4 mb-3" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 mb-3">
              <Wifi className="w-4 h-4" style={{ color: A }} />
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: MUTED, textTransform: "uppercase" }}>Wi-Fi</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: BG }}>
                <p style={{ fontSize: 11, color: MUTED }}>Réseau</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: DARK, marginTop: 2 }}>{get("practical", "wifi_name")}</p>
              </div>
              {get("practical", "wifi_password") && (
                <div className="rounded-xl px-3 py-2.5 relative" style={{ backgroundColor: BG }}>
                  <p style={{ fontSize: 11, color: MUTED }}>Mot de passe</p>
                  <p style={{ fontSize: 13, fontFamily: "monospace", color: A, marginTop: 2, paddingRight: 20 }}>
                    {get("practical", "wifi_password")}
                  </p>
                  <button onClick={() => copy(get("practical", "wifi_password"))}
                    className="absolute top-2 right-2" style={{ color: copied ? "#34c759" : SEPIA }}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Urgences */}
        <p style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 8, marginTop: 16 }}>
          Numéros d'urgence
        </p>
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          {[
            { label: "SAMU", n: "15" }, { label: "Pompiers", n: "18" },
            { label: "Police", n: "17" }, { label: "Urgences (EU)", n: "112" },
          ].map((e, i, arr) => (
            <div key={e.label}>
              <div className="flex items-center justify-between px-4 py-3.5">
                <p style={{ fontSize: 15, color: DARK }}>{e.label}</p>
                <a href={`tel:${e.n}`} style={{ fontSize: 20, fontWeight: 700, color: "#ef4444" }}>{e.n}</a>
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, backgroundColor: BORDER, marginLeft: 16 }} />}
            </div>
          ))}
        </div>

        {get("contacts", "emergency") && (
          <div className="mt-3 rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{ backgroundColor: "#fff5f5", border: "1px solid #fecaca" }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
            <p style={{ fontSize: 14, color: "#cc0000", lineHeight: "20px" }}>{get("contacts", "emergency")}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── SERVICES (modules détaillés) ──────────────────────────────────────────
  const TabServices = () => {
    const [selected, setSelected] = useState<string | null>(activeModule);

    useEffect(() => { setSelected(activeModule); }, [activeModule]);

    if (selected) {
      const mod = enabledModules.find((m) => m.type === selected);
      if (!mod) return null;
      const meta = MODULE_META[mod.type];
      const photos = mod.images ?? [];
      const docs = mod.documents ?? [];
      const g = (key: string) => getContent(booklet, mod.id, key, lang);

      const Field = ({ label, value }: { label: string; value: string }) => {
        if (!value) return null;
        return (
          <div className="px-4 py-3.5 border-b last:border-0" style={{ borderColor: BORDER }}>
            <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              {label}
            </p>
            <p style={{ fontSize: 15, color: DARK, lineHeight: "22px", whiteSpace: "pre-wrap" }}>{value}</p>
          </div>
        );
      };

      const renderFields = () => {
        switch (mod.type) {
          case "practical": return <>
            {g("wifi_name") && (
              <div className="px-4 py-4 border-b" style={{ borderColor: BORDER }}>
                <div className="flex items-center gap-2 mb-3">
                  <Wifi className="w-4 h-4" style={{ color: A }} />
                  <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>Wi-Fi</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: BG }}>
                    <p style={{ fontSize: 11, color: MUTED }}>Réseau</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: DARK, marginTop: 2 }}>{g("wifi_name")}</p>
                  </div>
                  {g("wifi_password") && (
                    <div className="rounded-xl px-3 py-2.5 relative" style={{ backgroundColor: BG }}>
                      <p style={{ fontSize: 11, color: MUTED }}>Mot de passe</p>
                      <p style={{ fontSize: 13, fontFamily: "monospace", color: A, marginTop: 2, paddingRight: 20 }}>{g("wifi_password")}</p>
                      <button onClick={() => copy(g("wifi_password"))} className="absolute top-2 right-2"
                        style={{ color: copied ? "#34c759" : SEPIA }}>
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {g("door_code") && (
              <div className="px-4 py-5 text-center border-b" style={{ borderColor: BORDER }}>
                <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Code d'entrée</p>
                <p style={{ fontSize: 52, fontWeight: 700, color: A, letterSpacing: 8 }}>{g("door_code")}</p>
              </div>
            )}
            <Field label="Parking" value={g("parking")} />
            <Field label="Autres infos" value={g("other")} />
          </>;
          case "checkin": return <>
            {(g("checkin_time") || g("checkout_time")) && (
              <div className="flex divide-x border-b" style={{ borderColor: BORDER }}>
                {g("checkin_time") && (
                  <div className="flex-1 px-4 py-4">
                    <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>Arrivée</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: DARK, letterSpacing: -0.5, marginTop: 4 }}>{formatTime(g("checkin_time"))}</p>
                  </div>
                )}
                {g("checkout_time") && (
                  <div className="flex-1 px-4 py-4">
                    <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>Départ</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: DARK, letterSpacing: -0.5, marginTop: 4 }}>{formatTime(g("checkout_time"))}</p>
                  </div>
                )}
              </div>
            )}
            <Field label="Procédure d'arrivée" value={g("checkin_process")} />
            <Field label="Procédure de départ" value={g("checkout_process")} />
            <CheckInFormInline bookletId={booklet.id} accent={A} theme="light" />
          </>;
          default: return <>
            {Object.entries(mod.content).map(([key, val]) => val ? (
              <Field key={key} label={key.replace(/_/g, " ")} value={val as string} />
            ) : null)}
          </>;
        }
      };

      return (
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: BG }}>
          <div className="px-4 pt-4 pb-6">
            <button onClick={() => { setSelected(null); setActiveModule(null); }}
              className="flex items-center gap-1.5 mb-4 text-sm font-medium" style={{ color: A }}>
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span style={{ fontSize: 32 }}>{meta.emoji}</span>
              <div>
                <p style={{ fontSize: 22, fontWeight: 700, color: DARK }}>{meta.label}</p>
                <p style={{ fontSize: 13, color: MUTED }}>{meta.description}</p>
              </div>
            </div>

            {photos[0] && (
              <div className="rounded-2xl overflow-hidden mb-4"
                style={{ aspectRatio: "16/9", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                <img src={photos[0]} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="bg-white rounded-2xl overflow-hidden mb-3" style={{ border: `1px solid ${BORDER}` }}>
              {renderFields()}
            </div>

            {docs.map((doc, i) => (
              <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer">
                <div className="bg-white rounded-2xl flex items-center gap-3 px-4 py-3.5 mb-2"
                  style={{ border: `1px solid ${BORDER}` }}>
                  <FileText className="w-4 h-4 shrink-0" style={{ color: A }} />
                  <span style={{ fontSize: 14, color: DARK, flex: 1 }}>{doc.name}</span>
                  <Download className="w-4 h-4 shrink-0" style={{ color: SEPIA }} />
                </div>
              </a>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: BG }}>
        <div className="px-4 pt-4 pb-6">
          <p style={{ fontSize: 26, fontWeight: 700, color: DARK, marginBottom: 4 }}>Services</p>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 16 }}>Tout ce dont vous avez besoin.</p>

          <div className="space-y-2">
            {enabledModules.map((m) => {
              const meta = MODULE_META[m.type];
              const hasContent = Object.keys(m.content).some((k) => m.content[k]);
              return (
                <button key={m.id} onClick={() => setSelected(m.type)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl text-left active:opacity-70 transition-opacity"
                  style={{ border: `1px solid ${BORDER}` }}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: hasContent ? `${A}15` : `${SEPIA}20` }}>
                    <span style={{ fontSize: 20 }}>{meta.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 15, fontWeight: 500, color: DARK }}>{meta.label}</p>
                    <p style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{meta.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: SEPIA }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── QUARTIER ──────────────────────────────────────────────────────────────
  const TabCompass = () => {
    const actPlaces = get("activities", "places") ? parsePlaces(get("activities", "places")) : [];
    const gdPlaces  = get("gooddeals", "places")  ? parsePlaces(get("gooddeals", "places"))  : [];
    const all = [...actPlaces, ...gdPlaces];

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: BG }}>
        <div className="px-4 pt-4 pb-6">
          <p style={{ fontSize: 26, fontWeight: 700, color: DARK, marginBottom: 4 }}>Quartier</p>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 16 }}>Nos recommandations autour de vous.</p>

          {booklet.address && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booklet.address)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl mb-3 active:opacity-70"
              style={{ border: `1px solid ${BORDER}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${A}15` }}>
                <MapPin className="w-4 h-4" style={{ color: A }} />
              </div>
              <p style={{ fontSize: 14, color: DARK, flex: 1 }}>{booklet.address}</p>
              <span style={{ fontSize: 13, fontWeight: 600, color: A }}>Maps →</span>
            </a>
          )}

          {all.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl px-4 py-4 mb-2"
              style={{ border: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: DARK }}>{p.name}</p>
              {p.address && <p style={{ fontSize: 13, color: A, marginTop: 2 }}>{p.address}</p>}
              {p.address && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${A}15`, color: A }}>
                  Itinéraire
                </a>
              )}
            </div>
          ))}

          {get("gooddeals", "restaurants") && (
            <div className="bg-white rounded-2xl px-4 py-4 mb-2" style={{ border: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                Restaurants
              </p>
              <p style={{ fontSize: 15, color: DARK, lineHeight: "22px", whiteSpace: "pre-wrap" }}>
                {get("gooddeals", "restaurants")}
              </p>
            </div>
          )}

          {!all.length && !get("gooddeals", "restaurants") && (
            <div className="text-center py-16">
              <p style={{ fontSize: 15, color: MUTED }}>Aucune adresse renseignée</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── PRATIQUE ──────────────────────────────────────────────────────────────
  const TabTools = () => {
    const [openId, setOpenId] = useState<string | null>(null);

    const items = [
      { id: "rules",     emoji: "📋", label: "Règles de la maison",  content: get("rules", "rules") },
      { id: "eco",       emoji: "♻️", label: "Éco-responsabilité",   content: get("guide", "trash") },
      { id: "faq",       emoji: "ℹ️", label: "FAQ",                   content: get("faq", "faq") },
      { id: "heating",   emoji: "🌡️", label: "Chauffage",             content: get("guide", "heating") },
      { id: "appliance", emoji: "🍳", label: "Électroménager",        content: get("guide", "appliances") },
      { id: "other",     emoji: "🏠", label: "Autres infos",          content: get("guide", "other") },
    ].filter((i) => i.content);

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: BG }}>
        <div className="px-4 pt-4 pb-6">
          <p style={{ fontSize: 26, fontWeight: 700, color: DARK, marginBottom: 4 }}>Infos pratiques</p>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 16 }}>Tout pour un séjour serein.</p>

          {/* Horaires */}
          {(get("checkin", "checkin_time") || get("checkin", "checkout_time")) && (
            <div className="bg-white rounded-2xl overflow-hidden mb-3" style={{ border: `1px solid ${BORDER}` }}>
              <div className="flex divide-x" style={{ borderColor: BORDER }}>
                {get("checkin", "checkin_time") && (
                  <div className="flex-1 px-5 py-4">
                    <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>Arrivée</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: DARK, letterSpacing: -0.5, marginTop: 4 }}>
                      {get("checkin", "checkin_time")}
                    </p>
                  </div>
                )}
                {get("checkin", "checkout_time") && (
                  <div className="flex-1 px-5 py-4">
                    <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>Départ</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: DARK, letterSpacing: -0.5, marginTop: 4 }}>
                      {get("checkin", "checkout_time")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Code d'entrée */}
          {get("practical", "door_code") && (
            <div className="bg-white rounded-2xl px-4 py-5 text-center mb-3" style={{ border: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                Code d'entrée
              </p>
              <p style={{ fontSize: 52, fontWeight: 700, color: A, letterSpacing: 8 }}>
                {get("practical", "door_code")}
              </p>
            </div>
          )}

          {/* Accordéons */}
          {items.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden mb-3" style={{ border: `1px solid ${BORDER}` }}>
              {items.map((item, i) => {
                const open = openId === item.id;
                return (
                  <div key={item.id}>
                    <button onClick={() => setOpenId(open ? null : item.id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-stone-50 transition-colors">
                      <span style={{ fontSize: 19, width: 24, textAlign: "center" }}>{item.emoji}</span>
                      <p style={{ fontSize: 15, color: DARK, flex: 1, textAlign: "left" }}>{item.label}</p>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                        style={{ color: SEPIA }} />
                    </button>
                    {open && (
                      <div className="px-4 pb-4 pt-1" style={{ backgroundColor: "#faf8f5", borderTop: `1px solid ${BORDER}` }}>
                        <p style={{ fontSize: 15, color: DARK, lineHeight: "22px", whiteSpace: "pre-wrap" }}>
                          {item.content}
                        </p>
                      </div>
                    )}
                    {i < items.length - 1 && <div style={{ height: 1, backgroundColor: BORDER, marginLeft: 52 }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  const titles: Record<TabId, string> = {
    home:     booklet.propertyName || booklet.title || "Accueil",
    phone:    "Contact",
    services: "Services",
    compass:  "Quartier",
    tools:    "Pratique",
    lang:     "Langue",
  };

  return (
    <>
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: BG, fontFamily: FONT }}>
        <TopBar title={activeTab !== "home" ? titles[activeTab] : undefined}
          onBack={activeTab !== "home" ? undefined : undefined} />
        {activeTab === "home"     && <TabHome />}
        {activeTab === "phone"    && <TabPhone />}
        {activeTab === "services" && <TabServices />}
        {activeTab === "compass"  && <TabCompass />}
        {activeTab === "tools"    && <TabTools />}
        <TabBar />
      </div>
    </>
  );
}
