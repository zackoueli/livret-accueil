import { Plan } from "@/types";

export type PlanFeature =
  | "booklets_unlimited"   // > 2 livrets
  | "booklets_pro"         // > 2 et <= 10
  | "template_grid"        // template Grille
  | "all_modules"          // tous les modules
  | "ai_import"            // import IA
  | "custom_slug"          // slug personnalisé
  | "folders"              // dossiers
  | "analytics"            // analytics
  | "hide_bunkly_badge"    // masquer badge Bunkly
  | "white_label";         // white-label complet

export const PLAN_FEATURES: Record<Plan, PlanFeature[]> = {
  free: [],
  pro: [
    "booklets_pro",
    "template_grid",
    "all_modules",
    "custom_slug",
    "folders",
    "hide_bunkly_badge",
  ],
  agency: [
    "booklets_pro",
    "template_grid",
    "all_modules",
    "custom_slug",
    "folders",
    "hide_bunkly_badge",
    "white_label",
  ],
};

export function planHasFeature(plan: Plan, feature: PlanFeature): boolean {
  return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}

export const PLAN_LIMITS: Record<Plan, { booklets: number }> = {
  free:   { booklets: 1 },
  pro:    { booklets: 10 },
  agency: { booklets: 20 },
};

export const PLANS_CONFIG = [
  {
    id: "free" as Plan,
    name: "Gratuit",
    price: { monthly: 0, yearly: 0 },
    color: "#6b7280",
    description: "Pour découvrir Bunkly",
    features: [
      { label: "1 livret", included: true },
      { label: "Template Scroll", included: true },
      { label: "Modules de base", included: true },
      { label: "URL fixe Bunkly", included: true },
      { label: "Template Grille", included: false },
      { label: "Import IA", included: false },
      { label: "Dossiers", included: false },
      { label: "Analytics", included: false },
      { label: "Badge Bunkly visible", included: false, negative: true },
    ],
  },
  {
    id: "pro" as Plan,
    name: "Pro",
    price: { monthly: 9, yearly: 5.75 },
    yearlyTotal: 69,
    color: "#f97316",
    popular: true,
    description: "Pour les hôtes sérieux",
    features: [
      { label: "10 livrets", included: true },
      { label: "Tous les templates", included: true },
      { label: "Tous les modules", included: true },
      { label: "Dossiers", included: true },
      { label: "Slug personnalisé", included: true },
      { label: "Badge Bunkly masqué", included: true },
      { label: "Import IA", included: false },
      { label: "Analytics", included: false },
      { label: "White-label", included: false },
    ],
  },
  {
    id: "agency" as Plan,
    name: "Agence",
    price: { monthly: 29, yearly: 20.75 },
    yearlyTotal: 249,
    color: "#6366f1",
    description: "Pour les conciergeries",
    features: [
      { label: "20 livrets", included: true },
      { label: "Tous les templates", included: true },
      { label: "Tous les modules", included: true },
      { label: "Dossiers", included: true },
      { label: "Slug personnalisé", included: true },
      { label: "Badge Bunkly masqué", included: true },
      { label: "White-label", included: true },
      { label: "Import IA", included: false },
      { label: "Analytics", included: false },
    ],
  },
];
