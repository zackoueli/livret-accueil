"use client";

import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { Booklet, BookletModule, SupportedLang, SUPPORTED_LANGS } from "@/types";
import { t, I18nKey } from "@/lib/i18n";
import { formatTime, parseActivities, parseServices, Activity } from "@/lib/modules";
import {
  Wifi, Copy, Check, MapPin, Clock, Key, Car, Thermometer, Wind, Tv, Mailbox,
  Info, Users, Cigarette, Dog, Volume2, PartyPopper, UtensilsCrossed, Trash2,
  ShoppingBag, Sparkles, WashingMachine, Phone, Mail, Wrench, ConciergeBell,
  Flame, Zap, Droplets, Hospital, Shield, Home, Briefcase, Accessibility,
  Leaf, Pill, Stethoscope, Store, Building2, Bike, Plane, Bus, Navigation,
  Star, ChevronRight, ChevronDown, ExternalLink, Baby, Waves, Monitor, Dumbbell,
  Globe, QrCode,
} from "lucide-react";

type Tab = "home" | "stay" | "area" | "safety" | "checkout";

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

function parsePlaces(raw: string) {
  return raw.split("\n").map(line => {
    const [name, address] = line.split("|").map(s => s.trim());
    return name ? { name, address: address ?? "" } : null;
  }).filter(Boolean) as { name: string; address: string }[];
}

function useMod(booklet: Booklet, type: BookletModule["type"]) {
  return booklet.modules.find(m => m.type === type && m.enabled);
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:     "#F7F7F9",   // gris chaud neutre
  card:   "#FFFFFF",
  label:  "#111827",
  sub:    "#6B7280",
  muted:  "#B0B7C3",
  sep:    "#F3F4F6",
  green:  "#10B981",
  orange: "#F59E0B",
  red:    "#EF4444",
  blue:   "#3B82F6",
};

const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";

// ─── Composants de base ───────────────────────────────────────────────────────

function Card({ children, style = {}, noPad = false }: { children: React.ReactNode; style?: React.CSSProperties; noPad?: boolean }) {
  return (
    <div style={{
      background: C.card,
      borderRadius: 24,
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 17, fontWeight: 700, color: C.label,
      margin: "0 0 12px", letterSpacing: -0.2,
    }}>
      {children}
    </p>
  );
}

function Sep() {
  return <div style={{ height: 1, background: C.sep, margin: "0 16px" }} />;
}

function IconBox({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{
      width: 48, height: 48, borderRadius: "50%",
      background: `${color}12`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function CopyButton({ value, accent }: { value: string; accent: string }) {
  const [done, setDone] = useState(false);
  const tr = useT();
  const copy = () => {
    navigator.clipboard.writeText(value);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer",
      fontSize: 13, fontWeight: 600,
      background: done ? `${C.green}15` : `${accent}12`,
      color: done ? C.green : accent,
      transition: "all 0.2s", flexShrink: 0,
    }}>
      {done ? <Check size={13} /> : <Copy size={13} />}
      {done ? tr("copied") : tr("copy")}
    </button>
  );
}

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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 4px", gap: 8 }}>
      <img src={dataUrl} alt="QR Code WiFi" width={160} height={160} style={{ borderRadius: 12, border: `2px solid ${accent}20` }} />
      <p style={{ margin: 0, fontSize: 12, color: C.sub, display: "flex", alignItems: "center", gap: 5 }}>
        <QrCode size={13} color={C.sub} />
        Scanner pour se connecter
      </p>
    </div>
  );
}

// ─── Marées (inline) ──────────────────────────────────────────────────────────

function TidesSection({ portId, portName, note, accent, tr }: { portId: string; portName: string; note: string; accent: string; tr: (k: I18nKey) => string }) {
  const [data, setData] = useState<{ tides: { type: string; time: string; height: string; coef?: string }[]; date: string } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!portId) return;
    fetch(`/api/tides?portId=${portId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true));
  }, [portId]);
  if (error) return <Card><p style={{ margin: 0, padding: "14px 16px", fontSize: 13, color: C.sub }}>Impossible de charger les marées.</p></Card>;
  if (!data) return <Card><p style={{ margin: 0, padding: "14px 16px", fontSize: 13, color: C.sub }}>Chargement...</p></Card>;
  return (
    <Card>
      <div style={{ padding: "10px 16px 6px", borderBottom: `1px solid ${C.sep}` }}>
        <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{tr("tides_port")} · {portName || portId} — {data.date}</p>
      </div>
      {data.tides.map((t, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderBottom: i < data.tides.length - 1 ? `1px solid ${C.sep}` : "none" }}>
          <IconBox color={t.type === "PM" ? accent : "#6B7280"}>
            <Waves size={18} color={t.type === "PM" ? accent : "#6B7280"} />
          </IconBox>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: C.sub }}>{t.type === "PM" ? tr("tides_high") : tr("tides_low")}{t.coef && ` · coeff. ${t.coef}`}</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.label, letterSpacing: -0.5 }}>{t.time}</p>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.sub }}>{t.height}</p>
        </div>
      ))}
      {note && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.sep}` }}>
          <p style={{ margin: 0, fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{note}</p>
        </div>
      )}
    </Card>
  );
}

// ─── Météo (inline) ───────────────────────────────────────────────────────────

function WeatherSection({ address, cityOverride, note, accent, tr }: { address: string; cityOverride: string; note: string; accent: string; tr: (k: I18nKey) => string }) {
  const [data, setData] = useState<{
    city: string; temperature: number; feelsLike: number; description: string; emoji: string;
    windSpeed: number; humidity: number;
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
  if (!address && !cityOverride) return null;
  if (error) return <Card><p style={{ margin: 0, padding: "14px 16px", fontSize: 13, color: C.sub }}>Impossible de charger la météo.</p></Card>;
  if (!data) return <Card><p style={{ margin: 0, padding: "14px 16px", fontSize: 13, color: C.sub }}>{tr("weather_loading")}</p></Card>;
  return (
    <Card>
      {/* Météo actuelle */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 16px 12px", borderBottom: `1px solid ${C.sep}` }}>
        <p style={{ margin: 0, fontSize: 40, lineHeight: 1 }}>{data.emoji}</p>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: C.label, letterSpacing: -1 }}>{data.temperature}°</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: C.sub }}>{data.description} · {data.city}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Ressenti {data.feelsLike}°</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>Vent {data.windSpeed} km/h</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>Humidité {data.humidity}%</p>
        </div>
      </div>
      {/* Prévisions */}
      {data.forecast.map((day, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < data.forecast.length - 1 ? `1px solid ${C.sep}` : "none" }}>
          <p style={{ margin: 0, width: 34, fontSize: 13, fontWeight: 600, color: C.sub }}>{day.dayLabel}</p>
          <p style={{ margin: 0, fontSize: 18 }}>{day.emoji}</p>
          <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.label }}>{day.tempMax}°</span>
            <span style={{ fontSize: 12, color: C.muted }}>{day.tempMin}°</span>
          </div>
          {day.precipProbability > 0 && <span style={{ fontSize: 11, color: "#3B82F6", fontWeight: 600 }}>{day.precipProbability}%</span>}
        </div>
      ))}
      {note && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.sep}` }}>
          <p style={{ margin: 0, fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{note}</p>
        </div>
      )}
    </Card>
  );
}

function RowItem({ icon, title, subtitle, accent, last = false, onClick, chevron = false }: {
  icon: React.ReactNode; title: string; subtitle?: string; accent: string;
  last?: boolean; onClick?: () => void; chevron?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: last ? "none" : `1px solid ${C.sep}`, cursor: onClick ? "pointer" : "default" }}>
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: C.label, letterSpacing: -0.1 }}>{title}</p>
        {subtitle && <p style={{ margin: "2px 0 0", fontSize: 13, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</p>}
      </div>
      {chevron && <ChevronRight size={16} color={C.muted} />}
    </div>
  );
}

function ExpandableRow({ icon, title, content, accent, last = false }: {
  icon: React.ReactNode; title: string; content: string; accent: string; last?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: (!open && !last) ? `1px solid ${C.sep}` : "none", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        {icon}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: C.label }}>{title}</p>
          {!open && content.length < 60 && (
            <p style={{ margin: "2px 0 0", fontSize: 13, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{content}</p>
          )}
        </div>
        <div style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
          <ChevronDown size={16} color={C.muted} />
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px 70px", borderBottom: !last ? `1px solid ${C.sep}` : "none" }}>
          <p style={{ margin: 0, fontSize: 14, color: C.sub, lineHeight: 1.7, whiteSpace: "pre-line" }}>{content}</p>
        </div>
      )}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function BookletHero({ booklet, accent }: { booklet: Booklet; accent: string }) {
  return (
    <div style={{ padding: "16px 16px 0", background: C.bg }}>
      <div style={{
        position: "relative", borderRadius: 24, overflow: "hidden",
        background: "#1a1a1a", height: 280,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}>
        {booklet.coverImage && (
          <img src={booklet.coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.1) brightness(0.9)" }} />
        )}
        {/* Gradient fort en bas */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 25%, rgba(0,0,0,0.85) 100%)" }} />

        {/* Contenu texte en bas */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 20px 24px" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: -0.4, lineHeight: 1.2 }}>
            {booklet.propertyName || booklet.title}
          </h1>
          {booklet.address && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={13} color="rgba(255,255,255,0.65)" />
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{booklet.address}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BunklyCredit({ accent }: { accent: string }) {
  const tr = useT();
  return (
    <div style={{ textAlign: "center", padding: "24px 16px 12px" }}>
      <a href="https://bunkly.co" target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 11, color: C.muted, textDecoration: "none", fontWeight: 500, letterSpacing: 0.3 }}>
        {tr("created_with").replace("Bunkly.co", "")}
        <span style={{ fontWeight: 700, color: accent }}>Bunkly.co</span>
      </a>
    </div>
  );
}

function TabWithHero({ booklet, accent, children }: { booklet: Booklet; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ overflowY: "auto", flex: 1, touchAction: "pan-y" }}>
        <BookletHero booklet={booklet} accent={accent} />
        {children}
        <BunklyCredit accent={accent} />
      </div>
    </div>
  );
}

// ─── PhotoGallery ─────────────────────────────────────────────────────────────

function PhotoGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  if (!images.length) return null;
  return (
    <>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", touchAction: "pan-x" }}>
        {images.map((url, i) => (
          <div key={i} onClick={() => setActive(url)} style={{ flexShrink: 0, width: 110, height: 78, borderRadius: 14, overflow: "hidden", cursor: "pointer" }}>
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
      {active && (
        <div onClick={() => setActive(null)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.94)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <img src={active} alt="" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 16 }} />
        </div>
      )}
    </>
  );
}

// ─── TAB ACCUEIL ──────────────────────────────────────────────────────────────

function TabHome({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const tr = useT();
  const arrival       = useMod(booklet, "arrival");
  const accommodation = useMod(booklet, "accommodation");
  const contact       = useMod(booklet, "contact");

  const checkinTime  = g(arrival, "checkin_time");
  const checkoutTime = g(arrival, "checkout_time") || g(useMod(booklet, "checkout"), "checkout_time");
  const accessCode   = g(arrival, "access_code");
  const keyLocation  = g(arrival, "key_location");
  const parking      = g(arrival, "parking");
  const wifiName     = g(accommodation, "wifi_name");
  const wifiPass     = g(accommodation, "wifi_password");
  const wifiSecurity = g(accommodation, "wifi_security");
  const welcomeMsg   = g(arrival, "welcome_message");
  const hostName     = g(contact, "host_name");
  const hostPhoto    = g(contact, "host_photo");
  const services     = parseServices(g(accommodation, "services_list"));

  return (
    <div style={{ flex: 1, overflowY: "auto", touchAction: "pan-y" }}>
      <BookletHero booklet={booklet} accent={accent} />
      <div style={{ padding: "24px 16px 48px" }}>

        {/* Hôte + message */}
        {(welcomeMsg || hostName) && (
          <div style={{ marginBottom: 28 }}>
            <Card>
              {(hostPhoto || hostName) && (
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 16px 14px", borderBottom: welcomeMsg ? `1px solid ${C.sep}` : "none" }}>
                  {hostPhoto
                    ? <img src={hostPhoto} alt="" style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: 46, height: 46, borderRadius: "50%", background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Users size={20} color={accent} />
                      </div>
                  }
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: C.sub, marginBottom: 2 }}>{tr("your_host")}</p>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.label, letterSpacing: -0.3 }}>{hostName}</p>
                  </div>
                </div>
              )}
              {welcomeMsg && (
                <p style={{ margin: 0, padding: "14px 16px", fontSize: 14, color: C.sub, lineHeight: 1.7 }}>{welcomeMsg}</p>
              )}
            </Card>
          </div>
        )}

        {/* Horaires */}
        {(checkinTime || checkoutTime) && (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("schedule")}</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: checkinTime && checkoutTime ? "1fr 1fr" : "1fr", gap: 12 }}>
              {checkinTime && (
                <Card>
                  <div style={{ padding: "20px 16px" }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${C.green}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                      <Clock size={20} color={C.green} />
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>{tr("checkin")}</p>
                    <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.label, letterSpacing: -1, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{formatTime(checkinTime)}</p>
                  </div>
                </Card>
              )}
              {checkoutTime && (
                <Card>
                  <div style={{ padding: "20px 16px" }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${C.orange}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                      <Clock size={20} color={C.orange} />
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>{tr("checkout")}</p>
                    <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.label, letterSpacing: -1, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{formatTime(checkoutTime)}</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Accès */}
        {(accessCode || parking) && (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("access_keys")}</SectionTitle>
            <Card>
              {accessCode && (
                <div style={{ padding: "16px 16px 14px", borderBottom: (keyLocation || parking) ? `1px solid ${C.sep}` : "none" }}>
                  <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>{tr("access_code")}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {accessCode.split("").map((char, i) => (
                        <div key={i} style={{
                          width: 40, height: 48, borderRadius: 12,
                          background: `${accent}10`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 24, fontWeight: 800, color: accent,
                          fontFamily: "ui-monospace,'SF Mono',monospace",
                          border: `1.5px solid ${accent}20`,
                        }}>
                          {char}
                        </div>
                      ))}
                    </div>
                    <CopyButton value={accessCode} accent={accent} />
                  </div>
                  {keyLocation && <p style={{ margin: "10px 0 0", fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{keyLocation}</p>}
                </div>
              )}
              {parking && (
                <RowItem
                  icon={<IconBox color={C.orange}><Car size={18} color={C.orange} /></IconBox>}
                  title={tr("parking")}
                  subtitle={parking}
                  accent={accent}
                  last
                />
              )}
            </Card>
          </div>
        )}

        {/* WiFi */}
        {(wifiName || wifiPass) && (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("wifi")}</SectionTitle>
            <Card>
              {wifiName && (
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: wifiPass ? `1px solid ${C.sep}` : "none" }}
                  onClick={() => navigator.clipboard.writeText(wifiName)}>
                  <IconBox color={accent}><Wifi size={18} color={accent} /></IconBox>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, color: C.sub, marginBottom: 2 }}>{tr("network")}</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.label, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wifiName}</p>
                  </div>
                  <CopyButton value={wifiName} accent={accent} />
                </div>
              )}
              {wifiPass && (
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: `1px solid ${C.sep}` }}>
                  <IconBox color={accent}><Key size={18} color={accent} /></IconBox>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, color: C.sub, marginBottom: 2 }}>{tr("password")}</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.label, fontFamily: "ui-monospace,monospace", letterSpacing: 0.5 }}>{wifiPass}</p>
                  </div>
                  <CopyButton value={wifiPass} accent={accent} />
                </div>
              )}
              {(wifiName || wifiPass) && <WifiQRCode ssid={wifiName} password={wifiPass} security={wifiSecurity} accent={accent} />}
            </Card>
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("included")}</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {services.map((s, i) => (
                <Card key={i}>
                  <div style={{ padding: "16px 14px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: 22 }}>{s.emoji}</p>
                    <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: C.label }}>{s.name}</p>
                    {s.description && <p style={{ margin: 0, fontSize: 12, color: C.sub, lineHeight: 1.4 }}>{s.description}</p>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Localisation */}
        {booklet.address && (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("location")}</SectionTitle>
            <Card>
              <div style={{ borderRadius: "20px 20px 0 0", overflow: "hidden", height: 160 }}>
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(booklet.address)}&output=embed&z=15`}
                  width="100%" height="160" style={{ border: 0, display: "block" }}
                  loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Carte" />
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                  <MapPin size={14} color={C.sub} />
                  <p style={{ margin: 0, fontSize: 13, color: C.sub }}>{booklet.address}</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booklet.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: 14, background: "#4285F412", textDecoration: "none", border: "1.5px solid #4285F420" }}>
                    <Navigation size={15} color="#4285F4" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#4285F4" }}>{tr("google_maps")}</span>
                  </a>
                  <a href={`https://waze.com/ul?q=${encodeURIComponent(booklet.address)}&navigate=yes`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: 14, background: "#33CCFF12", textDecoration: "none", border: "1.5px solid #33CCFF20" }}>
                    <Navigation size={15} color="#33AADD" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#33AADD" }}>{tr("waze")}</span>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        )}

        {(arrival?.images?.length ?? 0) > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("photos")}</SectionTitle>
            <PhotoGallery images={arrival!.images!} />
          </div>
        )}
        <BunklyCredit accent={accent} />
      </div>
    </div>
  );
}

// ─── TAB SÉJOUR ───────────────────────────────────────────────────────────────

function TabStay({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const tr = useT();
  const arrival       = useMod(booklet, "arrival");
  const accommodation = useMod(booklet, "accommodation");
  const rules         = useMod(booklet, "rules");
  const kitchen       = useMod(booklet, "kitchen");
  const baby          = useMod(booklet, "baby");
  const petsModule    = useMod(booklet, "pets");
  const pool          = useMod(booklet, "pool");
  const coworking     = useMod(booklet, "coworking");
  const accessibility = useMod(booklet, "accessibility");
  const tidesModule   = useMod(booklet, "tides");
  const weatherModule = useMod(booklet, "weather");

  const steps = g(arrival, "checkin_process").split("\n").filter(Boolean);
  const [checkinDone, setCheckinDone] = useState<Record<number, boolean>>({});
  const checkinCount = Object.values(checkinDone).filter(Boolean).length;
  const [expandedEquip, setExpandedEquip] = useState<string | null>(null);

  const equipRows = [
    { key: "heating",      icon: <Thermometer size={18} color="#EF4444" />,  color: "#EF4444", label: tr("heating") },
    { key: "ac",           icon: <Wind size={18} color="#3B82F6" />,         color: "#3B82F6", label: tr("ac") },
    { key: "appliances",   icon: <WashingMachine size={18} color="#10B981" />, color: "#10B981", label: tr("appliances") },
    { key: "tv",           icon: <Tv size={18} color="#8B5CF6" />,           color: "#8B5CF6", label: tr("tv") },
    { key: "checkin_code", icon: <Mailbox size={18} color="#F59E0B" />,      color: "#F59E0B", label: tr("mailbox") },
    { key: "other",        icon: <Info size={18} color="#6B7280" />,         color: "#6B7280", label: tr("other") },
  ].filter(r => accommodation && g(accommodation, r.key));

  return (
    <div style={{ padding: "20px 16px 40px" }}>

      {/* Checklist arrivée */}
      {steps.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <SectionTitle>{tr("checkin_process")}</SectionTitle>
            <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>{checkinCount}/{steps.length}</span>
          </div>
          <Card>
            {steps.map((step, i) => (
              <button key={i} onClick={() => setCheckinDone(p => ({ ...p, [i]: !p[i] }))}
                style={{ width: "100%", display: "flex", gap: 14, padding: "14px 16px", borderBottom: i < steps.length - 1 ? `1px solid ${C.sep}` : "none", alignItems: "center", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: checkinDone[i] ? accent : "transparent",
                  border: `2px solid ${checkinDone[i] ? accent : "#D1D5DB"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s",
                }}>
                  {checkinDone[i]
                    ? <Check size={13} color="#fff" strokeWidth={3} />
                    : <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{i + 1}</span>
                  }
                </div>
                <p style={{ margin: 0, fontSize: 15, color: checkinDone[i] ? C.muted : C.label, textDecoration: checkinDone[i] ? "line-through" : "none", flex: 1, lineHeight: 1.5, transition: "all 0.15s" }}>
                  {step}
                </p>
              </button>
            ))}
            {checkinCount === steps.length && steps.length > 0 && (
              <div style={{ padding: "14px 16px", background: `${accent}08`, display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={16} color={accent} />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: accent }}>{tr("settled_in")}</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Équipements */}
      {equipRows.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionTitle>{tr("accommodation")}</SectionTitle>
          <Card>
            {equipRows.map((r, i) => {
              const isOpen = expandedEquip === r.key;
              const content = accommodation ? g(accommodation, r.key) : "";
              return (
                <div key={r.key}>
                  <button onClick={() => setExpandedEquip(isOpen ? null : r.key)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: (!isOpen && i < equipRows.length - 1) ? `1px solid ${C.sep}` : "none", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <IconBox color={r.color}>{r.icon}</IconBox>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: C.label }}>{r.label}</p>
                      {!isOpen && content.length < 55 && (
                        <p style={{ margin: "2px 0 0", fontSize: 13, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{content}</p>
                      )}
                    </div>
                    <div style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                      <ChevronDown size={16} color={C.muted} />
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 20px 16px 84px", borderBottom: i < equipRows.length - 1 ? `1px solid ${C.sep}` : "none" }}>
                      <p style={{ margin: 0, fontSize: 14, color: C.sub, lineHeight: 1.7, whiteSpace: "pre-line" }}>{content}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* Règles */}
      {rules && (() => {
        const ruleRows = [
          { key: "max_guests", icon: <Users size={18} color="#3B82F6" />,       color: "#3B82F6", label: tr("persons") },
          { key: "smoking",    icon: <Cigarette size={18} color="#EF4444" />,    color: "#EF4444", label: tr("smoking") },
          { key: "pets",       icon: <Dog size={18} color="#F59E0B" />,          color: "#F59E0B", label: tr("pets") },
          { key: "noise",      icon: <Volume2 size={18} color="#10B981" />,      color: "#10B981", label: tr("noise") },
          { key: "parties",    icon: <PartyPopper size={18} color="#8B5CF6" />,  color: "#8B5CF6", label: tr("parties") },
          { key: "other",      icon: <Info size={18} color="#6B7280" />,         color: "#6B7280", label: tr("other") },
        ].filter(r => g(rules, r.key));
        if (!ruleRows.length) return null;
        return (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("rules")}</SectionTitle>
            <Card>
              {ruleRows.map((r, i) => (
                <ExpandableRow key={r.key} icon={<IconBox color={r.color}>{r.icon}</IconBox>} title={r.label} content={g(rules, r.key)} accent={accent} last={i === ruleRows.length - 1} />
              ))}
            </Card>
          </div>
        );
      })()}

      {/* Cuisine */}
      {kitchen && (() => {
        const kitchenRows = [
          { key: "equipment",         icon: <UtensilsCrossed size={18} color="#F59E0B" />, color: "#F59E0B", label: tr("kitchen_equip") },
          { key: "trash",             icon: <Trash2 size={18} color="#10B981" />,          color: "#10B981", label: tr("waste") },
          { key: "linen",             icon: <ShoppingBag size={18} color="#3B82F6" />,     color: "#3B82F6", label: tr("linen") },
          { key: "cleaning",          icon: <Sparkles size={18} color="#8B5CF6" />,        color: "#8B5CF6", label: tr("cleaning") },
          { key: "checkout_cleaning", icon: <Sparkles size={18} color="#EF4444" />,        color: "#EF4444", label: tr("checkout_cleaning") },
        ].filter(f => g(kitchen, f.key));
        if (!kitchenRows.length) return null;
        return (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("kitchen")}</SectionTitle>
            <Card>
              {kitchenRows.map((f, i) => (
                <ExpandableRow key={f.key} icon={<IconBox color={f.color}>{f.icon}</IconBox>} title={f.label} content={g(kitchen, f.key)} accent={accent} last={i === kitchenRows.length - 1} />
              ))}
            </Card>
          </div>
        );
      })()}

      {/* Bébé */}
      {baby && (() => {
        const rows = [
          { key: "available", icon: <Baby size={18} color="#EF4444" />,        color: "#EF4444", label: tr("baby_equip") },
          { key: "safety",    icon: <Shield size={18} color="#10B981" />,       color: "#10B981", label: tr("baby_safety") },
          { key: "rental",    icon: <ShoppingBag size={18} color="#3B82F6" />,  color: "#3B82F6", label: tr("baby_rental") },
        ].filter(f => g(baby, f.key));
        if (!rows.length) return null;
        return (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("baby")}</SectionTitle>
            <Card>{rows.map((f, i) => <ExpandableRow key={f.key} icon={<IconBox color={f.color}>{f.icon}</IconBox>} title={f.label} content={g(baby, f.key)} accent={accent} last={i === rows.length - 1} />)}</Card>
          </div>
        );
      })()}

      {/* Animaux */}
      {petsModule && (() => {
        const rows = [
          { key: "rules",  icon: <Dog size={18} color="#F59E0B" />,        color: "#F59E0B", label: tr("pets_rules") },
          { key: "zones",  icon: <MapPin size={18} color="#3B82F6" />,     color: "#3B82F6", label: tr("pets_zones") },
          { key: "nearby", icon: <Hospital size={18} color="#10B981" />,   color: "#10B981", label: tr("pets_places") },
        ].filter(f => g(petsModule, f.key));
        if (!rows.length) return null;
        return (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("pets")}</SectionTitle>
            <Card>{rows.map((f, i) => <ExpandableRow key={f.key} icon={<IconBox color={f.color}>{f.icon}</IconBox>} title={f.label} content={g(petsModule, f.key)} accent={accent} last={i === rows.length - 1} />)}</Card>
          </div>
        );
      })()}

      {/* Piscine */}
      {pool && (() => {
        const rows = [
          { key: "hours",       icon: <Clock size={18} color="#3B82F6" />,     color: "#3B82F6", label: tr("schedule") },
          { key: "rules",       icon: <Shield size={18} color="#EF4444" />,    color: "#EF4444", label: tr("pool_rules") },
          { key: "equipment",   icon: <Waves size={18} color="#10B981" />,     color: "#10B981", label: tr("pool_equip") },
          { key: "maintenance", icon: <Wrench size={18} color="#6B7280" />,    color: "#6B7280", label: tr("pool_maintenance") },
        ].filter(f => g(pool, f.key));
        if (!rows.length) return null;
        return (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("pool")}</SectionTitle>
            <Card>{rows.map((f, i) => <ExpandableRow key={f.key} icon={<IconBox color={f.color}>{f.icon}</IconBox>} title={f.label} content={g(pool, f.key)} accent={accent} last={i === rows.length - 1} />)}</Card>
          </div>
        );
      })()}

      {/* Télétravail */}
      {coworking && (() => {
        const rows = [
          { key: "desk",     icon: <Monitor size={18} color="#8B5CF6" />,  color: "#8B5CF6", label: tr("workspace") },
          { key: "wifi_pro", icon: <Wifi size={18} color="#3B82F6" />,     color: "#3B82F6", label: tr("wifi_dedicated") },
          { key: "screens",  icon: <Monitor size={18} color="#10B981" />,  color: "#10B981", label: tr("screens") },
          { key: "printing", icon: <Briefcase size={18} color="#F59E0B" />, color: "#F59E0B", label: tr("printing") },
        ].filter(f => g(coworking, f.key));
        if (!rows.length) return null;
        return (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("coworking")}</SectionTitle>
            <Card>{rows.map((f, i) => <ExpandableRow key={f.key} icon={<IconBox color={f.color}>{f.icon}</IconBox>} title={f.label} content={g(coworking, f.key)} accent={accent} last={i === rows.length - 1} />)}</Card>
          </div>
        );
      })()}

      {/* Accessibilité */}
      {accessibility && (() => {
        const rows = [
          { key: "access",    icon: <Accessibility size={18} color="#3B82F6" />, color: "#3B82F6", label: tr("access") },
          { key: "elevator",  icon: <Building2 size={18} color="#10B981" />,     color: "#10B981", label: tr("elevator") },
          { key: "bathroom",  icon: <Waves size={18} color="#8B5CF6" />,         color: "#8B5CF6", label: tr("bathroom") },
          { key: "equipment", icon: <Dumbbell size={18} color="#6B7280" />,      color: "#6B7280", label: tr("pmr_equip") },
        ].filter(f => g(accessibility, f.key));
        if (!rows.length) return null;
        return (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("accessibility")}</SectionTitle>
            <Card>{rows.map((f, i) => <ExpandableRow key={f.key} icon={<IconBox color={f.color}>{f.icon}</IconBox>} title={f.label} content={g(accessibility, f.key)} accent={accent} last={i === rows.length - 1} />)}</Card>
          </div>
        );
      })()}

      {/* Marées */}
      {tidesModule && g(tidesModule, "port_id") && (
        <div style={{ marginBottom: 28 }}>
          <SectionTitle>{tr("tides")}</SectionTitle>
          <TidesSection portId={g(tidesModule, "port_id")} portName={g(tidesModule, "port_name")} note={g(tidesModule, "note")} accent={accent} tr={tr} />
        </div>
      )}

      {/* Météo */}
      {weatherModule && (
        <div style={{ marginBottom: 28 }}>
          <SectionTitle>{tr("weather")}</SectionTitle>
          <WeatherSection address={booklet.address ?? ""} cityOverride={g(weatherModule, "city_override")} note={g(weatherModule, "note")} accent={accent} tr={tr} />
        </div>
      )}
    </div>
  );
}

// ─── Carte activité ───────────────────────────────────────────────────────────

function ActivityCard({ act, accent }: {
  act: Activity;
  accent: string;
}) {
  const tr = useT();
  const catColor: Record<string, string> = { restaurant: "#EF4444", activity: "#3B82F6", shop: "#10B981", transport: "#F59E0B", other: "#6B7280" };
  const color = catColor[act.category] ?? "#6B7280";
  const catLabel: Record<string, string> = {
    restaurant: tr("cat_restaurant"),
    activity: tr("cat_activity"),
    shop: tr("cat_shop"),
    transport: tr("transport"),
    other: tr("places"),
  };

  return (
    <div style={{ background: C.card, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", width: "100%" }}>
      {act.photo ? (
        <div style={{ height: 130, backgroundImage: `url(${act.photo})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)" }} />
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "3px 10px" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{catLabel[act.category]}</span>
          </div>
          {act.recommended && (
            <div style={{ position: "absolute", top: 10, right: 10, background: C.orange, borderRadius: 20, padding: "3px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Star size={10} color="#fff" fill="#fff" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{tr("cat_favorite")}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ height: 70, background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MapPin size={20} color={color} />
          </div>
        </div>
      )}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: C.label, letterSpacing: -0.2 }}>{act.name}</p>
        {act.description && (
          <p style={{ margin: "0 0 8px", fontSize: 13, color: C.sub, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
            {act.description}
          </p>
        )}
        {(act.distance || act.openHours || act.priceRange) && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {act.distance   && <div style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} color={C.muted} /><span style={{ fontSize: 11, color: C.sub }}>{act.distance}</span></div>}
            {act.openHours  && <div style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} color={C.muted} /><span style={{ fontSize: 11, color: C.sub }}>{act.openHours}</span></div>}
            {act.priceRange && <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>{act.priceRange}</span>}
          </div>
        )}
        {(act.phone || act.address || act.website || act.instagram) && (
          <div style={{ display: "flex", gap: 6, paddingTop: 10, borderTop: `1px solid ${C.sep}`, marginTop: "auto" }}>
            {act.phone && (
              <a href={`tel:${act.phone}`} style={{ flex: 1, padding: "8px 0", borderRadius: 12, background: `${accent}10`, color: accent, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Phone size={16} color={accent} />
              </a>
            )}
            {act.address && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.address)}`} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: "8px 0", borderRadius: 12, background: `${accent}10`, color: accent, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Navigation size={16} color={accent} />
              </a>
            )}
            {act.website && (
              <a href={act.website} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: "8px 0", borderRadius: 12, background: `${accent}10`, color: accent, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Globe size={16} color={accent} />
              </a>
            )}
            {act.instagram && (
              <a href={`https://instagram.com/${act.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: "8px 0", borderRadius: 12, background: `${accent}10`, color: accent, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ExternalLink size={16} color={accent} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB ACTIVITÉS ────────────────────────────────────────────────────────────

function TabArea({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const tr = useT();
  const neighborhood = useMod(booklet, "neighborhood");
  const transport    = useMod(booklet, "transport");
  const practical    = useMod(booklet, "practical");
  const experiences  = useMod(booklet, "experiences");
  const eco          = useMod(booklet, "eco");

  const activities = parseActivities(g(neighborhood, "activities_list"));
  const places     = neighborhood ? parsePlaces(g(neighborhood, "places")) : [];
  const mapAddress = encodeURIComponent(booklet.address || booklet.propertyName || "");

  const [activeFilter, setActiveFilter] = useState<string>("all");

  const CATS = [
    { id: "all",        label: tr("all") },
    { id: "restaurant", label: tr("restaurant") },
    { id: "activity",   label: tr("activities") },
    { id: "shop",       label: tr("shops") },
    { id: "transport",  label: tr("transport") },
    { id: "other",      label: tr("other") },
  ];

  const presentCats = new Set(activities.map(a => a.category));
  const catCount = (id: string) => id === "all" ? activities.length : activities.filter(a => a.category === id as Activity["category"]).length;
  const visibleCats = CATS.filter(c => c.id === "all" || presentCats.has(c.id as Activity["category"]));
  const filtered = activeFilter === "all" ? activities : activities.filter(a => a.category === activeFilter);

  return (
    <div style={{ padding: "24px 0 48px" }}>

      {/* Activités */}
      {activities.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          {visibleCats.length > 2 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", padding: "0 16px 14px", touchAction: "pan-x" }}>
              {visibleCats.map(cat => {
                const isActive = activeFilter === cat.id;
                return (
                  <button key={cat.id} onClick={() => setActiveFilter(cat.id)}
                    style={{
                      flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                      padding: "7px 14px", borderRadius: 20,
                      border: isActive ? `1.5px solid ${accent}` : "1.5px solid #E5E7EB",
                      cursor: "pointer", fontSize: 13, fontWeight: isActive ? 600 : 500,
                      background: isActive ? `${accent}10` : C.card,
                      color: isActive ? accent : C.sub,
                    }}>
                    {cat.label}
                    <span style={{ fontSize: 11, fontWeight: 700, background: isActive ? accent : "#F3F4F6", color: isActive ? "#fff" : C.sub, borderRadius: 8, padding: "1px 7px" }}>
                      {catCount(cat.id)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ padding: "0 16px", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.8 }}>
              {activeFilter === "all" ? `${activities.length} ${tr("recommendations")}` : `${filtered.length} ${tr("locations")}`}
            </p>
          </div>

          {filtered.length < 8 ? (
            <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollbarWidth: "none", padding: "0 16px 4px", alignItems: "stretch", touchAction: "pan-x" }}>
              {filtered.map((act, i) => (
                <div key={i} style={{ flexShrink: 0, width: 210, display: "flex" }}>
                  <ActivityCard act={act} accent={accent} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 16px 4px" }}>
              {filtered.map((act, i) => (
                <ActivityCard key={i} act={act} accent={accent} />
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "0 16px" }}>

        {/* Carte */}
        {mapAddress && (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("map")}</SectionTitle>
            <Card>
              <div style={{ borderRadius: "20px 20px 0 0", overflow: "hidden", height: 180 }}>
                <iframe src={`https://maps.google.com/maps?q=${mapAddress}&output=embed&z=15`}
                  width="100%" height="180" style={{ border: 0, display: "block" }}
                  loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Carte" />
              </div>
              {booklet.address && (
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={13} color={C.sub} />
                  <p style={{ margin: 0, fontSize: 13, color: C.sub }}>{booklet.address}</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Adresses */}
        {places.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("addresses")}</SectionTitle>
            <Card>
              {places.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderBottom: i < places.length - 1 ? `1px solid ${C.sep}` : "none" }}>
                  <IconBox color={accent}><MapPin size={18} color={accent} /></IconBox>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.label, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                    {p.address && <p style={{ margin: "1px 0 0", fontSize: 12, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.address}</p>}
                  </div>
                  {p.address && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer"
                      style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, color: accent, background: `${accent}10`, textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                      <Navigation size={13} color={accent} /> {tr("maps")}
                    </a>
                  )}
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* Coup de cœur */}
        {g(neighborhood, "hidden_gems") && (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("host_picks")}</SectionTitle>
            <Card>
              <div style={{ padding: "16px", display: "flex", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: `${C.orange}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Star size={18} color={C.orange} fill={C.orange} />
                </div>
                <p style={{ margin: 0, fontSize: 14, color: C.sub, lineHeight: 1.7, flex: 1 }}>{g(neighborhood, "hidden_gems")}</p>
              </div>
            </Card>
          </div>
        )}

        {/* Transports */}
        {(g(neighborhood, "transport") || transport) && (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("transport")}</SectionTitle>
            <Card>
              {g(neighborhood, "transport") && (
                <div style={{ padding: "14px 16px", borderBottom: transport ? `1px solid ${C.sep}` : "none" }}>
                  <p style={{ margin: 0, fontSize: 14, color: C.sub, lineHeight: 1.65, whiteSpace: "pre-line" }}>{g(neighborhood, "transport")}</p>
                </div>
              )}
              {transport && [
                { key: "public", icon: <Bus size={18} color="#3B82F6" />,    color: "#3B82F6", label: tr("public_transport") },
                { key: "taxi",   icon: <Car size={18} color="#F59E0B" />,    color: "#F59E0B", label: tr("taxi") },
                { key: "bike",   icon: <Bike size={18} color="#10B981" />,   color: "#10B981", label: tr("bikes") },
                { key: "airport",icon: <Plane size={18} color="#8B5CF6" />,  color: "#8B5CF6", label: tr("airport") },
              ].filter(f => g(transport, f.key)).map((f, i, arr) => (
                <ExpandableRow key={f.key} icon={<IconBox color={f.color}>{f.icon}</IconBox>} title={f.label} content={g(transport, f.key)} accent={accent} last={i === arr.length - 1} />
              ))}
            </Card>
          </div>
        )}

        {/* Infos pratiques */}
        {practical && Object.entries(practical.content).filter(([, v]) => v).length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("practical")}</SectionTitle>
            <Card>
              {[
                { key: "pharmacy",    icon: <Pill size={18} color="#EF4444" />,        color: "#EF4444", label: tr("pharmacy") },
                { key: "doctor",      icon: <Stethoscope size={18} color="#3B82F6" />, color: "#3B82F6", label: tr("doctor") },
                { key: "supermarket", icon: <Store size={18} color="#10B981" />,       color: "#10B981", label: tr("supermarket") },
                { key: "laundry",     icon: <WashingMachine size={18} color="#8B5CF6" />, color: "#8B5CF6", label: tr("laundry") },
                { key: "city_hall",   icon: <Building2 size={18} color="#6B7280" />,   color: "#6B7280", label: tr("city_hall") },
              ].filter(f => g(practical, f.key)).map((f, i, arr) => (
                <ExpandableRow key={f.key} icon={<IconBox color={f.color}>{f.icon}</IconBox>} title={f.label} content={g(practical, f.key)} accent={accent} last={i === arr.length - 1} />
              ))}
            </Card>
          </div>
        )}

        {/* Expériences */}
        {experiences && (() => {
          const rows = [
            { key: "hidden_gems", icon: <Star size={18} color="#F59E0B" />,       color: "#F59E0B", label: tr("favorites") },
            { key: "activities",  icon: <MapPin size={18} color="#3B82F6" />,     color: "#3B82F6", label: tr("recommended") },
            { key: "events",      icon: <PartyPopper size={18} color="#10B981" />, color: "#10B981", label: tr("local_events") },
          ].filter(f => g(experiences, f.key));
          if (!rows.length) return null;
          return (
            <div style={{ marginBottom: 28 }}>
              <SectionTitle>{tr("experiences")}</SectionTitle>
              <Card>{rows.map((f, i) => <ExpandableRow key={f.key} icon={<IconBox color={f.color}>{f.icon}</IconBox>} title={f.label} content={g(experiences, f.key)} accent={accent} last={i === rows.length - 1} />)}</Card>
            </div>
          );
        })()}

        {/* Éco */}
        {eco && (() => {
          const rows = [
            { key: "sorting", icon: <Trash2 size={18} color="#10B981" />,  color: "#10B981", label: tr("waste") },
            { key: "energy",  icon: <Zap size={18} color="#F59E0B" />,     color: "#F59E0B", label: tr("energy") },
            { key: "water",   icon: <Droplets size={18} color="#3B82F6" />, color: "#3B82F6", label: tr("water") },
            { key: "other",   icon: <Leaf size={18} color="#10B981" />,    color: "#10B981", label: tr("green") },
          ].filter(f => g(eco, f.key));
          if (!rows.length) return null;
          return (
            <div style={{ marginBottom: 28 }}>
              <SectionTitle>{tr("eco")}</SectionTitle>
              <Card>{rows.map((f, i) => <ExpandableRow key={f.key} icon={<IconBox color={f.color}>{f.icon}</IconBox>} title={f.label} content={g(eco, f.key)} accent={accent} last={i === rows.length - 1} />)}</Card>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── TAB URGENCES ─────────────────────────────────────────────────────────────

function TabSafety({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const tr = useT();
  const safety  = useMod(booklet, "safety");
  const contact = useMod(booklet, "contact");

  return (
    <div style={{ padding: "20px 16px 40px" }}>

      {safety && g(safety, "emergency") && (
        <div style={{ marginBottom: 28 }}>
          <Card style={{ border: "1.5px solid #FEE2E2", background: "#FFF5F5" }}>
            <div style={{ padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "#EF444420", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Phone size={18} color={C.red} />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 0.5 }}>{tr("emergency_numbers")}</p>
              </div>
              <p style={{ margin: 0, fontSize: 15, color: "#374151", lineHeight: 1.9, whiteSpace: "pre-line", fontWeight: 500 }}>{g(safety, "emergency")}</p>
            </div>
          </Card>
        </div>
      )}

      {contact && (g(contact, "host_name") || g(contact, "host_phone")) && (
        <div style={{ marginBottom: 28 }}>
          <SectionTitle>{tr("your_host")}</SectionTitle>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", borderBottom: `1px solid ${C.sep}` }}>
              {g(contact, "host_photo")
                ? <img src={g(contact, "host_photo")} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                : <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={22} color={accent} />
                  </div>
              }
              <div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.label, letterSpacing: -0.3 }}>{g(contact, "host_name") || tr("your_host")}</p>
                {g(contact, "response_time") && <p style={{ margin: "3px 0 0", fontSize: 13, color: C.sub }}>{g(contact, "response_time")}</p>}
              </div>
            </div>
            {g(contact, "about") && (
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.sep}` }}>
                <p style={{ margin: 0, fontSize: 14, color: C.sub, lineHeight: 1.65 }}>{g(contact, "about")}</p>
              </div>
            )}
            <div style={{ display: "flex" }}>
              {g(contact, "host_phone") && (
                <a href={`tel:${g(contact, "host_phone")}`}
                  style={{ flex: 1, padding: "15px 0", textAlign: "center", color: accent, fontSize: 14, fontWeight: 600, textDecoration: "none", borderRight: g(contact, "host_email") ? `1px solid ${C.sep}` : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  <Phone size={16} color={accent} /> {tr("call")}
                </a>
              )}
              {g(contact, "host_email") && (
                <a href={`mailto:${g(contact, "host_email")}`}
                  style={{ flex: 1, padding: "15px 0", textAlign: "center", color: accent, fontSize: 14, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  <Mail size={16} color={accent} /> {tr("email")}
                </a>
              )}
            </div>
          </Card>
        </div>
      )}

      {safety && (() => {
        const rows = [
          { key: "fire_extinguisher", icon: <Flame size={18} color="#EF4444" />,   color: "#EF4444", label: tr("fire_extinguisher") },
          { key: "circuit_breaker",   icon: <Zap size={18} color="#F59E0B" />,     color: "#F59E0B", label: tr("circuit_breaker") },
          { key: "water_shutoff",     icon: <Droplets size={18} color="#3B82F6" />, color: "#3B82F6", label: tr("water_shutoff") },
          { key: "hospital",          icon: <Hospital size={18} color="#10B981" />, color: "#10B981", label: tr("hospital") },
        ].filter(f => g(safety, f.key));
        if (!rows.length) return null;
        return (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>{tr("security")}</SectionTitle>
            <Card>{rows.map((f, i) => <ExpandableRow key={f.key} icon={<IconBox color={f.color}>{f.icon}</IconBox>} title={f.label} content={g(safety, f.key)} accent={accent} last={i === rows.length - 1} />)}</Card>
          </div>
        );
      })()}

      {contact && (g(contact, "concierge") || g(contact, "maintenance")) && (
        <div style={{ marginBottom: 28 }}>
          <SectionTitle>{tr("services")}</SectionTitle>
          <Card>
            {g(contact, "concierge") && (
              <ExpandableRow icon={<IconBox color="#8B5CF6"><ConciergeBell size={18} color="#8B5CF6" /></IconBox>} title={tr("concierge")} content={g(contact, "concierge")} accent={accent} last={!g(contact, "maintenance")} />
            )}
            {g(contact, "maintenance") && (
              <ExpandableRow icon={<IconBox color="#F59E0B"><Wrench size={18} color="#F59E0B" /></IconBox>} title={tr("maintenance")} content={g(contact, "maintenance")} accent={accent} last />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── TAB DÉPART ───────────────────────────────────────────────────────────────

function TabCheckout({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const tr = useT();
  const checkout = useMod(booklet, "checkout");
  const tasks    = g(checkout, "process").split("\n").filter(Boolean);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ padding: "20px 16px 40px" }}>

      {g(checkout, "checkout_time") && (
        <div style={{ marginBottom: 28 }}>
          <Card>
            <div style={{ padding: "28px 16px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Clock size={26} color={accent} />
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.6 }}>{tr("checkout_time")}</p>
              <p style={{ margin: 0, fontSize: 52, fontWeight: 800, color: C.label, letterSpacing: -2, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {formatTime(g(checkout, "checkout_time"))}
              </p>
              {g(checkout, "late_checkout_info") && (
                <p style={{ margin: "12px 0 0", fontSize: 13, color: C.sub, lineHeight: 1.5 }}>{g(checkout, "late_checkout_info")}</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {tasks.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <SectionTitle>{tr("checkout_checklist")}</SectionTitle>
            <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>{doneCount}/{tasks.length}</span>
          </div>
          <Card>
            {tasks.map((task, i) => (
              <button key={i} onClick={() => setChecked(p => ({ ...p, [i]: !p[i] }))}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "none", border: "none", borderBottom: i < tasks.length - 1 ? `1px solid ${C.sep}` : "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: checked[i] ? accent : "transparent",
                  border: `2px solid ${checked[i] ? accent : "#D1D5DB"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s",
                }}>
                  {checked[i] && <Check size={13} color="#fff" strokeWidth={3} />}
                </div>
                <p style={{ margin: 0, fontSize: 15, color: checked[i] ? C.muted : C.label, textDecoration: checked[i] ? "line-through" : "none", flex: 1, lineHeight: 1.4, transition: "all 0.15s" }}>
                  {task}
                </p>
              </button>
            ))}
            {doneCount === tasks.length && tasks.length > 0 && (
              <div style={{ padding: "14px 16px", background: `${accent}08`, display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={16} color={accent} />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: accent }}>{tr("checkout_ready")}</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {g(checkout, "keys_return") && (
        <div style={{ marginBottom: 28 }}>
          <Card>
            <div style={{ display: "flex", gap: 14, padding: "15px 16px", alignItems: "center" }}>
              <IconBox color="#F59E0B"><Key size={18} color="#F59E0B" /></IconBox>
              <div>
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4 }}>{tr("key_return")}</p>
                <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.6 }}>{g(checkout, "keys_return")}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {(g(checkout, "review_airbnb") || g(checkout, "review_google") || g(checkout, "review_booking")) && (
        <div style={{ marginBottom: 28 }}>
          <SectionTitle>{tr("leave_review")}</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { key: "review_airbnb",  label: "Airbnb",       sub: tr("leave_review") },
              { key: "review_google",  label: "Google",       sub: tr("leave_review") },
              { key: "review_booking", label: "Booking.com",  sub: tr("leave_review") },
            ].filter(r => g(checkout, r.key)).map(r => (
              <a key={r.key} href={g(checkout, r.key)} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderRadius: 20, background: C.card, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", textDecoration: "none", border: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${accent}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Star size={20} color={accent} fill={accent} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.label }}>{r.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: C.sub }}>{r.sub}</p>
                  </div>
                </div>
                <ChevronRight size={18} color={C.muted} />
              </a>
            ))}
          </div>
        </div>
      )}

      {g(checkout, "thank_you") && (
        <div style={{ textAlign: "center", padding: "24px 16px 8px" }}>
          <p style={{ margin: 0, fontSize: 14, color: C.sub, fontStyle: "italic", lineHeight: 1.7 }}>{g(checkout, "thank_you")}</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

function TabBar({ active, onSelect, accent }: { active: Tab; onSelect: (t: Tab) => void; accent: string }) {
  const tr = useT();
  const tabs: { id: Tab; label: string; icon: (a: boolean) => React.ReactNode }[] = [
    {
      id: "home", label: tr("nav_home"),
      icon: (a) => <Home size={22} color={a ? accent : "#9CA3AF"} strokeWidth={a ? 2.5 : 1.8} />,
    },
    {
      id: "stay", label: tr("nav_stay"),
      icon: (a) => <Briefcase size={22} color={a ? accent : "#9CA3AF"} strokeWidth={a ? 2.5 : 1.8} />,
    },
    {
      id: "area", label: tr("nav_area"),
      icon: (a) => <MapPin size={22} color={a ? accent : "#9CA3AF"} strokeWidth={a ? 2.5 : 1.8} />,
    },
    {
      id: "safety", label: tr("nav_safety"),
      icon: (a) => <Shield size={22} color={a ? C.red : "#9CA3AF"} strokeWidth={a ? 2.5 : 1.8} />,
    },
    {
      id: "checkout", label: tr("nav_checkout"),
      icon: (a) => <Star size={22} color={a ? accent : "#9CA3AF"} strokeWidth={a ? 2.5 : 1.8} />,
    },
  ];

  return (
    <div style={{
      display: "flex",
      background: "#FFFFFF",
      boxShadow: "0 -1px 0 rgba(0,0,0,0.05), 0 -4px 20px rgba(0,0,0,0.04)",
      flexShrink: 0,
      paddingBottom: "env(safe-area-inset-bottom)",
      paddingTop: 8,
      paddingLeft: 8,
      paddingRight: 8,
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        const color = t.id === "safety" ? C.red : accent;
        return (
          <button key={t.id} onClick={() => onSelect(t.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0 8px", background: "none", border: "none", cursor: "pointer" }}>
            <div style={{
              width: 48, height: 32, borderRadius: 16,
              background: isActive ? `${color}15` : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}>
              {t.icon(isActive)}
            </div>
            <span style={{
              fontSize: 10, fontWeight: isActive ? 700 : 400,
              color: isActive ? color : C.muted,
              letterSpacing: 0.1,
            }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── QR Code hook ─────────────────────────────────────────────────────────────

function useQrCode(url: string) {
  const [dataUrl, setDataUrl] = useState("");
  useEffect(() => {
    import("qrcode").then(QRCode => {
      QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: "#0D1117", light: "#ffffff" } })
        .then(setDataUrl);
    });
  }, [url]);
  return dataUrl;
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

// ─── Traduction ───────────────────────────────────────────────────────────────

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
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(0,0,0,0.1)", borderRadius: 20,
          padding: "7px 12px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}>
        <FlagImg code={current.code} size={22} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16,
          padding: 6, minWidth: 150, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}>
          {available.map(l => (
            <button
              key={l.code}
              onClick={() => { onSelect(l.code); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                background: l.code === lang ? "rgba(249,115,22,0.08)" : "transparent",
                border: "none", borderRadius: 10, padding: "8px 12px",
                color: l.code === lang ? "#f97316" : "#374151",
                fontSize: 13, fontWeight: l.code === lang ? 700 : 400,
                cursor: "pointer", textAlign: "left",
              }}>
              <FlagImg code={l.code} size={20} />
              <span>{l.label}</span>
              {l.code === lang && <Check size={12} style={{ marginLeft: "auto" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ViewerContent({ booklet: rawBooklet, onTabChange }: { booklet: Booklet; onTabChange?: (tab: string) => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const [lang, setLang] = useState<SupportedLang>("fr");
  const booklet = useTranslatedBooklet(rawBooklet, lang);
  const accent = booklet.accentColor || C.blue;

  const handleTabChange = (t: Tab) => {
    setTab(t);
    onTabChange?.(t);
  };

  return (
    <LangCtx.Provider value={lang}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", background: C.bg, fontFamily: FONT, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", overflow: "hidden" }}>
        <LangSelector booklet={rawBooklet} lang={lang} onSelect={setLang} />
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {tab === "home"     && <TabHome     booklet={booklet} accent={accent} />}
          {tab === "stay"     && <TabWithHero booklet={booklet} accent={accent}><TabStay     booklet={booklet} accent={accent} /></TabWithHero>}
          {tab === "area"     && <TabWithHero booklet={booklet} accent={accent}><TabArea     booklet={booklet} accent={accent} /></TabWithHero>}
          {tab === "safety"   && <TabWithHero booklet={booklet} accent={accent}><TabSafety   booklet={booklet} accent={accent} /></TabWithHero>}
          {tab === "checkout" && <TabWithHero booklet={booklet} accent={accent}><TabCheckout booklet={booklet} accent={accent} /></TabWithHero>}
        </div>
        <TabBar active={tab} onSelect={handleTabChange} accent={accent} />
      </div>
    </LangCtx.Provider>
  );
}

function DesktopViewer({ booklet }: { booklet: Booklet }) {
  const url = `https://app.bunkly.co/b/${booklet.slug}`;
  const qrDataUrl = useQrCode(url);
  const accent = booklet.accentColor || C.blue;

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
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 20 }}>
            <MapPin size={13} color="rgba(255,255,255,0.4)" />
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{booklet.address}</p>
          </div>
        )}
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
          Scannez ce QR code avec votre téléphone pour accéder au livret.
        </p>
        <div style={{ background: "#fff", borderRadius: 20, padding: 16, display: "inline-block", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          {qrDataUrl
            ? <img src={qrDataUrl} alt="QR code" style={{ width: 160, height: 160, display: "block", borderRadius: 8 }} />
            : <div style={{ width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}><QrCode size={40} color="#ddd" /></div>
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
          {/* Dynamic Island */}
          <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", width: 120, height: 34, background: "#000", borderRadius: 20, zIndex: 10 }} />
          {/* Écran */}
          <div style={{ width: "100%", height: "100%", borderRadius: 42, overflow: "hidden", background: C.bg }}>
            <ViewerContent booklet={booklet} />
          </div>
        </div>
        {/* Boutons */}
        <div style={{ position: "absolute", left: -3, top: 120, width: 3, height: 32, background: "#374151", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", left: -3, top: 162, width: 3, height: 64, background: "#374151", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", left: -3, top: 236, width: 3, height: 64, background: "#374151", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", right: -3, top: 160, width: 3, height: 80, background: "#374151", borderRadius: "0 2px 2px 0" }} />
      </div>
    </div>
  );
}

export function ViewerSimple({ booklet, onTabChange }: { booklet: Booklet; onTabChange?: (tab: string) => void }) {
  return (
    <>
      <div className="md:hidden" style={{ height: "100vh", maxHeight: "100dvh" }}>
        <ViewerContent booklet={booklet} onTabChange={onTabChange} />
      </div>
      <div className="hidden md:block">
        <DesktopViewer booklet={booklet} />
      </div>
    </>
  );
}
