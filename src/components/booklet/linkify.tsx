import { Fragment, ReactNode } from "react";
import { externalHref } from "@/lib/url";

// URL (http(s):// ou www.) ou adresse e-mail
const LINK_RE = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+\.[^\s<>"']+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/gi;
// Ponctuation collée en fin de lien qui fait en réalité partie de la phrase
const TRAILING_RE = /[.,;:!?)\]}»"']+$/;

/** Transforme les URLs et e-mails d'un texte libre en liens cliquables. */
export function linkify(text: string | undefined | null): ReactNode {
  if (!text) return text;
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    let raw = m[0];
    const trailing = raw.match(TRAILING_RE)?.[0] ?? "";
    // Garde la parenthèse fermante si le lien en contient une ouvrante (ex. wikipedia)
    if (trailing && !(trailing.startsWith(")") && raw.includes("("))) raw = raw.slice(0, -trailing.length);
    const start = m.index!;
    if (start > last) parts.push(text.slice(last, start));
    const isEmail = !/^(https?:\/\/|www\.)/i.test(raw) && raw.includes("@");
    parts.push(
      <a key={start} href={isEmail ? `mailto:${raw}` : externalHref(raw)}
        target={isEmail ? undefined : "_blank"} rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2, wordBreak: "break-word", fontWeight: 600 }}>
        {raw}
      </a>
    );
    last = start + raw.length;
  }
  if (!parts.length) return text;
  if (last < text.length) parts.push(text.slice(last));
  return <Fragment>{parts}</Fragment>;
}
