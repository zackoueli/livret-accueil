"use client";

import { useState, useEffect } from "react";
import { Booklet, BookletModule } from "@/types";
import { MODULE_META, formatTime, parseActivities, parseServices, Activity } from "@/lib/modules";

type Tab = "home" | "stay" | "area" | "safety" | "checkout";

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
  bg:     "#F2F2F7",
  card:   "#FFFFFF",
  label:  "#1C1C1E",
  sub:    "#8E8E93",
  sep:    "#E5E5EA",
  blue:   "#007AFF",
  green:  "#34C759",
  orange: "#FF9500",
  red:    "#FF3B30",
};

const FONT = "-apple-system,'SF Pro Display','SF Pro Text',system-ui,sans-serif";

// ─── Composants de base ───────────────────────────────────────────────────────

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.card, borderRadius: 18, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 0.5px 2px rgba(0,0,0,0.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SecLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 600, color: C.sub,
      textTransform: "uppercase", letterSpacing: 1,
      padding: "0 6px", marginBottom: 8, marginTop: 28,
    }}>
      {children}
    </p>
  );
}

function Sep() {
  return <div style={{ height: 0.5, background: C.sep, margin: "0 16px" }} />;
}

function CopyBtn({ value, accent }: { value: string; accent: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 2000); }}
      style={{
        padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer",
        fontSize: 13, fontWeight: 600, letterSpacing: -0.1,
        background: done ? "#E8F5E9" : `${accent}14`,
        color: done ? "#2E7D32" : accent,
        transition: "all 0.2s", flexShrink: 0,
      }}>
      {done ? "✓" : "Copier"}
    </button>
  );
}

function AppIcon({ bg, children, size = 34 }: { bg: string; children: React.ReactNode; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.5, flexShrink: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
    }}>
      {children}
    </div>
  );
}

function PhotoGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  if (!images.length) return null;
  return (
    <>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2, marginTop: 4 }}>
        {images.map((url, i) => (
          <div key={i} onClick={() => setActive(url)}
            style={{ flexShrink: 0, width: 120, height: 84, borderRadius: 12, overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
      {active && (
        <div onClick={() => setActive(null)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <img src={active} alt="" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 16 }} />
        </div>
      )}
    </>
  );
}

function WifiRow({ label, value, accent, mono, borderBottom, children }: {
  label: string; value: string; accent: string; mono: boolean;
  borderBottom: boolean; children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={copy}
      style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, borderBottom: borderBottom ? `0.5px solid ${C.sep}` : "none", cursor: "pointer", userSelect: "none" }}>
      {children && (
        <AppIcon bg={`${C.blue}14`} size={40}>{children}</AppIcon>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, color: C.sub, marginBottom: 2, letterSpacing: 0.2 }}>{label}</p>
        <p style={{ margin: 0, fontSize: mono ? 15 : 16, fontWeight: 600, color: C.label, fontFamily: mono ? "ui-monospace,monospace" : "inherit", letterSpacing: mono ? 1 : 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value}
        </p>
      </div>
      <button onClick={(e) => { e.stopPropagation(); copy(); }}
        style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: copied ? "#E8F5E9" : `${accent}14`, color: copied ? "#2E7D32" : accent, transition: "all 0.2s", flexShrink: 0 }}>
        {copied ? "✓" : "Copier"}
      </button>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function BookletHero({ booklet }: { booklet: Booklet }) {
  return (
    <div style={{ position: "relative", height: 220, overflow: "hidden", background: "#1A1A1C", flexShrink: 0 }}>
      {booklet.coverImage && (
        <img src={booklet.coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.52) saturate(1.15)" }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.7) 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 20px 20px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "rgba(255,255,255,0.13)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 20, padding: "4px 11px", marginBottom: 10,
        }}>
          <span style={{ fontSize: 11 }}>🏠</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.92)", letterSpacing: 0.2 }}>Votre séjour</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.6, lineHeight: 1.1 }}>
          {booklet.propertyName || booklet.title}
        </h1>
        {booklet.address && (
          <p style={{ margin: "5px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 4 }}>
            <span>📍</span> {booklet.address}
          </p>
        )}
      </div>
    </div>
  );
}

function TabWithHero({ booklet, children }: { booklet: Booklet; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ overflowY: "auto", flex: 1 }}>
        <BookletHero booklet={booklet} />
        {children}
      </div>
    </div>
  );
}

// ─── TAB ACCUEIL ──────────────────────────────────────────────────────────────

function TabHome({ booklet, accent }: { booklet: Booklet; accent: string }) {
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
  const welcomeMsg   = g(arrival, "welcome_message");
  const hostName     = g(contact, "host_name");
  const hostPhoto    = g(contact, "host_photo");
  const services     = parseServices(g(accommodation, "services_list"));

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <BookletHero booklet={booklet} />
      <div style={{ padding: "0 16px 40px" }}>

      {/* Bienvenue */}
      {(welcomeMsg || hostName) && (
        <>
          <SecLabel>Bienvenue</SecLabel>
          <Card>
            {(hostPhoto || hostName) && (
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 16px", borderBottom: welcomeMsg ? `0.5px solid ${C.sep}` : "none" }}>
                {hostPhoto ? (
                  <img src={hostPhoto} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>👤</div>
                )}
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: C.sub, marginBottom: 2 }}>Votre hôte</p>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.label, letterSpacing: -0.3 }}>{hostName || "Votre hôte"}</p>
                </div>
              </div>
            )}
            {welcomeMsg && (
              <p style={{ margin: 0, padding: "16px", fontSize: 15, color: "#3C3C43", lineHeight: 1.65 }}>{welcomeMsg}</p>
            )}
          </Card>
        </>
      )}

      {/* Horaires */}
      {(checkinTime || checkoutTime) && (
        <>
          <SecLabel>Horaires</SecLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {checkinTime && (
              <Card>
                <div style={{ padding: "18px 16px" }}>
                  <AppIcon bg={`${C.green}18`} size={36}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="1.5" y="3" width="15" height="13" rx="2.5" stroke={C.green} strokeWidth="1.6"/>
                      <path d="M6 1.5v3M12 1.5v3M1.5 7.5h15" stroke={C.green} strokeWidth="1.6" strokeLinecap="round"/>
                      <path d="M6 11.5l2 2 4-4" stroke={C.green} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </AppIcon>
                  <p style={{ margin: "12px 0 3px", fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.8 }}>Arrivée</p>
                  <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: accent, letterSpacing: -1, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {formatTime(checkinTime)}
                  </p>
                </div>
              </Card>
            )}
            {checkoutTime && (
              <Card>
                <div style={{ padding: "18px 16px" }}>
                  <AppIcon bg={`${C.orange}18`} size={36}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="1.5" y="3" width="15" height="13" rx="2.5" stroke={C.orange} strokeWidth="1.6"/>
                      <path d="M6 1.5v3M12 1.5v3M1.5 7.5h15" stroke={C.orange} strokeWidth="1.6" strokeLinecap="round"/>
                      <path d="M7 11h4M9 9v4" stroke={C.orange} strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </AppIcon>
                  <p style={{ margin: "12px 0 3px", fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.8 }}>Départ</p>
                  <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: C.orange, letterSpacing: -1, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {formatTime(checkoutTime)}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Code d'accès */}
      {accessCode && (
        <>
          <SecLabel>Accès & Clés</SecLabel>
          <Card>
            <div style={{ padding: "18px 16px 16px" }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Code d'accès
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {/* Chiffres espacés style iOS */}
                <div style={{ display: "flex", gap: 6 }}>
                  {accessCode.split("").map((char, i) => (
                    <div key={i} style={{
                      width: 42, height: 52, borderRadius: 12,
                      background: `${accent}10`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 28, fontWeight: 700,
                      color: accent,
                      fontFamily: "ui-monospace,'SF Mono',monospace",
                      letterSpacing: 0,
                    }}>
                      {char}
                    </div>
                  ))}
                </div>
                <CopyBtn value={accessCode} accent={accent} />
              </div>
              {keyLocation && (
                <p style={{ margin: "12px 0 0", fontSize: 13, color: C.sub, lineHeight: 1.5 }}>{keyLocation}</p>
              )}
            </div>
            {parking && (
              <>
                <Sep />
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" }}>
                  <AppIcon bg="#FF950018" size={32}>🅿️</AppIcon>
                  <p style={{ margin: 0, fontSize: 15, color: C.label, flex: 1 }}>Stationnement</p>
                  <p style={{ margin: 0, fontSize: 14, color: C.sub, maxWidth: "50%", textAlign: "right" }}>{parking}</p>
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {/* WiFi */}
      {(wifiName || wifiPass) && (
        <>
          <SecLabel>WiFi</SecLabel>
          <Card>
            {wifiName && (
              <WifiRow label="Réseau WiFi" value={wifiName} accent={accent} mono={false} borderBottom={!!wifiPass}>
                <svg width="22" height="17" viewBox="0 0 22 17" fill="none">
                  <circle cx="11" cy="15.5" r="1.8" fill={C.blue}/>
                  <path d="M7.2 11.8C8.2 10.8 9.5 10.2 11 10.2s2.8.6 3.8 1.6" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M4 8.6C5.8 6.8 8.3 5.7 11 5.7s5.2 1.1 7 2.9" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
                  <path d="M.8 5.4C3.4 2.8 7 1.2 11 1.2s7.6 1.6 10.2 4.2" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round" opacity="0.3"/>
                </svg>
              </WifiRow>
            )}
            {wifiPass && <WifiRow label="Mot de passe" value={wifiPass} accent={accent} mono={true} borderBottom={false} />}
          </Card>
        </>
      )}

      {/* Services inclus */}
      {services.length > 0 && (
        <>
          <SecLabel>Services inclus</SecLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {services.map((s, i) => (
              <Card key={i}>
                <div style={{ padding: "18px 14px" }}>
                  <AppIcon bg={`${accent}14`} size={44}>{s.emoji}</AppIcon>
                  <p style={{ margin: "12px 0 2px", fontSize: 14, fontWeight: 600, color: C.label }}>{s.name}</p>
                  {s.description && <p style={{ margin: 0, fontSize: 12, color: C.sub, lineHeight: 1.4 }}>{s.description}</p>}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Localisation */}
      {booklet.address && (
        <>
          <SecLabel>Localisation</SecLabel>
          <Card>
            {/* Carte Google Maps embed */}
            <div style={{ borderRadius: "18px 18px 0 0", overflow: "hidden", height: 160 }}>
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(booklet.address)}&output=embed&z=15`}
                width="100%" height="160"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localisation"
              />
            </div>
            {/* Adresse + boutons */}
            <div style={{ padding: "14px 16px" }}>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
                📍 {booklet.address}
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booklet.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: 14, background: "#4285F418", textDecoration: "none" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#4285F4">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#4285F4" }}>Google Maps</span>
                </a>
                <a
                  href={`https://waze.com/ul?q=${encodeURIComponent(booklet.address)}&navigate=yes`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: 14, background: "#33CCFF18", textDecoration: "none" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#33CCFF">
                    <path d="M20.54 6.29C19.07 3.66 16.28 2 13.22 2 8.73 2 5.05 5.54 5 10.03c-.01.82.13 1.62.38 2.38L3.1 19.35c-.17.51.3.99.82.85l6.98-1.98c.77.26 1.58.4 2.41.4 4.51 0 8.18-3.57 8.18-7.97 0-1.56-.46-3.07-1.28-4.27l.33-.09z"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#33AADD" }}>Waze</span>
                </a>
              </div>
            </div>
          </Card>
        </>
      )}

      {(arrival?.images?.length ?? 0) > 0 && (
        <>
          <SecLabel>Photos</SecLabel>
          <PhotoGallery images={arrival!.images!} />
        </>
      )}

      </div>{/* fin padding */}
    </div>
  );
}

// ─── TAB SÉJOUR ───────────────────────────────────────────────────────────────

function TabStay({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const arrival       = useMod(booklet, "arrival");
  const accommodation = useMod(booklet, "accommodation");
  const rules         = useMod(booklet, "rules");
  const kitchen       = useMod(booklet, "kitchen");
  const baby          = useMod(booklet, "baby");
  const petsModule    = useMod(booklet, "pets");
  const pool          = useMod(booklet, "pool");
  const coworking     = useMod(booklet, "coworking");
  const accessibility = useMod(booklet, "accessibility");

  const steps = g(arrival, "checkin_process").split("\n").filter(Boolean);
  const [checkinDone, setCheckinDone] = useState<Record<number, boolean>>({});
  const checkinCount = Object.values(checkinDone).filter(Boolean).length;

  const equipRows = [
    { key: "heating",      icon: "🌡️", bg: "#FF6B6B18", label: "Chauffage" },
    { key: "ac",           icon: "❄️", bg: "#5AC8FA18", label: "Climatisation" },
    { key: "appliances",   icon: "🫧", bg: "#34C75918", label: "Électroménager" },
    { key: "tv",           icon: "📺", bg: "#5856D618", label: "TV & Divertissements" },
    { key: "checkin_code", icon: "📬", bg: "#FF950018", label: "Boîte aux lettres" },
    { key: "other",        icon: "ℹ️", bg: "#8E8E9318", label: "Autres" },
  ].filter(r => accommodation && g(accommodation, r.key));

  const [expandedEquip, setExpandedEquip] = useState<string | null>(null);

  return (
    <div style={{ padding: "0 16px 40px" }}>

      {steps.length > 0 && (
        <>
          <SecLabel>Procédure d'arrivée · {checkinCount}/{steps.length}</SecLabel>
          <Card>
            {steps.map((step, i) => (
              <button key={i} onClick={() => setCheckinDone(p => ({ ...p, [i]: !p[i] }))}
                style={{ width: "100%", display: "flex", gap: 14, padding: "15px 16px", borderBottom: i < steps.length - 1 ? `0.5px solid ${C.sep}` : "none", alignItems: "flex-start", background: "none", border: "none", borderRadius: 0, cursor: "pointer", textAlign: "left" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0, transition: "all 0.18s",
                  background: checkinDone[i] ? accent : "transparent",
                  border: `2px solid ${checkinDone[i] ? accent : "#C7C7CC"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: checkinDone[i] ? `0 2px 8px ${accent}40` : "none",
                }}>
                  {checkinDone[i]
                    ? <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4.5 8L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <span style={{ fontSize: 11, fontWeight: 700, color: "#C7C7CC" }}>{i + 1}</span>
                  }
                </div>
                <p style={{ margin: 0, fontSize: 15, color: checkinDone[i] ? "#C7C7CC" : C.label, textDecoration: checkinDone[i] ? "line-through" : "none", lineHeight: 1.5, paddingTop: 2, flex: 1, transition: "all 0.15s" }}>
                  {step}
                </p>
              </button>
            ))}
            {checkinCount === steps.length && steps.length > 0 && (
              <div style={{ padding: "16px", textAlign: "center", background: `${accent}08` }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: accent }}>✅ Vous êtes bien installé !</p>
              </div>
            )}
          </Card>
        </>
      )}

      {equipRows.length > 0 && (
        <>
          <SecLabel>Dans votre logement</SecLabel>
          <Card>
            {equipRows.map((r, i) => {
              const isOpen = expandedEquip === r.key;
              const content = accommodation ? g(accommodation, r.key) : "";
              return (
                <div key={r.key}>
                  <button
                    onClick={() => setExpandedEquip(isOpen ? null : r.key)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderBottom: (!isOpen && i < equipRows.length - 1) ? `0.5px solid ${C.sep}` : "none", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <AppIcon bg={r.bg} size={34}>{r.icon}</AppIcon>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 15, color: C.label, fontWeight: 400 }}>{r.label}</p>
                      {!isOpen && content.length < 55 && (
                        <p style={{ margin: "1px 0 0", fontSize: 12, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{content}</p>
                      )}
                    </div>
                    <svg width="7" height="13" viewBox="0 0 7 13" fill="none" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                      <path d="M1 1L6 6.5L1 12" stroke="#C7C7CC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "12px 16px 14px", borderBottom: i < equipRows.length - 1 ? `0.5px solid ${C.sep}` : "none", background: `${C.bg}` }}>
                      <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.7, whiteSpace: "pre-line" }}>{content}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </>
      )}

      {rules && [
        { key: "max_guests", icon: "👥", bg: "#007AFF18", label: "Personnes" },
        { key: "smoking",    icon: "🚭", bg: "#FF3B3018", label: "Tabac" },
        { key: "pets",       icon: "🐾", bg: "#FF950018", label: "Animaux" },
        { key: "noise",      icon: "🔊", bg: "#34C75918", label: "Bruit" },
        { key: "parties",    icon: "🎉", bg: "#5856D618", label: "Fêtes" },
        { key: "other",      icon: "📌", bg: "#8E8E9318", label: "Autres" },
      ].filter(r => g(rules, r.key)).length > 0 && (
        <>
          <SecLabel>Règles du séjour</SecLabel>
          <Card>
            {[
              { key: "max_guests", icon: "👥", bg: "#007AFF18", label: "Personnes" },
              { key: "smoking",    icon: "🚭", bg: "#FF3B3018", label: "Tabac" },
              { key: "pets",       icon: "🐾", bg: "#FF950018", label: "Animaux" },
              { key: "noise",      icon: "🔊", bg: "#34C75918", label: "Bruit" },
              { key: "parties",    icon: "🎉", bg: "#5856D618", label: "Fêtes" },
              { key: "other",      icon: "📌", bg: "#8E8E9318", label: "Autres" },
            ].filter(r => g(rules, r.key)).map((r, i, arr) => (
              <div key={r.key} style={{ display: "flex", gap: 14, padding: "14px 16px", alignItems: "flex-start", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none" }}>
                <AppIcon bg={r.bg} size={34}>{r.icon}</AppIcon>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>{r.label}</p>
                  <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.55, whiteSpace: "pre-line" }}>{g(rules, r.key)}</p>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {kitchen && [
        { key: "equipment",        label: "🍴", title: "Équipements cuisine" },
        { key: "trash",            label: "♻️", title: "Tri des déchets" },
        { key: "linen",            label: "🛏️", title: "Linge de maison" },
        { key: "cleaning",         label: "🧹", title: "Ménage & produits" },
        { key: "checkout_cleaning",label: "🧽", title: "Ménage au départ" },
      ].filter(f => g(kitchen, f.key)).length > 0 && (
        <>
          <SecLabel>Cuisine & Ménage</SecLabel>
          <Card>
            {[
              { key: "equipment",        label: "🍴", title: "Équipements cuisine" },
              { key: "trash",            label: "♻️", title: "Tri des déchets" },
              { key: "linen",            label: "🛏️", title: "Linge de maison" },
              { key: "cleaning",         label: "🧹", title: "Ménage & produits" },
              { key: "checkout_cleaning",label: "🧽", title: "Ménage au départ" },
            ].filter(f => g(kitchen, f.key)).map((f, i, arr) => (
              <div key={f.key} style={{ padding: "15px 16px", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none" }}>
                <p style={{ margin: "0 0 5px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {f.label} {f.title}
                </p>
                <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.65, whiteSpace: "pre-line" }}>{g(kitchen, f.key)}</p>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* ── Bébé & Enfants ── */}
      {baby && [
        { key: "available", icon: "👶", bg: "#FF6B6B18", label: "Équipements bébé" },
        { key: "safety",    icon: "🛡️", bg: "#34C75918", label: "Sécurité enfants" },
        { key: "rental",    icon: "🛒", bg: "#007AFF18", label: "Location possible" },
      ].filter(f => g(baby, f.key)).length > 0 && (
        <>
          <SecLabel>👶 Bébé & Enfants</SecLabel>
          <Card>
            {[
              { key: "available", icon: "👶", bg: "#FF6B6B18", label: "Équipements bébé" },
              { key: "safety",    icon: "🛡️", bg: "#34C75918", label: "Sécurité enfants" },
              { key: "rental",    icon: "🛒", bg: "#007AFF18", label: "Location possible" },
            ].filter(f => g(baby, f.key)).map((f, i, arr) => (
              <div key={f.key} style={{ display: "flex", gap: 14, padding: "14px 16px", alignItems: "flex-start", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none" }}>
                <AppIcon bg={f.bg} size={34}>{f.icon}</AppIcon>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</p>
                  <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.55, whiteSpace: "pre-line" }}>{g(baby, f.key)}</p>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* ── Animaux ── */}
      {petsModule && [
        { key: "rules",  icon: "🐾", bg: "#FF950018", label: "Règles animaux" },
        { key: "zones",  icon: "🗺️", bg: "#007AFF18", label: "Zones autorisées" },
        { key: "nearby", icon: "🏥", bg: "#34C75918", label: "Parcs & vétérinaires" },
      ].filter(f => g(petsModule, f.key)).length > 0 && (
        <>
          <SecLabel>🐾 Animaux acceptés</SecLabel>
          <Card>
            {[
              { key: "rules",  icon: "🐾", bg: "#FF950018", label: "Règles animaux" },
              { key: "zones",  icon: "🗺️", bg: "#007AFF18", label: "Zones autorisées" },
              { key: "nearby", icon: "🏥", bg: "#34C75918", label: "Parcs & vétérinaires" },
            ].filter(f => g(petsModule, f.key)).map((f, i, arr) => (
              <div key={f.key} style={{ display: "flex", gap: 14, padding: "14px 16px", alignItems: "flex-start", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none" }}>
                <AppIcon bg={f.bg} size={34}>{f.icon}</AppIcon>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</p>
                  <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.55, whiteSpace: "pre-line" }}>{g(petsModule, f.key)}</p>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* ── Piscine & Extérieur ── */}
      {pool && [
        { key: "hours",       icon: "🕐", bg: "#007AFF18", label: "Horaires" },
        { key: "rules",       icon: "🚫", bg: "#FF3B3018", label: "Règles de sécurité" },
        { key: "equipment",   icon: "🪑", bg: "#34C75918", label: "Équipements" },
        { key: "maintenance", icon: "🔧", bg: "#8E8E9318", label: "Entretien" },
      ].filter(f => g(pool, f.key)).length > 0 && (
        <>
          <SecLabel>🏊 Piscine & Extérieur</SecLabel>
          <Card>
            {[
              { key: "hours",       icon: "🕐", bg: "#007AFF18", label: "Horaires" },
              { key: "rules",       icon: "🚫", bg: "#FF3B3018", label: "Règles de sécurité" },
              { key: "equipment",   icon: "🪑", bg: "#34C75918", label: "Équipements" },
              { key: "maintenance", icon: "🔧", bg: "#8E8E9318", label: "Entretien" },
            ].filter(f => g(pool, f.key)).map((f, i, arr) => (
              <div key={f.key} style={{ display: "flex", gap: 14, padding: "14px 16px", alignItems: "flex-start", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none" }}>
                <AppIcon bg={f.bg} size={34}>{f.icon}</AppIcon>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</p>
                  <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.55, whiteSpace: "pre-line" }}>{g(pool, f.key)}</p>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* ── Télétravail ── */}
      {coworking && [
        { key: "desk",     icon: "🖥️", bg: "#5856D618", label: "Espace de travail" },
        { key: "wifi_pro", icon: "📶", bg: "#007AFF18", label: "WiFi dédié" },
        { key: "screens",  icon: "🖥️", bg: "#34C75918", label: "Écrans" },
        { key: "printing", icon: "🖨️", bg: "#FF950018", label: "Impression" },
      ].filter(f => g(coworking, f.key)).length > 0 && (
        <>
          <SecLabel>💻 Télétravail</SecLabel>
          <Card>
            {[
              { key: "desk",     icon: "🖥️", bg: "#5856D618", label: "Espace de travail" },
              { key: "wifi_pro", icon: "📶", bg: "#007AFF18", label: "WiFi dédié" },
              { key: "screens",  icon: "🖥️", bg: "#34C75918", label: "Écrans" },
              { key: "printing", icon: "🖨️", bg: "#FF950018", label: "Impression" },
            ].filter(f => g(coworking, f.key)).map((f, i, arr) => (
              <div key={f.key} style={{ display: "flex", gap: 14, padding: "14px 16px", alignItems: "flex-start", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none" }}>
                <AppIcon bg={f.bg} size={34}>{f.icon}</AppIcon>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</p>
                  <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.55, whiteSpace: "pre-line" }}>{g(coworking, f.key)}</p>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* ── Accessibilité ── */}
      {accessibility && [
        { key: "access",    icon: "♿", bg: "#007AFF18", label: "Accès" },
        { key: "elevator",  icon: "🛗", bg: "#34C75918", label: "Ascenseur" },
        { key: "bathroom",  icon: "🚿", bg: "#5AC8FA18", label: "Salle de bain" },
        { key: "equipment", icon: "🦽", bg: "#8E8E9318", label: "Équipements PMR" },
      ].filter(f => g(accessibility, f.key)).length > 0 && (
        <>
          <SecLabel>♿ Accessibilité</SecLabel>
          <Card>
            {[
              { key: "access",    icon: "♿", bg: "#007AFF18", label: "Accès" },
              { key: "elevator",  icon: "🛗", bg: "#34C75918", label: "Ascenseur" },
              { key: "bathroom",  icon: "🚿", bg: "#5AC8FA18", label: "Salle de bain" },
              { key: "equipment", icon: "🦽", bg: "#8E8E9318", label: "Équipements PMR" },
            ].filter(f => g(accessibility, f.key)).map((f, i, arr) => (
              <div key={f.key} style={{ display: "flex", gap: 14, padding: "14px 16px", alignItems: "flex-start", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none" }}>
                <AppIcon bg={f.bg} size={34}>{f.icon}</AppIcon>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</p>
                  <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.55, whiteSpace: "pre-line" }}>{g(accessibility, f.key)}</p>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Carte activité ───────────────────────────────────────────────────────────

function ActivityCard({ act, accent, catLabel, catColor }: {
  act: ReturnType<typeof parseActivities>[number];
  accent: string;
  catLabel: (cat: string) => string;
  catColor: (cat: string) => string;
}) {
  return (
    <div style={{ background: C.card, borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 0.5px 2px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", width: "100%" }}>
      {act.photo ? (
        <div style={{ height: 128, backgroundImage: `url(${act.photo})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.48)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderRadius: 20, padding: "3px 10px" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{catLabel(act.category)}</span>
          </div>
          {act.recommended && (
            <div style={{ position: "absolute", top: 10, right: 10, background: C.orange, borderRadius: 20, padding: "3px 10px", boxShadow: `0 2px 8px ${C.orange}60` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>★ Coup de cœur</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ height: 72, background: `${catColor(act.category)}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `${catColor(act.category)}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 22 }}>{ { restaurant: "🍽️", activity: "🎯", shop: "🛒", transport: "🚌", other: "📍" }[act.category] ?? "📍" }</span>
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
            {act.distance   && <span style={{ fontSize: 11, color: C.sub }}>📍 {act.distance}</span>}
            {act.openHours  && <span style={{ fontSize: 11, color: C.sub }}>🕐 {act.openHours}</span>}
            {act.priceRange && <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>{act.priceRange}</span>}
          </div>
        )}
        {(act.phone || act.address || act.website || act.instagram) && (
          <div style={{ display: "flex", gap: 6, paddingTop: 10, borderTop: `0.5px solid ${C.sep}`, marginTop: "auto" }}>
            {act.phone && (
              <a href={`tel:${act.phone}`} style={{ flex: 1, padding: "8px 0", borderRadius: 12, background: `${accent}12`, color: accent, fontSize: 16, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>📞</a>
            )}
            {act.address && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.address)}`} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: "8px 0", borderRadius: 12, background: `${accent}12`, color: accent, fontSize: 16, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>🗺️</a>
            )}
            {act.website && (
              <a href={act.website} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: "8px 0", borderRadius: 12, background: `${accent}12`, color: accent, fontSize: 16, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>🌐</a>
            )}
            {act.instagram && (
              <a href={`https://instagram.com/${act.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: "8px 0", borderRadius: 12, background: `${accent}12`, color: accent, fontSize: 16, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>📸</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB ACTIVITÉS ────────────────────────────────────────────────────────────

function TabArea({ booklet, accent }: { booklet: Booklet; accent: string }) {
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
    { id: "all",        label: "Tout" },
    { id: "restaurant", label: "Restau" },
    { id: "activity",   label: "Activités" },
    { id: "shop",       label: "Commerces" },
    { id: "transport",  label: "Transport" },
    { id: "other",      label: "Autres" },
  ];

  const catLabel = (cat: string) => ({ restaurant: "Restaurant", activity: "Activité", shop: "Commerce", transport: "Transport", other: "Lieu" }[cat] ?? "Lieu");
  const catColor = (cat: string) => ({ restaurant: "#FF6B6B", activity: C.blue, shop: C.green, transport: C.orange, other: C.sub }[cat] ?? C.sub);

  // Catégories effectivement présentes dans les activités
  const presentCats = new Set(activities.map(a => a.category));
  const catCount = (id: string) => id === "all" ? activities.length : activities.filter(a => a.category === id).length;
  const visibleCats = CATS.filter(c => c.id === "all" || presentCats.has(c.id as Activity["category"]));

  const filtered = activeFilter === "all"
    ? activities
    : activities.filter(a => a.category === activeFilter);

  return (
    <div style={{ padding: "0 0 40px" }}>

      {/* Activités */}
      {activities.length > 0 && (
        <>
          {/* Filtres catégories */}
          {visibleCats.length > 2 && (
            <div style={{ display: "flex", gap: 7, overflowX: "auto", scrollbarWidth: "none", padding: "8px 16px 0", marginBottom: 2 }}>
              {visibleCats.map(cat => {
                const isActive = activeFilter === cat.id;
                const count = catCount(cat.id);
                return (
                  <button key={cat.id} onClick={() => setActiveFilter(cat.id)}
                    style={{
                      flexShrink: 0,
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 10,
                      border: isActive ? `1.5px solid ${accent}` : "1.5px solid rgba(0,0,0,0.09)",
                      cursor: "pointer",
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      background: isActive ? `${accent}10` : C.card,
                      color: isActive ? accent : C.sub,
                      transition: "all 0.15s",
                      boxShadow: isActive ? `0 1px 6px ${accent}22` : "none",
                    }}>
                    {cat.label}
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      background: isActive ? accent : "rgba(0,0,0,0.07)",
                      color: isActive ? "#fff" : C.sub,
                      borderRadius: 6, padding: "1px 6px",
                      lineHeight: 1.6,
                    }}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ padding: "8px 16px 0" }}>
            <SecLabel>
              {activeFilter === "all" ? `${activities.length} recommandation${activities.length > 1 ? "s" : ""}` : `${filtered.length} lieu${filtered.length > 1 ? "x" : ""}`}
            </SecLabel>
          </div>
          {/* Scroll horizontal si < 8, grille 2 col sinon */}
          {filtered.length < 8 ? (
            <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollbarWidth: "none", padding: "0 16px 4px", alignItems: "stretch" }}>
              {filtered.map((act, i) => (
                <div key={i} style={{ flexShrink: 0, width: 210, display: "flex" }}>
                  <ActivityCard act={act} accent={accent} catLabel={catLabel} catColor={catColor} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 16px 4px" }}>
              {filtered.map((act, i) => (
                <ActivityCard key={i} act={act} accent={accent} catLabel={catLabel} catColor={catColor} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Carte */}
      {mapAddress && (
        <>
          <SecLabel>Carte</SecLabel>
          <div style={{ borderRadius: 18, overflow: "hidden", height: 188, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <iframe src={`https://maps.google.com/maps?q=${mapAddress}&output=embed&z=15`}
              width="100%" height="188" style={{ border: 0, display: "block" }}
              loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Carte" />
          </div>
        </>
      )}

      {/* Adresses */}
      {places.length > 0 && (
        <>
          <SecLabel>Adresses</SecLabel>
          <Card>
            {places.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i < places.length - 1 ? `0.5px solid ${C.sep}` : "none" }}>
                <AppIcon bg={`${accent}12`} size={32}>📍</AppIcon>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.label, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                  {p.address && <p style={{ margin: "1px 0 0", fontSize: 12, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.address}</p>}
                </div>
                {p.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer"
                    style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "#fff", background: accent, textDecoration: "none", flexShrink: 0 }}>
                    Maps
                  </a>
                )}
              </div>
            ))}
          </Card>
        </>
      )}

      {g(neighborhood, "hidden_gems") && (
        <>
          <SecLabel>⭐ Coup de cœur</SecLabel>
          <Card>
            <div style={{ padding: "15px 16px" }}>
              <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.7, whiteSpace: "pre-line" }}>{g(neighborhood, "hidden_gems")}</p>
            </div>
          </Card>
        </>
      )}

      {(g(neighborhood, "transport") || transport) && (
        <>
          <SecLabel>Transports</SecLabel>
          <Card>
            {g(neighborhood, "transport") && (
              <div style={{ padding: "14px 16px", borderBottom: transport ? `0.5px solid ${C.sep}` : "none" }}>
                <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.65, whiteSpace: "pre-line" }}>{g(neighborhood, "transport")}</p>
              </div>
            )}
            {transport && [
              { key: "public", label: "Transports en commun" },
              { key: "taxi",   label: "Taxi / VTC" },
              { key: "bike",   label: "Vélos & trottinettes" },
              { key: "airport",label: "Aéroport" },
            ].filter(f => g(transport, f.key)).map((f, i, arr) => (
              <div key={f.key} style={{ padding: "13px 16px", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none" }}>
                <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</p>
                <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.55, whiteSpace: "pre-line" }}>{g(transport, f.key)}</p>
              </div>
            ))}
          </Card>
        </>
      )}

      {practical && Object.entries(practical.content).filter(([, v]) => v).length > 0 && (
        <>
          <SecLabel>Infos pratiques</SecLabel>
          <Card>
            {[
              { key: "pharmacy",   label: "Pharmacie" },
              { key: "doctor",     label: "Médecin" },
              { key: "supermarket",label: "Supermarché" },
              { key: "laundry",    label: "Laverie" },
              { key: "city_hall",  label: "Mairie" },
            ].filter(f => g(practical, f.key)).map((f, i, arr) => (
              <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none", gap: 12 }}>
                <p style={{ margin: 0, fontSize: 15, color: C.sub, flexShrink: 0 }}>{f.label}</p>
                <p style={{ margin: 0, fontSize: 14, color: C.label, fontWeight: 500, textAlign: "right", flex: 1 }}>{g(practical, f.key)}</p>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* ── Expériences locales ── */}
      {experiences && [
        { key: "hidden_gems", icon: "⭐", bg: "#FF950018", label: "Coups de cœur" },
        { key: "activities",  icon: "🎯", bg: "#007AFF18", label: "Activités recommandées" },
        { key: "events",      icon: "🎉", bg: "#34C75918", label: "Événements locaux" },
      ].filter(f => g(experiences, f.key)).length > 0 && (
        <>
          <SecLabel>🗺️ Expériences locales</SecLabel>
          <Card>
            {[
              { key: "hidden_gems", icon: "⭐", bg: "#FF950018", label: "Coups de cœur" },
              { key: "activities",  icon: "🎯", bg: "#007AFF18", label: "Activités recommandées" },
              { key: "events",      icon: "🎉", bg: "#34C75918", label: "Événements locaux" },
            ].filter(f => g(experiences, f.key)).map((f, i, arr) => (
              <div key={f.key} style={{ display: "flex", gap: 14, padding: "14px 16px", alignItems: "flex-start", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none" }}>
                <AppIcon bg={f.bg} size={34}>{f.icon}</AppIcon>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</p>
                  <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.55, whiteSpace: "pre-line" }}>{g(experiences, f.key)}</p>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* ── Éco-responsable ── */}
      {eco && [
        { key: "sorting", icon: "♻️", bg: "#34C75918", label: "Tri des déchets" },
        { key: "energy",  icon: "⚡", bg: "#FF950018", label: "Économies d'énergie" },
        { key: "water",   icon: "💧", bg: "#007AFF18", label: "Économies d'eau" },
        { key: "other",   icon: "🌿", bg: "#34C75918", label: "Autres gestes verts" },
      ].filter(f => g(eco, f.key)).length > 0 && (
        <>
          <SecLabel>🌿 Éco-responsable</SecLabel>
          <Card>
            {[
              { key: "sorting", icon: "♻️", bg: "#34C75918", label: "Tri des déchets" },
              { key: "energy",  icon: "⚡", bg: "#FF950018", label: "Économies d'énergie" },
              { key: "water",   icon: "💧", bg: "#007AFF18", label: "Économies d'eau" },
              { key: "other",   icon: "🌿", bg: "#34C75918", label: "Autres gestes verts" },
            ].filter(f => g(eco, f.key)).map((f, i, arr) => (
              <div key={f.key} style={{ display: "flex", gap: 14, padding: "14px 16px", alignItems: "flex-start", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none" }}>
                <AppIcon bg={f.bg} size={34}>{f.icon}</AppIcon>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</p>
                  <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.55, whiteSpace: "pre-line" }}>{g(eco, f.key)}</p>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── TAB URGENCES ─────────────────────────────────────────────────────────────

function TabSafety({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const safety  = useMod(booklet, "safety");
  const contact = useMod(booklet, "contact");

  return (
    <div style={{ padding: "0 16px 40px" }}>

      {safety && g(safety, "emergency") && (
        <>
          <SecLabel>Numéros d'urgence</SecLabel>
          <Card style={{ boxShadow: "0 2px 12px rgba(255,59,48,0.1), 0 0.5px 2px rgba(255,59,48,0.06)" }}>
            <div style={{ padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <AppIcon bg="#FF3B3018" size={28}>🚨</AppIcon>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 0.6 }}>Urgences</p>
              </div>
              <p style={{ margin: 0, fontSize: 15, color: C.label, lineHeight: 1.8, whiteSpace: "pre-line", fontWeight: 500 }}>
                {g(safety, "emergency")}
              </p>
            </div>
          </Card>
        </>
      )}

      {contact && (g(contact, "host_name") || g(contact, "host_phone")) && (
        <>
          <SecLabel>Votre hôte</SecLabel>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 16px", borderBottom: `0.5px solid ${C.sep}` }}>
              {g(contact, "host_photo")
                ? <img src={g(contact, "host_photo")} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }} />
                : <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>👤</div>
              }
              <div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.label, letterSpacing: -0.3 }}>{g(contact, "host_name") || "Votre hôte"}</p>
                {g(contact, "response_time") && <p style={{ margin: "3px 0 0", fontSize: 13, color: C.sub }}>{g(contact, "response_time")}</p>}
              </div>
            </div>
            {g(contact, "about") && (
              <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${C.sep}` }}>
                <p style={{ margin: 0, fontSize: 14, color: "#3C3C43", lineHeight: 1.65 }}>{g(contact, "about")}</p>
              </div>
            )}
            <div style={{ display: "flex" }}>
              {g(contact, "host_phone") && (
                <a href={`tel:${g(contact, "host_phone")}`}
                  style={{ flex: 1, padding: "15px 0", textAlign: "center", color: accent, fontSize: 15, fontWeight: 600, textDecoration: "none", borderRight: g(contact, "host_email") ? `0.5px solid ${C.sep}` : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14.5 11.5l-3-1.5-1.5 1.5C7 10 6 9 4.5 6L6 4.5 4.5 1.5C3.5 1 2.5 1.5 2 2.5 1 5 3.5 10.5 8 13.5c1.5.9 4.5 2 6-0.5.5-1 1-2 .5-1.5z" stroke={accent} strokeWidth="1.5" strokeLinejoin="round"/></svg>
                  Appeler
                </a>
              )}
              {g(contact, "host_email") && (
                <a href={`mailto:${g(contact, "host_email")}`}
                  style={{ flex: 1, padding: "15px 0", textAlign: "center", color: accent, fontSize: 15, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <svg width="16" height="14" viewBox="0 0 16 14" fill="none"><rect x="1" y="1" width="14" height="12" rx="2" stroke={accent} strokeWidth="1.5"/><path d="M1 4l7 5 7-5" stroke={accent} strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Email
                </a>
              )}
            </div>
          </Card>
        </>
      )}

      {safety && [
        { key: "fire_extinguisher", icon: "🧯", bg: "#FF3B3018", label: "Extincteur" },
        { key: "circuit_breaker",   icon: "⚡", bg: "#FF950018", label: "Disjoncteur" },
        { key: "water_shutoff",     icon: "💧", bg: "#007AFF18", label: "Coupure d'eau" },
        { key: "hospital",          icon: "🏥", bg: "#34C75918", label: "Hôpital" },
      ].filter(f => g(safety, f.key)).length > 0 && (
        <>
          <SecLabel>Sécurité</SecLabel>
          <Card>
            {[
              { key: "fire_extinguisher", icon: "🧯", bg: "#FF3B3018", label: "Extincteur" },
              { key: "circuit_breaker",   icon: "⚡", bg: "#FF950018", label: "Disjoncteur" },
              { key: "water_shutoff",     icon: "💧", bg: "#007AFF18", label: "Coupure d'eau" },
              { key: "hospital",          icon: "🏥", bg: "#34C75918", label: "Hôpital" },
            ].filter(f => g(safety, f.key)).map((f, i, arr) => (
              <div key={f.key} style={{ display: "flex", gap: 14, padding: "14px 16px", alignItems: "flex-start", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none" }}>
                <AppIcon bg={f.bg} size={34}>{f.icon}</AppIcon>
                <div>
                  <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</p>
                  <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.55, whiteSpace: "pre-line" }}>{g(safety, f.key)}</p>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {contact && (g(contact, "concierge") || g(contact, "maintenance")) && (
        <>
          <SecLabel>Services</SecLabel>
          <Card>
            {g(contact, "concierge") && (
              <div style={{ padding: "14px 16px", borderBottom: g(contact, "maintenance") ? `0.5px solid ${C.sep}` : "none" }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>🛎️ Conciergerie</p>
                <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.55, whiteSpace: "pre-line" }}>{g(contact, "concierge")}</p>
              </div>
            )}
            {g(contact, "maintenance") && (
              <div style={{ padding: "14px 16px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>🔧 Maintenance</p>
                <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.55, whiteSpace: "pre-line" }}>{g(contact, "maintenance")}</p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── TAB DÉPART ───────────────────────────────────────────────────────────────

function TabCheckout({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const checkout  = useMod(booklet, "checkout");
  const tasks     = g(checkout, "process").split("\n").filter(Boolean);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ padding: "0 16px 40px" }}>

      {g(checkout, "checkout_time") && (
        <>
          <SecLabel>Heure de départ</SecLabel>
          <Card>
            <div style={{ padding: "24px 16px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 54, fontWeight: 800, color: C.label, letterSpacing: -2, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {formatTime(g(checkout, "checkout_time"))}
              </p>
              {g(checkout, "late_checkout_info") && (
                <p style={{ margin: "12px 0 0", fontSize: 13, color: C.sub, lineHeight: 1.5 }}>{g(checkout, "late_checkout_info")}</p>
              )}
            </div>
          </Card>
        </>
      )}

      {tasks.length > 0 && (
        <>
          <SecLabel>Checklist · {doneCount}/{tasks.length}</SecLabel>
          <Card>
            {tasks.map((task, i) => (
              <button key={i} onClick={() => setChecked(p => ({ ...p, [i]: !p[i] }))}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", background: "none", border: "none", borderBottom: i < tasks.length - 1 ? `0.5px solid ${C.sep}` : "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0, transition: "all 0.18s",
                  background: checked[i] ? accent : "transparent",
                  border: `2px solid ${checked[i] ? accent : "#C7C7CC"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: checked[i] ? `0 2px 8px ${accent}40` : "none",
                }}>
                  {checked[i] && (
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                      <path d="M1 4.5L4.5 8L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 15, color: checked[i] ? "#C7C7CC" : C.label, textDecoration: checked[i] ? "line-through" : "none", flex: 1, lineHeight: 1.4, transition: "all 0.15s" }}>
                  {task}
                </p>
              </button>
            ))}
            {doneCount === tasks.length && tasks.length > 0 && (
              <div style={{ padding: "16px", textAlign: "center", background: `${accent}08` }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: accent }}>✅ Tout est prêt, bon voyage !</p>
              </div>
            )}
          </Card>
        </>
      )}

      {g(checkout, "keys_return") && (
        <>
          <SecLabel>Retour des clés</SecLabel>
          <Card>
            <div style={{ display: "flex", gap: 14, padding: "15px 16px", alignItems: "center" }}>
              <AppIcon bg="#FF950018" size={34}>🔑</AppIcon>
              <p style={{ margin: 0, fontSize: 14, color: C.label, lineHeight: 1.6, whiteSpace: "pre-line" }}>{g(checkout, "keys_return")}</p>
            </div>
          </Card>
        </>
      )}

      {(g(checkout, "review_airbnb") || g(checkout, "review_google") || g(checkout, "review_booking")) && (
        <>
          <SecLabel>Laissez un avis</SecLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { key: "review_airbnb",  emoji: "🏠", label: "Airbnb",       sub: "Laisser un avis" },
              { key: "review_google",  emoji: "⭐", label: "Google",       sub: "Laisser un avis" },
              { key: "review_booking", emoji: "📋", label: "Booking.com", sub: "Laisser un avis" },
            ].filter(r => g(checkout, r.key)).map(r => (
              <a key={r.key} href={g(checkout, r.key)} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderRadius: 18, background: C.card, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <AppIcon bg={`${accent}12`} size={44}>{r.emoji}</AppIcon>
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.label }}>{r.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: C.sub }}>{r.sub}</p>
                  </div>
                </div>
                <svg width="7" height="13" viewBox="0 0 7 13" fill="none"><path d="M1 1L6 6.5L1 12" stroke="#C7C7CC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            ))}
          </div>
        </>
      )}

      {g(checkout, "thank_you") && (
        <div style={{ textAlign: "center", padding: "28px 16px 8px" }}>
          <p style={{ margin: 0, fontSize: 15, color: C.sub, fontStyle: "italic", lineHeight: 1.7 }}>{g(checkout, "thank_you")}</p>
          <p style={{ margin: "20px 0 0", fontSize: 12, color: "#C7C7CC" }}>Créé avec <span style={{ fontWeight: 700, color: accent }}>Bunkly</span></p>
        </div>
      )}
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

function TabBar({ active, onSelect, accent }: { active: Tab; onSelect: (t: Tab) => void; accent: string }) {
  const tabs: { id: Tab; label: string; icon: (a: boolean) => React.ReactNode }[] = [
    {
      id: "home", label: "Accueil",
      icon: (a) => (
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
          <path d="M2.5 11.5L12.5 2.5L22.5 11.5V21.5C22.5 22.1 22.1 22.5 21.5 22.5H16.5V16.5H8.5V22.5H3.5C2.9 22.5 2.5 22.1 2.5 21.5V11.5Z"
            fill={a ? accent : "none"} stroke={a ? accent : "#8E8E93"} strokeWidth="1.6" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: "stay", label: "Séjour",
      icon: (a) => (
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
          <rect x="2.5" y="8.5" width="20" height="14" rx="2.5" fill={a ? `${accent}20` : "none"} stroke={a ? accent : "#8E8E93"} strokeWidth="1.6"/>
          <path d="M7.5 8.5V6.5C7.5 4.8 8.8 3.5 10.5 3.5H14.5C16.2 3.5 17.5 4.8 17.5 6.5V8.5" stroke={a ? accent : "#8E8E93"} strokeWidth="1.6" strokeLinecap="round"/>
          <circle cx="12.5" cy="15.5" r="2" fill={a ? accent : "#8E8E93"}/>
        </svg>
      ),
    },
    {
      id: "area", label: "Activités",
      icon: (a) => (
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
          <path d="M12.5 2.5C8.6 2.5 5.5 5.6 5.5 9.5C5.5 15 12.5 22.5 12.5 22.5C12.5 22.5 19.5 15 19.5 9.5C19.5 5.6 16.4 2.5 12.5 2.5Z"
            fill={a ? `${accent}18` : "none"} stroke={a ? accent : "#8E8E93"} strokeWidth="1.6"/>
          <circle cx="12.5" cy="9.5" r="2.5" fill={a ? accent : "#8E8E93"}/>
        </svg>
      ),
    },
    {
      id: "safety", label: "Urgences",
      icon: (a) => (
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
          <path d="M12.5 2.5L2.5 20.5H22.5L12.5 2.5Z"
            fill={a ? `${C.red}15` : "none"} stroke={a ? C.red : "#8E8E93"} strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M12.5 9.5V14.5" stroke={a ? C.red : "#8E8E93"} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12.5" cy="17.5" r="1.2" fill={a ? C.red : "#8E8E93"}/>
        </svg>
      ),
    },
    {
      id: "checkout", label: "Départ",
      icon: (a) => (
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
          <path d="M12.5 2.5L14.9 8.3L21.2 9.1L16.8 13.4L18 19.7L12.5 16.7L7 19.7L8.2 13.4L3.8 9.1L10.1 8.3L12.5 2.5Z"
            fill={a ? `${accent}20` : "none"} stroke={a ? accent : "#8E8E93"} strokeWidth="1.6" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      display: "flex",
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      borderTop: `0.5px solid rgba(0,0,0,0.08)`,
      flexShrink: 0, paddingTop: 8, paddingBottom: 8,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0 2px", background: "none", border: "none", cursor: "pointer" }}>
          {t.icon(active === t.id)}
          <span style={{
            fontSize: 10, fontWeight: active === t.id ? 600 : 400,
            color: t.id === "safety" && active === t.id ? C.red : active === t.id ? accent : "#8E8E93",
            letterSpacing: 0.1, lineHeight: 1,
          }}>
            {t.label}
          </span>
          {active === t.id && (
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: t.id === "safety" ? C.red : accent, marginTop: 1 }} />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

function ViewerContent({ booklet }: { booklet: Booklet }) {
  const [tab, setTab] = useState<Tab>("home");
  const accent = booklet.accentColor || C.blue;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, fontFamily: FONT, WebkitFontSmoothing: "antialiased", overflow: "hidden" }}>

      {/* CONTENU */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {tab === "home"     && <TabHome     booklet={booklet} accent={accent} />}
          {tab === "stay"     && <TabWithHero booklet={booklet}><TabStay     booklet={booklet} accent={accent} /></TabWithHero>}
          {tab === "area"     && <TabWithHero booklet={booklet}><TabArea     booklet={booklet} accent={accent} /></TabWithHero>}
          {tab === "safety"   && <TabWithHero booklet={booklet}><TabSafety   booklet={booklet} accent={accent} /></TabWithHero>}
          {tab === "checkout" && <TabWithHero booklet={booklet}><TabCheckout booklet={booklet} accent={accent} /></TabWithHero>}
        </div>
      </div>

      <TabBar active={tab} onSelect={setTab} accent={accent} />
    </div>
  );
}

function useQrCode(url: string) {
  const [dataUrl, setDataUrl] = useState("");
  useEffect(() => {
    import("qrcode").then(QRCode => {
      QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: "#1a1a2e", light: "#ffffff" } })
        .then(setDataUrl);
    });
  }, [url]);
  return dataUrl;
}

export function ViewerSimple({ booklet }: { booklet: Booklet }) {
  return (
    <>
      {/* Mobile : plein écran */}
      <div className="md:hidden" style={{ height: "100vh", maxHeight: "100dvh" }}>
        <ViewerContent booklet={booklet} />
      </div>

      {/* Desktop : mockup téléphone centré */}
      <DesktopViewer booklet={booklet} />
    </>
  );
}

function DesktopViewer({ booklet }: { booklet: Booklet }) {
  const url = `https://app.bunkly.co/b/${booklet.slug}`;
  const qrDataUrl = useQrCode(url);
  const accent = booklet.accentColor || C.blue;

  return (
      <div className="hidden md:flex" style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: FONT,
      }}>
        {/* Texte + QR à gauche */}
        <div style={{ color: "#fff", maxWidth: 300, marginRight: 60, flexShrink: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 14px", marginBottom: 24, backdropFilter: "blur(10px)" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>📱 Expérience mobile</span>
          </div>
          <h1 style={{ margin: "0 0 16px", fontSize: 32, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.5 }}>
            {booklet.propertyName || booklet.title}
          </h1>
          {booklet.address && (
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>📍</span> {booklet.address}
            </p>
          )}
          <p style={{ margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
            Scannez ce QR code avec votre téléphone pour accéder au livret.
          </p>

          {/* QR code */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 16, display: "inline-block", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
            {qrDataUrl
              ? <img src={qrDataUrl} alt="QR code" style={{ width: 160, height: 160, display: "block", borderRadius: 8 }} />
              : <div style={{ width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: 12 }}>Chargement...</div>
            }
            <p style={{ margin: "10px 0 0", fontSize: 11, color: "#999", textAlign: "center", fontFamily: "ui-monospace,monospace" }}>
              app.bunkly.co/b/{booklet.slug}
            </p>
          </div>
        </div>

        {/* Mockup iPhone */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {/* Reflet */}
          <div style={{
            position: "absolute", inset: -2,
            borderRadius: 54,
            background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)",
            zIndex: 2, pointerEvents: "none",
          }} />
          {/* Boîtier */}
          <div style={{
            width: 390,
            height: 760,
            borderRadius: 52,
            background: "#1a1a1a",
            padding: "12px 10px",
            boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 0 2px rgba(255,255,255,0.06)",
            position: "relative",
          }}>
            {/* Notch Dynamic Island */}
            <div style={{
              position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
              width: 120, height: 34, background: "#000",
              borderRadius: 20, zIndex: 10,
            }} />
            {/* Écran */}
            <div style={{
              width: "100%", height: "100%",
              borderRadius: 42,
              overflow: "hidden",
              background: C.bg,
            }}>
              <ViewerContent booklet={booklet} />
            </div>
          </div>
          {/* Boutons latéraux */}
          <div style={{ position: "absolute", left: -3, top: 120, width: 3, height: 32, background: "#333", borderRadius: "2px 0 0 2px" }} />
          <div style={{ position: "absolute", left: -3, top: 162, width: 3, height: 64, background: "#333", borderRadius: "2px 0 0 2px" }} />
          <div style={{ position: "absolute", left: -3, top: 236, width: 3, height: 64, background: "#333", borderRadius: "2px 0 0 2px" }} />
          <div style={{ position: "absolute", right: -3, top: 160, width: 3, height: 80, background: "#333", borderRadius: "0 2px 2px 0" }} />
        </div>
      </div>
  );
}
