"use client";

import { useState, useEffect, useMemo, createContext, useContext, Suspense } from "react";
import { Booklet, BookletModule, BookletService, ServiceChoiceItem, SupportedLang, SUPPORTED_LANGS, Plan } from "@/types";
import { t, I18nKey } from "@/lib/i18n";
import { formatTime, parseActivities, parseReviewLinks, Activity } from "@/lib/modules";
import { geocodableAddress } from "@/lib/geoAddress";
import { useAddonServices, useAddonPurchase, useAddonPurchaseConfirmation, fmtAddonPrice, computeServiceTotal } from "@/components/booklet/AddonsSection";
import {
  Copy, Check, MapPin, Clock, Users, Phone, Mail, Navigation,
  Star, ChevronRight, ChevronDown, Globe, QrCode, Menu, X, Minus, Plus,
} from "lucide-react";

// ─── i18n Context ─────────────────────────────────────────────────────────────

const LangCtx = createContext<SupportedLang>("fr");
function useT() {
  const lang = useContext(LangCtx);
  return (key: I18nKey) => t(lang, key);
}

const AccentCtx = createContext<string>("#1E2230");
function useAccent() {
  return useContext(AccentCtx);
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
    if (lang === (booklet.defaultLang ?? "fr") || !booklet.translations?.[lang]) return booklet;
    const tr = booklet.translations[lang]!;
    return {
      ...booklet,
      title: tr["_meta_"]?.title ?? booklet.title,
      description: tr["_meta_"]?.description ?? booklet.description,
      modules: booklet.modules.map(mod => {
        const modTr = tr[mod.id];
        if (!modTr) return mod;
        const content = { ...mod.content };
        for (const [field, value] of Object.entries(modTr)) {
          if (mod.content[field]) content[field] = value;
        }
        return { ...mod, content };
      }),
    };
  }, [booklet, lang]);
}

// ─── Design tokens : épuré, quasi monochrome ──────────────────────────────────

const C = {
  bg:    "#F6F5F2",  // crème clair neutre
  card:  "#FFFFFF",
  label: "#1E2230",
  sub:   "#6B7280",
  muted: "#9AA3B2",
  sep:   "rgba(30,34,48,0.06)",   // séparateur froid translucide
  line:  "rgba(30,34,48,0.12)",
};

const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const SERIF = "'Playfair Display', 'Georgia', 'Times New Roman', serif";
const RADIUS = 28;
const SHADOW = "0 2px 6px rgba(30,34,48,0.05), 0 18px 40px rgba(30,34,48,0.10)";

// ─── Titre de page (serif, façon éditorial) ──────────────────────────────────

function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ padding: "6px 2px 22px" }}>
      <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 32, fontWeight: 700, color: C.label, letterSpacing: -0.5, lineHeight: 1.1 }}>
        {children}
      </h1>
      {sub && <p style={{ margin: "6px 0 0", fontSize: 13.5, color: C.sub, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

// Halo central teinté par la couleur d'accent, sur fond crème.
// Rendu 100% via radial-gradients (aucun `filter: blur`, qui est plafonné/ignoré
// par Safari iOS au-delà de ~30px et faisait disparaître le halo sur mobile).
function haloBackground(accent: string) {
  return [
    // tache centrale dense
    `radial-gradient(60% 45% at 50% 32%, ${accent}59 0%, ${accent}24 45%, ${accent}00 78%)`,
    // nappe large et diffuse
    `radial-gradient(95% 70% at 50% 45%, ${accent}2E 0%, ${accent}00 72%)`,
    // base crème
    C.bg,
  ].join(", ");
}

// ─── Composants de base : style "fiche" ─────────────────────────────────────

// Carte-fiche : titre de section en haut, contenu aéré, pas de filet interne.
function FieldCard({ title, count, children }: { title?: string; count?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 26 }}>
      {title && (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "0 4px 10px" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.label, textTransform: "uppercase", letterSpacing: 1.6 }}>{title}</p>
          {count && <span style={{ fontSize: 12.5, fontWeight: 700, color: C.label }}>{count}</span>}
        </div>
      )}
      <div style={{ background: C.card, borderRadius: RADIUS, boxShadow: SHADOW, padding: "8px 20px 20px", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

// Un champ : label en petites capitales, valeur en gros noir. Optionnel : bouton copier / lien.
function Field({ label, value, mono = false, action }: {
  label: string; value: string; mono?: boolean; action?: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div style={{ padding: "14px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
          <p style={{
            margin: 0, fontSize: 17, fontWeight: 600, color: C.label, lineHeight: 1.5,
            whiteSpace: "pre-line", letterSpacing: mono ? 0.5 : -0.2,
            fontFamily: mono ? "ui-monospace,'SF Mono',monospace" : FONT,
            wordBreak: "break-word",
          }}>
            {value}
          </p>
        </div>
        {action && <div style={{ flexShrink: 0, paddingTop: 2 }}>{action}</div>}
      </div>
    </div>
  );
}

// Bouton copier compact, plein accent.
function CopyChip({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  const tr = useT();
  const accent = useAccent();
  return (
    <button onClick={() => { navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 2000); }}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "9px 15px", borderRadius: 999, border: "none", cursor: "pointer",
        fontSize: 13, fontWeight: 700, background: accent, color: "#fff",
        transition: "opacity 0.15s", opacity: done ? 0.65 : 1,
      }}>
      {done ? <Check size={13} /> : <Copy size={13} />}
      {done ? tr("copied") : tr("copy")}
    </button>
  );
}

// Ligne dépliable, sans pastille : titre + chevron, texte au-dessous.
function Disclosure({ title, content, last = false }: { title: string; content: string; last?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!content) return null;
  return (
    <div style={{ borderTop: last ? "none" : "none" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "15px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 15.5, fontWeight: 600, color: C.label, letterSpacing: -0.2 }}>{title}</span>
        <div style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
          <ChevronDown size={17} color={C.label} />
        </div>
      </button>
      {open && (
        <p style={{ margin: "0 0 14px", fontSize: 14.5, color: C.label, lineHeight: 1.7, whiteSpace: "pre-line", opacity: 0.85 }}>{content}</p>
      )}
    </div>
  );
}

// Séparateur "espace + trait très léger" entre les Disclosure d'une même carte.
function Div() {
  return <div style={{ height: 1, background: C.sep }} />;
}

// Grand nombre (horaires, heure de départ) présenté façon fiche.
function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: C.card, borderRadius: RADIUS, boxShadow: SHADOW, padding: "20px 20px 22px" }}>
      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
      <p style={{ margin: 0, fontFamily: SERIF, fontSize: 40, fontWeight: 600, color: C.label, letterSpacing: -1, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</p>
    </div>
  );
}

function WifiQR({ ssid, password, security }: { ssid: string; password: string; security?: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!ssid && !password) return;
    const escaped = (s: string) => s.replace(/[\\;,"]/g, c => `\\${c}`);
    const sec = security || "WPA";
    const wifiString = `WIFI:T:${sec};S:${escaped(ssid)};P:${escaped(password)};;`;
    import("qrcode").then(QRCode => {
      QRCode.toDataURL(wifiString, { width: 200, margin: 1, color: { dark: C.label, light: "#FFFFFF" } })
        .then(url => setDataUrl(url));
    });
  }, [ssid, password, security]);
  if (!dataUrl) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0 6px", gap: 10 }}>
      <img src={dataUrl} alt="QR Code WiFi" width={168} height={168} style={{ borderRadius: 16 }} />
      <p style={{ margin: 0, fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
        <QrCode size={13} color={C.muted} /> Scanner pour se connecter
      </p>
    </div>
  );
}

// ─── Header + menu hamburger ─────────────────────────────────────────────────

type CleanPage = "home" | "stay" | "area" | "services" | "safety" | "checkout";

function CleanHeader({ booklet, onOpenMenu }: { booklet: Booklet; onOpenMenu: () => void }) {
  return (
    <div style={{ position: "relative", padding: "16px 18px 4px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {booklet.propertyName || booklet.title}
        </p>
        <button onClick={onOpenMenu} aria-label="Menu"
          style={{ width: 44, height: 44, borderRadius: 999, border: "none", background: C.card, boxShadow: SHADOW, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <Menu size={19} color={C.label} />
        </button>
      </div>
    </div>
  );
}

function CleanMenu({ open, active, showServices, onSelect, onClose }: {
  open: boolean; active: CleanPage; showServices: boolean; onSelect: (p: CleanPage) => void; onClose: () => void;
}) {
  const tr = useT();
  const items: { id: CleanPage; label: string }[] = [
    { id: "home",     label: tr("nav_home") },
    { id: "stay",     label: tr("nav_stay") },
    { id: "area",     label: tr("nav_area") },
    ...(showServices ? [{ id: "services" as CleanPage, label: tr("addons_title") }] : []),
    { id: "safety",   label: tr("nav_safety") },
    { id: "checkout", label: tr("nav_checkout") },
  ];
  const accent = useAccent();
  if (!open) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 400, background: haloBackground(accent), display: "flex", flexDirection: "column", fontFamily: FONT }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "18px 18px 0", flexShrink: 0 }}>
        <button onClick={onClose} aria-label="Fermer"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 999, border: `1px solid ${C.label}`, background: "transparent", color: C.label, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Fermer <X size={16} />
        </button>
      </div>
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 26px", gap: items.length > 5 ? 2 : 6, overflowY: "auto" }}>
        {items.map(it => (
          <button key={it.id} onClick={() => { onSelect(it.id); onClose(); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: items.length > 5 ? "12px 4px" : "15px 4px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
              fontFamily: SERIF, fontSize: items.length > 5 ? 32 : 36, fontWeight: 600, letterSpacing: -0.4,
              color: active === it.id ? C.label : C.muted,
            }}>
            {it.label}
            {active === it.id && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.label, flexShrink: 0 }} />}
          </button>
        ))}
      </nav>
      <div style={{ padding: "0 26px max(26px, env(safe-area-inset-bottom))", flexShrink: 0 }} />
    </div>
  );
}

function BunklyCredit({ ownerPlan }: { ownerPlan?: Plan }) {
  const tr = useT();
  if (ownerPlan === "pro" || ownerPlan === "agency") return null;
  return (
    <div style={{ textAlign: "center", padding: "28px 16px 16px" }}>
      <a href="https://bunkly.co" target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 11, color: C.muted, textDecoration: "none", fontWeight: 500, letterSpacing: 0.3 }}>
        {tr("created_with").replace("Bunkly.co", "")}
        <span style={{ fontWeight: 700, color: C.sub }}>Bunkly.co</span>
      </a>
    </div>
  );
}

// Rend une liste de {key,label} en Disclosure, séparés par un trait léger.
function DisclosureList({ mod, rows }: { mod: BookletModule | undefined; rows: { key: string; label: string }[] }) {
  const present = rows.filter(r => mod && g(mod, r.key));
  return (
    <>
      {present.map((r, i) => (
        <div key={r.key}>
          <Disclosure title={r.label} content={g(mod, r.key)} last={i === present.length - 1} />
          {i < present.length - 1 && <Div />}
        </div>
      ))}
    </>
  );
}

// Module optionnel : ne rend rien si le module est absent/désactivé ou n'a aucun champ rempli.
function OptionalCard({ mod, title, rows }: {
  mod: BookletModule | undefined; title: string; rows: { key: string; label: string }[];
}) {
  if (!mod || !rows.some(r => g(mod, r.key))) return null;
  return (
    <FieldCard title={title}>
      <DisclosureList mod={mod} rows={rows} />
    </FieldCard>
  );
}

// ─── PAGE ACCUEIL ─────────────────────────────────────────────────────────────

function PageHome({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const tr = useT();
  const arrival       = useMod(booklet, "arrival");
  const accommodation = useMod(booklet, "accommodation");
  const contact       = useMod(booklet, "contact");
  const checkout      = useMod(booklet, "checkout");

  const checkinTime  = g(arrival, "checkin_time");
  const checkoutTime = g(arrival, "checkout_time") || g(checkout, "checkout_time");
  const accessCode   = g(arrival, "access_code");
  const keyLocation  = g(arrival, "key_location");
  const parking      = g(arrival, "parking");
  const wifiName     = g(accommodation, "wifi_name");
  const wifiPass     = g(accommodation, "wifi_password");
  const wifiSecurity = g(accommodation, "wifi_security");
  const wifiInfo     = g(accommodation, "wifi_info");
  const welcomeMsg   = g(arrival, "welcome_message") || g(contact, "welcome_message");
  const hostName     = g(contact, "host_name");
  const hostPhoto    = g(contact, "host_photo");

  return (
    <div style={{ padding: "12px 18px 40px" }}>

      <PageTitle sub={tr("nav_home")}>{booklet.propertyName || booklet.title}</PageTitle>

      <CleanAddonsBanner />

      {booklet.coverImage && (
        <div style={{ borderRadius: RADIUS, overflow: "hidden", boxShadow: SHADOW, marginBottom: 22, height: 210 }}>
          <img src={booklet.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}

      {booklet.address && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "0 4px 26px" }}>
          <MapPin size={14} color={C.label} />
          <p style={{ margin: 0, fontSize: 13.5, color: C.label, fontWeight: 500 }}>{booklet.address}</p>
        </div>
      )}

      {(welcomeMsg || hostName) && (
        <div style={{ marginBottom: 26 }}>
          <div style={{ background: C.card, borderRadius: RADIUS, boxShadow: SHADOW, padding: "22px" }}>
            {(hostPhoto || hostName) && (
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: welcomeMsg ? 16 : 0 }}>
                {hostPhoto
                  ? <img src={hostPhoto} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Users size={22} color={accent} />
                    </div>}
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 3 }}>{tr("your_host")}</p>
                  <p style={{ margin: 0, fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: C.label, letterSpacing: -0.3 }}>{hostName}</p>
                </div>
              </div>
            )}
            {welcomeMsg && (
              <p style={{ margin: 0, fontSize: 14.5, color: C.label, lineHeight: 1.75, opacity: 0.85 }}>{welcomeMsg}</p>
            )}
          </div>
        </div>
      )}

      {(checkinTime || checkoutTime) && (
        <div style={{ marginBottom: 26 }}>
          <p style={{ margin: "0 4px 10px", fontSize: 12, fontWeight: 700, color: C.label, textTransform: "uppercase", letterSpacing: 1.6 }}>{tr("schedule")}</p>
          <div style={{ display: "grid", gridTemplateColumns: checkinTime && checkoutTime ? "1fr 1fr" : "1fr", gap: 12 }}>
            {checkinTime && <StatBlock label={tr("checkin")} value={formatTime(checkinTime)} />}
            {checkoutTime && <StatBlock label={tr("checkout")} value={formatTime(checkoutTime)} />}
          </div>
        </div>
      )}

      {accessCode && (
        <FieldCard title={tr("access_code")}>
          <div style={{ padding: "16px 0 6px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 7 }}>
              {accessCode.split("").map((char, i) => (
                <div key={i} style={{
                  minWidth: 40, height: 50, padding: "0 4px", borderRadius: 14,
                  background: `${accent}12`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: C.label,
                }}>{char}</div>
              ))}
            </div>
            <CopyChip value={accessCode} />
          </div>
        </FieldCard>
      )}

      {(keyLocation || parking) && (
        <FieldCard title={tr("access_keys")}>
          <Field label={tr("key_location")} value={keyLocation} />
          {keyLocation && parking && <Div />}
          <Field label={tr("parking")} value={parking} />
        </FieldCard>
      )}

      {(wifiName || wifiPass) && (
        <FieldCard title={tr("wifi")}>
          <Field label={tr("network")} value={wifiName} action={wifiName ? <CopyChip value={wifiName} /> : undefined} />
          {wifiName && wifiPass && <Div />}
          <Field label={tr("password")} value={wifiPass} mono action={wifiPass ? <CopyChip value={wifiPass} /> : undefined} />
          <WifiQR ssid={wifiName} password={wifiPass} security={wifiSecurity} />
          {wifiInfo && (
            <>
              <Div />
              <p style={{ margin: "14px 0 0", fontSize: 13.5, color: C.label, lineHeight: 1.65, opacity: 0.8, whiteSpace: "pre-line" }}>{wifiInfo}</p>
            </>
          )}
        </FieldCard>
      )}

      {booklet.address && (
        <div style={{ marginBottom: 26 }}>
          <p style={{ margin: "0 4px 10px", fontSize: 12, fontWeight: 700, color: C.label, textTransform: "uppercase", letterSpacing: 1.6 }}>{tr("location")}</p>
          <div style={{ borderRadius: RADIUS, overflow: "hidden", boxShadow: SHADOW, background: C.card }}>
            <div style={{ height: 170, overflow: "hidden" }}>
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(geocodableAddress(booklet.address))}&output=embed&z=15`}
                width="100%" height="170" style={{ border: 0, display: "block" }}
                loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Carte" />
            </div>
            <div style={{ padding: "14px 16px", display: "flex", gap: 10 }}>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(geocodableAddress(booklet.address))}`}
                target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 0", borderRadius: 14, background: C.label, textDecoration: "none", color: "#fff", fontSize: 13, fontWeight: 700 }}>
                <Navigation size={14} color="#fff" /> {tr("google_maps")}
              </a>
              <a href={`https://waze.com/ul?q=${encodeURIComponent(geocodableAddress(booklet.address))}&navigate=yes`}
                target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 0", borderRadius: 14, background: "transparent", border: `1.5px solid ${C.line}`, textDecoration: "none", color: C.label, fontSize: 13, fontWeight: 700 }}>
                <Navigation size={14} color={C.label} /> {tr("waze")}
              </a>
            </div>
          </div>
        </div>
      )}

      <BunklyCredit ownerPlan={booklet.ownerPlan} />
    </div>
  );
}

// ─── PAGE SÉJOUR ──────────────────────────────────────────────────────────────

function PageStay({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const tr = useT();
  const arrival       = useMod(booklet, "arrival");
  const accommodation = useMod(booklet, "accommodation");
  const rules         = useMod(booklet, "rules");
  const kitchen       = useMod(booklet, "kitchen");

  const steps = g(arrival, "checkin_process").split("\n").filter(Boolean);
  const [checkinDone, setCheckinDone] = useState<Record<number, boolean>>({});
  const checkinCount = Object.values(checkinDone).filter(Boolean).length;

  const equipRows = [
    { key: "heating",      label: tr("heating") },
    { key: "ac",           label: tr("ac") },
    { key: "appliances",   label: tr("appliances") },
    { key: "tv",           label: tr("tv") },
    { key: "checkin_code", label: tr("mailbox") },
    { key: "other",        label: tr("other") },
  ];
  const ruleRows = [
    { key: "max_guests", label: tr("persons") },
    { key: "smoking",    label: tr("smoking") },
    { key: "pets",       label: tr("pets") },
    { key: "noise",      label: tr("noise") },
    { key: "parties",    label: tr("parties") },
    { key: "other",      label: tr("other") },
  ];
  const kitchenRows = [
    { key: "equipment",         label: tr("kitchen_equip") },
    { key: "trash",             label: tr("waste") },
    { key: "linen",             label: tr("linen") },
    { key: "cleaning",          label: tr("cleaning") },
    { key: "checkout_cleaning", label: tr("checkout_cleaning") },
  ];

  const hasEquip = equipRows.some(r => accommodation && g(accommodation, r.key));
  const hasRules = ruleRows.some(r => rules && g(rules, r.key));
  const hasKitchen = kitchenRows.some(r => kitchen && g(kitchen, r.key));

  // Modules optionnels rattachés au séjour
  const baby          = useMod(booklet, "baby");
  const petsModule    = useMod(booklet, "pets");
  const pool          = useMod(booklet, "pool");
  const coworking     = useMod(booklet, "coworking");
  const accessibility = useMod(booklet, "accessibility");
  const practical     = useMod(booklet, "practical");
  const eco           = useMod(booklet, "eco");

  return (
    <div style={{ padding: "12px 18px 40px" }}>

      <PageTitle>{tr("nav_stay")}</PageTitle>

      {steps.length > 0 && (
        <FieldCard title={tr("checkin_process")} count={`${checkinCount}/${steps.length}`}>
          <div style={{ paddingTop: 6 }}>
            {steps.map((step, i) => (
              <button key={i} onClick={() => setCheckinDone(p => ({ ...p, [i]: !p[i] }))}
                style={{ width: "100%", display: "flex", gap: 14, padding: "13px 0", alignItems: "center", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: checkinDone[i] ? accent : "transparent",
                  border: `2px solid ${checkinDone[i] ? accent : C.line}`,
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                }}>
                  {checkinDone[i]
                    ? <Check size={13} color="#fff" strokeWidth={3} />
                    : <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{i + 1}</span>}
                </div>
                <span style={{ fontSize: 15, color: checkinDone[i] ? C.muted : C.label, textDecoration: checkinDone[i] ? "line-through" : "none", flex: 1, lineHeight: 1.5 }}>{step}</span>
              </button>
            ))}
          </div>
        </FieldCard>
      )}

      {hasEquip && (
        <FieldCard title={tr("accommodation")}>
          <DisclosureList mod={accommodation} rows={equipRows} />
        </FieldCard>
      )}

      {hasRules && (
        <FieldCard title={tr("rules")}>
          <DisclosureList mod={rules} rows={ruleRows} />
        </FieldCard>
      )}

      {hasKitchen && (
        <FieldCard title={tr("kitchen")}>
          <DisclosureList mod={kitchen} rows={kitchenRows} />
        </FieldCard>
      )}

      <OptionalCard mod={pool} title={tr("pool")} rows={[
        { key: "hours",       label: tr("schedule") },
        { key: "rules",       label: tr("pool_rules") },
        { key: "equipment",   label: tr("pool_equip") },
        { key: "maintenance", label: tr("pool_maintenance") },
      ]} />

      <OptionalCard mod={baby} title={tr("baby")} rows={[
        { key: "available", label: tr("baby_equip") },
        { key: "safety",    label: tr("baby_safety") },
        { key: "rental",    label: tr("baby_rental") },
      ]} />

      <OptionalCard mod={petsModule} title={tr("pets")} rows={[
        { key: "rules",  label: tr("pets_rules") },
        { key: "zones",  label: tr("pets_zones") },
        { key: "nearby", label: tr("pets_places") },
      ]} />

      <OptionalCard mod={coworking} title={tr("coworking")} rows={[
        { key: "desk",     label: tr("workspace") },
        { key: "wifi_pro", label: tr("wifi_dedicated") },
        { key: "screens",  label: tr("screens") },
        { key: "printing", label: tr("printing") },
      ]} />

      <OptionalCard mod={accessibility} title={tr("accessibility")} rows={[
        { key: "access",    label: tr("access") },
        { key: "elevator",  label: tr("elevator") },
        { key: "bathroom",  label: tr("bathroom") },
        { key: "equipment", label: tr("pmr_equip") },
      ]} />

      <OptionalCard mod={practical} title={tr("practical")} rows={[
        { key: "pharmacy",    label: tr("pharmacy") },
        { key: "doctor",      label: tr("doctor") },
        { key: "supermarket", label: tr("supermarket") },
        { key: "laundry",     label: tr("laundry") },
        { key: "city_hall",   label: tr("city_hall") },
      ]} />

      <OptionalCard mod={eco} title={tr("eco")} rows={[
        { key: "sorting", label: tr("waste") },
        { key: "energy",  label: tr("energy") },
        { key: "water",   label: tr("water") },
        { key: "other",   label: tr("green") },
      ]} />

      <BunklyCredit ownerPlan={booklet.ownerPlan} />
    </div>
  );
}

// ─── Marées & Météo (fiche) ─────────────────────────────────────────────────

function CleanTides({ portId, portName, note }: { portId: string; portName: string; note: string }) {
  const tr = useT();
  const [data, setData] = useState<{ tides: { type: string; time: string; height: string; coef?: string }[]; date: string } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!portId) return;
    fetch(`/api/tides?portId=${portId}`).then(r => r.ok ? r.json() : Promise.reject()).then(setData).catch(() => setError(true));
  }, [portId]);
  const wrap = (children: React.ReactNode) => (
    <div style={{ background: C.card, borderRadius: RADIUS, boxShadow: SHADOW, padding: "8px 20px 18px" }}>{children}</div>
  );
  if (error) return wrap(<p style={{ margin: "12px 0", fontSize: 14, color: C.label, opacity: 0.7 }}>—</p>);
  if (!data) return wrap(<p style={{ margin: "12px 0", fontSize: 14, color: C.label, opacity: 0.7 }}>…</p>);
  return wrap(
    <>
      <p style={{ margin: "12px 0 4px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>
        {tr("tides_port")} · {portName || portId}
      </p>
      <p style={{ margin: "0 0 6px", fontSize: 12, color: C.label, opacity: 0.6 }}>{data.date}</p>
      {data.tides.map((t, i) => (
        <div key={i}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0" }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>
                {t.type === "PM" ? tr("tides_high") : tr("tides_low")}{t.coef ? ` · ${tr("tides_coef")} ${t.coef}` : ""}
              </p>
              <p style={{ margin: 0, fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: C.label, letterSpacing: -0.5 }}>{t.time}</p>
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.label, opacity: 0.7 }}>{t.height}</p>
          </div>
          {i < data.tides.length - 1 && <Div />}
        </div>
      ))}
      {note && <><Div /><p style={{ margin: "14px 0 0", fontSize: 13.5, color: C.label, opacity: 0.8, lineHeight: 1.6, whiteSpace: "pre-line" }}>{note}</p></>}
    </>
  );
}

function CleanWeather({ address, cityOverride, note }: { address: string; cityOverride: string; note: string }) {
  const tr = useT();
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
    fetch(`/api/weather?${params}`).then(r => r.ok ? r.json() : Promise.reject()).then(setData).catch(() => setError(true));
  }, [address, cityOverride]);
  const wrap = (children: React.ReactNode) => (
    <div style={{ background: C.card, borderRadius: RADIUS, boxShadow: SHADOW, padding: "8px 20px 18px" }}>{children}</div>
  );
  if (!address && !cityOverride) return null;
  if (error) return wrap(<p style={{ margin: "12px 0", fontSize: 14, color: C.label, opacity: 0.7 }}>—</p>);
  if (!data) return wrap(<p style={{ margin: "12px 0", fontSize: 14, color: C.label, opacity: 0.7 }}>{tr("weather_loading")}</p>);
  return wrap(
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0 14px" }}>
        <p style={{ margin: 0, fontSize: 44, lineHeight: 1 }}>{data.emoji}</p>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontFamily: SERIF, fontSize: 34, fontWeight: 600, color: C.label, letterSpacing: -1 }}>{data.temperature}°</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: C.label, opacity: 0.75 }}>{data.description} · {data.city}</p>
        </div>
        <div style={{ textAlign: "right", fontSize: 11.5, color: C.label, opacity: 0.6, lineHeight: 1.7 }}>
          <div>{tr("weather_feels")} {data.feelsLike}°</div>
          <div>{tr("weather_wind")} {data.windSpeed} km/h</div>
          <div>{tr("weather_humidity")} {data.humidity}%</div>
        </div>
      </div>
      <Div />
      {data.forecast.map((day, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < data.forecast.length - 1 ? `1px solid ${C.sep}` : "none" }}>
          <span style={{ width: 34, fontSize: 13, fontWeight: 700, color: C.label }}>{day.dayLabel}</span>
          <span style={{ fontSize: 18 }}>{day.emoji}</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C.label }}>{day.tempMax}° <span style={{ opacity: 0.5, fontWeight: 500 }}>{day.tempMin}°</span></span>
          {day.precipProbability > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: C.label, opacity: 0.7 }}>{day.precipProbability}%</span>}
        </div>
      ))}
      {note && <p style={{ margin: "14px 0 0", fontSize: 13.5, color: C.label, opacity: 0.8, lineHeight: 1.6, whiteSpace: "pre-line" }}>{note}</p>}
    </>
  );
}

// ─── Carte activité ───────────────────────────────────────────────────────────

function ActivityCard({ act }: { act: Activity }) {
  const tr = useT();
  const catLabel: Record<string, string> = {
    restaurant: tr("cat_restaurant"), activity: tr("cat_activity"), shop: tr("cat_shop"),
    transport: tr("transport"), other: tr("places"),
  };
  return (
    <div style={{ background: C.card, borderRadius: RADIUS, overflow: "hidden", boxShadow: SHADOW, display: "flex", flexDirection: "column" }}>
      {act.photo && (
        <div style={{ height: 150, backgroundImage: `url(${act.photo})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      )}
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>{catLabel[act.category]}</span>
          {act.recommended && <Star size={11} color={C.label} fill={C.label} />}
        </div>
        <p style={{ margin: "0 0 6px", fontFamily: SERIF, fontSize: 19, fontWeight: 600, color: C.label, letterSpacing: -0.3 }}>{act.name}</p>
        {act.description && (
          <p style={{ margin: "0 0 12px", fontSize: 13.5, color: C.label, opacity: 0.8, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{act.description}</p>
        )}
        {(act.distance || act.openHours || act.priceRange) && (
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            {act.distance   && <span style={{ fontSize: 11.5, color: C.label, opacity: 0.8, display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} />{act.distance}</span>}
            {act.openHours  && <span style={{ fontSize: 11.5, color: C.label, opacity: 0.8, display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} />{act.openHours}</span>}
            {act.priceRange && <span style={{ fontSize: 11.5, color: C.label, fontWeight: 700 }}>{act.priceRange}</span>}
          </div>
        )}
        {(act.phone || act.address || act.website) && (
          <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
            {act.phone && (
              <a href={`tel:${act.phone}`} style={{ flex: 1, padding: "9px 0", borderRadius: 12, border: `1.5px solid ${C.line}`, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Phone size={15} color={C.label} />
              </a>
            )}
            {act.address && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.address)}`} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: "9px 0", borderRadius: 12, border: `1.5px solid ${C.line}`, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Navigation size={15} color={C.label} />
              </a>
            )}
            {act.website && (
              <a href={act.website} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: "9px 0", borderRadius: 12, border: `1.5px solid ${C.line}`, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Globe size={15} color={C.label} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAGE DÉCOUVRIR ───────────────────────────────────────────────────────────

function PageArea({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const tr = useT();
  const neighborhood = useMod(booklet, "neighborhood");
  const transport    = useMod(booklet, "transport");
  const experiences  = useMod(booklet, "experiences");
  const tidesMod     = useMod(booklet, "tides");
  const weatherMod   = useMod(booklet, "weather");

  const activities = parseActivities(g(neighborhood, "activities_list"));
  const places     = neighborhood ? parsePlaces(g(neighborhood, "places")) : [];
  const mapAddress = encodeURIComponent(geocodableAddress(booklet.address || "") || booklet.propertyName || "");
  const [activeFilter, setActiveFilter] = useState("all");

  const CATS = [
    { id: "all",        label: tr("all") },
    { id: "restaurant", label: tr("restaurant") },
    { id: "activity",   label: tr("activities") },
    { id: "shop",       label: tr("shops") },
    { id: "transport",  label: tr("transport") },
    { id: "other",      label: tr("other") },
  ];
  const presentCats = new Set(activities.map(a => a.category));
  const visibleCats = CATS.filter(c => c.id === "all" || presentCats.has(c.id as Activity["category"]));
  const filtered = activeFilter === "all" ? activities : activities.filter(a => a.category === activeFilter);

  const transportRows = [
    { key: "public",  label: tr("public_transport") },
    { key: "taxi",    label: tr("taxi") },
    { key: "bike",    label: tr("bikes") },
    { key: "airport", label: tr("airport") },
  ];
  const hasTransportRows = transportRows.some(r => transport && g(transport, r.key));

  return (
    <div style={{ padding: "12px 18px 40px" }}>

      <PageTitle>{tr("nav_area")}</PageTitle>

      {activities.length > 0 && (
        <div style={{ marginBottom: 26 }}>
          <p style={{ margin: "0 4px 10px", fontSize: 12, fontWeight: 700, color: C.label, textTransform: "uppercase", letterSpacing: 1.6 }}>{tr("discover")}</p>
          {visibleCats.length > 2 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", marginBottom: 14, touchAction: "pan-x" }}>
              {visibleCats.map(cat => {
                const isActive = activeFilter === cat.id;
                return (
                  <button key={cat.id} onClick={() => setActiveFilter(cat.id)}
                    style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 999, border: `1.5px solid ${isActive ? C.label : C.line}`, cursor: "pointer", fontSize: 13, fontWeight: isActive ? 700 : 500, background: isActive ? C.label : "transparent", color: isActive ? "#fff" : C.label }}>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((act, i) => <ActivityCard key={i} act={act} />)}
          </div>
        </div>
      )}

      {places.length > 0 && (
        <FieldCard title={tr("addresses")}>
          {places.map((p, i) => (
            <div key={i}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 0" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15.5, fontWeight: 600, color: C.label, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                  {p.address && <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.label, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.address}</p>}
                </div>
                {p.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer"
                    style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 12, border: `1.5px solid ${C.line}`, textDecoration: "none" }}>
                    <Navigation size={15} color={C.label} />
                  </a>
                )}
              </div>
              {i < places.length - 1 && <Div />}
            </div>
          ))}
        </FieldCard>
      )}

      {g(neighborhood, "hidden_gems") && (
        <div style={{ marginBottom: 26 }}>
          <p style={{ margin: "0 4px 10px", fontSize: 12, fontWeight: 700, color: C.label, textTransform: "uppercase", letterSpacing: 1.6 }}>{tr("host_picks")}</p>
          <div style={{ background: C.card, borderRadius: RADIUS, boxShadow: SHADOW, padding: "20px", display: "flex", gap: 14 }}>
            <Star size={18} color={accent} fill={accent} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 14.5, color: C.label, lineHeight: 1.7, opacity: 0.9 }}>{g(neighborhood, "hidden_gems")}</p>
          </div>
        </div>
      )}

      {(g(neighborhood, "transport") || hasTransportRows) && (
        <FieldCard title={tr("transport")}>
          {g(neighborhood, "transport") && (
            <>
              <p style={{ margin: "14px 0", fontSize: 14.5, color: C.label, lineHeight: 1.7, opacity: 0.9, whiteSpace: "pre-line" }}>{g(neighborhood, "transport")}</p>
              {hasTransportRows && <Div />}
            </>
          )}
          <DisclosureList mod={transport} rows={transportRows} />
        </FieldCard>
      )}

      <OptionalCard mod={experiences} title={tr("experiences")} rows={[
        { key: "hidden_gems", label: tr("favorites") },
        { key: "activities",  label: tr("recommended") },
        { key: "events",      label: tr("local_events") },
      ]} />


      {tidesMod && g(tidesMod, "port_id") && (
        <div style={{ marginBottom: 26 }}>
          <p style={{ margin: "0 4px 10px", fontSize: 12, fontWeight: 700, color: C.label, textTransform: "uppercase", letterSpacing: 1.6 }}>{tr("tides")}</p>
          <CleanTides portId={g(tidesMod, "port_id")} portName={g(tidesMod, "port_name")} note={g(tidesMod, "note")} />
        </div>
      )}

      {weatherMod && (
        <div style={{ marginBottom: 26 }}>
          <p style={{ margin: "0 4px 10px", fontSize: 12, fontWeight: 700, color: C.label, textTransform: "uppercase", letterSpacing: 1.6 }}>{tr("weather")}</p>
          <CleanWeather address={geocodableAddress(booklet.address ?? "")} cityOverride={g(weatherMod, "city_override")} note={g(weatherMod, "note")} />
        </div>
      )}

      {mapAddress && (
        <div style={{ marginBottom: 26 }}>
          <p style={{ margin: "0 4px 10px", fontSize: 12, fontWeight: 700, color: C.label, textTransform: "uppercase", letterSpacing: 1.6 }}>{tr("map")}</p>
          <div style={{ borderRadius: RADIUS, overflow: "hidden", boxShadow: SHADOW }}>
            <iframe src={`https://maps.google.com/maps?q=${mapAddress}&output=embed&z=15`}
              width="100%" height="190" style={{ border: 0, display: "block" }}
              loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Carte" />
          </div>
        </div>
      )}

      <BunklyCredit ownerPlan={booklet.ownerPlan} />
    </div>
  );
}

// ─── PAGE SÉCURITÉ ────────────────────────────────────────────────────────────

function PageSafety({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const tr = useT();
  const safety  = useMod(booklet, "safety");
  const contact = useMod(booklet, "contact");

  const safetyRows = [
    { key: "fire_extinguisher", label: tr("fire_extinguisher") },
    { key: "circuit_breaker",   label: tr("circuit_breaker") },
    { key: "water_shutoff",     label: tr("water_shutoff") },
    { key: "hospital",          label: tr("hospital") },
  ];
  const hasSafetyRows = safetyRows.some(r => safety && g(safety, r.key));

  return (
    <div style={{ padding: "12px 18px 40px" }}>

      <PageTitle>{tr("nav_safety")}</PageTitle>

      {safety && g(safety, "emergency") && (
        <div style={{ marginBottom: 26 }}>
          <div style={{ background: C.card, borderRadius: RADIUS, boxShadow: `0 0 0 2px ${accent}, ${SHADOW}`, padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Phone size={18} color={accent} />
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.label, textTransform: "uppercase", letterSpacing: 1 }}>{tr("emergency_numbers")}</p>
            </div>
            <p style={{ margin: 0, fontSize: 16, color: C.label, lineHeight: 1.95, whiteSpace: "pre-line", fontWeight: 500 }}>{g(safety, "emergency")}</p>
          </div>
        </div>
      )}

      {contact && (g(contact, "host_name") || g(contact, "host_phone")) && (
        <div style={{ marginBottom: 26 }}>
          <p style={{ margin: "0 4px 10px", fontSize: 12, fontWeight: 700, color: C.label, textTransform: "uppercase", letterSpacing: 1.6 }}>{tr("your_host")}</p>
          <div style={{ background: C.card, borderRadius: RADIUS, boxShadow: SHADOW, padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: g(contact, "about") ? 16 : 18 }}>
              {g(contact, "host_photo")
                ? <img src={g(contact, "host_photo")} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                : <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={22} color={accent} />
                  </div>}
              <div>
                <p style={{ margin: 0, fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.label, letterSpacing: -0.3 }}>{g(contact, "host_name") || tr("your_host")}</p>
                {g(contact, "response_time") && <p style={{ margin: "3px 0 0", fontSize: 13, color: C.label, opacity: 0.7 }}>{g(contact, "response_time")}</p>}
              </div>
            </div>
            {g(contact, "about") && (
              <p style={{ margin: "0 0 18px", fontSize: 14.5, color: C.label, lineHeight: 1.7, opacity: 0.85 }}>{g(contact, "about")}</p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              {g(contact, "host_phone") && (
                <a href={`tel:${g(contact, "host_phone")}`}
                  style={{ flex: 1, padding: "13px 0", textAlign: "center", background: C.label, color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  <Phone size={15} color="#fff" /> {tr("call")}
                </a>
              )}
              {g(contact, "host_email") && (
                <a href={`mailto:${g(contact, "host_email")}`}
                  style={{ flex: 1, padding: "13px 0", textAlign: "center", background: "transparent", border: `1.5px solid ${C.line}`, color: C.label, fontSize: 14, fontWeight: 700, textDecoration: "none", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  <Mail size={15} color={C.label} /> {tr("email")}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {hasSafetyRows && (
        <FieldCard title={tr("security")}>
          <DisclosureList mod={safety} rows={safetyRows} />
        </FieldCard>
      )}

      {contact && (g(contact, "concierge") || g(contact, "maintenance")) && (
        <FieldCard title={tr("services")}>
          <DisclosureList mod={contact} rows={[
            { key: "concierge", label: tr("concierge") },
            { key: "maintenance", label: tr("maintenance") },
          ]} />
        </FieldCard>
      )}

      <BunklyCredit ownerPlan={booklet.ownerPlan} />
    </div>
  );
}

// ─── Services payants (add-ons) ──────────────────────────────────────────────

function QtyStepper({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 0" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.label }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 4, border: `1.5px solid ${C.line}`, borderRadius: 999, padding: "3px" }}>
        <button onClick={() => onChange(Math.max(min, value - 1))}
          style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Minus size={14} color={C.label} />
        </button>
        <span style={{ minWidth: 24, textAlign: "center", fontSize: 15, fontWeight: 700, color: C.label }}>{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))}
          style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Plus size={14} color={C.label} />
        </button>
      </div>
    </div>
  );
}

function ChoicePicker({ choices, quantities, onChange }: {
  choices: ServiceChoiceItem[]; quantities: Record<string, number>; onChange: (id: string, q: number) => void;
}) {
  return (
    <div>
      {choices.map((c, i) => {
        const qty = quantities[c.id] ?? 0;
        return (
          <div key={c.id}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 0" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.label }}>{c.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.label, opacity: 0.7 }}>{fmtAddonPrice(c.amount)}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, border: `1.5px solid ${C.line}`, borderRadius: 999, padding: "3px", flexShrink: 0 }}>
                <button onClick={() => onChange(c.id, Math.max(0, qty - 1))}
                  style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Minus size={14} color={C.label} />
                </button>
                <span style={{ minWidth: 24, textAlign: "center", fontSize: 15, fontWeight: 700, color: C.label }}>{qty}</span>
                <button onClick={() => onChange(c.id, Math.min(c.maxQuantity, qty + 1))}
                  style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Plus size={14} color={C.label} />
                </button>
              </div>
            </div>
            {i < choices.length - 1 && <Div />}
          </div>
        );
      })}
    </div>
  );
}

function CleanAddonsBanner() {
  const tr = useT();
  const accent = useAccent();
  const { purchase, status } = useAddonPurchaseConfirmation();
  if (!purchase) return null;
  const isSuccess = purchase === "success";
  const processing = isSuccess && status?.status === "processing";
  return (
    <div style={{ marginBottom: 22, borderRadius: RADIUS, padding: "16px 20px", background: C.card, boxShadow: `0 0 0 2px ${isSuccess ? accent : C.line}, ${SHADOW}` }}>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.label }}>
        {isSuccess ? (processing ? tr("addons_processing") : tr("addons_success_title")) : tr("addons_cancel_title")}
      </p>
      {isSuccess && !processing && (
        <p style={{ margin: "5px 0 0", fontSize: 13.5, color: C.label, opacity: 0.75, lineHeight: 1.5 }}>
          {tr("addons_success_body")}
          {status?.serviceName ? ` (${status.serviceName}${status.amountTotal ? ` · ${fmtAddonPrice(status.amountTotal)}` : ""})` : ""}
        </p>
      )}
    </div>
  );
}

function PageServices({ booklet }: { booklet: Booklet }) {
  const tr = useT();
  const accent = useAccent();
  const { services, purchasable } = useAddonServices(booklet);
  const { buy, purchasing } = useAddonPurchase(booklet.id);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [choiceQuantities, setChoiceQuantities] = useState<Record<string, Record<string, number>>>({});

  const getQty = (s: BookletService) => quantities[s.id] ?? (s.priceType === "per_unit" ? (s.unitMin ?? 1) : 1);
  const setQty = (s: BookletService, q: number) => setQuantities(p => ({ ...p, [s.id]: q }));
  const getChoiceQuantities = (s: BookletService) => choiceQuantities[s.id] ?? {};
  const setChoiceQuantity = (s: BookletService, choiceId: string, q: number) =>
    setChoiceQuantities(p => ({ ...p, [s.id]: { ...getChoiceQuantities(s), [choiceId]: q } }));

  return (
    <div style={{ padding: "12px 18px 40px" }}>

      <PageTitle>{tr("addons_title")}</PageTitle>

      <CleanAddonsBanner />

      {(!purchasable || services.length === 0) ? (
        <div style={{ background: C.card, borderRadius: RADIUS, boxShadow: SHADOW, padding: "28px 22px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 14.5, color: C.label, opacity: 0.7 }}>—</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {services.map(s => {
            const selection = { quantity: getQty(s), choiceQuantities: getChoiceQuantities(s) };
            const { totalAmount } = computeServiceTotal(s, selection);
            const canBuy = s.priceType !== "choice" || totalAmount > 0;
            const priceLine = s.priceType === "choice"
              ? `${tr("addons_total")} : ${fmtAddonPrice(totalAmount)}`
              : `${fmtAddonPrice(s.amount)}${s.priceType === "per_day" ? ` ${tr("addons_per_day")}` : s.priceType === "per_unit" ? ` / ${s.unitLabel || tr("addons_quantity")}` : ""}`;
            return (
              <div key={s.id} style={{ background: C.card, borderRadius: RADIUS, boxShadow: SHADOW, overflow: "hidden" }}>
                {s.image && <img src={s.image} alt="" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />}
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {!s.image && (
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>
                        {s.emoji || "✨"}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: SERIF, fontSize: 19, fontWeight: 600, color: C.label, letterSpacing: -0.3 }}>{s.name}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 700, color: C.label }}>{priceLine}</p>
                    </div>
                  </div>

                  {s.description && (
                    <p style={{ margin: "12px 0 0", fontSize: 13.5, color: C.label, opacity: 0.8, lineHeight: 1.6 }}>{s.description}</p>
                  )}

                  {s.priceType === "per_day" && (
                    <><Div /><QtyStepper label={tr("addons_quantity")} min={1} max={9999} value={getQty(s)} onChange={v => setQty(s, v)} /></>
                  )}
                  {s.priceType === "per_unit" && (
                    <><Div /><QtyStepper label={s.unitLabel || tr("addons_quantity")} min={s.unitMin ?? 1} max={s.unitMax ?? 9999} value={getQty(s)} onChange={v => setQty(s, v)} /></>
                  )}
                  {s.priceType === "choice" && s.choices && (
                    <><Div /><ChoicePicker choices={s.choices} quantities={getChoiceQuantities(s)} onChange={(id, q) => setChoiceQuantity(s, id, q)} /></>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.label }}>
                      {tr("addons_total")} : {fmtAddonPrice(totalAmount)}
                    </p>
                    <button
                      onClick={() => buy(s.id, selection)}
                      disabled={!!purchasing || !canBuy}
                      style={{
                        padding: "12px 22px", borderRadius: 999, border: "none",
                        cursor: purchasing || !canBuy ? "default" : "pointer",
                        fontSize: 14, fontWeight: 700, background: accent, color: "#fff",
                        opacity: (purchasing && purchasing !== s.id) || !canBuy ? 0.5 : 1,
                      }}>
                      {purchasing === s.id ? tr("addons_buying") : tr("addons_buy")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BunklyCredit ownerPlan={booklet.ownerPlan} />
    </div>
  );
}

// ─── PAGE DÉPART ──────────────────────────────────────────────────────────────

function PageCheckout({ booklet, accent }: { booklet: Booklet; accent: string }) {
  const tr = useT();
  const checkout = useMod(booklet, "checkout");
  const tasks    = g(checkout, "process").split("\n").filter(Boolean);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ padding: "12px 18px 40px" }}>

      <PageTitle>{tr("nav_checkout")}</PageTitle>

      {g(checkout, "checkout_time") && (
        <div style={{ marginBottom: 26 }}>
          <div style={{ background: C.card, borderRadius: RADIUS, boxShadow: SHADOW, padding: "30px 20px", textAlign: "center" }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{tr("checkout_time")}</p>
            <p style={{ margin: 0, fontFamily: SERIF, fontSize: 56, fontWeight: 600, color: C.label, letterSpacing: -2, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {formatTime(g(checkout, "checkout_time"))}
            </p>
            {g(checkout, "late_checkout_info") && (
              <p style={{ margin: "14px 0 0", fontSize: 13.5, color: C.label, opacity: 0.75, lineHeight: 1.5 }}>{g(checkout, "late_checkout_info")}</p>
            )}
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <FieldCard title={tr("checkout_checklist")} count={`${doneCount}/${tasks.length}`}>
          <div style={{ paddingTop: 6 }}>
            {tasks.map((task, i) => (
              <button key={i} onClick={() => setChecked(p => ({ ...p, [i]: !p[i] }))}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: checked[i] ? accent : "transparent",
                  border: `2px solid ${checked[i] ? accent : C.line}`,
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                }}>
                  {checked[i] && <Check size={13} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: 15, color: checked[i] ? C.muted : C.label, textDecoration: checked[i] ? "line-through" : "none", flex: 1, lineHeight: 1.4 }}>{task}</span>
              </button>
            ))}
          </div>
        </FieldCard>
      )}

      {g(checkout, "keys_return") && (
        <FieldCard title={tr("key_return")}>
          <Field label={tr("key_return")} value={g(checkout, "keys_return")} />
        </FieldCard>
      )}

      {(() => {
        const reviews = [
          { url: g(checkout, "review_airbnb"),  label: "Airbnb" },
          { url: g(checkout, "review_google"),  label: "Google" },
          { url: g(checkout, "review_booking"), label: "Booking.com" },
          ...parseReviewLinks(g(checkout, "review_custom")).filter(r => r.url && r.platform).map(r => ({ url: r.url, label: r.platform })),
        ].filter(r => r.url);
        if (reviews.length === 0) return null;
        return (
        <div style={{ marginBottom: 26 }}>
          <p style={{ margin: "0 4px 10px", fontSize: 12, fontWeight: 700, color: C.label, textTransform: "uppercase", letterSpacing: 1.6 }}>{tr("leave_review")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviews.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderRadius: RADIUS, background: C.card, boxShadow: SHADOW, textDecoration: "none" }}>
                <span style={{ fontSize: 15.5, fontWeight: 600, color: C.label }}>{r.label}</span>
                <ChevronRight size={18} color={C.label} />
              </a>
            ))}
          </div>
        </div>
        );
      })()}

      {g(checkout, "thank_you") && (
        <div style={{ textAlign: "center", padding: "24px 16px 8px" }}>
          <p style={{ margin: 0, fontFamily: SERIF, fontSize: 17, color: C.label, fontStyle: "italic", lineHeight: 1.7, opacity: 0.85 }}>{g(checkout, "thank_you")}</p>
        </div>
      )}

      <BunklyCredit ownerPlan={booklet.ownerPlan} />
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
  const available = SUPPORTED_LANGS.filter(l => l.code === (booklet.defaultLang ?? "fr") || booklet.translations?.[l.code] !== undefined);
  if (available.length <= 1) return null;
  const current = available.find(l => l.code === lang) ?? available[0];
  return (
    <div style={{ position: "absolute", top: 20, right: 74, zIndex: 210 }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: C.card, border: "none", boxShadow: SHADOW, borderRadius: 999, padding: "12px", cursor: "pointer" }}>
        <FlagImg code={current.code} size={20} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: C.card, border: `1px solid ${C.sep}`, borderRadius: 16, padding: 6, minWidth: 140, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
          {available.map(l => (
            <button key={l.code} onClick={() => { onSelect(l.code); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: l.code === lang ? C.bg : "transparent", border: "none", borderRadius: 10, padding: "8px 12px", color: C.label, fontSize: 13, fontWeight: l.code === lang ? 700 : 400, cursor: "pointer", textAlign: "left" }}>
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

// ─── Contenu principal ────────────────────────────────────────────────────────

function CleanContent({ booklet: rawBooklet, onTabChange }: { booklet: Booklet; onTabChange?: (tab: string) => void }) {
  const [page, setPage] = useState<CleanPage>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState<SupportedLang>(rawBooklet.defaultLang ?? "fr");
  const booklet = useTranslatedBooklet(rawBooklet, lang);
  const accent = booklet.accentColor || C.label;
  const showServices = Boolean(booklet.addonsPurchasable);

  const handlePage = (p: CleanPage) => {
    setPage(p);
    onTabChange?.(p);
  };

  return (
    <LangCtx.Provider value={lang}>
      <AccentCtx.Provider value={accent}>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", background: haloBackground(accent), fontFamily: FONT, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", overflow: "hidden" }}>
          <LangSelector booklet={rawBooklet} lang={lang} onSelect={setLang} />
          <CleanHeader booklet={booklet} onOpenMenu={() => setMenuOpen(true)} />
          <div key={page} style={{ position: "relative", flex: 1, overflowY: "auto", touchAction: "pan-y", background: "transparent" }}>
            {page === "home"     && <PageHome     booklet={booklet} accent={accent} />}
            {page === "stay"     && <PageStay     booklet={booklet} accent={accent} />}
            {page === "area"     && <PageArea     booklet={booklet} accent={accent} />}
            {page === "services" && <PageServices booklet={booklet} />}
            {page === "safety"   && <PageSafety   booklet={booklet} accent={accent} />}
            {page === "checkout" && <PageCheckout booklet={booklet} accent={accent} />}
          </div>
          <CleanMenu open={menuOpen} active={page} showServices={showServices} onSelect={handlePage} onClose={() => setMenuOpen(false)} />
        </div>
      </AccentCtx.Provider>
    </LangCtx.Provider>
  );
}

// ─── Desktop (mockup iPhone + QR) ─────────────────────────────────────────────

function useQrCode(url: string) {
  const [dataUrl, setDataUrl] = useState("");
  useEffect(() => {
    import("qrcode").then(QRCode => {
      QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: C.label, light: "#ffffff" } }).then(setDataUrl).catch(() => {});
    });
  }, [url]);
  return dataUrl;
}

function CleanDesktop({ booklet }: { booklet: Booklet }) {
  const url = `https://app.bunkly.co/b/${booklet.slug}`;
  const qrDataUrl = useQrCode(url);

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${C.bg} 0%, #F1EEE7 60%, ${C.bg} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: FONT }}>
      <div style={{ color: C.label, maxWidth: 300, marginRight: 60, flexShrink: 0 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.card, border: `1px solid ${C.sep}`, borderRadius: 999, padding: "6px 14px", marginBottom: 24 }}>
          <MapPin size={12} color={C.sub} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Expérience mobile</span>
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
            : <div style={{ width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}><QrCode size={40} color="#ddd" /></div>}
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9CA3AF", textAlign: "center", fontFamily: "ui-monospace,monospace" }}>app.bunkly.co/b/{booklet.slug}</p>
        </div>
      </div>

      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{ width: 390, height: 760, borderRadius: 52, background: "#161513", padding: "12px 10px", boxShadow: "0 40px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06)", position: "relative" }}>
          <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", width: 120, height: 34, background: "#000", borderRadius: 20, zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: 42, overflow: "hidden", background: C.bg }}>
            <CleanContent booklet={booklet} />
          </div>
        </div>
        <div style={{ position: "absolute", left: -3, top: 120, width: 3, height: 32, background: "#3A3833", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", left: -3, top: 162, width: 3, height: 64, background: "#3A3833", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", left: -3, top: 236, width: 3, height: 64, background: "#3A3833", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", right: -3, top: 160, width: 3, height: 80, background: "#3A3833", borderRadius: "0 2px 2px 0" }} />
      </div>
    </div>
  );
}

// ─── Viewer principal ─────────────────────────────────────────────────────────

export function ViewerClean({ booklet, onTabChange }: { booklet: Booklet; onTabChange?: (tab: string) => void }) {
  return (
    <Suspense>
      <div className="md:hidden" style={{ height: "100vh", maxHeight: "100dvh" }}>
        <CleanContent booklet={booklet} onTabChange={onTabChange} />
      </div>
      <div className="hidden md:block">
        <CleanDesktop booklet={booklet} />
      </div>
    </Suspense>
  );
}
