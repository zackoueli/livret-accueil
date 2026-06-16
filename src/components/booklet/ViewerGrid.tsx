"use client";

import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { Booklet, BookletModule, SupportedLang, SUPPORTED_LANGS } from "@/types";
import { t, I18nKey } from "@/lib/i18n";
import { formatTime, parseActivities, parseServices, Activity } from "@/lib/modules";
import {
  Wifi, Key, Thermometer, Wind, Tv, ScrollText, UtensilsCrossed,
  Sparkles, Shield, Phone, Star, MapPin, Clock, Navigation,
  ChevronDown, Check, Copy, Globe, ExternalLink, X, Car,
  Baby, Dog, Waves, Briefcase, Leaf, Info, Bus, Bike, Plane,
  Flame, Zap, Droplets, Hospital, ConciergeBell, Wrench,
  Pill, Stethoscope, Store, Building2, WashingMachine, Users,
  Mailbox, Volume2, Cigarette, PartyPopper, ShoppingBag,
  Home, LogOut, QrCode, Sun, Droplet,
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

// ─── Tokens ───────────────────────────────────────────────────────────────────

const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";

const C = {
  bg:    "#F7F7F9",
  card:  "#FFFFFF",
  label: "#111827",
  sub:   "#6B7280",
  muted: "#B0B7C3",
  sep:   "#F3F4F6",
  green: "#10B981",
  orange:"#F59E0B",
  red:   "#EF4444",
  blue:  "#3B82F6",
};

// Photos placeholder par module (à remplacer par URLs Firebase)
const MODULE_PHOTOS: Record<string, string> = {
  wifi:      "https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-brettjordan-5703429.jpg?alt=media&token=aedd5134-7da0-43e7-9a2d-421c113da11f",
  access:    "https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-felixmoeller-36750789.jpg?alt=media&token=d62e7a56-4549-4e98-a38c-b324317a8f52",
  heating:   "https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-mart-production-7328504.jpg?alt=media&token=2056e2f3-11be-40b2-a947-7d371edbfede",
  ac:        "https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-erfanamiri-28054343.jpg?alt=media&token=e5602c2c-357d-41f2-bc45-7a6ddfb9d95f",
  rules:     "https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-jibarofoto-16475250.jpg?alt=media&token=78d93c2b-f74e-4adc-8dd0-c1bd4c3187af",
  kitchen:   "https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-francesco-ungaro-30735585.jpg?alt=media&token=eb4120dd-327b-41ee-85d2-47f4e11e3257",
  cleaning:  "https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-jonathanborba-28576637.jpg?alt=media&token=3b2c84f4-ecb5-4969-b541-7bdab3420075",
  safety:    "https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-pixabay-263402.jpg?alt=media&token=b814a1a7-5d3f-48d8-8418-ee40c84b9e53",
  contact:   "https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-cottonbro-6964158.jpg?alt=media&token=e79841e5-d724-4610-995f-5e3e7a7aa7f1",
  horaires:  "https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-sadman-abrar-rafin-2158611417-35494016.jpg?alt=media&token=9a9303b8-1799-45d5-8241-58eec20bf4b6",
  tv:        "https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-jeshoots-com-147458-1201996.jpg?alt=media&token=2a01d684-5861-4a91-981e-253b007dae86",
  checkout:  "",
  pool:      "",
  baby:      "",
  pets:      "",
  coworking: "",
  transport: "",
};

// Couleurs de fond fallback si pas de photo
const MODULE_COLORS: Record<string, string> = {
  wifi:      "#3B82F6",
  access:    "#F59E0B",
  heating:   "#EF4444",
  ac:        "#06B6D4",
  rules:     "#8B5CF6",
  kitchen:   "#F97316",
  cleaning:  "#10B981",
  safety:    "#EF4444",
  contact:   "#EC4899",
  checkout:  "#6366F1",
  pool:      "#0EA5E9",
  baby:      "#F472B6",
  pets:      "#84CC16",
  coworking: "#8B5CF6",
  transport: "#F59E0B",
};

// ─── Drawer ───────────────────────────────────────────────────────────────────

function Drawer({ open, onClose, title, icon, color, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
      {/* Sheet */}
      <div style={{
        position: "relative", background: C.card, borderRadius: "24px 24px 0 0",
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        fontFamily: FONT,
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E5E7EB" }} />
        </div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px 14px", borderBottom: `1px solid ${C.sep}` }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {icon}
          </div>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.label, flex: 1 }}>{title}</p>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: C.sep, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} color={C.sub} />
          </button>
        </div>
        {/* Content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px 32px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Composants internes ──────────────────────────────────────────────────────

function InfoRow({ icon, label, value, color, last = false }: {
  icon: React.ReactNode; label: string; value: string; color: string; last?: boolean;
}) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: last ? "none" : `1px solid ${C.sep}` }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 14, color: C.sub, lineHeight: 1.65, whiteSpace: "pre-line" }}>{value}</p>
      </div>
    </div>
  );
}

function CopyRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  const tr = useT();
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: `1px solid ${C.sep}` }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.label, fontFamily: "ui-monospace, monospace", letterSpacing: 0.5 }}>{value}</p>
      </div>
      <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: copied ? `${C.green}15` : `${accent}12`, color: copied ? C.green : accent }}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? tr("copied") : tr("copy")}
      </button>
    </div>
  );
}

// ─── QR Code WiFi ─────────────────────────────────────────────────────────────

function WifiQRCode({ ssid, password, security, accent }: { ssid: string; password: string; security?: string; accent: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!ssid && !password) return;
    const escaped = (s: string) => s.replace(/[\\;,"]/g, c => `\\${c}`);
    const sec = security || "WPA";
    const wifiString = sec
      ? `WIFI:T:${sec};S:${escaped(ssid)};P:${escaped(password)};;`
      : `WIFI:T:;S:${escaped(ssid)};P:;;`;
    import("qrcode").then(QRCode => {
      QRCode.toDataURL(wifiString, { width: 180, margin: 1, color: { dark: "#1F2937", light: "#FFFFFF" } })
        .then(url => setDataUrl(url));
    });
  }, [ssid, password]);

  if (!dataUrl) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0 8px", gap: 10 }}>
      <img src={dataUrl} alt="QR Code WiFi" width={160} height={160} style={{ borderRadius: 12, border: `2px solid ${accent}20` }} />
      <p style={{ margin: 0, fontSize: 12, color: C.sub, display: "flex", alignItems: "center", gap: 5 }}>
        <QrCode size={13} color={C.muted} />
        Scanner pour se connecter
      </p>
    </div>
  );
}

// ─── Bouton de grille ─────────────────────────────────────────────────────────

function GridButton({ label, icon, color, onClick, wide = false }: {
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        gridColumn: wide ? "span 2" : "span 1",
        position: "relative",
        height: wide ? 80 : 100,
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.25)",
        cursor: "pointer",
        background: "rgba(255,255,255,0.13)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
      }}>
      {/* Tache de couleur subtile */}
      <div style={{ position: "absolute", inset: 0, background: `${color}22` }} />
      {/* Contenu */}
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 12px" }}>
        <div style={{ width: 40, height: 40, borderRadius: 14, background: `${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.2, letterSpacing: -0.1, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>{label}</span>
      </div>
    </button>
  );
}

// ─── Marées ───────────────────────────────────────────────────────────────────

function TidesDrawerContent({ portId, portName, note, tr, accent }: { portId: string; portName: string; note: string; tr: (k: I18nKey) => string; accent: string }) {
  const [data, setData] = useState<{ tides: { type: string; time: string; height: string; coef?: string }[]; date: string } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!portId) return;
    fetch(`/api/tides?portId=${portId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true));
  }, [portId]);

  if (!portId) return <p style={{ color: C.sub, fontSize: 14, textAlign: "center", padding: "20px 0" }}>Aucun port sélectionné.</p>;
  if (error) return <p style={{ color: C.sub, fontSize: 14, textAlign: "center", padding: "20px 0" }}>Impossible de charger les marées.</p>;
  if (!data) return <p style={{ color: C.sub, fontSize: 14, textAlign: "center", padding: "20px 0" }}>Chargement...</p>;

  const name = portName || data.tides[0]?.type;

  return (
    <div>
      <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>
        {tr("tides_port")} · {name || portId}
      </p>
      <p style={{ margin: "0 0 16px", fontSize: 11, color: C.muted }}>{data.date}</p>
      {data.tides.map((t, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < data.tides.length - 1 ? `1px solid ${C.sep}` : "none" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: t.type === "PM" ? `${accent}15` : `${C.blue}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Waves size={20} color={t.type === "PM" ? accent : C.muted} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: t.type === "PM" ? accent : C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>
              {t.type === "PM" ? tr("tides_high") : tr("tides_low")}
              {t.coef && <span style={{ marginLeft: 8, color: C.muted, fontWeight: 500 }}>{tr("tides_coef")} {t.coef}</span>}
            </p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.label, letterSpacing: -0.5 }}>{t.time}</p>
          </div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.sub }}>{t.height}</p>
        </div>
      ))}
      {note && (
        <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: `${accent}08` }}>
          <p style={{ margin: 0, fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{note}</p>
        </div>
      )}
      <p style={{ margin: "16px 0 0", fontSize: 11, color: C.muted, textAlign: "center" }}>{tr("tides_source")}</p>
    </div>
  );
}

// ─── Météo ────────────────────────────────────────────────────────────────────

function WeatherDrawerContent({ address, cityOverride, note, tr, accent }: { address: string; cityOverride: string; note: string; tr: (k: I18nKey) => string; accent: string }) {
  const [data, setData] = useState<{
    city: string; temperature: number; feelsLike: number; description: string; emoji: string;
    windSpeed: number; humidity: number; uvIndex: number;
    forecast: { dayLabel: string; tempMax: number; tempMin: number; emoji: string; precipProbability: number }[];
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!address && !cityOverride) return;
    const params = new URLSearchParams();
    if (cityOverride) params.set("city", cityOverride);
    else if (address) params.set("address", address);
    fetch(`/api/weather?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true));
  }, [address, cityOverride]);

  if (!address && !cityOverride) return <p style={{ color: C.sub, fontSize: 14, textAlign: "center", padding: "20px 0" }}>Renseignez l'adresse du logement pour afficher la météo.</p>;
  if (error) return <p style={{ color: C.sub, fontSize: 14, textAlign: "center", padding: "20px 0" }}>Impossible de charger la météo.</p>;
  if (!data) return <p style={{ color: C.sub, fontSize: 14, textAlign: "center", padding: "20px 0" }}>{tr("weather_loading")}</p>;

  return (
    <div>
      {/* Température principale */}
      <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
        <p style={{ margin: 0, fontSize: 56, lineHeight: 1 }}>{data.emoji}</p>
        <p style={{ margin: "8px 0 0", fontSize: 48, fontWeight: 800, color: C.label, letterSpacing: -2 }}>{data.temperature}°</p>
        <p style={{ margin: "4px 0 0", fontSize: 15, color: C.sub }}>{data.description}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>{data.city}</p>
      </div>
      {/* Infos secondaires */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { icon: <Thermometer size={16} color={accent} />, label: tr("weather_feels"), value: `${data.feelsLike}°` },
          { icon: <Wind size={16} color={C.blue} />, label: tr("weather_wind"), value: `${data.windSpeed} km/h` },
          { icon: <Droplet size={16} color="#06B6D4" />, label: tr("weather_humidity"), value: `${data.humidity}%` },
        ].map((item, i) => (
          <div key={i} style={{ background: C.bg, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{item.icon}</div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.label }}>{item.value}</p>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</p>
          </div>
        ))}
      </div>
      {/* Prévisions 5 jours */}
      <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>{tr("weather_forecast")}</p>
      {data.forecast.map((day, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < data.forecast.length - 1 ? `1px solid ${C.sep}` : "none" }}>
          <p style={{ margin: 0, width: 34, fontSize: 13, fontWeight: 600, color: C.sub }}>{day.dayLabel}</p>
          <p style={{ margin: 0, fontSize: 20 }}>{day.emoji}</p>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.label }}>{day.tempMax}°</span>
              <span style={{ fontSize: 12, color: C.muted }}>{day.tempMin}°</span>
            </div>
          </div>
          {day.precipProbability > 0 && (
            <span style={{ fontSize: 11, color: C.blue, fontWeight: 600 }}>{day.precipProbability}%</span>
          )}
        </div>
      ))}
      {note && (
        <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: `${accent}08` }}>
          <p style={{ margin: 0, fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{note}</p>
        </div>
      )}
      <p style={{ margin: "16px 0 0", fontSize: 11, color: C.muted, textAlign: "center" }}>{tr("weather_source")}</p>
    </div>
  );
}

// ─── PAGE ACCUEIL ─────────────────────────────────────────────────────────────

function PageHome({ booklet, accent, setDrawer }: { booklet: Booklet; accent: string; setDrawer: (id: string) => void }) {
  const tr = useT();
  const arrival       = useMod(booklet, "arrival");
  const accommodation = useMod(booklet, "accommodation");
  const rules         = useMod(booklet, "rules");
  const kitchen       = useMod(booklet, "kitchen");
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
  const checkoutTime = g(arrival, "checkout_time") || g(useMod(booklet, "checkout"), "checkout_time");
  const hostName = g(contact, "host_name");
  const hostPhoto = g(contact, "host_photo");
  const welcomeMsg = g(contact, "welcome_message") || g(arrival, "welcome_message");

  const buttons = [
    { id: "wifi",      label: tr("wifi"),             icon: <Wifi size={20} color="#fff" />,            color: MODULE_COLORS.wifi,      show: !!(wifiName || wifiPass) },
    { id: "access",    label: tr("access_keys"),       icon: <Key size={20} color="#fff" />,             color: MODULE_COLORS.access,    show: !!accessCode },
    { id: "horaires",  label: tr("schedule"),          icon: <Clock size={20} color="#fff" />,           color: C.green,                 show: !!(checkinTime || checkoutTime) },
    { id: "rules",     label: tr("rules"),             icon: <ScrollText size={20} color="#fff" />,      color: MODULE_COLORS.rules,     show: !!rules },
    { id: "logement",  label: tr("le_logement"),       icon: <Home size={20} color="#fff" />,            color: "#6366F1",               show: !!(accommodation && (g(accommodation, "heating") || g(accommodation, "ac") || g(accommodation, "tv"))) },
    { id: "kitchen",   label: tr("kitchen_equip"),     icon: <UtensilsCrossed size={20} color="#fff" />, color: MODULE_COLORS.kitchen,   show: !!kitchen },
    { id: "cleaning",  label: tr("menage_dechets"),    icon: <Sparkles size={20} color="#fff" />,        color: MODULE_COLORS.cleaning,  show: !!(kitchen && g(kitchen, "cleaning")) },
    { id: "safety",    label: tr("nav_safety"),        icon: <Shield size={20} color="#fff" />,          color: MODULE_COLORS.safety,    show: !!safety },
    { id: "contact",   label: tr("contact"),           icon: <Phone size={20} color="#fff" />,           color: MODULE_COLORS.contact,   show: !!contact },
    { id: "pool",      label: tr("pool"),              icon: <Waves size={20} color="#fff" />,           color: MODULE_COLORS.pool,      show: !!pool },
    { id: "baby",      label: tr("baby"),              icon: <Baby size={20} color="#fff" />,            color: MODULE_COLORS.baby,      show: !!baby },
    { id: "pets",      label: tr("pets"),              icon: <Dog size={20} color="#fff" />,             color: MODULE_COLORS.pets,      show: !!petsModule },
    { id: "coworking", label: tr("coworking"),         icon: <Briefcase size={20} color="#fff" />,       color: MODULE_COLORS.coworking, show: !!coworking },
    { id: "transport", label: tr("transport"),         icon: <Bus size={20} color="#fff" />,             color: MODULE_COLORS.transport, show: !!transport },
    { id: "tides",     label: tr("tides"),             icon: <Waves size={20} color="#fff" />,           color: "#0EA5E9",               show: !!(tidesModule && g(tidesModule, "port_id")) },
    { id: "weather",   label: tr("weather"),           icon: <Sun size={20} color="#fff" />,             color: "#F59E0B",               show: !!weatherModule },
  ].filter(b => b.show);

  return (
    <div style={{ flex: 1, overflowY: "auto", touchAction: "pan-y", display: "flex", flexDirection: "column", paddingBottom: TAB_BAR_H }}>

        {/* Header hôte */}
        <div style={{ padding: "48px 20px 20px", textAlign: "center" }}>
          {hostPhoto ? (
            <img src={hostPhoto} alt="" style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(255,255,255,0.5)", margin: "0 auto 12px", display: "block" }} />
          ) : (
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2.5px solid rgba(255,255,255,0.3)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={26} color="rgba(255,255,255,0.8)" />
            </div>
          )}
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.5, textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>
            {booklet.propertyName || booklet.title}
          </h1>
          {hostName && (
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{tr("your_host")} · {hostName}</p>
          )}
          {welcomeMsg && (
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, maxWidth: 260, marginLeft: "auto", marginRight: "auto" }}>
              {welcomeMsg.length > 80 ? welcomeMsg.slice(0, 80) + "…" : welcomeMsg}
            </p>
          )}
        </div>

        {/* Card glassmorphism — adresse uniquement */}
        {booklet.address && (
          <div style={{ margin: "0 16px 16px", borderRadius: 20, background: "rgba(255,255,255,0.13)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.22)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <MapPin size={14} color="rgba(255,255,255,0.55)" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, flex: 1, fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{booklet.address}</p>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booklet.address)}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "5px 10px", borderRadius: 10, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 700, color: "#fff", textDecoration: "none" }}>
                Maps
              </a>
              <a href={`https://waze.com/ul?q=${encodeURIComponent(booklet.address)}&navigate=yes`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "5px 10px", borderRadius: 10, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 700, color: "#fff", textDecoration: "none" }}>
                Waze
              </a>
            </div>
          </div>
        )}

        {/* Grille de boutons */}
        <div style={{ padding: "0 16px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {buttons.map((btn) => (
            <GridButton
              key={btn.id}
              label={btn.label}
              icon={btn.icon}
              color={btn.color}
              onClick={() => setDrawer(btn.id)}
            />
          ))}
        </div>
        <BunklyCredit dark />

    </div>
  );
}

function BunklyCredit({ dark = false }: { dark?: boolean }) {
  const tr = useT();
  const color = dark ? "rgba(255,255,255,0.35)" : C.muted;
  const bold  = dark ? "rgba(255,255,255,0.6)"  : C.sub;
  return (
    <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
      <a href="https://bunkly.co" target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 11, color, textDecoration: "none", fontWeight: 500, letterSpacing: 0.3 }}>
        {tr("created_with").replace("Bunkly.co", "")}
        <span style={{ fontWeight: 700, color: bold }}>Bunkly.co</span>
      </a>
    </div>
  );
}

// ─── Drawers accueil (rendu dans GridContent au-dessus de tout) ───────────────

function HomeDrawers({ booklet, accent, drawer, onClose }: { booklet: Booklet; accent: string; drawer: string | null; onClose: () => void }) {
  const tr = useT();
  const arrival       = useMod(booklet, "arrival");
  const accommodation = useMod(booklet, "accommodation");
  const rules         = useMod(booklet, "rules");
  const kitchen       = useMod(booklet, "kitchen");
  const safety        = useMod(booklet, "safety");
  const contact       = useMod(booklet, "contact");
  const baby          = useMod(booklet, "baby");
  const petsModule    = useMod(booklet, "pets");
  const pool          = useMod(booklet, "pool");
  const coworking     = useMod(booklet, "coworking");
  const transport     = useMod(booklet, "transport");
  const tidesModule   = useMod(booklet, "tides");
  const weatherModule = useMod(booklet, "weather");

  const wifiName     = g(accommodation, "wifi_name");
  const wifiPass     = g(accommodation, "wifi_password");
  const wifiSecurity = g(accommodation, "wifi_security");
  const accessCode   = g(arrival, "access_code");
  const checkinTime  = g(arrival, "checkin_time");
  const checkoutTime = g(arrival, "checkout_time") || g(useMod(booklet, "checkout"), "checkout_time");

  return (
    <>
      <Drawer open={drawer === "horaires"} onClose={onClose} title={tr("schedule")} icon={<Clock size={20} color={C.green} />} color={C.green}>
        {checkinTime && (
          <div style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: checkoutTime ? `1px solid ${C.sep}` : "none" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${C.green}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Clock size={20} color={C.green} /></div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>{tr("checkin")}</p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: C.green, letterSpacing: -1 }}>{formatTime(checkinTime)}</p>
            </div>
          </div>
        )}
        {checkoutTime && (
          <div style={{ display: "flex", gap: 14, padding: "14px 0" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${C.orange}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><LogOut size={20} color={C.orange} /></div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>{tr("checkout")}</p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: C.orange, letterSpacing: -1 }}>{formatTime(checkoutTime)}</p>
            </div>
          </div>
        )}
        {g(arrival, "checkin_process") && (
          <div style={{ marginTop: 8 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>{tr("checkin_process")}</p>
            {g(arrival, "checkin_process").split("\n").filter(Boolean).map((step, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.sep}` : "none" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${C.green}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>{i + 1}</span></div>
                <p style={{ margin: 0, fontSize: 14, color: C.sub, lineHeight: 1.6, paddingTop: 2 }}>{step}</p>
              </div>
            ))}
          </div>
        )}
        <InfoRow icon={<Clock size={18} color={C.green} />} label={tr("early_checkin")} value={g(arrival, "early_checkin")} color={C.green} last />
      </Drawer>

      <Drawer open={drawer === "wifi"} onClose={onClose} title={tr("wifi")} icon={<Wifi size={20} color={MODULE_COLORS.wifi} />} color={MODULE_COLORS.wifi}>
        <CopyRow label={tr("network")} value={wifiName} accent={accent} />
        <CopyRow label={tr("password")} value={wifiPass} accent={accent} />
        {(wifiName || wifiPass) && <WifiQRCode ssid={wifiName} password={wifiPass} security={wifiSecurity} accent={accent} />}
        {g(accommodation, "wifi_info") && (
          <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: `${accent}08` }}>
            <p style={{ margin: 0, fontSize: 13, color: C.sub, lineHeight: 1.65, whiteSpace: "pre-line" }}>{g(accommodation, "wifi_info")}</p>
          </div>
        )}
      </Drawer>

      <Drawer open={drawer === "access"} onClose={onClose} title={tr("access_keys")} icon={<Key size={20} color={MODULE_COLORS.access} />} color={MODULE_COLORS.access}>
        {accessCode && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>{tr("access_code")}</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {accessCode.split("").map((char, i) => (
                <div key={i} style={{ width: 44, height: 52, borderRadius: 12, background: `${accent}10`, border: `1.5px solid ${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: accent, fontFamily: "ui-monospace,monospace" }}>{char}</div>
              ))}
            </div>
          </div>
        )}
        <InfoRow icon={<MapPin size={18} color={MODULE_COLORS.access} />} label={tr("key_location")} value={g(arrival, "key_location")} color={MODULE_COLORS.access} />
        <InfoRow icon={<Car size={18} color={C.orange} />} label={tr("parking")} value={g(arrival, "parking")} color={C.orange} last />
      </Drawer>

      <Drawer open={drawer === "rules"} onClose={onClose} title={tr("rules")} icon={<ScrollText size={20} color={MODULE_COLORS.rules} />} color={MODULE_COLORS.rules}>
        <InfoRow icon={<Users size={18} color={C.blue} />} label={tr("persons")} value={g(rules, "max_guests")} color={C.blue} />
        <InfoRow icon={<Cigarette size={18} color={C.red} />} label={tr("smoking")} value={g(rules, "smoking")} color={C.red} />
        <InfoRow icon={<Dog size={18} color={C.orange} />} label={tr("pets")} value={g(rules, "pets")} color={C.orange} />
        <InfoRow icon={<Volume2 size={18} color={C.green} />} label={tr("noise")} value={g(rules, "noise")} color={C.green} />
        <InfoRow icon={<PartyPopper size={18} color="#8B5CF6" />} label={tr("parties")} value={g(rules, "parties")} color="#8B5CF6" />
        <InfoRow icon={<Info size={18} color={C.muted} />} label={tr("other")} value={g(rules, "other")} color={C.muted} last />
      </Drawer>

      <Drawer open={drawer === "logement"} onClose={onClose} title={tr("le_logement")} icon={<Home size={20} color="#6366F1" />} color="#6366F1">
        <InfoRow icon={<Thermometer size={18} color={MODULE_COLORS.heating} />} label={tr("heating")} value={g(accommodation, "heating")} color={MODULE_COLORS.heating} />
        <InfoRow icon={<Wind size={18} color={MODULE_COLORS.ac} />} label={tr("ac")} value={g(accommodation, "ac")} color={MODULE_COLORS.ac} />
        <InfoRow icon={<Tv size={18} color="#8B5CF6" />} label={tr("tv")} value={g(accommodation, "tv")} color="#8B5CF6" last />
      </Drawer>

      <Drawer open={drawer === "kitchen"} onClose={onClose} title={tr("kitchen_equip")} icon={<UtensilsCrossed size={20} color={MODULE_COLORS.kitchen} />} color={MODULE_COLORS.kitchen}>
        <InfoRow icon={<UtensilsCrossed size={18} color={MODULE_COLORS.kitchen} />} label={tr("kitchen_equip")} value={g(kitchen, "equipment")} color={MODULE_COLORS.kitchen} />
        <InfoRow icon={<WashingMachine size={18} color={C.blue} />} label={tr("appliances")} value={g(accommodation, "appliances")} color={C.blue} />
        <InfoRow icon={<Mailbox size={18} color={C.orange} />} label={tr("mailbox")} value={g(accommodation, "checkin_code")} color={C.orange} last />
      </Drawer>

      <Drawer open={drawer === "cleaning"} onClose={onClose} title={tr("menage_dechets")} icon={<Sparkles size={20} color={MODULE_COLORS.cleaning} />} color={MODULE_COLORS.cleaning}>
        <InfoRow icon={<Sparkles size={18} color={MODULE_COLORS.cleaning} />} label={tr("cleaning")} value={g(kitchen, "cleaning")} color={MODULE_COLORS.cleaning} />
        <InfoRow icon={<ShoppingBag size={18} color={C.blue} />} label={tr("linen")} value={g(kitchen, "linen")} color={C.blue} />
        <InfoRow icon={<Trash2Icon size={18} color={C.green} />} label={tr("waste")} value={g(kitchen, "trash")} color={C.green} last />
      </Drawer>

      <Drawer open={drawer === "safety"} onClose={onClose} title={tr("safety")} icon={<Shield size={20} color={MODULE_COLORS.safety} />} color={MODULE_COLORS.safety}>
        {g(safety, "emergency") && (
          <div style={{ background: "#FFF5F5", borderRadius: 16, padding: "14px 16px", marginBottom: 12, border: "1px solid #FEE2E2" }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 0.7 }}>{tr("emergency_numbers")}</p>
            <p style={{ margin: 0, fontSize: 15, color: "#374151", lineHeight: 1.9, whiteSpace: "pre-line", fontWeight: 500 }}>{g(safety, "emergency")}</p>
          </div>
        )}
        <InfoRow icon={<Flame size={18} color={C.red} />} label={tr("fire_extinguisher")} value={g(safety, "fire_extinguisher")} color={C.red} />
        <InfoRow icon={<Zap size={18} color={C.orange} />} label={tr("circuit_breaker")} value={g(safety, "circuit_breaker")} color={C.orange} />
        <InfoRow icon={<Droplets size={18} color={C.blue} />} label={tr("water_shutoff")} value={g(safety, "water_shutoff")} color={C.blue} />
        <InfoRow icon={<Hospital size={18} color={C.green} />} label={tr("hospital")} value={g(safety, "hospital")} color={C.green} last />
      </Drawer>

      <Drawer open={drawer === "contact"} onClose={onClose} title={tr("contact")} icon={<Phone size={20} color={MODULE_COLORS.contact} />} color={MODULE_COLORS.contact}>
        {(g(contact, "host_name") || g(contact, "host_photo")) && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 0 14px", borderBottom: `1px solid ${C.sep}`, marginBottom: 4 }}>
            {g(contact, "host_photo") ? <img src={g(contact, "host_photo")} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={22} color={accent} /></div>}
            <div>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.label }}>{g(contact, "host_name")}</p>
              {g(contact, "response_time") && <p style={{ margin: "2px 0 0", fontSize: 12, color: C.sub }}>{g(contact, "response_time")}</p>}
            </div>
          </div>
        )}
        {g(contact, "about") && <p style={{ margin: "12px 0", fontSize: 14, color: C.sub, lineHeight: 1.65 }}>{g(contact, "about")}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          {g(contact, "host_phone") && <a href={`tel:${g(contact, "host_phone")}`} style={{ flex: 1, padding: "12px 0", borderRadius: 14, background: `${accent}12`, color: accent, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontWeight: 600, fontSize: 14 }}><Phone size={16} color={accent} /> {tr("call")}</a>}
          {g(contact, "host_email") && <a href={`mailto:${g(contact, "host_email")}`} style={{ flex: 1, padding: "12px 0", borderRadius: 14, background: `${accent}12`, color: accent, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontWeight: 600, fontSize: 14 }}><Phone size={16} color={accent} /> {tr("email")}</a>}
        </div>
        <InfoRow icon={<ConciergeBell size={18} color="#8B5CF6" />} label={tr("concierge")} value={g(contact, "concierge")} color="#8B5CF6" />
        <InfoRow icon={<Wrench size={18} color={C.orange} />} label={tr("maintenance")} value={g(contact, "maintenance")} color={C.orange} last />
      </Drawer>

      <Drawer open={drawer === "pool"} onClose={onClose} title={tr("pool")} icon={<Waves size={20} color={MODULE_COLORS.pool} />} color={MODULE_COLORS.pool}>
        <InfoRow icon={<Clock size={18} color={C.blue} />} label={tr("schedule")} value={g(pool, "hours")} color={C.blue} />
        <InfoRow icon={<Shield size={18} color={C.red} />} label={tr("pool_rules")} value={g(pool, "rules")} color={C.red} />
        <InfoRow icon={<Waves size={18} color={C.green} />} label={tr("pool_equip")} value={g(pool, "equipment")} color={C.green} />
        <InfoRow icon={<Wrench size={18} color={C.muted} />} label={tr("pool_maintenance")} value={g(pool, "maintenance")} color={C.muted} last />
      </Drawer>

      <Drawer open={drawer === "baby"} onClose={onClose} title={tr("baby")} icon={<Baby size={20} color={MODULE_COLORS.baby} />} color={MODULE_COLORS.baby}>
        <InfoRow icon={<Baby size={18} color={MODULE_COLORS.baby} />} label={tr("baby_equip")} value={g(baby, "available")} color={MODULE_COLORS.baby} />
        <InfoRow icon={<Shield size={18} color={C.green} />} label={tr("baby_safety")} value={g(baby, "safety")} color={C.green} />
        <InfoRow icon={<ShoppingBag size={18} color={C.blue} />} label={tr("baby_rental")} value={g(baby, "rental")} color={C.blue} last />
      </Drawer>

      <Drawer open={drawer === "pets"} onClose={onClose} title={tr("pets")} icon={<Dog size={20} color={MODULE_COLORS.pets} />} color={MODULE_COLORS.pets}>
        <InfoRow icon={<Dog size={18} color={MODULE_COLORS.pets} />} label={tr("pets_rules")} value={g(petsModule, "rules")} color={MODULE_COLORS.pets} />
        <InfoRow icon={<MapPin size={18} color={C.blue} />} label={tr("pets_zones")} value={g(petsModule, "zones")} color={C.blue} />
        <InfoRow icon={<Hospital size={18} color={C.green} />} label={tr("pets_places")} value={g(petsModule, "nearby")} color={C.green} last />
      </Drawer>

      <Drawer open={drawer === "coworking"} onClose={onClose} title={tr("coworking")} icon={<Briefcase size={20} color={MODULE_COLORS.coworking} />} color={MODULE_COLORS.coworking}>
        <InfoRow icon={<Briefcase size={18} color={MODULE_COLORS.coworking} />} label={tr("workspace")} value={g(coworking, "desk")} color={MODULE_COLORS.coworking} />
        <InfoRow icon={<Wifi size={18} color={C.blue} />} label={tr("wifi_dedicated")} value={g(coworking, "wifi_pro")} color={C.blue} />
        <InfoRow icon={<Tv size={18} color={C.green} />} label={tr("screens")} value={g(coworking, "screens")} color={C.green} last />
      </Drawer>

      <Drawer open={drawer === "transport"} onClose={onClose} title={tr("transport")} icon={<Bus size={20} color={MODULE_COLORS.transport} />} color={MODULE_COLORS.transport}>
        <InfoRow icon={<Bus size={18} color={C.blue} />} label={tr("public_transport")} value={g(transport, "public")} color={C.blue} />
        <InfoRow icon={<Car size={18} color={C.orange} />} label={tr("taxi")} value={g(transport, "taxi")} color={C.orange} />
        <InfoRow icon={<Bike size={18} color={C.green} />} label={tr("bikes")} value={g(transport, "bike")} color={C.green} />
        <InfoRow icon={<Plane size={18} color="#8B5CF6" />} label={tr("airport")} value={g(transport, "airport")} color="#8B5CF6" last />
      </Drawer>

      <Drawer open={drawer === "tides"} onClose={onClose} title={tr("tides")} icon={<Waves size={20} color="#0EA5E9" />} color="#0EA5E9">
        <TidesDrawerContent portId={g(tidesModule, "port_id")} portName={g(tidesModule, "port_name")} note={g(tidesModule, "note")} tr={tr} accent="#0EA5E9" />
      </Drawer>

      <Drawer open={drawer === "weather"} onClose={onClose} title={tr("weather")} icon={<Sun size={20} color="#F59E0B" />} color="#F59E0B">
        <WeatherDrawerContent address={booklet.address ?? ""} cityOverride={g(weatherModule, "city_override")} note={g(weatherModule, "note")} tr={tr} accent="#F59E0B" />
      </Drawer>
    </>
  );
}

// Icône Trash2 sous un autre nom pour éviter le conflit
function Trash2Icon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ─── PAGE ACTIVITÉS ───────────────────────────────────────────────────────────

function PageArea({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const tr = useT();
  const neighborhood = useMod(booklet, "neighborhood");
  const activities = parseActivities(g(neighborhood, "activities_list"));
  const places = neighborhood ? parsePlaces(g(neighborhood, "places")) : [];
  const mapAddress = encodeURIComponent(booklet.address || booklet.propertyName || "");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedAct, setSelectedAct] = useState<Activity | null>(null);

  const catColor: Record<string, string> = { restaurant: C.red, activity: C.blue, shop: C.green, transport: C.orange, other: C.muted };
  const catLabel: Record<string, string> = {
    restaurant: tr("cat_restaurant"),
    activity: tr("cat_activity"),
    shop: tr("cat_shop"),
    transport: tr("transport"),
    other: tr("places"),
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

  const GLASS = { background: "rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.2)" };
  const GLASS_CARD = { background: "rgba(255,255,255,0.14)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20 };

  return (
    <div style={{ position: "relative", flex: 1, height: "100%", overflow: "hidden" }}>
      {/* Fond photo plein écran fixe */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        {booklet.coverImage
          ? <img src={booklet.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", background: "#1a1a2e" }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      </div>

      {/* Contenu scrollable */}
      <div style={{ position: "relative", zIndex: 1, height: "100%", overflowY: "auto", touchAction: "pan-y", paddingBottom: TAB_BAR_H }}>

        {/* Header */}
        <div style={{ padding: "48px 20px 16px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1 }}>{tr("discover")}</p>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.4, textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>{booklet.propertyName || booklet.title}</h2>
        </div>

        <div style={{ padding: "0 16px 32px" }}>
          {/* Filtres glass */}
          {visibleCats.length > 2 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", marginBottom: 14, touchAction: "pan-x" }}>
              {visibleCats.map(cat => {
                const isActive = activeFilter === cat.id;
                return (
                  <button key={cat.id} onClick={() => setActiveFilter(cat.id)}
                    style={{ flexShrink: 0, padding: "7px 16px", borderRadius: 20, border: isActive ? `1.5px solid rgba(255,255,255,0.6)` : "1.5px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 13, fontWeight: isActive ? 700 : 500, background: isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", color: "#fff" }}>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Liste activités glass */}
          <div style={{ ...GLASS_CARD, overflow: "hidden", marginBottom: 16 }}>
            {filtered.map((act, i) => (
              <button key={i} onClick={() => setSelectedAct(act)}
                style={{ width: "100%", display: "flex", gap: 12, padding: "12px 14px", background: "none", border: "none", borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,0.15)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {act.photo
                    ? <img src={act.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <MapPin size={22} color="rgba(255,255,255,0.7)" />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: catColor[act.category], background: `${catColor[act.category]}30`, borderRadius: 6, padding: "2px 7px" }}>{catLabel[act.category]}</span>
                    {act.recommended && <Star size={11} color={C.orange} fill={C.orange} />}
                  </div>
                  <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{act.name}</p>
                  {act.description && <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{act.description}</p>}
                  <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                    {act.distance && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>📍 {act.distance}</span>}
                    {act.priceRange && <span style={{ fontSize: 10, color: C.orange, fontWeight: 700 }}>{act.priceRange}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Carte */}
          {mapAddress && (
            <div style={{ ...GLASS_CARD, overflow: "hidden" }}>
              <p style={{ margin: "0 0 0", padding: "12px 14px 10px", fontSize: 13, fontWeight: 700, color: "#fff" }}>{tr("map")}</p>
              <iframe src={`https://maps.google.com/maps?q=${mapAddress}&output=embed&z=15`} width="100%" height="160" style={{ border: 0, display: "block" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Carte" />
            </div>
          )}
        </div>
        <BunklyCredit dark />
      </div>

      {/* Drawer activité */}
      {selectedAct && (
        <div style={{ position: "absolute", inset: 0, zIndex: 200 }}>
          <Drawer open={!!selectedAct} onClose={() => setSelectedAct(null)} title={selectedAct.name} icon={<MapPin size={20} color={catColor[selectedAct.category]} />} color={catColor[selectedAct.category]}>
            {selectedAct.photo && (
              <div style={{ borderRadius: 16, overflow: "hidden", height: 160, marginBottom: 16 }}>
                <img src={selectedAct.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            {selectedAct.description && <p style={{ margin: "0 0 16px", fontSize: 14, color: C.sub, lineHeight: 1.7 }}>{selectedAct.description}</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {selectedAct.distance && <span style={{ fontSize: 12, color: C.sub, background: C.sep, borderRadius: 20, padding: "4px 10px" }}>📍 {selectedAct.distance}</span>}
              {selectedAct.openHours && <span style={{ fontSize: 12, color: C.sub, background: C.sep, borderRadius: 20, padding: "4px 10px" }}>🕐 {selectedAct.openHours}</span>}
              {selectedAct.priceRange && <span style={{ fontSize: 12, color: C.orange, fontWeight: 700, background: `${C.orange}12`, borderRadius: 20, padding: "4px 10px" }}>{selectedAct.priceRange}</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {selectedAct.phone && <a href={`tel:${selectedAct.phone}`} style={{ flex: 1, padding: "11px 0", borderRadius: 14, background: `${accent}12`, color: accent, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 13 }}><Phone size={15} color={accent} /> {tr("call")}</a>}
              {selectedAct.address && <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedAct.address)}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "11px 0", borderRadius: 14, background: `${accent}12`, color: accent, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 13 }}><Navigation size={15} color={accent} /> {tr("maps")}</a>}
              {selectedAct.website && <a href={selectedAct.website} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "11px 0", borderRadius: 14, background: `${accent}12`, color: accent, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 13 }}><Globe size={15} color={accent} /> {tr("website")}</a>}
            </div>
          </Drawer>
        </div>
      )}
    </div>
  );
}

// ─── PAGE DÉPART ──────────────────────────────────────────────────────────────

function PageCheckout({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const tr = useT();
  const checkout = useMod(booklet, "checkout");
  const tasks = g(checkout, "process").split("\n").filter(Boolean);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const doneCount = Object.values(checked).filter(Boolean).length;

  const GLASS_CARD = { background: "rgba(255,255,255,0.14)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20 };

  return (
    <div style={{ position: "relative", flex: 1, height: "100%", overflow: "hidden" }}>
      {/* Fond photo plein écran */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        {booklet.coverImage
          ? <img src={booklet.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", background: "#1a1a2e" }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      </div>

      {/* Contenu scrollable */}
      <div style={{ position: "relative", zIndex: 1, height: "100%", overflowY: "auto", touchAction: "pan-y", paddingBottom: TAB_BAR_H }}>

        {/* Header */}
        <div style={{ padding: "48px 20px 16px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1 }}>{tr("checklist")}</p>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.4, textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>{tr("your_checkout")}</h2>
        </div>

        <div style={{ padding: "0 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Heure */}
          {g(checkout, "checkout_time") && (
            <div style={{ ...GLASS_CARD, padding: "24px 20px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Clock size={26} color="#fff" />
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.8 }}>{tr("checkout_time")}</p>
              <p style={{ margin: 0, fontSize: 52, fontWeight: 800, color: "#fff", letterSpacing: -2, lineHeight: 1, textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>{formatTime(g(checkout, "checkout_time"))}</p>
              {g(checkout, "late_checkout_info") && <p style={{ margin: "10px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{g(checkout, "late_checkout_info")}</p>}
            </div>
          )}

          {/* Checklist */}
          {tasks.length > 0 && (
            <div style={{ ...GLASS_CARD, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>{tr("checkout_checklist")}</p>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{doneCount}/{tasks.length}</span>
              </div>
              {tasks.map((task, i) => (
                <button key={i} onClick={() => setChecked(p => ({ ...p, [i]: !p[i] }))}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", background: "none", border: "none", borderBottom: i < tasks.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: checked[i] ? accent : "transparent", border: `2px solid ${checked[i] ? accent : "rgba(255,255,255,0.4)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}>
                    {checked[i] && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: checked[i] ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.9)", textDecoration: checked[i] ? "line-through" : "none", flex: 1 }}>{task}</p>
                </button>
              ))}
              {doneCount === tasks.length && tasks.length > 0 && (
                <div style={{ padding: "12px 18px", background: `${accent}30`, display: "flex", alignItems: "center", gap: 8 }}>
                  <Check size={15} color="#fff" />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>{tr("checkout_ready")}</p>
                </div>
              )}
            </div>
          )}

          {/* Retour des clés */}
          {g(checkout, "keys_return") && (
            <div style={{ ...GLASS_CARD, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Key size={20} color="#fff" />
              </div>
              <div>
                <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 0.7 }}>{tr("key_return")}</p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>{g(checkout, "keys_return")}</p>
              </div>
            </div>
          )}

          {/* Avis */}
          {(g(checkout, "review_airbnb") || g(checkout, "review_google") || g(checkout, "review_booking")) && (
            <div>
              <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.8 }}>{tr("leave_review")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { key: "review_airbnb", label: "Airbnb" },
                  { key: "review_google", label: "Google" },
                  { key: "review_booking", label: "Booking.com" },
                ].filter(r => g(checkout, r.key)).map(r => (
                  <a key={r.key} href={g(checkout, r.key)} target="_blank" rel="noopener noreferrer"
                    style={{ ...GLASS_CARD, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", textDecoration: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Star size={18} color="#fff" fill="#fff" />
                      </div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{r.label}</p>
                    </div>
                    <ChevronDown size={16} color="rgba(255,255,255,0.5)" style={{ transform: "rotate(-90deg)" }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {g(checkout, "thank_you") && (
            <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.6)", fontStyle: "italic", lineHeight: 1.7 }}>{g(checkout, "thank_you")}</p>
          )}
        </div>
        <BunklyCredit dark />
      </div>
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

type GridTab = "home" | "area" | "checkout";

function GridTabBar({ active, onSelect, accent }: { active: GridTab; onSelect: (t: GridTab) => void; accent: string }) {
  const tr = useT();
  const inactive = "rgba(255,255,255,0.5)";

  const tabs = [
    { id: "home" as GridTab,     label: tr("nav_home"),     icon: (a: boolean) => <Home size={22} color={a ? "#fff" : inactive} strokeWidth={a ? 2.5 : 1.8} /> },
    { id: "area" as GridTab,     label: tr("nav_area"),     icon: (a: boolean) => <MapPin size={22} color={a ? "#fff" : inactive} strokeWidth={a ? 2.5 : 1.8} /> },
    { id: "checkout" as GridTab, label: tr("nav_checkout"), icon: (a: boolean) => <LogOut size={22} color={a ? "#fff" : inactive} strokeWidth={a ? 2.5 : 1.8} /> },
  ];

  return (
    <div style={{ display: "flex", background: "rgba(10,10,20,0.55)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.12)", flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom)", paddingTop: 8, paddingLeft: 8, paddingRight: 8 }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onSelect(t.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0 8px", background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 48, height: 32, borderRadius: 16, background: isActive ? "rgba(255,255,255,0.2)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
              {t.icon(isActive)}
            </div>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? "#fff" : inactive, letterSpacing: 0.1 }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Viewer mobile (contenu seul) ─────────────────────────────────────────────

const TAB_BAR_H = 72;

// ─── Sélecteur de langue ──────────────────────────────────────────────────────

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

const LANG_FLAG_ISO: Record<string, string> = { fr: "fr", en: "gb", es: "es", de: "de", it: "it", ar: "sa" };
function FlagImg({ code, size = 20 }: { code: string; size?: number }) {
  const iso = LANG_FLAG_ISO[code] ?? code;
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt={code}
      style={{ width: size, height: size * 0.67, borderRadius: 3, objectFit: "cover", display: "block", flexShrink: 0 }}
    />
  );
}

function LangSelector({ booklet, lang, onSelect }: {
  booklet: Booklet;
  lang: SupportedLang;
  onSelect: (l: SupportedLang) => void;
}) {
  const [open, setOpen] = useState(false);
  const available = SUPPORTED_LANGS.filter(
    l => l.code === "fr" || booklet.translations?.[l.code] !== undefined
  );
  if (available.length <= 1) return null;

  const current = available.find(l => l.code === lang) ?? available[0];

  return (
    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 200 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20,
          padding: "7px 12px", cursor: "pointer",
        }}>
        <FlagImg code={current.code} size={22} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "rgba(15,15,25,0.92)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16,
          padding: 6, minWidth: 140,
        }}>
          {available.map(l => (
            <button
              key={l.code}
              onClick={() => { onSelect(l.code); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                background: l.code === lang ? "rgba(255,255,255,0.12)" : "transparent",
                border: "none", borderRadius: 10, padding: "8px 12px",
                color: "#fff", fontSize: 13, fontWeight: l.code === lang ? 700 : 400,
                cursor: "pointer", textAlign: "left",
              }}>
              <FlagImg code={l.code} size={20} />
              <span>{l.label}</span>
              {l.code === lang && <Check size={12} style={{ marginLeft: "auto", color: "#34d399" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GridContent({ booklet: rawBooklet, onTabChange }: { booklet: Booklet; onTabChange?: (tab: string) => void }) {
  const [tab, setTab] = useState<GridTab>("home");
  const [drawer, setDrawer] = useState<string | null>(null);
  const [lang, setLang] = useState<SupportedLang>("fr");
  const booklet = useTranslatedBooklet(rawBooklet, lang);
  const accent = booklet.accentColor || C.blue;

  const handleTabChange = (t: GridTab) => {
    setTab(t);
    onTabChange?.(t);
  };

  return (
    <LangCtx.Provider value={lang}>
      <style>{`::-webkit-scrollbar-thumb { background: ${accent} !important; }`}</style>
      <div style={{ position: "relative", height: "100%", fontFamily: FONT, WebkitFontSmoothing: "antialiased", background: "#1a1a2e" }}>

      {/* Fond photo plein écran — home uniquement (area/checkout gèrent leur propre fond) */}
      {tab === "home" && booklet.coverImage && (
        <>
          <img src={booklet.coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.6) 100%)", zIndex: 1 }} />
        </>
      )}

      {/* Sélecteur de langue */}
      <LangSelector booklet={rawBooklet} lang={lang} onSelect={setLang} />

      {/* Pages */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", flexDirection: "column" }}>
        {tab === "home"     && <PageHome     booklet={booklet} accent={accent} setDrawer={setDrawer} />}
        {tab === "area"     && <PageArea     booklet={booklet} accent={accent} />}
        {tab === "checkout" && <PageCheckout booklet={booklet} accent={accent} />}
      </div>

      {/* Tab bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50 }}>
        <GridTabBar active={tab} onSelect={handleTabChange} accent={accent} />
      </div>

      {/* Drawers — au-dessus de tout, même de la tab bar */}
      <div style={{ position: "absolute", inset: 0, zIndex: 300, pointerEvents: drawer ? "auto" : "none" }}>
        <HomeDrawers booklet={booklet} accent={accent} drawer={drawer} onClose={() => setDrawer(null)} />
      </div>
    </div>
    </LangCtx.Provider>
  );
}

// ─── Desktop (mockup iPhone + QR) ────────────────────────────────────────────

function useQrCodeGrid(url: string) {
  const [dataUrl, setDataUrl] = useState("");
  if (typeof window !== "undefined") {
    import("qrcode").then(QRCode => {
      QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: "#111827", light: "#ffffff" } })
        .then(setDataUrl).catch(() => {});
    });
  }
  return dataUrl;
}

function GridDesktop({ booklet }: { booklet: Booklet }) {
  const url = `https://app.bunkly.co/b/${booklet.slug}`;
  const qrDataUrl = useQrCodeGrid(url);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px", fontFamily: FONT,
    }}>
      {/* Texte + QR gauche */}
      <div style={{ color: "#fff", maxWidth: 300, marginRight: 60, flexShrink: 0 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "6px 14px", marginBottom: 24 }}>
          <MapPin size={12} color="rgba(255,255,255,0.6)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Expérience mobile</span>
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: 32, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.5 }}>
          {booklet.propertyName || booklet.title}
        </h1>
        {booklet.address && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 5, marginBottom: 20 }}>
            <MapPin size={13} color="rgba(255,255,255,0.4)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{booklet.address}</p>
          </div>
        )}
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
          Scannez ce QR code avec votre téléphone pour accéder au livret.
        </p>
        <div style={{ background: "#fff", borderRadius: 20, padding: 16, display: "inline-block", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          {qrDataUrl
            ? <img src={qrDataUrl} alt="QR code" style={{ width: 160, height: 160, display: "block", borderRadius: 8 }} />
            : <div style={{ width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}><MapPin size={40} color="#ddd" /></div>
          }
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9CA3AF", textAlign: "center", fontFamily: "ui-monospace,monospace" }}>
            app.bunkly.co/b/{booklet.slug}
          </p>
        </div>
      </div>

      {/* Mockup iPhone */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 390, height: 760, borderRadius: 52,
          background: "#111827", padding: "12px 10px",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 0 2px rgba(255,255,255,0.04)",
          position: "relative",
        }}>
          <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", width: 120, height: 34, background: "#000", borderRadius: 20, zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: 42, overflow: "hidden", background: C.bg }}>
            <GridContent booklet={booklet} />
          </div>
        </div>
        <div style={{ position: "absolute", left: -3, top: 120, width: 3, height: 32, background: "#374151", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", left: -3, top: 162, width: 3, height: 64, background: "#374151", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", left: -3, top: 236, width: 3, height: 64, background: "#374151", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", right: -3, top: 160, width: 3, height: 80, background: "#374151", borderRadius: "0 2px 2px 0" }} />
      </div>
    </div>
  );
}

// ─── Viewer principal ─────────────────────────────────────────────────────────

export function ViewerGrid({ booklet, onTabChange }: { booklet: Booklet; onTabChange?: (tab: string) => void }) {
  return (
    <>
      <div className="md:hidden" style={{ height: "100vh", maxHeight: "100dvh" }}>
        <GridContent booklet={booklet} onTabChange={onTabChange} />
      </div>
      <div className="hidden md:block">
        <GridDesktop booklet={booklet} />
      </div>
    </>
  );
}
