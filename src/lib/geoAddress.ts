// Désambiguïsation des adresses françaises d'outre-mer pour le géocodage.
//
// Problème : "5 rue X, 97116 Pointe-Noire, France" est résolu par Google Maps
// comme "Pointe-Noire, Congo" — le code postal seul ne suffit pas à lever
// l'ambiguïté, et garder "France" en fin de chaîne aggrave le cas. On remplace
// donc le pays par le nom du territoire (déduit du préfixe du code postal), ce
// qui donne "..., 97116 Pointe-Noire, Guadeloupe" — sans "France" à la fin.

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
 * postal d'outre-mer, on remplace le pays final ("France") par le nom du
 * territoire. Garder "..., Guadeloupe, France" fait échouer Google Maps ; on
 * termine donc la chaîne sur le territoire.
 * Les adresses métropolitaines sont renvoyées inchangées.
 */
export function geocodableAddress(address: string): string {
  if (!address) return address;
  const territory = domTomFromPostalCode(address);
  if (!territory) return address;

  const parts = address.split(",").map(s => s.trim()).filter(Boolean);
  // Retire un éventuel "France" final.
  if (parts.length && /^(france|fr)$/i.test(parts[parts.length - 1])) {
    parts.pop();
  }
  // Ajoute le territoire s'il n'est pas déjà présent en dernière position.
  if (!parts.length || parts[parts.length - 1].toLowerCase() !== territory.toLowerCase()) {
    parts.push(territory);
  }
  return parts.join(", ");
}
