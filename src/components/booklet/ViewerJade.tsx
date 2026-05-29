"use client";

import { useState, useEffect } from "react";
import { Booklet } from "@/types";
import { MODULE_META } from "@/lib/modules";
import { getContent, parsePlaces, getAvailableLangs, formatTime } from "./viewerUtils";
import { CheckInFormInline } from "./CheckInForm";
import {
  Home, Map, Phone, Menu, Globe, ChevronRight, ArrowRight,
  Wifi, Key, MapPin, AlertTriangle, Copy, Check,
  FileText, Download, ArrowLeft,
  Thermometer, UtensilsCrossed, Recycle, HelpCircle,
  Info, Star, Clock, ExternalLink,
} from "lucide-react";
import { getPalette } from "@/lib/palettes";

const FONT = "-apple-system, 'SF Pro Text', system-ui, sans-serif";

type TabId = "home" | "map" | "contact" | "menu";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "home",    label: "Accueil",        icon: Home },
  { id: "map",     label: "Carte",          icon: Map },
  { id: "contact", label: "Nous contacter", icon: Phone },
  { id: "menu",    label: "Menu",           icon: Menu },
];

const C = {
  bg:     "#f8f9fa",
  card:   "#ffffff",
  label:  "#111827",
  label2: "#6b7280",
  label3: "#9ca3af",
  sep:    "#f3f4f6",
  border: "#e5e7eb",
};

// Card blanche avec bordure
const Card = ({ children, className = "", onClick }: {
  children: React.ReactNode; className?: string; onClick?: () => void;
}) => {
  const El = onClick ? "button" : "div";
  return (
    <El onClick={onClick}
      className={`bg-white rounded-2xl overflow-hidden w-full text-left ${className}`}
      style={{ border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {children}
    </El>
  );
};

const Sep = () => <div style={{ height: 1, backgroundColor: C.sep, margin: "0 16px" }} />;

export function ViewerJade({ booklet }: { booklet: Booklet }) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [menuSection, setMenuSection] = useState<string | null>(null);
  const [lang, setLang] = useState(booklet.defaultLanguage || "fr");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const _p = { ...getPalette(booklet.paletteId ?? "ocean"), ...booklet.customPalette };
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
  const TopBar = () => (
    <div className="shrink-0 bg-white flex items-center gap-2 px-4 pt-10 pb-3"
      style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${A}18` }}>
        <Home className="w-3.5 h-3.5" style={{ color: A }} />
      </div>
      <p className="flex-1 font-semibold truncate" style={{ fontSize: 14, color: C.label }}>
        {sp.customTitle || booklet.propertyName || booklet.title}
      </p>
      {availableLangs.length > 1 && (
        <div className="relative">
          <button onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
            style={{ border: `1px solid ${C.border}`, color: C.label2 }}>
            {currentLang?.flag} {currentLang?.label?.slice(0, 2)}
          </button>
          {showLangMenu && (
            <div className="absolute top-8 right-0 z-50 bg-white rounded-xl overflow-hidden"
              style={{ border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 140 }}>
              {availableLangs.map((l, i) => (
                <div key={l.code}>
                  <button onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5">
                    <span style={{ fontSize: 14, color: C.label }}>{l.flag} {l.label}</span>
                    {lang === l.code && <Check className="w-3.5 h-3.5" style={{ color: A }} />}
                  </button>
                  {i < availableLangs.length - 1 && <Sep />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <button className="p-1.5 rounded-lg" style={{ border: `1px solid ${C.border}` }}>
        <Menu className="w-4 h-4" style={{ color: C.label2 }} />
      </button>
    </div>
  );

  // ── TAB BAR ───────────────────────────────────────────────────────────────
  const TabBar = () => (
    <div className="shrink-0 bg-white flex"
      style={{ borderTop: `1px solid ${C.border}`, paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-1 active:opacity-50 transition-opacity">
            <Icon className="w-5 h-5" strokeWidth={active ? 2 : 1.5}
              style={{ color: active ? A : C.label3 }} />
            <span style={{ fontSize: 10, color: active ? A : C.label3, fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ── HOME ──────────────────────────────────────────────────────────────────
  const TabHome = () => {
    // Groupes de modules pour la grille
    const moduleGroups = [
      { type: "practical", label: "Nos Services",    desc: "Découvrez nos services pour un séjour inoubliable.", icon: Star },
      { type: "checkin",   label: "Restaurants & Bars", desc: "Savourez une cuisine délicieuse.", icon: UtensilsCrossed },
      { type: "guide",     label: "Chaînes TV",      desc: "Regardez vos chaînes préférées en direct.", icon: Home },
      { type: "practical", label: "Informations WiFi", desc: "Accédez à notre réseau WiFi.", icon: Wifi },
      { type: "rules",     label: "Règlement",       desc: "Les règles de notre établissement.", icon: Info },
      { type: "contacts",  label: "Contacts",        desc: "Joignez notre équipe.", icon: Phone },
      { type: "activities", label: "Activités",      desc: "À faire autour de nous.", icon: Map },
      { type: "transport", label: "Transport",       desc: "Venir et partir facilement.", icon: MapPin },
      { type: "faq",       label: "FAQ",             desc: "Vos questions fréquentes.", icon: HelpCircle },
      { type: "upselling", label: "Services +",      desc: "Nos offres spéciales.", icon: Star },
    ].filter((g) => enabledModules.some((m) => m.type === g.type));

    // Utilise les vrais labels des modules activés
    const realModules = enabledModules.map((m) => ({
      ...m,
      meta: MODULE_META[m.type],
    }));

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
        {/* Hero */}
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden"
          style={{ height: 180, boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
          {bgUrl ? (
            <div className="w-full h-full relative">
              <div className="absolute inset-0"
                style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />
              <div className="absolute bottom-0 left-0 p-4">
                <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: "28px", letterSpacing: -0.3 }}>
                  {sp.customTitle || booklet.propertyName || booklet.title}
                </p>
                {(sp.customSubtitle || booklet.description) && (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 3 }}>
                    {sp.customSubtitle || booklet.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-end p-4"
              style={{ background: `linear-gradient(135deg, ${A}cc 0%, ${A}88 100%)` }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: "28px" }}>
                {sp.customTitle || booklet.propertyName || booklet.title}
              </p>
            </div>
          )}
        </div>

        {/* Sous-titre */}
        <div className="px-4 mt-4 mb-3">
          <p style={{ fontSize: 17, fontWeight: 700, color: C.label }}>Explorez Notre Établissement</p>
          <p style={{ fontSize: 13, color: C.label2, marginTop: 2 }}>
            Accédez rapidement aux espaces mis à votre disposition.
          </p>
          <p style={{ fontSize: 12, color: A, marginTop: 1 }}>{realModules.length} espaces disponibles</p>
        </div>

        {/* Grille 2×N */}
        <div className="px-4 pb-6">
          <div className="grid grid-cols-2 gap-3">
            {realModules.map((m) => (
              <Card key={m.id} onClick={() => { setMenuSection(m.type); setActiveTab("menu"); }}>
                <div className="p-3.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5"
                    style={{ backgroundColor: `${A}12`, border: `1px solid ${A}20` }}>
                    <span style={{ fontSize: 16 }}>{m.meta.emoji}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.label, marginBottom: 3 }}>{m.meta.label}</p>
                  <p style={{ fontSize: 12, color: C.label2, lineHeight: "16px", marginBottom: 8 }}>
                    {m.meta.description}
                  </p>
                  <div className="flex items-center gap-1" style={{ color: A }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>En savoir plus</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Card>
            ))}

          </div>
        </div>
      </div>
    );
  };

  // ── MAP (Quartier) ────────────────────────────────────────────────────────
  const TabMap = () => {
    const actPlaces = get("activities", "places") ? parsePlaces(get("activities", "places")) : [];
    const gdPlaces  = get("gooddeals", "places")  ? parsePlaces(get("gooddeals", "places"))  : [];
    const allPlaces = [...actPlaces, ...gdPlaces];

    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
        <div className="px-4 pt-4 pb-6">
          <p style={{ fontSize: 22, fontWeight: 700, color: C.label, marginBottom: 4 }}>Explorer le quartier</p>
          <p style={{ fontSize: 14, color: C.label2, marginBottom: 16 }}>Nos adresses préférées autour du logement.</p>

          {booklet.address && (
            <Card className="mb-3">
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booklet.address)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${A}12` }}>
                  <MapPin className="w-4.5 h-4.5" style={{ color: A }} />
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.label }}>{booklet.address}</p>
                  <p style={{ fontSize: 12, color: A, marginTop: 1 }}>Ouvrir dans Maps →</p>
                </div>
              </a>
            </Card>
          )}

          {allPlaces.length > 0 && (
            <Card className="mb-3">
              {allPlaces.map((p, i) => (
                <div key={i}>
                  <div className="flex items-start gap-3 px-4 py-3.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: `${A}10` }}>
                      <MapPin className="w-5 h-5" style={{ color: A }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.label }}>{p.name}</p>
                      {p.address && <p style={{ fontSize: 12, color: A, marginTop: 2 }}>{p.address}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address || p.name)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                          style={{ border: `1px solid ${C.border}`, fontSize: 11, color: C.label2 }}>
                          <MapPin className="w-3 h-3" /> Itinéraire
                        </a>
                      </div>
                    </div>
                  </div>
                  {i < allPlaces.length - 1 && <Sep />}
                </div>
              ))}
            </Card>
          )}

          {get("gooddeals", "restaurants") && (
            <>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.label, marginBottom: 8, marginTop: 16 }}>🍽️ Restaurants</p>
              <Card className="mb-3">
                <div className="px-4 py-3.5">
                  <p style={{ fontSize: 14, color: C.label, lineHeight: "21px", whiteSpace: "pre-wrap" }}>
                    {get("gooddeals", "restaurants")}
                  </p>
                </div>
              </Card>
            </>
          )}

          {!allPlaces.length && !get("gooddeals", "restaurants") && !booklet.address && (
            <div className="text-center py-16">
              <p style={{ fontSize: 15, color: C.label2 }}>Aucune adresse renseignée</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── CONTACT ───────────────────────────────────────────────────────────────
  const TabContact = () => (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
      <div className="px-4 pt-4 pb-6">
        <p style={{ fontSize: 22, fontWeight: 700, color: C.label, marginBottom: 4 }}>Nous contacter</p>
        <p style={{ fontSize: 14, color: C.label2, marginBottom: 16 }}>Notre équipe est à votre disposition.</p>

        {get("contacts", "owner_name") && (
          <Card className="mb-3">
            <div className="px-4 py-4">
              <p style={{ fontSize: 16, fontWeight: 600, color: C.label, marginBottom: 12 }}>
                {get("contacts", "owner_name")}
              </p>
              {get("contacts", "owner_phone") && (
                <a href={`tel:${get("contacts", "owner_phone")}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl mb-2"
                  style={{ backgroundColor: A }}>
                  <Phone className="w-4 h-4 text-white" />
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
                    {get("contacts", "owner_phone")}
                  </span>
                </a>
              )}
            </div>
          </Card>
        )}

        {/* WiFi dans contact */}
        {get("practical", "wifi_name") && (
          <Card className="mb-3">
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Wifi className="w-4 h-4" style={{ color: A }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: C.label2, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Wi-Fi
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: C.bg }}>
                  <p style={{ fontSize: 11, color: C.label2 }}>Réseau</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.label, marginTop: 2 }}>
                    {get("practical", "wifi_name")}
                  </p>
                </div>
                {get("practical", "wifi_password") && (
                  <div className="rounded-xl px-3 py-2.5 relative" style={{ backgroundColor: C.bg }}>
                    <p style={{ fontSize: 11, color: C.label2 }}>Mot de passe</p>
                    <p style={{ fontSize: 13, fontFamily: "monospace", color: A, marginTop: 2, paddingRight: 20 }}>
                      {get("practical", "wifi_password")}
                    </p>
                    <button onClick={() => copy(get("practical", "wifi_password"))}
                      className="absolute top-2 right-2" style={{ color: copied ? "#34c759" : C.label3 }}>
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Urgences */}
        <p style={{ fontSize: 15, fontWeight: 700, color: C.label, marginBottom: 8, marginTop: 16 }}>
          🚨 Urgences
        </p>
        <Card>
          {[
            { label: "SAMU", n: "15" }, { label: "Pompiers", n: "18" },
            { label: "Police", n: "17" }, { label: "Urgences (EU)", n: "112" },
          ].map((e, i, arr) => (
            <div key={e.label}>
              <div className="flex items-center justify-between px-4 py-3.5">
                <p style={{ fontSize: 15, color: C.label }}>{e.label}</p>
                <a href={`tel:${e.n}`} style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>{e.n}</a>
              </div>
              {i < arr.length - 1 && <Sep />}
            </div>
          ))}
        </Card>

        {get("contacts", "emergency") && (
          <div className="mt-3 rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{ backgroundColor: "#fff2f2", border: "1px solid #fecaca" }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
            <p style={{ fontSize: 14, color: "#cc0000", lineHeight: "20px" }}>
              {get("contacts", "emergency")}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ── MENU (tous les modules) ───────────────────────────────────────────────
  const TabMenu = () => {
    const [selected, setSelected] = useState<string | null>(menuSection);

    useEffect(() => { setSelected(menuSection); }, [menuSection]);

    if (selected) {
      const mod = enabledModules.find((m) => m.type === selected);
      if (!mod) return null;
      const meta = MODULE_META[mod.type];
      const photos = mod.images ?? [];
      const docs = mod.documents ?? [];
      const g = (key: string) => getContent(booklet, mod.id, key, lang);

      // Affichage check-in spécial
      if (mod.type === "checkin") {
        const steps = g("checkin_process").split("\n").filter(Boolean);
        return (
          <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
            <div className="px-4 pt-4 pb-6">
              <button onClick={() => { setSelected(null); setMenuSection(null); }}
                className="flex items-center gap-1.5 mb-4" style={{ color: A, fontSize: 14 }}>
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>

              {(g("checkin_time") || g("checkout_time")) && (
                <Card className="mb-3">
                  <div className="flex divide-x" style={{ borderColor: C.sep }}>
                    {g("checkin_time") && (
                      <div className="flex-1 px-5 py-4">
                        <p style={{ fontSize: 11, color: C.label2, textTransform: "uppercase", letterSpacing: 0.5 }}>Arrivée</p>
                        <p style={{ fontSize: 28, fontWeight: 700, color: C.label, letterSpacing: -0.5 }}>{formatTime(g("checkin_time"))}</p>
                      </div>
                    )}
                    {g("checkout_time") && (
                      <div className="flex-1 px-5 py-4">
                        <p style={{ fontSize: 11, color: C.label2, textTransform: "uppercase", letterSpacing: 0.5 }}>Départ</p>
                        <p style={{ fontSize: 28, fontWeight: 700, color: C.label, letterSpacing: -0.5 }}>{formatTime(g("checkout_time"))}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {steps.length > 0 && steps.map((step, i) => (
                <Card key={i} className="mb-2.5">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${A}18` }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: A }}>{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p style={{ fontSize: 12, color: C.label2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                          Dernière mise à jour
                        </p>
                        <p style={{ fontSize: 15, fontWeight: 500, color: C.label, lineHeight: "21px" }}>{step}</p>
                        {photos[i] && (
                          <div className="mt-3 rounded-xl overflow-hidden aspect-video">
                            <img src={photos[i]} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {g("door_code") && (
                <Card className="mb-2.5">
                  <div className="px-4 py-5 text-center">
                    <p style={{ fontSize: 11, color: C.label2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                      Code d'entrée
                    </p>
                    <p style={{ fontSize: 52, fontWeight: 700, color: A, letterSpacing: 8, lineHeight: "60px" }}>
                      {g("door_code")}
                    </p>
                  </div>
                </Card>
              )}
              <CheckInFormInline bookletId={booklet.id} accent={A} theme="light" />
            </div>
          </div>
        );
      }

      // Affichage générique
      const fieldMap: Record<string, [string, string][]> = {
        practical: [["wifi_name","Réseau Wi-Fi"], ["wifi_password","Mot de passe"], ["door_code","Code d'entrée"], ["parking","Parking"], ["other","Autres infos"]],
        welcome:   [["title","Titre"], ["message","Message"]],
        rules:     [["rules","Règlement"]],
        guide:     [["heating","Chauffage"], ["appliances","Électroménager"], ["trash","Tri des déchets"], ["other","Autres infos"]],
        contacts:  [["owner_name","Contact"], ["owner_phone","Téléphone"], ["emergency","Urgences"], ["doctor","Médecin"], ["neighbors","Voisins"]],
        activities:[["activities","Activités"], ["places","Lieux"]],
        gooddeals: [["restaurants","Restaurants"], ["shops","Commerces"], ["others","Bons plans"]],
        transport: [["by_car","En voiture"], ["by_train","En train"], ["taxi","Taxi/VTC"], ["airport","Aéroport"]],
        faq:       [["faq","FAQ"]],
      };
      const fields = fieldMap[mod.type] ?? [];

      return (
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
          <div className="px-4 pt-4 pb-6">
            <button onClick={() => { setSelected(null); setMenuSection(null); }}
              className="flex items-center gap-1.5 mb-4" style={{ color: A, fontSize: 14 }}>
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>

            {photos[0] && (
              <div className="rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "16/9" }}>
                <img src={photos[0]} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <Card className="mb-3">
              {fields.map(([key, label], i) => {
                const val = g(key);
                if (!val) return null;
                return (
                  <div key={key}>
                    <div className="px-4 py-3.5">
                      <p style={{ fontSize: 11, color: C.label2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                        {label}
                      </p>
                      <p style={{ fontSize: 15, color: C.label, lineHeight: "21px", whiteSpace: "pre-wrap" }}>{val}</p>
                    </div>
                    {i < fields.length - 1 && <Sep />}
                  </div>
                );
              }).filter(Boolean)}
            </Card>

            {docs.length > 0 && docs.map((doc, i) => (
              <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer">
                <Card className="mb-2">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <FileText className="w-4 h-4 shrink-0" style={{ color: A }} />
                    <span style={{ fontSize: 14, color: C.label, flex: 1 }}>{doc.name}</span>
                    <Download className="w-4 h-4 shrink-0" style={{ color: C.label3 }} />
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      );
    }

    // Liste de tous les modules
    return (
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}>
        <div className="px-4 pt-4 pb-6">
          <p style={{ fontSize: 22, fontWeight: 700, color: C.label, marginBottom: 16 }}>Menu</p>
          <Card>
            {enabledModules.map((m, i) => {
              const meta = MODULE_META[m.type];
              return (
                <div key={m.id}>
                  <button onClick={() => setSelected(m.type)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${A}10` }}>
                      <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 500, color: C.label, flex: 1, textAlign: "left" }}>
                      {meta.label}
                    </p>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: C.label3 }} />
                  </button>
                  {i < enabledModules.length - 1 && <Sep />}
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-white" style={{ fontFamily: FONT }}>
        <TopBar />
        {activeTab === "home"    && <TabHome />}
        {activeTab === "map"     && <TabMap />}
        {activeTab === "contact" && <TabContact />}
        {activeTab === "menu"    && <TabMenu />}
        <TabBar />
      </div>
    </>
  );
}
