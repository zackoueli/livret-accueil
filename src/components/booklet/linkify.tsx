import { Fragment, ReactNode } from "react";
import { Globe } from "lucide-react";
import { externalHref } from "@/lib/url";

// [texte](url) au format Markdown, URL (http(s):// ou www.) ou adresse e-mail
const LINK_RE = /\[([^\]\n]+)\]\(((?:https?:\/\/|www\.)[^\s)]+)\)|(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+\.[^\s<>"']+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/gi;
// Ponctuation collée en fin de lien qui fait en réalité partie de la phrase
const TRAILING_RE = /[.,;:!?)\]}»"']+$/;

// Noms de sites connus, indexés par le nom de domaine (sans extension)
const SITE_NAMES: Record<string, string> = {
  airbnb: "Airbnb", booking: "Booking", abritel: "Abritel", vrbo: "Vrbo", expedia: "Expedia",
  tripadvisor: "Tripadvisor", google: "Google", youtube: "YouTube", youtu: "YouTube",
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", whatsapp: "WhatsApp",
  waze: "Waze", leboncoin: "leboncoin", gites: "Gîtes de France", "gites-de-france": "Gîtes de France",
};

/** Nom court d'un site pour l'affichage : "Airbnb" pour airbnb.fr/rooms/…, sinon le domaine sans "www.". */
function siteName(url: string): string {
  try {
    const host = new URL(externalHref(url)).hostname.replace(/^www\./i, "");
    const parts = host.split(".");
    return SITE_NAMES[parts[parts.length - 2]?.toLowerCase()] ?? host;
  } catch {
    return url;
  }
}

const linkStyle = { color: "inherit", textDecoration: "underline", textUnderlineOffset: 2, wordBreak: "break-word", fontWeight: 600 } as const;

/**
 * Transforme les liens d'un texte libre en liens cliquables.
 * Les URLs s'affichent sous forme courte (🌐 Airbnb) ; `[texte](url)` permet de choisir le libellé.
 */
export function linkify(text: string | undefined | null): ReactNode {
  if (!text) return text;
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    const start = m.index!;
    if (start > last) parts.push(text.slice(last, start));

    if (m[1]) {
      // Lien Markdown : libellé choisi par l'hôte
      parts.push(
        <a key={start} href={externalHref(m[2])} target="_blank" rel="noopener noreferrer" title={m[2]}
          onClick={e => e.stopPropagation()} style={linkStyle}>
          {m[1]}
        </a>
      );
      last = start + m[0].length;
      continue;
    }

    let raw = m[3];
    const trailing = raw.match(TRAILING_RE)?.[0] ?? "";
    // Garde la parenthèse fermante si le lien en contient une ouvrante (ex. wikipedia)
    if (trailing && !(trailing.startsWith(")") && raw.includes("("))) raw = raw.slice(0, -trailing.length);
    const isEmail = !/^(https?:\/\/|www\.)/i.test(raw) && raw.includes("@");
    parts.push(isEmail ? (
      <a key={start} href={`mailto:${raw}`} rel="noopener noreferrer"
        onClick={e => e.stopPropagation()} style={linkStyle}>
        {raw}
      </a>
    ) : (
      <a key={start} href={externalHref(raw)} target="_blank" rel="noopener noreferrer" title={raw}
        onClick={e => e.stopPropagation()} style={{ ...linkStyle, whiteSpace: "nowrap" }}>
        <Globe size="0.95em" strokeWidth={2.2} style={{ verticalAlign: "-0.12em", marginRight: 3 }} />
        {siteName(raw)}
      </a>
    ));
    last = start + raw.length;
  }
  if (!parts.length) return text;
  if (last < text.length) parts.push(text.slice(last));
  return <Fragment>{parts}</Fragment>;
}
