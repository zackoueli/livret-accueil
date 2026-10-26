import { Booklet, BookletService, SupportedLang } from "@/types";

// Langues dans lesquelles un livret peut s'afficher : sa langue de rédaction + ses traductions
export function bookletLangs(booklet: Pick<Booklet, "defaultLang" | "translations">): SupportedLang[] {
  const source = booklet.defaultLang ?? "fr";
  const translated = Object.keys(booklet.translations ?? {}) as SupportedLang[];
  return [source, ...translated.filter((l) => l !== source)];
}

// Langue d'ouverture du livret : `?lang=` explicite, sinon la première langue du navigateur
// (en-tête Accept-Language, ex. "en-GB,en;q=0.9,fr;q=0.8") disponible pour ce livret,
// sinon la langue de rédaction.
export function pickBookletLang(
  booklet: Pick<Booklet, "defaultLang" | "translations">,
  acceptLanguage: string | null,
  override?: string
): SupportedLang {
  const available = bookletLangs(booklet);
  if (override && available.includes(override as SupportedLang)) return override as SupportedLang;
  const preferred = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { lang: tag.trim().slice(0, 2).toLowerCase(), q: q ? parseFloat(q.trim().slice(2)) || 0 : 1 };
    })
    .filter((p) => p.lang && p.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { lang } of preferred) {
    if (available.includes(lang as SupportedLang)) return lang as SupportedLang;
  }
  return available[0];
}

// Clé des traductions d'un service payant dans booklet.translations[lang]
export const serviceTranslationKey = (serviceId: string) => `_svc_${serviceId}`;
export const choiceTranslationField = (choiceId: string) => `choice_${choiceId}`;

// Textes traduisibles d'un service : nom, description, unité, libellés des choix
export function serviceTranslatableFields(service: BookletService): Record<string, string> {
  const fields: Record<string, string> = {};
  if (service.name?.trim()) fields.name = service.name;
  if (service.description?.trim()) fields.description = service.description;
  if (service.priceType === "per_unit" && service.unitLabel?.trim()) fields.unitLabel = service.unitLabel;
  if (service.priceType === "choice") {
    for (const c of service.choices ?? []) {
      if (c.label?.trim()) fields[choiceTranslationField(c.id)] = c.label;
    }
  }
  return fields;
}

export function translateService(
  service: BookletService,
  booklet: Pick<Booklet, "defaultLang" | "translations">,
  lang: SupportedLang
): BookletService {
  if (lang === (booklet.defaultLang ?? "fr")) return service;
  const tr = booklet.translations?.[lang]?.[serviceTranslationKey(service.id)];
  if (!tr) return service;
  return {
    ...service,
    name: tr.name || service.name,
    description: service.description ? tr.description || service.description : service.description,
    unitLabel: service.unitLabel ? tr.unitLabel || service.unitLabel : service.unitLabel,
    choices: service.choices?.map((c) => ({ ...c, label: tr[choiceTranslationField(c.id)] || c.label })),
  };
}
