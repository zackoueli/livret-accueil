// Désambiguïsation des adresses françaises d'outre-mer pour le géocodage.
//
// Problème : "5 rue X, 97116 Pointe-Noire, France" est résolu par Google /
// Nominatim comme "Pointe-Noire, Congo" — le code postal seul ne suffit pas à
// lever l'ambiguïté. On injecte le nom du territoire (déductible du préfixe du
// code postal) dans la chaîne envoyée au géocodeur.

const DOM_TOM_BY_PREFIX: { prefix: string; name: string }[] = [
  { prefix: "971", name: "Guadeloupe" },
  { prefix: "972", name: "Martinique" },
  { prefix: "973", name: "Guyane" },
  { prefix: "974", name: "La Réunion" },
  { prefix: "975", name: "Saint-Pierre-et-Miquelon" },
  { prefix: "976", name: "Mayotte" },
  { prefix: "977", name: "Saint-Barthélemy" },
  { prefix: "978", name: "Saint-Martin" },
  { prefix: "984", name: "Terres australes et antarctiques françaises" },
  { prefix: "986", name: "Wallis-et-Futuna" },
  { prefix: "987", name: "Polynésie française" },
  { prefix: "988", name: "Nouvelle-Calédonie" },
];

// Communes rattachées au bloc 971xx mais qui sont des collectivités distinctes.
const SPECIAL_POSTAL: Record<string, string> = {
  "97133": "Saint-Barthélemy",
  "97150": "Saint-Martin",
};

/** Retourne le territoire d'outre-mer correspondant à un code postal, ou null. */
export function domTomFromPostalCode(raw: string): string | null {
  const cp = (raw.match(/\b(9[78]\d{3})\b/) ?? [])[1];
  if (!cp) return null;
  if (SPECIAL_POSTAL[cp]) return SPECIAL_POSTAL[cp];
  return DOM_TOM_BY_PREFIX.find(d => cp.startsWith(d.prefix))?.name ?? null;
}

/**
 * Prépare une adresse pour un géocodeur / une carte : si elle contient un code
 * postal d'outre-mer, on insère le nom du territoire avant le pays (si absent).
 * Les adresses métropolitaines sont renvoyées inchangées.
 */
export function geocodableAddress(address: string): string {
  if (!address) return address;
  const territory = domTomFromPostalCode(address);
  if (!territory) return address;
  if (new RegExp(territory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(address)) {
    return address;
  }
  const parts = address.split(",").map(s => s.trim()).filter(Boolean);
  // Si le dernier segment ressemble à "France", on insère juste avant.
  if (parts.length && /^france$/i.test(parts[parts.length - 1])) {
    parts.splice(parts.length - 1, 0, territory);
  } else {
    parts.push(territory, "France");
  }
  return parts.join(", ");
}
