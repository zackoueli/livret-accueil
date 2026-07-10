import { Plan } from "@/types";

export type PlanFeature =
  | "template_grid"        // choix de plusieurs modèles
  | "all_modules"          // modules optionnels (hors marée/météo)
  | "tides_weather"        // module marée & météo
  | "ai_import"            // import IA
  | "custom_slug"          // slug personnalisé
  | "folders"              // dossiers
  | "analytics"            // analytics
  | "qr_custom"            // personnalisation du QR code
  | "hide_bunkly_badge"    // masquer badge Bunkly
  | "white_label";         // white-label complet

export const PLAN_FEATURES: Record<Plan, PlanFeature[]> = {
  free: [],
  starter: [
    "template_grid",
    "all_modules",
    "custom_slug",
    "folders",
  ],
  pro: [
    "template_grid",
    "all_modules",
    "tides_weather",
    "ai_import",
    "custom_slug",
    "folders",
    "analytics",
    "qr_custom",
    "hide_bunkly_badge",
    "white_label",
  ],
  agency: [
    "template_grid",
    "all_modules",
    "tides_weather",
    "ai_import",
    "custom_slug",
    "folders",
    "analytics",
    "qr_custom",
    "hide_bunkly_badge",
    "white_label",
  ],
};

export function planHasFeature(plan: Plan, feature: PlanFeature): boolean {
  return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}

export const PLAN_LIMITS: Record<Plan, { booklets: number }> = {
  free:    { booklets: 1 },
  starter: { booklets: 5 },
  pro:     { booklets: 20 },
  agency:  { booklets: 100 },
};

// Nombre de modèles de livret sélectionnables (parmi TEMPLATES, dans l'ordre)
export const PLAN_TEMPLATE_COUNT: Record<Plan, number> = {
  free: 1,
  starter: 3,
  pro: 5,
  agency: 5,
};

// Nombre de langues de traduction automatique (au-delà : traduction manuelle uniquement)
export const PLAN_TRANSLATION_LANGS: Record<Plan, number> = {
  free: 0,
  starter: 3,
  pro: 6,
  agency: 6,
};

// Nombre maximum d'activités par module — null = illimité
export const PLAN_ACTIVITY_LIMIT: Record<Plan, number | null> = {
  free: 5,
  starter: 15,
  pro: null,
  agency: null,
};

export const PLANS_CONFIG = [
  {
    id: "free" as Plan,
    name: "Gratuit",
    price: { monthly: 0, yearly: 0 },
    color: "#6b7280",
    description: "Pour découvrir Bunkly",
    features: [
      { label: "1 logement inclus", included: true },
      { label: "1 modèle de livret au choix", included: true },
      { label: "Traduction manuelle", included: true },
      { label: "Modules de base inclus", included: true },
      { label: "5 activités au choix (manuellement)", included: true },
      { label: "Slug personnalisé", included: false },
      { label: "Modules supplémentaires", included: false },
      { label: "Import IA", included: false },
      { label: "Badge Bunkly visible", included: false, negative: true },
    ],
  },
  {
    id: "starter" as Plan,
    name: "Starter",
    price: { monthly: 9, yearly: 5.75 },
    yearlyTotal: 69,
    color: "#f97316",
    popular: true,
    description: "Pour les hôtes sérieux",
    features: [
      { label: "Jusqu'à 5 logements", included: true },
      { label: "3 modèles de livret au choix", included: true },
      { label: "Traduction auto pour 3 langues", included: true },
      { label: "Lien URL avec slug personnalisé", included: true },
      { label: "Modules supplémentaires inclus", included: true },
      { label: "15 activités supplémentaires", included: true },
      { label: "Import IA", included: false },
      { label: "Marée & météo", included: false },
      { label: "Analytics", included: false },
    ],
  },
  {
    id: "pro" as Plan,
    name: "Pro",
    price: { monthly: 29, yearly: 18.5 },
    yearlyTotal: 222,
    color: "#6366f1",
    description: "Pour les hôtes qui veulent tout",
    features: [
      { label: "Jusqu'à 20 logements", included: true },
      { label: "5 modèles de livret au choix", included: true },
      { label: "Module marée et météo", included: true },
      { label: "Traduction auto pour 6 langues", included: true },
      { label: "URL et QR code personnalisables", included: true },
      { label: "Activités en illimité", included: true },
      { label: "Import IA", included: true },
      { label: "Interface en marque blanche", included: true },
      { label: "Support client prioritaire", included: true },
      { label: "Données analytics", included: true },
    ],
  },
  {
    id: "agency" as Plan,
    name: "Agence",
    price: { monthly: 59, yearly: 37.75 },
    yearlyTotal: 453,
    color: "#111827",
    description: "Pour les conciergeries",
    features: [
      { label: "Jusqu'à 100 logements", included: true },
      { label: "Toutes les fonctionnalités du plan Pro", included: true },
      { label: "Données analytics", included: true },
    ],
  },
];
