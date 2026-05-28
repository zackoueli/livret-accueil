import { Booklet } from "@/types";
import { LANGUAGES } from "@/lib/modules";

export function getContent(booklet: Booklet, moduleId: string, key: string, lang: string): string {
  const mod = booklet.modules.find((m) => m.id === moduleId);
  if (!mod) return "";
  if (mod.content[key] !== undefined) return mod.content[key];
  return mod.content[`${key}_${lang}`] || mod.content[`${key}_fr`] || "";
}

export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id = u.hostname.includes("youtu.be") ? u.pathname.slice(1) : u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch { /* invalid url */ }
  return null;
}

export function parsePlaces(raw: string) {
  return raw.split("\n").map((line) => {
    const [name, address] = line.split("|").map((s) => s.trim());
    return name ? { name, address: address ?? "" } : null;
  }).filter(Boolean) as { name: string; address: string }[];
}

export function getAvailableLangs(booklet: Booklet) {
  return LANGUAGES.filter((l) => booklet.availableLanguages.includes(l.code));
}
