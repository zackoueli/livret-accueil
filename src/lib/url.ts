const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.bunkly.co";

export function bookletUrl(slug: string): string {
  return `${APP_URL}/b/${slug}`;
}

/** Lien externe saisi par l'hôte : force http(s) (ajoute https:// si absent, neutralise javascript: & co). */
export function externalHref(url: string): string {
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

/** Version lisible d'une URL : sans protocole, sans "www." ni slash final. */
export function displayUrl(url: string): string {
  return url.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}
