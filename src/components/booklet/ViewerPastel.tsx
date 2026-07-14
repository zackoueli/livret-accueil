"use client";

import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { Booklet, BookletModule, SupportedLang, SUPPORTED_LANGS, Plan } from "@/types";
import { t, I18nKey } from "@/lib/i18n";
import { formatTime, parseActivities, Activity } from "@/lib/modules";
import {
  Wifi, Key, ScrollText,
  Shield, Phone, Star, MapPin, Clock, Navigation,
  Check, Copy, Globe, X, ChevronRight,
  Baby, Dog, Waves, Briefcase, Info, Bus,
  Users, Volume2, Cigarette, PartyPopper,
  Home, LogOut, QrCode, Sun, Heart,
} from "lucide-react";

// ─── i18n Context ─────────────────────────────────────────────────────────────

const LangCtx = createContext<SupportedLang>("fr");
function useT() {
  const lang = useContext(LangCtx);
  return (key: I18nKey) => t(lang, key);
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function g(mod: BookletModule | undefined, key: string) {
  return mod?.content[key] ?? "";
}

function useMod(booklet: Booklet, type: BookletModule["type"]) {
  return booklet.modules.find(m => m.type === type && m.enabled);
}

function parsePlaces(raw: string) {
  return raw.split("\n").map(line => {
    const [name, address] = line.split("|").map(s => s.trim());
    return name ? { name, address: address ?? "" } : null;
  }).filter(Boolean) as { name: string; address: string }[];
}

function useTranslatedBooklet(booklet: Booklet, lang: SupportedLang): Booklet {
  return useMemo(() => {
    if (lang === "fr" || !booklet.translations?.[lang]) return booklet;
    const tr = booklet.translations[lang]!;
    return {
      ...booklet,
      title: tr["_meta_"]?.title ?? booklet.title,
      description: tr["_meta_"]?.description ?? booklet.description,
      modules: booklet.modules.map(mod => ({
        ...mod,
        content: tr[mod.id] ? { ...mod.content, ...tr[mod.id] } : mod.content,
      })),
    };
  }, [booklet, lang]);
}

// ─── Tokens : palette pastel figée ────────────────────────────────────────────

const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";

const C = {
  bg:     "#FBF4E8", // crème
  card:   "#FFFFFF",
  label:  "#2B2620",
  sub:    "#8A8073",
  muted:  "#C4BAA9",
  sep:    "#F1E9DA",
  yellow: "#F7D774",
  blue:   "#B9D4F1",
  pink:   "#F6C9D8",
  green:  "#BFE3C8",
  lilac:  "#DCC9F2",
  peach:  "#F7C99E",
  red:    "#E8846B",
  ink:    "#1F1B15",
};

// Petite forme organique décorative (étoile à 4 branches façon maquette)
function Blob({ color, size = 26, style }: { color: string; size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", ...style }}>
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" fill={color} opacity={0.9} />
    </svg>
  );
}

// ─── Carte info pastel ────────────────────────────────────────────────────────

function PastelCard({ tint, icon, title, tag, onClick, children }: {
  tint: string; icon: React.ReactNode; title: string; tag?: string; onClick?: () => void; children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative", overflow: "hidden", textAlign: "left", cursor: onClick ? "pointer" : "default",
        width: "100%", border: `1px solid ${C.sep}`, borderRadius: 22, background: C.card,
        padding: 0, fontFamily: FONT,
      }}>
      <div style={{ position: "relative", background: tint, padding: "16px 18px", overflow: "hidden" }}>
        <Blob color="rgba(255,255,255,0.55)" size={30} style={{ top: 8, right: 14 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {icon}
          </div>
          <p style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: C.ink, letterSpacing: -0.2, flex: 1 }}>{title}</p>
          {tag && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.ink, background: "rgba(255,255,255,0.6)", borderRadius: 10, padding: "3px 9px" }}>{tag}</span>}
        </div>
      </div>
      {children && <div style={{ padding: "12px 18px 16px" }}>{children}</div>}
    </button>
  );
}

// ─── Feuille (sheet) plein écran pastel ───────────────────────────────────────

function Sheet({ open, onClose, tint, icon, title, children }: {
  open: boolean; onClose: () => void; tint: string; icon: React.ReactNode; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* Fond assombri */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(43,38,32,0.45)", backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)" }} />
      {/* Feuille */}
      <div style={{
        position: "relative", background: C.bg, borderRadius: "28px 28px 0 0",
        maxHeight: "82vh", display: "flex", flexDirection: "column",
        boxShadow: "0 -12px 40px rgba(43,38,32,0.2)", fontFamily: FONT,
      }}>
        {/* Poignée */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.sep }} />
        </div>
        {/* Header */}
        <div style={{ position: "relative", background: tint, margin: "10px 14px 0", borderRadius: 20, padding: "14px 16px", flexShrink: 0, overflow: "hidden" }}>
          <Blob color="rgba(255,255,255,0.5)" size={28} style={{ top: 8, right: 16 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {icon}
            </div>
            <p style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: C.ink, letterSpacing: -0.3, flex: 1 }}>{title}</p>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.55)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <X size={14} color={C.ink} />
            </button>
          </div>
        </div>
        {/* Contenu */}
        <div style={{ flex: 1, overflowY: "auto", touchAction: "pan-y", padding: "14px 18px", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function WifiQRCode({ ssid, password, security }: { ssid: string; password: string; security?: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!ssid && !password) return;
    const escaped = (s: string) => s.replace(/[\\;,"]/g, c => `\\${c}`);
    const sec = security || "WPA";
    const wifiString = `WIFI:T:${sec};S:${escaped(ssid)};P:${escaped(password)};;`;
    import("qrcode").then(QRCode => {
      QRCode.toDataURL(wifiString, { width: 180, margin: 1, color: { dark: C.ink, light: "#ffffff" } })
        .then(url => setDataUrl(url));
    });
  }, [ssid, password, security]);

  if (!dataUrl) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 8px", gap: 10 }}>
      <img src={dataUrl} alt="QR Code WiFi" width={160} height={160} style={{ borderRadius: 16, border: `2px solid ${C.blue}` }} />
      <p style={{ margin: 0, fontSize: 12, color: C.sub, display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
        <QrCode size={13} color={C.muted} />
        Scanner pour se connecter
      </p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.sep}`, borderRadius: 18, padding: "14px 16px", marginBottom: 10 }}>
      <p style={{ margin: "0 0 4px", fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.65, whiteSpace: "pre-line" }}>{value}</p>
    </div>
  );
}

function CopyBlock({ label, value, tint }: { label: string; value: string; tint: string }) {
  const tr = useT();
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.sep}`, borderRadius: 18, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 3px", fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.label, fontFamily: "ui-monospace, monospace" }}>{value}</p>
      </div>
      <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, background: copied ? C.green : tint, color: C.ink, flexShrink: 0 }}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? tr("copied") : tr("copy")}
      </button>
    </div>
  );
}

// ─── PAGE ACCUEIL ─────────────────────────────────────────────────────────────

function PageHome({ booklet, setSheet }: { booklet: Booklet; setSheet: (id: string) => void }) {
  const tr = useT();
  const arrival       = useMod(booklet, "arrival");
  const accommodation = useMod(booklet, "accommodation");
  const checkoutModule = useMod(booklet, "checkout");
  const safety        = useMod(booklet, "safety");
  const contact       = useMod(booklet, "contact");
  const baby          = useMod(booklet, "baby");
  const petsModule    = useMod(booklet, "pets");
  const pool          = useMod(booklet, "pool");
  const coworking     = useMod(booklet, "coworking");
  const transport     = useMod(booklet, "transport");
  const tidesModule   = useMod(booklet, "tides");
  const weatherModule = useMod(booklet, "weather");

  const wifiName = g(accommodation, "wifi_name");
  const wifiPass = g(accommodation, "wifi_password");
  const accessCode = g(arrival, "access_code");
  const checkinTime = g(arrival, "checkin_time");
  const checkoutTime = g(arrival, "checkout_time") || g(checkoutModule, "checkout_time");
  const hostName = g(contact, "host_name");
  const hostPhoto = g(contact, "host_photo");
  const welcomeMsg = g(contact, "welcome_message") || g(arrival, "welcome_message");

  const moduleOrder = (type: string) => booklet.modules.find(m => m.type === type)?.order ?? 999;

  // Logement & Règles ont leur propre onglet — l'accueil garde les essentiels + modules annexes
  const cards = [
    { id: "horaires",  label: tr("schedule"),      icon: <Clock size={18} color={C.ink} />,           tint: C.green,  show: !!(checkinTime || checkoutTime), order: moduleOrder("arrival") },
    { id: "access",    label: tr("access_keys"),   icon: <Key size={18} color={C.ink} />,             tint: C.yellow, show: !!accessCode,                    order: moduleOrder("arrival") - 0.1 },
    { id: "wifi",      label: tr("wifi"),           icon: <Wifi size={18} color={C.ink} />,            tint: C.blue,   show: !!(wifiName || wifiPass),        order: moduleOrder("accommodation") },
    { id: "safety",    label: tr("nav_safety"),     icon: <Shield size={18} color={C.ink} />,          tint: C.pink,   show: !!safety,                         order: moduleOrder("safety") },
    { id: "contact",   label: tr("contact"),        icon: <Phone size={18} color={C.ink} />,           tint: C.blue,   show: !!contact,                        order: moduleOrder("contact") },
    { id: "pool",      label: tr("pool"),           icon: <Waves size={18} color={C.ink} />,           tint: C.blue,   show: !!pool,                           order: moduleOrder("pool") },
    { id: "baby",      label: tr("baby"),           icon: <Baby size={18} color={C.ink} />,            tint: C.pink,   show: !!baby,                           order: moduleOrder("baby") },
    { id: "pets",      label: tr("pets"),           icon: <Dog size={18} color={C.ink} />,             tint: C.peach,  show: !!petsModule,                     order: moduleOrder("pets") },
    { id: "coworking", label: tr("coworking"),      icon: <Briefcase size={18} color={C.ink} />,       tint: C.lilac,  show: !!coworking,                      order: moduleOrder("coworking") },
    { id: "transport", label: tr("transport"),      icon: <Bus size={18} color={C.ink} />,             tint: C.yellow, show: !!transport,                      order: moduleOrder("transport") },
    { id: "tides",     label: tr("tides"),          icon: <Waves size={18} color={C.ink} />,           tint: C.blue,   show: !!(tidesModule && g(tidesModule, "port_id")), order: moduleOrder("tides") },
    { id: "weather",   label: tr("weather"),        icon: <Sun size={18} color={C.ink} />,             tint: C.yellow, show: !!weatherModule,                  order: moduleOrder("weather") },
  ].filter(c => c.show).sort((a, b) => a.order - b.order);

  return (
    <div style={{ flex: 1, overflowY: "auto", touchAction: "pan-y", paddingBottom: TAB_BAR_H }}>
      {/* Header hôte */}
      <div style={{ padding: "48px 20px 18px", position: "relative" }}>
        <Blob color={C.yellow} size={20} style={{ top: 44, left: 24 }} />
        <Blob color={C.pink} size={14} style={{ top: 96, right: 30 }} />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {hostPhoto ? (
              <img src={hostPhoto} alt="" style={{ width: 82, height: 82, borderRadius: 22, objectFit: "cover", boxShadow: "0 4px 14px rgba(0,0,0,0.1)" }} />
            ) : (
              <div style={{ width: 82, height: 82, borderRadius: 22, background: C.lilac, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.1)" }}>
                <Users size={30} color={C.ink} />
              </div>
            )}
            <div style={{ position: "absolute", top: -6, right: -6, width: 26, height: 26, borderRadius: "50%", background: C.pink, border: `2px solid ${C.bg}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Heart size={12} color={C.ink} fill={C.ink} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 27, fontWeight: 800, color: C.ink, letterSpacing: -0.5, lineHeight: 1.1 }}>
              {booklet.propertyName || booklet.title}
            </h1>
            {hostName && <p style={{ margin: 0, fontSize: 14.5, color: C.sub, fontWeight: 600 }}>{tr("your_host")} · {hostName}</p>}
          </div>
        </div>
        {welcomeMsg && (
          <p style={{ margin: "0 0 14px", fontSize: 13, color: C.sub, lineHeight: 1.55 }}>
            {welcomeMsg.length > 110 ? welcomeMsg.slice(0, 110) + "…" : welcomeMsg}
          </p>
        )}
        {booklet.address && (
          <div style={{ borderRadius: 16, background: C.card, border: `1px solid ${C.sep}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <MapPin size={14} color={C.muted} style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, flex: 1, fontSize: 12, color: C.sub, lineHeight: 1.4, fontWeight: 600 }}>{booklet.address}</p>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booklet.address)}`} target="_blank" rel="noopener noreferrer"
              style={{ padding: "5px 10px", borderRadius: 10, background: C.bg, fontSize: 11, fontWeight: 700, color: C.ink, textDecoration: "none", flexShrink: 0 }}>
              Maps
            </a>
          </div>
        )}
      </div>

      {/* Liste de cartes */}
      <div style={{ padding: "0 16px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
        {cards.map(c => (
          <PastelCard key={c.id} tint={c.tint} icon={c.icon} title={c.label} onClick={() => setSheet(c.id)} />
        ))}
      </div>
      <BunklyCredit ownerPlan={booklet.ownerPlan} />
    </div>
  );
}

function BunklyCredit({ ownerPlan }: { ownerPlan?: Plan }) {
  const tr = useT();
  if (ownerPlan === "pro" || ownerPlan === "agency") return null;
  return (
    <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
      <a href="https://bunkly.co" target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 11, color: C.muted, textDecoration: "none", fontWeight: 600, letterSpacing: 0.3 }}>
        {tr("created_with").replace("Bunkly.co", "")}
        <span style={{ fontWeight: 800, color: C.sub }}>Bunkly.co</span>
      </a>
    </div>
  );
}

// ─── Sheets (accueil) ─────────────────────────────────────────────────────────

function HomeSheets({ booklet, sheet, onClose }: { booklet: Booklet; sheet: string | null; onClose: () => void }) {
  const tr = useT();
  const arrival       = useMod(booklet, "arrival");
  const accommodation = useMod(booklet, "accommodation");
  const safety        = useMod(booklet, "safety");
  const contact       = useMod(booklet, "contact");
  const baby          = useMod(booklet, "baby");
  const petsModule    = useMod(booklet, "pets");
  const pool          = useMod(booklet, "pool");
  const coworking     = useMod(booklet, "coworking");
  const transport     = useMod(booklet, "transport");
  const tidesModule   = useMod(booklet, "tides");
  const weatherModule = useMod(booklet, "weather");
  const checkoutModule = useMod(booklet, "checkout");

  const wifiName     = g(accommodation, "wifi_name");
  const wifiPass     = g(accommodation, "wifi_password");
  const wifiSecurity = g(accommodation, "wifi_security");
  const accessCode   = g(arrival, "access_code");
  const checkinTime  = g(arrival, "checkin_time");
  const checkoutTime = g(arrival, "checkout_time") || g(checkoutModule, "checkout_time");

  return (
    <>
      <Sheet open={sheet === "horaires"} onClose={onClose} tint={C.green} icon={<Clock size={18} color={C.ink} />} title={tr("schedule")}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          {checkinTime && (
            <div style={{ flex: 1, background: C.card, border: `1px solid ${C.sep}`, borderRadius: 18, padding: "16px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>{tr("checkin")}</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.ink, letterSpacing: -1 }}>{formatTime(checkinTime)}</p>
            </div>
          )}
          {checkoutTime && (
            <div style={{ flex: 1, background: C.card, border: `1px solid ${C.sep}`, borderRadius: 18, padding: "16px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>{tr("checkout")}</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.ink, letterSpacing: -1 }}>{formatTime(checkoutTime)}</p>
            </div>
          )}
        </div>
        {g(arrival, "checkin_process") && (
          <div style={{ background: C.card, border: `1px solid ${C.sep}`, borderRadius: 18, padding: "14px 16px", marginBottom: 10 }}>
            <p style={{ margin: "0 0 10px", fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>{tr("checkin_process")}</p>
            {g(arrival, "checkin_process").split("\n").filter(Boolean).map((step, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.sep}` : "none" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.ink }}>{i + 1}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: C.label, lineHeight: 1.55, paddingTop: 1 }}>{step}</p>
              </div>
            ))}
          </div>
        )}
        <InfoBlock label={tr("early_checkin")} value={g(arrival, "early_checkin")} />
      </Sheet>

      <Sheet open={sheet === "wifi"} onClose={onClose} tint={C.blue} icon={<Wifi size={18} color={C.ink} />} title={tr("wifi")}>
        <CopyBlock label={tr("network")} value={wifiName} tint={C.blue} />
        <CopyBlock label={tr("password")} value={wifiPass} tint={C.blue} />
        {(wifiName || wifiPass) && <WifiQRCode ssid={wifiName} password={wifiPass} security={wifiSecurity} />}
        <InfoBlock label={tr("wifi")} value={g(accommodation, "wifi_info")} />
      </Sheet>

      <Sheet open={sheet === "access"} onClose={onClose} tint={C.yellow} icon={<Key size={18} color={C.ink} />} title={tr("access_keys")}>
        {accessCode && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {accessCode.split("").map((char, i) => (
              <div key={i} style={{ width: 42, height: 50, borderRadius: 14, background: C.card, border: `1.5px solid ${C.yellow}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: C.ink, fontFamily: "ui-monospace,monospace" }}>{char}</div>
            ))}
          </div>
        )}
        <InfoBlock label={tr("key_location")} value={g(arrival, "key_location")} />
        <InfoBlock label={tr("parking")} value={g(arrival, "parking")} />
      </Sheet>

      <Sheet open={sheet === "safety"} onClose={onClose} tint={C.pink} icon={<Shield size={18} color={C.ink} />} title={tr("safety")}>
        {g(safety, "emergency") && (
          <div style={{ background: "#FBE4DC", borderRadius: 18, padding: "14px 16px", marginBottom: 10, border: `1px solid ${C.red}30` }}>
            <p style={{ margin: "0 0 6px", fontSize: 10.5, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 0.7 }}>{tr("emergency_numbers")}</p>
            <p style={{ margin: 0, fontSize: 14, color: C.ink, lineHeight: 1.8, whiteSpace: "pre-line", fontWeight: 600 }}>{g(safety, "emergency")}</p>
          </div>
        )}
        <InfoBlock label={tr("fire_extinguisher")} value={g(safety, "fire_extinguisher")} />
        <InfoBlock label={tr("circuit_breaker")} value={g(safety, "circuit_breaker")} />
        <InfoBlock label={tr("water_shutoff")} value={g(safety, "water_shutoff")} />
        <InfoBlock label={tr("hospital")} value={g(safety, "hospital")} />
      </Sheet>

      <Sheet open={sheet === "contact"} onClose={onClose} tint={C.blue} icon={<Phone size={18} color={C.ink} />} title={tr("contact")}>
        {(g(contact, "host_name") || g(contact, "host_photo")) && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            {g(contact, "host_photo")
              ? <img src={g(contact, "host_photo")} alt="" style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }} />
              : <div style={{ width: 50, height: 50, borderRadius: "50%", background: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={20} color={C.ink} /></div>}
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.ink }}>{g(contact, "host_name")}</p>
              {g(contact, "response_time") && <p style={{ margin: "2px 0 0", fontSize: 12, color: C.sub, fontWeight: 600 }}>{g(contact, "response_time")}</p>}
            </div>
          </div>
        )}
        {g(contact, "about") && <p style={{ margin: "0 0 14px", fontSize: 13.5, color: C.sub, lineHeight: 1.6 }}>{g(contact, "about")}</p>}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {g(contact, "host_phone") && <a href={`tel:${g(contact, "host_phone")}`} style={{ flex: 1, padding: "12px 0", borderRadius: 16, background: C.blue, color: C.ink, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, fontSize: 13 }}><Phone size={15} /> {tr("call")}</a>}
          {g(contact, "host_email") && <a href={`mailto:${g(contact, "host_email")}`} style={{ flex: 1, padding: "12px 0", borderRadius: 16, background: C.bg, border: `1px solid ${C.sep}`, color: C.ink, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, fontSize: 13 }}><Phone size={15} /> {tr("email")}</a>}
        </div>
        <InfoBlock label={tr("concierge")} value={g(contact, "concierge")} />
        <InfoBlock label={tr("maintenance")} value={g(contact, "maintenance")} />
      </Sheet>

      <Sheet open={sheet === "pool"} onClose={onClose} tint={C.blue} icon={<Waves size={18} color={C.ink} />} title={tr("pool")}>
        <InfoBlock label={tr("schedule")} value={g(pool, "hours")} />
        <InfoBlock label={tr("pool_rules")} value={g(pool, "rules")} />
        <InfoBlock label={tr("pool_equip")} value={g(pool, "equipment")} />
        <InfoBlock label={tr("pool_maintenance")} value={g(pool, "maintenance")} />
      </Sheet>

      <Sheet open={sheet === "baby"} onClose={onClose} tint={C.pink} icon={<Baby size={18} color={C.ink} />} title={tr("baby")}>
        <InfoBlock label={tr("baby_equip")} value={g(baby, "available")} />
        <InfoBlock label={tr("baby_safety")} value={g(baby, "safety")} />
        <InfoBlock label={tr("baby_rental")} value={g(baby, "rental")} />
      </Sheet>

      <Sheet open={sheet === "pets"} onClose={onClose} tint={C.peach} icon={<Dog size={18} color={C.ink} />} title={tr("pets")}>
        <InfoBlock label={tr("pets_rules")} value={g(petsModule, "rules")} />
        <InfoBlock label={tr("pets_zones")} value={g(petsModule, "zones")} />
        <InfoBlock label={tr("pets_places")} value={g(petsModule, "nearby")} />
      </Sheet>

      <Sheet open={sheet === "coworking"} onClose={onClose} tint={C.lilac} icon={<Briefcase size={18} color={C.ink} />} title={tr("coworking")}>
        <InfoBlock label={tr("workspace")} value={g(coworking, "desk")} />
        <InfoBlock label={tr("wifi_dedicated")} value={g(coworking, "wifi_pro")} />
        <InfoBlock label={tr("screens")} value={g(coworking, "screens")} />
      </Sheet>

      <Sheet open={sheet === "transport"} onClose={onClose} tint={C.yellow} icon={<Bus size={18} color={C.ink} />} title={tr("transport")}>
        <InfoBlock label={tr("public_transport")} value={g(transport, "public")} />
        <InfoBlock label={tr("taxi")} value={g(transport, "taxi")} />
        <InfoBlock label={tr("bikes")} value={g(transport, "bike")} />
        <InfoBlock label={tr("airport")} value={g(transport, "airport")} />
      </Sheet>

      <Sheet open={sheet === "tides"} onClose={onClose} tint={C.blue} icon={<Waves size={18} color={C.ink} />} title={tr("tides")}>
        <InfoBlock label={tr("tides_port")} value={g(tidesModule, "port_name") || g(tidesModule, "port_id")} />
        <InfoBlock label={tr("other")} value={g(tidesModule, "note")} />
      </Sheet>

      <Sheet open={sheet === "weather"} onClose={onClose} tint={C.yellow} icon={<Sun size={18} color={C.ink} />} title={tr("weather")}>
        <InfoBlock label={tr("other")} value={g(weatherModule, "note")} />
      </Sheet>
    </>
  );
}

// ─── PAGE ACTIVITÉS ───────────────────────────────────────────────────────────

const CAT_TINT: Record<string, string> = { restaurant: C.peach, activity: C.blue, shop: C.green, transport: C.yellow, other: C.lilac };

function PageArea({ booklet, onSelectAct }: { booklet: Booklet; onSelectAct: (a: Activity) => void }) {
  const tr = useT();
  const neighborhood = useMod(booklet, "neighborhood");
  const activities = parseActivities(g(neighborhood, "activities_list"));
  const places = neighborhood ? parsePlaces(g(neighborhood, "places")) : [];
  const mapAddress = encodeURIComponent(booklet.address || booklet.propertyName || "");
  const [activeFilter, setActiveFilter] = useState("all");

  const catTint = CAT_TINT;
  const catLabel: Record<string, string> = {
    restaurant: tr("cat_restaurant"), activity: tr("cat_activity"), shop: tr("cat_shop"),
    transport: tr("transport"), other: tr("places"),
  };

  const CATS = [
    { id: "all", label: tr("all") },
    { id: "restaurant", label: tr("restaurant") },
    { id: "activity", label: tr("activities") },
    { id: "shop", label: tr("shops") },
    { id: "transport", label: tr("transport") },
    { id: "other", label: tr("other") },
  ];
  const presentCats = new Set(activities.map(a => a.category));
  const visibleCats = CATS.filter(c => c.id === "all" || presentCats.has(c.id as Activity["category"]));
  const filtered = activeFilter === "all" ? activities : activities.filter(a => a.category === activeFilter);

  return (
    <div style={{ flex: 1, overflowY: "auto", touchAction: "pan-y", paddingBottom: TAB_BAR_H }}>
      <div style={{ padding: "48px 20px 16px", position: "relative" }}>
        <Blob color={C.yellow} size={18} style={{ top: 44, right: 40 }} />
        <Blob color={C.pink} size={13} style={{ top: 70, right: 24 }} />
        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{tr("discover")}</p>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>{booklet.propertyName || booklet.title}</h2>
      </div>

      <div style={{ padding: "0 16px 24px" }}>
        {visibleCats.length > 2 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", marginBottom: 14, touchAction: "pan-x" }}>
            {visibleCats.map(cat => {
              const isActive = activeFilter === cat.id;
              return (
                <button key={cat.id} onClick={() => setActiveFilter(cat.id)}
                  style={{ flexShrink: 0, padding: "7px 16px", borderRadius: 20, border: isActive ? `1.5px solid ${C.ink}` : `1.5px solid ${C.sep}`, cursor: "pointer", fontSize: 13, fontWeight: isActive ? 700 : 600, background: isActive ? C.ink : C.card, color: isActive ? "#fff" : C.sub }}>
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {filtered.map((act, i) => (
            <button key={i} onClick={() => onSelectAct(act)}
              style={{ display: "flex", gap: 12, padding: "12px 14px", background: C.card, border: `1px solid ${C.sep}`, borderRadius: 18, cursor: "pointer", textAlign: "left" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, overflow: "hidden", background: catTint[act.category], flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {act.photo ? <img src={act.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <MapPin size={20} color={C.ink} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.ink, background: catTint[act.category], borderRadius: 6, padding: "2px 7px" }}>{catLabel[act.category]}</span>
                  {act.recommended && <Star size={11} color={C.peach} fill={C.peach} />}
                </div>
                <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{act.name}</p>
                {act.description && <p style={{ margin: 0, fontSize: 11.5, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{act.description}</p>}
                <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                  {act.distance && <span style={{ fontSize: 10.5, color: C.muted }}>📍 {act.distance}</span>}
                  {act.priceRange && <span style={{ fontSize: 10.5, color: C.sub, fontWeight: 700 }}>{act.priceRange}</span>}
                </div>
              </div>
              <ChevronRight size={16} color={C.muted} style={{ flexShrink: 0, alignSelf: "center" }} />
            </button>
          ))}
          {places.map((p, i) => (
            <div key={`place-${i}`} style={{ display: "flex", gap: 12, padding: "12px 14px", background: C.card, border: `1px solid ${C.sep}`, borderRadius: 18 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: C.lilac, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={20} color={C.ink} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: C.ink }}>{p.name}</p>
                {p.address && <p style={{ margin: 0, fontSize: 11.5, color: C.sub }}>{p.address}</p>}
              </div>
            </div>
          ))}
        </div>

        {mapAddress && (
          <div style={{ borderRadius: 18, overflow: "hidden", border: `1px solid ${C.sep}` }}>
            <p style={{ margin: 0, padding: "12px 14px 10px", fontSize: 13, fontWeight: 700, color: C.ink, background: C.card }}>{tr("map")}</p>
            <iframe src={`https://maps.google.com/maps?q=${mapAddress}&output=embed&z=15`} width="100%" height="160" style={{ border: 0, display: "block" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Carte" />
          </div>
        )}
      </div>
      <BunklyCredit ownerPlan={booklet.ownerPlan} />
    </div>
  );
}

function ActivitySheetContent({ act, tr }: { act: Activity; tr: (k: I18nKey) => string }) {
  return (
    <>
      {act.photo && (
        <div style={{ borderRadius: 18, overflow: "hidden", height: 160, marginBottom: 14 }}>
          <img src={act.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      {act.description && <p style={{ margin: "0 0 14px", fontSize: 13.5, color: C.sub, lineHeight: 1.65 }}>{act.description}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {act.distance && <span style={{ fontSize: 12, color: C.sub, background: C.card, border: `1px solid ${C.sep}`, borderRadius: 20, padding: "4px 10px", fontWeight: 600 }}>📍 {act.distance}</span>}
        {act.openHours && <span style={{ fontSize: 12, color: C.sub, background: C.card, border: `1px solid ${C.sep}`, borderRadius: 20, padding: "4px 10px", fontWeight: 600 }}>🕐 {act.openHours}</span>}
        {act.priceRange && <span style={{ fontSize: 12, color: C.ink, fontWeight: 700, background: C.peach, borderRadius: 20, padding: "4px 10px" }}>{act.priceRange}</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {act.phone && <a href={`tel:${act.phone}`} style={{ flex: 1, padding: "11px 0", borderRadius: 14, background: C.bg, border: `1px solid ${C.sep}`, color: C.ink, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, fontSize: 13 }}><Phone size={14} /> {tr("call")}</a>}
        {act.address && <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(act.address)}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "11px 0", borderRadius: 14, background: C.bg, border: `1px solid ${C.sep}`, color: C.ink, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, fontSize: 13 }}><Navigation size={14} /> {tr("maps")}</a>}
        {act.website && <a href={act.website} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "11px 0", borderRadius: 14, background: C.bg, border: `1px solid ${C.sep}`, color: C.ink, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, fontSize: 13 }}><Globe size={14} /> {tr("website")}</a>}
      </div>
    </>
  );
}

// ─── PAGE DÉPART ──────────────────────────────────────────────────────────────

function PageCheckout({ booklet }: { booklet: Booklet }) {
  const tr = useT();
  const checkout = useMod(booklet, "checkout");
  const tasks = g(checkout, "process").split("\n").filter(Boolean);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ flex: 1, overflowY: "auto", touchAction: "pan-y", paddingBottom: TAB_BAR_H }}>
      <div style={{ padding: "48px 20px 16px", position: "relative" }}>
        <Blob color={C.green} size={18} style={{ top: 44, right: 40 }} />
        <Blob color={C.lilac} size={13} style={{ top: 70, right: 24 }} />
        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{tr("checklist")}</p>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>{tr("your_checkout")}</h2>
      </div>

      <div style={{ padding: "0 16px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
        {g(checkout, "checkout_time") && (
          <div style={{ background: C.peach, borderRadius: 20, padding: "22px 18px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <Blob color="rgba(255,255,255,0.5)" size={30} style={{ top: 10, right: 16 }} />
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
              <Clock size={22} color={C.ink} />
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 10.5, fontWeight: 700, color: C.ink, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.8 }}>{tr("checkout_time")}</p>
            <p style={{ margin: 0, fontSize: 44, fontWeight: 800, color: C.ink, letterSpacing: -2, lineHeight: 1 }}>{formatTime(g(checkout, "checkout_time"))}</p>
            {g(checkout, "late_checkout_info") && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: C.ink, opacity: 0.75 }}>{g(checkout, "late_checkout_info")}</p>}
          </div>
        )}

        {tasks.length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.sep}`, borderRadius: 20, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${C.sep}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: C.ink }}>{tr("checkout_checklist")}</p>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.sub }}>{doneCount}/{tasks.length}</span>
            </div>
            {tasks.map((task, i) => (
              <button key={i} onClick={() => setChecked(p => ({ ...p, [i]: !p[i] }))}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", background: "none", border: "none", borderBottom: i < tasks.length - 1 ? `1px solid ${C.sep}` : "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: checked[i] ? C.green : "transparent", border: `2px solid ${checked[i] ? C.green : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {checked[i] && <Check size={12} color={C.ink} strokeWidth={3} />}
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: checked[i] ? C.muted : C.label, textDecoration: checked[i] ? "line-through" : "none", flex: 1 }}>{task}</p>
              </button>
            ))}
            {doneCount === tasks.length && tasks.length > 0 && (
              <div style={{ padding: "12px 18px", background: C.green, display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={15} color={C.ink} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.ink }}>{tr("checkout_ready")}</p>
              </div>
            )}
          </div>
        )}

        {g(checkout, "keys_return") && <InfoBlock label={tr("key_return")} value={g(checkout, "keys_return")} />}

        {(g(checkout, "review_airbnb") || g(checkout, "review_google") || g(checkout, "review_booking")) && (
          <div>
            <p style={{ margin: "0 0 10px", fontSize: 12.5, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.8 }}>{tr("leave_review")}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { key: "review_airbnb", label: "Airbnb" },
                { key: "review_google", label: "Google" },
                { key: "review_booking", label: "Booking.com" },
              ].filter(r => g(checkout, r.key)).map(r => (
                <a key={r.key} href={g(checkout, r.key)} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: C.card, border: `1px solid ${C.sep}`, borderRadius: 18, textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Star size={16} color={C.ink} fill={C.ink} />
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink }}>{r.label}</p>
                  </div>
                  <ChevronRight size={16} color={C.muted} />
                </a>
              ))}
            </div>
          </div>
        )}

        {g(checkout, "thank_you") && (
          <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: 13, color: C.sub, fontStyle: "italic", lineHeight: 1.7 }}>{g(checkout, "thank_you")}</p>
        )}
      </div>
      <BunklyCredit ownerPlan={booklet.ownerPlan} />
    </div>
  );
}

// ─── PAGE LOGEMENT ────────────────────────────────────────────────────────────

function PageLogement({ booklet }: { booklet: Booklet }) {
  const tr = useT();
  const accommodation = useMod(booklet, "accommodation");
  const kitchen = useMod(booklet, "kitchen");

  return (
    <div style={{ flex: 1, overflowY: "auto", touchAction: "pan-y", paddingBottom: TAB_BAR_H }}>
      {/* Photo de couverture verticale (portrait) */}
      <div style={{ position: "relative", height: "46vh", minHeight: 320, overflow: "hidden" }}>
        {booklet.coverImage
          ? <img src={booklet.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", background: C.lilac }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(43,38,32,0.1) 0%, rgba(43,38,32,0.15) 55%, rgba(43,38,32,0.65) 100%)" }} />
        <Blob color="rgba(255,255,255,0.6)" size={22} style={{ top: 20, right: 24 }} />
        <Blob color="rgba(255,255,255,0.4)" size={14} style={{ top: 56, right: 54 }} />
        <div style={{ position: "absolute", left: 20, right: 20, bottom: 22 }}>
          <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1 }}>{tr("nav_stay")}</p>
          <h2 style={{ margin: "0 0 10px", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.5, lineHeight: 1.1, textShadow: "0 1px 10px rgba(0,0,0,0.35)" }}>{tr("le_logement")}</h2>
          <p style={{ margin: "0 0 5px", fontSize: 17, fontWeight: 700, color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}>{booklet.propertyName || booklet.title}</p>
          {booklet.address && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <MapPin size={14} color="rgba(255,255,255,0.85)" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 13.5, color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>{booklet.address}</p>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "16px 16px 32px" }}>
        <InfoBlock label={tr("heating")} value={g(accommodation, "heating")} />
        <InfoBlock label={tr("ac")} value={g(accommodation, "ac")} />
        <InfoBlock label={tr("tv")} value={g(accommodation, "tv")} />
        <InfoBlock label={tr("appliances")} value={g(accommodation, "appliances")} />
        <InfoBlock label={tr("mailbox")} value={g(accommodation, "checkin_code")} />
        <InfoBlock label={tr("other")} value={g(accommodation, "other")} />
        <InfoBlock label={tr("kitchen_equip")} value={g(kitchen, "equipment")} />
        <InfoBlock label={tr("cleaning")} value={g(kitchen, "cleaning")} />
        <InfoBlock label={tr("linen")} value={g(kitchen, "linen")} />
        <InfoBlock label={tr("waste")} value={g(kitchen, "trash")} />
      </div>
      <BunklyCredit ownerPlan={booklet.ownerPlan} />
    </div>
  );
}

// ─── PAGE RÈGLES (classeur de cartes → bottom sheets) ────────────────────────

function getRulesCards(rules: BookletModule | undefined, tr: (k: I18nKey) => string) {
  return [
    { id: "persons", label: tr("persons"), icon: <Users size={18} color={C.ink} />, tint: C.blue,   value: g(rules, "max_guests") },
    { id: "smoking", label: tr("smoking"), icon: <Cigarette size={18} color={C.ink} />, tint: C.pink,   value: g(rules, "smoking") },
    { id: "pets",    label: tr("pets"),    icon: <Dog size={18} color={C.ink} />,    tint: C.peach,  value: g(rules, "pets") },
    { id: "noise",   label: tr("noise"),   icon: <Volume2 size={18} color={C.ink} />, tint: C.green,  value: g(rules, "noise") },
    { id: "parties", label: tr("parties"), icon: <PartyPopper size={18} color={C.ink} />, tint: C.lilac,  value: g(rules, "parties") },
    { id: "other",   label: tr("other"),   icon: <Info size={18} color={C.ink} />,   tint: C.yellow, value: g(rules, "other") },
  ].filter(c => c.value);
}

function PageRules({ booklet, onSelectCard }: { booklet: Booklet; onSelectCard: (id: string) => void }) {
  const tr = useT();
  const rules = useMod(booklet, "rules");
  const cards = getRulesCards(rules, tr);

  return (
    <div style={{ flex: 1, overflowY: "auto", touchAction: "pan-y", paddingBottom: TAB_BAR_H, position: "relative" }}>
      <div style={{ padding: "48px 20px 16px" }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{tr("nav_stay")}</p>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>{tr("rules")}</h2>
      </div>
      <div style={{ padding: "0 16px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
        {cards.map(c => (
          <PastelCard key={c.id} tint={c.tint} icon={c.icon} title={c.label} onClick={() => onSelectCard(c.id)} />
        ))}
      </div>
      <BunklyCredit ownerPlan={booklet.ownerPlan} />
    </div>
  );
}

// ─── Tab bar pastel ───────────────────────────────────────────────────────────

const TAB_BAR_H = 76;

type PastelTab = "logement" | "rules" | "home" | "area" | "checkout";

function PastelTabBar({ active, onSelect }: { active: PastelTab; onSelect: (t: PastelTab) => void }) {
  const tr = useT();
  const sideTabs = [
    { id: "logement" as PastelTab, label: tr("le_logement"), icon: Home },
    { id: "rules"    as PastelTab, label: "Règles",          icon: ScrollText },
  ];
  const rightTabs = [
    { id: "area"     as PastelTab, label: tr("nav_area"),     icon: MapPin },
    { id: "checkout" as PastelTab, label: tr("nav_checkout"), icon: LogOut },
  ];

  return (
    <div style={{
      position: "relative", display: "flex", alignItems: "flex-end",
      background: "rgba(251,244,232,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderTop: `1px solid ${C.sep}`, flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom)",
      paddingTop: 10, paddingLeft: 6, paddingRight: 6,
    }}>
      {sideTabs.map(t => {
        const isActive = active === t.id;
        const Icon = t.icon;
        return (
          <button key={t.id} onClick={() => onSelect(t.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0 6px", background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 48, height: 32, borderRadius: 16, background: isActive ? C.yellow : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={19} color={C.ink} strokeWidth={isActive ? 2.4 : 1.8} />
            </div>
            <span style={{ fontSize: 9.5, fontWeight: isActive ? 700 : 500, color: isActive ? C.ink : C.muted, letterSpacing: 0.1 }}>
              {t.label}
            </span>
          </button>
        );
      })}

      {/* Bouton central surélevé — Accueil */}
      <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", width: 76 }}>
        <button onClick={() => onSelect("home")}
          style={{
            width: 58, height: 58, borderRadius: "50%", marginTop: -28, marginBottom: 4,
            background: active === "home" ? C.yellow : C.ink,
            border: `4px solid ${C.bg}`, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", boxShadow: "0 6px 16px rgba(43,38,32,0.22)",
          }}>
          <Home size={24} color={active === "home" ? C.ink : C.yellow} strokeWidth={2.2} />
        </button>
        <span style={{ fontSize: 9.5, fontWeight: active === "home" ? 700 : 500, color: active === "home" ? C.ink : C.muted, letterSpacing: 0.1, marginBottom: 6 }}>
          {tr("nav_home")}
        </span>
      </div>

      {rightTabs.map(t => {
        const isActive = active === t.id;
        const Icon = t.icon;
        return (
          <button key={t.id} onClick={() => onSelect(t.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0 6px", background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 48, height: 32, borderRadius: 16, background: isActive ? C.yellow : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={19} color={C.ink} strokeWidth={isActive ? 2.4 : 1.8} />
            </div>
            <span style={{ fontSize: 9.5, fontWeight: isActive ? 700 : 500, color: isActive ? C.ink : C.muted, letterSpacing: 0.1 }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Sélecteur de langue ──────────────────────────────────────────────────────

const LANG_FLAG_ISO: Record<string, string> = { fr: "fr", en: "gb", es: "es", de: "de", it: "it", ar: "sa" };
function FlagImg({ code, size = 20 }: { code: string; size?: number }) {
  const iso = LANG_FLAG_ISO[code] ?? code;
  return <img src={`https://flagcdn.com/w40/${iso}.png`} alt={code} style={{ width: size, height: size * 0.67, borderRadius: 3, objectFit: "cover", display: "block", flexShrink: 0 }} />;
}

function LangSelector({ booklet, lang, onSelect }: { booklet: Booklet; lang: SupportedLang; onSelect: (l: SupportedLang) => void }) {
  const [open, setOpen] = useState(false);
  const available = SUPPORTED_LANGS.filter(l => l.code === "fr" || booklet.translations?.[l.code] !== undefined);
  if (available.length <= 1) return null;
  const current = available.find(l => l.code === lang) ?? available[0];

  return (
    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 210 }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: C.card, border: `1px solid ${C.sep}`, borderRadius: 20, padding: "7px 12px", cursor: "pointer" }}>
        <FlagImg code={current.code} size={20} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: C.card, border: `1px solid ${C.sep}`, borderRadius: 16, padding: 6, minWidth: 140, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
          {available.map(l => (
            <button key={l.code} onClick={() => { onSelect(l.code); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: l.code === lang ? C.bg : "transparent", border: "none", borderRadius: 10, padding: "8px 12px", color: C.ink, fontSize: 13, fontWeight: l.code === lang ? 700 : 400, cursor: "pointer", textAlign: "left" }}>
              <FlagImg code={l.code} size={20} />
              <span>{l.label}</span>
              {l.code === lang && <Check size={12} style={{ marginLeft: "auto", color: C.green }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Contenu principal ────────────────────────────────────────────────────────

function PastelContent({ booklet: rawBooklet, onTabChange }: { booklet: Booklet; onTabChange?: (tab: string) => void }) {
  const tr = useT();
  const [tab, setTab] = useState<PastelTab>("home");
  const [sheet, setSheet] = useState<string | null>(null);
  const [ruleSheet, setRuleSheet] = useState<string | null>(null);
  const [selectedAct, setSelectedAct] = useState<Activity | null>(null);
  const [lang, setLang] = useState<SupportedLang>("fr");
  const booklet = useTranslatedBooklet(rawBooklet, lang);

  const rules = useMod(booklet, "rules");
  const rulesCards = getRulesCards(rules, tr);
  const activeRuleCard = rulesCards.find(c => c.id === ruleSheet);

  const handleTabChange = (t: PastelTab) => {
    setTab(t);
    onTabChange?.(t);
  };

  const anySheetOpen = !!sheet || !!ruleSheet || !!selectedAct;

  return (
    <LangCtx.Provider value={lang}>
      <div style={{ position: "relative", height: "100%", fontFamily: FONT, WebkitFontSmoothing: "antialiased", background: C.bg, display: "flex", flexDirection: "column" }}>
        <LangSelector booklet={rawBooklet} lang={lang} onSelect={setLang} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative" }}>
          {tab === "home"     && <PageHome     booklet={booklet} setSheet={setSheet} />}
          {tab === "logement" && <PageLogement booklet={booklet} />}
          {tab === "rules"    && <PageRules    booklet={booklet} onSelectCard={setRuleSheet} />}
          {tab === "area"     && <PageArea     booklet={booklet} onSelectAct={setSelectedAct} />}
          {tab === "checkout" && <PageCheckout booklet={booklet} />}
        </div>

        <PastelTabBar active={tab} onSelect={handleTabChange} />

        <div style={{ position: "absolute", inset: 0, zIndex: 300, pointerEvents: anySheetOpen ? "auto" : "none" }}>
          <HomeSheets booklet={booklet} sheet={sheet} onClose={() => setSheet(null)} />

          {activeRuleCard && (
            <Sheet open={!!ruleSheet} onClose={() => setRuleSheet(null)} tint={activeRuleCard.tint} icon={activeRuleCard.icon} title={activeRuleCard.label}>
              <InfoBlock label={activeRuleCard.label} value={activeRuleCard.value} />
            </Sheet>
          )}

          {selectedAct && (
            <Sheet open={!!selectedAct} onClose={() => setSelectedAct(null)} tint={CAT_TINT[selectedAct.category]} icon={<MapPin size={18} color={C.ink} />} title={selectedAct.name}>
              <ActivitySheetContent act={selectedAct} tr={tr} />
            </Sheet>
          )}
        </div>
      </div>
    </LangCtx.Provider>
  );
}

// ─── Desktop (mockup iPhone + QR) ─────────────────────────────────────────────

function useQrCodePastel(url: string) {
  const [dataUrl, setDataUrl] = useState("");
  if (typeof window !== "undefined") {
    import("qrcode").then(QRCode => {
      QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: C.ink, light: "#ffffff" } }).then(setDataUrl).catch(() => {});
    });
  }
  return dataUrl;
}

function PastelDesktop({ booklet }: { booklet: Booklet }) {
  const url = `https://app.bunkly.co/b/${booklet.slug}`;
  const qrDataUrl = useQrCodePastel(url);

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${C.bg} 0%, #F3E8D6 60%, ${C.bg} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: FONT }}>
      <div style={{ color: C.ink, maxWidth: 300, marginRight: 60, flexShrink: 0 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.card, border: `1px solid ${C.sep}`, borderRadius: 20, padding: "6px 14px", marginBottom: 24 }}>
          <MapPin size={12} color={C.sub} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Expérience mobile</span>
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: 32, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.5 }}>{booklet.propertyName || booklet.title}</h1>
        {booklet.address && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 5, marginBottom: 20 }}>
            <MapPin size={13} color={C.muted} style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 14, color: C.sub }}>{booklet.address}</p>
          </div>
        )}
        <p style={{ margin: "0 0 28px", fontSize: 14, color: C.sub, lineHeight: 1.7 }}>Scannez ce QR code avec votre téléphone pour accéder au livret.</p>
        <div style={{ background: "#fff", borderRadius: 20, padding: 16, display: "inline-block", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
          {qrDataUrl
            ? <img src={qrDataUrl} alt="QR code" style={{ width: 160, height: 160, display: "block", borderRadius: 8 }} />
            : <div style={{ width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}><MapPin size={40} color="#ddd" /></div>}
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9CA3AF", textAlign: "center", fontFamily: "ui-monospace,monospace" }}>app.bunkly.co/b/{booklet.slug}</p>
        </div>
      </div>

      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{ width: 390, height: 760, borderRadius: 52, background: "#2B2620", padding: "12px 10px", boxShadow: "0 40px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)", position: "relative" }}>
          <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", width: 120, height: 34, background: "#000", borderRadius: 20, zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: 42, overflow: "hidden", background: C.bg }}>
            <PastelContent booklet={booklet} />
          </div>
        </div>
        <div style={{ position: "absolute", left: -3, top: 120, width: 3, height: 32, background: "#4A4438", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", left: -3, top: 162, width: 3, height: 64, background: "#4A4438", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", left: -3, top: 236, width: 3, height: 64, background: "#4A4438", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", right: -3, top: 160, width: 3, height: 80, background: "#4A4438", borderRadius: "0 2px 2px 0" }} />
      </div>
    </div>
  );
}

// ─── Viewer principal ─────────────────────────────────────────────────────────

export function ViewerPastel({ booklet, onTabChange }: { booklet: Booklet; onTabChange?: (tab: string) => void }) {
  return (
    <>
      <div className="md:hidden" style={{ height: "100vh", maxHeight: "100dvh" }}>
        <PastelContent booklet={booklet} onTabChange={onTabChange} />
      </div>
      <div className="hidden md:block">
        <PastelDesktop booklet={booklet} />
      </div>
    </>
  );
}
