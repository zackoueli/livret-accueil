export type PatternType = "solid" | "stripes" | "gradient" | "circles";

export interface BookletPalette {
  id: string;
  name: string;
  // Couleurs principales
  primary: string;    // accent, boutons, titres forts
  secondary: string;  // fond principal / fond page
  surface: string;    // fond des cards / modules
  text: string;       // texte principal
  muted: string;      // texte secondaire / labels
  border: string;     // bordures et séparateurs
  // Motif de fond
  pattern: PatternType;
  patternColor?: string; // 2e couleur pour bandes/dégradé/cercles
  patternSize?: number;  // taille bande en px (défaut 40)
}

export const PALETTES: BookletPalette[] = [
  // ── UNIS ──────────────────────────────────────────────────────────────────
  {
    id: "creme",
    name: "Crème",
    primary: "#6b8f71",
    secondary: "#faf7f2",
    surface: "#ffffff",
    text: "#2d3a2e",
    muted: "#9a9a8a",
    border: "#d4c9b0",
    pattern: "solid",
  },
  {
    id: "ardoise",
    name: "Ardoise",
    primary: "#c8e86b",
    secondary: "#0f1a14",
    surface: "#1a2a1e",
    text: "#f0f0e8",
    muted: "#6b7a60",
    border: "#2a3a2e",
    pattern: "solid",
  },
  {
    id: "corail",
    name: "Corail",
    primary: "#f97316",
    secondary: "#fff7ed",
    surface: "#ffffff",
    text: "#1c0f00",
    muted: "#92400e",
    border: "#fed7aa",
    pattern: "solid",
  },
  {
    id: "ocean",
    name: "Océan",
    primary: "#0891b2",
    secondary: "#f0fdff",
    surface: "#ffffff",
    text: "#0c2a33",
    muted: "#6b9ea8",
    border: "#a5e7f0",
    pattern: "solid",
  },
  {
    id: "lavande",
    name: "Lavande",
    primary: "#7c3aed",
    secondary: "#faf5ff",
    surface: "#ffffff",
    text: "#2e1a47",
    muted: "#9b7ec8",
    border: "#ddd6fe",
    pattern: "solid",
  },
  {
    id: "charbon",
    name: "Charbon",
    primary: "#e2e8f0",
    secondary: "#0f172a",
    surface: "#1e293b",
    text: "#f1f5f9",
    muted: "#64748b",
    border: "#334155",
    pattern: "solid",
  },
  // ── BANDES ────────────────────────────────────────────────────────────────
  {
    id: "bandes-rose",
    name: "Bandes Rose",
    primary: "#e879a0",
    secondary: "#fff0f5",
    surface: "#ffffff",
    text: "#3d0a1e",
    muted: "#c47a94",
    border: "#fbc4d8",
    pattern: "stripes",
    patternColor: "#ffd6e7",
    patternSize: 40,
  },
  {
    id: "bandes-bleu",
    name: "Bandes Bleu",
    primary: "#3b82f6",
    secondary: "#eff6ff",
    surface: "#ffffff",
    text: "#1e3a5f",
    muted: "#6b9fd4",
    border: "#bfdbfe",
    pattern: "stripes",
    patternColor: "#dbeafe",
    patternSize: 40,
  },
  {
    id: "bandes-sauge",
    name: "Bandes Sauge",
    primary: "#4a7c59",
    secondary: "#f0faf3",
    surface: "#ffffff",
    text: "#1a3325",
    muted: "#7aaa8a",
    border: "#bbdfca",
    pattern: "stripes",
    patternColor: "#d4edda",
    patternSize: 40,
  },
  {
    id: "bandes-sable",
    name: "Bandes Sable",
    primary: "#b45309",
    secondary: "#fffbeb",
    surface: "#ffffff",
    text: "#3d1f00",
    muted: "#c4904a",
    border: "#fde68a",
    pattern: "stripes",
    patternColor: "#fef3c7",
    patternSize: 40,
  },
  // ── DÉGRADÉS ──────────────────────────────────────────────────────────────
  {
    id: "degrade-aurore",
    name: "Aurore",
    primary: "#e11d48",
    secondary: "#fff1f2",
    surface: "#ffffff",
    text: "#3d0014",
    muted: "#c47a8a",
    border: "#fecdd3",
    pattern: "gradient",
    patternColor: "#fdf4ff",
  },
  {
    id: "degrade-ciel",
    name: "Ciel",
    primary: "#0ea5e9",
    secondary: "#f0f9ff",
    surface: "#ffffff",
    text: "#0c2a3d",
    muted: "#5ba4c8",
    border: "#bae6fd",
    pattern: "gradient",
    patternColor: "#f0fdf4",
  },
  {
    id: "degrade-coucher",
    name: "Coucher de soleil",
    primary: "#f97316",
    secondary: "#fff7ed",
    surface: "#ffffff",
    text: "#3d1500",
    muted: "#c47a4a",
    border: "#fed7aa",
    pattern: "gradient",
    patternColor: "#fef9c3",
  },
  // ── CERCLES ───────────────────────────────────────────────────────────────
  {
    id: "cercles-rose",
    name: "Bulles Rosées",
    primary: "#db2777",
    secondary: "#fdf2f8",
    surface: "#ffffff",
    text: "#3d0a1e",
    muted: "#b47a94",
    border: "#fbcfe8",
    pattern: "circles",
    patternColor: "#fce7f3",
  },
  {
    id: "cercles-indigo",
    name: "Bulles Indigo",
    primary: "#4f46e5",
    secondary: "#eef2ff",
    surface: "#ffffff",
    text: "#1e1a4f",
    muted: "#818cf8",
    border: "#c7d2fe",
    pattern: "circles",
    patternColor: "#e0e7ff",
  },
];

export const DEFAULT_PALETTE = PALETTES[0];

export function getPalette(id?: string): BookletPalette {
  return PALETTES.find((p) => p.id === id) ?? DEFAULT_PALETTE;
}

// Génère le CSS background selon le motif
export function patternToCss(palette: BookletPalette): string {
  const { pattern, secondary, patternColor, patternSize = 40 } = palette;
  const c2 = patternColor ?? secondary;

  switch (pattern) {
    case "stripes":
      return `repeating-linear-gradient(
        180deg,
        ${secondary} 0px,
        ${secondary} ${patternSize}px,
        ${c2} ${patternSize}px,
        ${c2} ${patternSize * 2}px
      )`;
    case "gradient":
      return `linear-gradient(135deg, ${secondary} 0%, ${c2} 100%)`;
    case "circles":
      return `radial-gradient(circle at 20% 20%, ${c2} 0%, transparent 40%),
              radial-gradient(circle at 80% 80%, ${c2} 0%, transparent 40%),
              ${secondary}`;
    case "solid":
    default:
      return secondary;
  }
}
