export type TemplateFontFamily = "sans" | "serif" | "mono";
export type TemplateRadius = "none" | "sm" | "md" | "lg" | "full";

export interface BookletTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
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
  accentColor: string;
  headerBg: string;
  cardBg: string;
  cardBorder: string;
  cardRadius: TemplateRadius;
  cardShadow: boolean;
  moduleBg: string;
  infoBg: string;
  infoBorder: string;
  fontFamily: TemplateFontFamily;
}

export const TEMPLATES: BookletTemplate[] = [
  {
    id: "app",
    name: "App",
    description: "Sombre, glassmorphism, style application mobile",
    preview: "📱",
    accentColor: "#3b9be8",
    splashOverlay: "dark",
    splashTitleFont: "sans",
    splashTitleSize: "xl",
    splashTitleWeight: "black",
    splashTitleColor: "#ffffff",
    splashSubtitleColor: "rgba(255,255,255,0.6)",
    splashButtonColor: "#3b9be8",
    splashButtonTextColor: "#ffffff",
    splashBadgeText: "Livret d'accueil",
    splashButtonText: "Accéder au livret",
    headerBg: "#0d1b2a",
    cardBg: "rgba(255,255,255,0.1)",
    cardBorder: "rgba(255,255,255,0.15)",
    cardRadius: "lg",
    cardShadow: false,
    moduleBg: "#0d1b2a",
    infoBg: "rgba(255,255,255,0.1)",
    infoBorder: "rgba(255,255,255,0.15)",
    fontFamily: "sans",
  },
  {
    id: "tempo",
    name: "Tempo",
    description: "Élégant, noir & crème, style magazine imprimé",
    preview: "🏡",
    accentColor: "#c4a882",
    splashOverlay: "medium",
    splashTitleFont: "sans",
    splashTitleSize: "xl",
    splashTitleWeight: "black",
    splashTitleColor: "#1a1a1a",
    splashSubtitleColor: "#7a6a5a",
    splashButtonColor: "#1a1a1a",
    splashButtonTextColor: "#ffffff",
    splashBadgeText: "Livret d'accueil",
    splashButtonText: "Entrer →",
    headerBg: "#f0ebe3",
    cardBg: "#f0ebe3",
    cardBorder: "#e8ddd0",
    cardRadius: "lg",
    cardShadow: false,
    moduleBg: "#ffffff",
    infoBg: "#f0ebe3",
    infoBorder: "#e8ddd0",
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
    id: "magazine",
    name: "Magazine",
    description: "Sombre, éditorial, guide de voyage",
    preview: "📰",
    accentColor: "#c8e86b",
    splashOverlay: "dark",
    splashTitleFont: "serif",
    splashTitleSize: "xl",
    splashTitleWeight: "black",
    splashTitleColor: "#f0f0e8",
    splashSubtitleColor: "#6b7a60",
    splashButtonColor: "#c8e86b",
    splashButtonTextColor: "#0f1a14",
    splashBadgeText: "Guide d'accueil",
    splashButtonText: "Explorer →",
    headerBg: "#0f1a14",
    cardBg: "#1a2a1e",
    cardBorder: "#2a3a2e",
    cardRadius: "none",
    cardShadow: false,
    moduleBg: "#0f1a14",
    infoBg: "#1a2a1e",
    infoBorder: "#2a3a2e",
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
];

export const DEFAULT_TEMPLATE = TEMPLATES[2]; // Moderne par défaut

export function getTemplate(id?: string): BookletTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? DEFAULT_TEMPLATE;
}
