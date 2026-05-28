export type TemplateFontFamily = "sans" | "serif" | "mono";
export type TemplateRadius = "none" | "sm" | "md" | "lg" | "full";

export interface BookletTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // emoji ou couleur de préview
  // Splash
  splashOverlay: "light" | "medium" | "dark";
  splashTitleFont: TemplateFontFamily;
  splashTitleSize: "sm" | "md" | "lg" | "xl";
  splashTitleWeight: "normal" | "semibold" | "bold" | "black";
  splashTitleColor: string;
  splashSubtitleColor: string;
  splashButtonColor: string;
  splashButtonTextColor: string;
  splashBadgeText: string;
  splashButtonText: string;
  // Accueil (home screen)
  accentColor: string;
  headerBg: string;           // couleur du header home
  cardBg: string;             // fond des cartes modules
  cardBorder: string;         // bordure des cartes
  cardRadius: TemplateRadius;
  cardShadow: boolean;
  // Modules (viewer)
  moduleBg: string;           // fond global du viewer
  infoBg: string;             // fond des InfoCard
  infoBorder: string;
  fontFamily: TemplateFontFamily;
}

export const TEMPLATES: BookletTemplate[] = [
  {
    id: "minimal",
    name: "Minimaliste",
    description: "Épuré, lignes nettes, noir & blanc",
    preview: "⬜",
    accentColor: "#1a1a1a",
    splashOverlay: "dark",
    splashTitleFont: "sans",
    splashTitleSize: "xl",
    splashTitleWeight: "black",
    splashTitleColor: "#ffffff",
    splashSubtitleColor: "#cccccc",
    splashButtonColor: "#ffffff",
    splashButtonTextColor: "#1a1a1a",
    splashBadgeText: "Livret d'accueil",
    splashButtonText: "Entrer →",
    headerBg: "#1a1a1a",
    cardBg: "#ffffff",
    cardBorder: "#e5e7eb",
    cardRadius: "sm",
    cardShadow: false,
    moduleBg: "#f9fafb",
    infoBg: "#ffffff",
    infoBorder: "#e5e7eb",
    fontFamily: "sans",
  },
  {
    id: "nature",
    name: "Nature",
    description: "Tons verts, chaleureux, organique",
    preview: "🌿",
    accentColor: "#4a7c59",
    splashOverlay: "medium",
    splashTitleFont: "serif",
    splashTitleSize: "lg",
    splashTitleWeight: "bold",
    splashTitleColor: "#ffffff",
    splashSubtitleColor: "#d4edda",
    splashButtonColor: "#ffffff",
    splashButtonTextColor: "#4a7c59",
    splashBadgeText: "Bienvenue",
    splashButtonText: "Découvrir →",
    headerBg: "#4a7c59",
    cardBg: "#f0faf3",
    cardBorder: "#bbdfca",
    cardRadius: "lg",
    cardShadow: true,
    moduleBg: "#f7fdf9",
    infoBg: "#f0faf3",
    infoBorder: "#bbdfca",
    fontFamily: "serif",
  },
  {
    id: "moderne",
    name: "Moderne",
    description: "Orange vif, dynamique, contemporain",
    preview: "🟠",
    accentColor: "#f97316",
    splashOverlay: "dark",
    splashTitleFont: "sans",
    splashTitleSize: "lg",
    splashTitleWeight: "black",
    splashTitleColor: "#ffffff",
    splashSubtitleColor: "#fed7aa",
    splashButtonColor: "#f97316",
    splashButtonTextColor: "#ffffff",
    splashBadgeText: "Livret d'accueil",
    splashButtonText: "Ouvrir le livret →",
    headerBg: "#f97316",
    cardBg: "#ffffff",
    cardBorder: "#fed7aa",
    cardRadius: "lg",
    cardShadow: true,
    moduleBg: "#fff7ed",
    infoBg: "#ffffff",
    infoBorder: "#fed7aa",
    fontFamily: "sans",
  },
  {
    id: "luxe",
    name: "Luxe",
    description: "Doré, sombre, élégant et raffiné",
    preview: "✨",
    accentColor: "#b8960c",
    splashOverlay: "dark",
    splashTitleFont: "serif",
    splashTitleSize: "xl",
    splashTitleWeight: "normal",
    splashTitleColor: "#f5e6b2",
    splashSubtitleColor: "#d4b896",
    splashButtonColor: "#b8960c",
    splashButtonTextColor: "#1a1a1a",
    splashBadgeText: "Bienvenue",
    splashButtonText: "Accéder au livret",
    headerBg: "#1a1612",
    cardBg: "#1a1612",
    cardBorder: "#3d3020",
    cardRadius: "md",
    cardShadow: true,
    moduleBg: "#120f0a",
    infoBg: "#1a1612",
    infoBorder: "#3d3020",
    fontFamily: "serif",
  },
  {
    id: "ocean",
    name: "Océan",
    description: "Bleu turquoise, frais et estival",
    preview: "🌊",
    accentColor: "#0891b2",
    splashOverlay: "medium",
    splashTitleFont: "sans",
    splashTitleSize: "lg",
    splashTitleWeight: "bold",
    splashTitleColor: "#ffffff",
    splashSubtitleColor: "#a5f3fc",
    splashButtonColor: "#ffffff",
    splashButtonTextColor: "#0891b2",
    splashBadgeText: "Livret d'accueil",
    splashButtonText: "Ouvrir →",
    headerBg: "#0891b2",
    cardBg: "#f0fdff",
    cardBorder: "#a5e7f0",
    cardRadius: "lg",
    cardShadow: true,
    moduleBg: "#f0fdff",
    infoBg: "#ffffff",
    infoBorder: "#a5e7f0",
    fontFamily: "sans",
  },
  {
    id: "provencal",
    name: "Provençal",
    description: "Lavande et crème, doux et authentique",
    preview: "💜",
    accentColor: "#7c3aed",
    splashOverlay: "medium",
    splashTitleFont: "serif",
    splashTitleSize: "lg",
    splashTitleWeight: "bold",
    splashTitleColor: "#ffffff",
    splashSubtitleColor: "#ddd6fe",
    splashButtonColor: "#ffffff",
    splashButtonTextColor: "#7c3aed",
    splashBadgeText: "Bienvenue chez nous",
    splashButtonText: "Entrer →",
    headerBg: "#7c3aed",
    cardBg: "#faf5ff",
    cardBorder: "#ddd6fe",
    cardRadius: "full",
    cardShadow: true,
    moduleBg: "#fdf8ff",
    infoBg: "#faf5ff",
    infoBorder: "#ddd6fe",
    fontFamily: "serif",
  },
];

export const DEFAULT_TEMPLATE = TEMPLATES[2]; // Moderne par défaut

export function getTemplate(id?: string): BookletTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? DEFAULT_TEMPLATE;
}
