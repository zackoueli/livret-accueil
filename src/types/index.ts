export type Plan = "free" | "pro" | "agency";
export type BillingPeriod = "monthly" | "yearly";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  plan: Plan;
  billingPeriod?: BillingPeriod;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "trialing";
  subscriptionEndDate?: number;
  createdAt: number;
  translationCharsUsed?: number;
  translationCharsMonth?: string; // "YYYY-MM"
}

// ── Modules ────────────────────────────────────────────────────────────────────

export type ModuleType =
  // Modules principaux
  | "arrival"       // 🔑 Arrivée & Départ
  | "accommodation" // 🏠 Le logement
  | "rules"         // 📋 Règles du séjour
  | "kitchen"       // 🍳 Cuisine & Ménage
  | "neighborhood"  // 📍 Quartier & Activités
  | "safety"        // 🚨 Sécurité & Urgences
  | "contact"       // 📞 Contact & Services
  | "checkout"      // ⭐ Départ & Avis
  // Modules optionnels
  | "baby"          // 👶 Bébé & Enfants
  | "pets"          // 🐾 Animaux acceptés
  | "pool"          // 🏊 Piscine & Extérieur
  | "coworking"     // 💻 Télétravail
  | "transport"     // 🚗 Transport & Parking
  | "accessibility" // ♿ Accessibilité
  | "experiences"   // 🗺️ Expériences locales
  | "eco"           // 🌿 Éco-responsable
  | "practical"     // ℹ️ Infos pratiques
  | "tides"         // 🌊 Marées
  | "weather";      // ⛅ Météo

export interface BookletDocument {
  url: string;
  name: string;
  size?: number;
}

export interface BookletModule {
  id: string;
  type: ModuleType;
  enabled: boolean;
  order: number;
  content: Record<string, string>;
  images?: string[];
  documents?: BookletDocument[];
}

export interface CheckIn {
  id: string;
  bookletId: string;
  guestName: string;
  guestEmail: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  signature: string;
  acceptedRules: boolean;
  createdAt: number;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: number;
}

export type SupportedLang = "fr" | "en" | "es" | "de" | "it" | "ar";

export interface LangMeta {
  code: SupportedLang;
  label: string;
  flag: string;
  dir?: "rtl";
}

export const SUPPORTED_LANGS: LangMeta[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
];

// Traductions d'un livret : par langue, par moduleId, par champ
export type BookletTranslations = Record<
  SupportedLang,
  Record<string, Record<string, string>> // moduleId → { field: value }
>;

export interface Booklet {
  id: string;
  userId: string;
  templateId?: string;
  paletteId?: string;
  folderId?: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  accentColor: string;
  propertyName: string;
  address?: string;
  modules: BookletModule[];
  isPublished: boolean;
  viewCount?: number;
  translations?: Partial<BookletTranslations>;
  createdAt: number;
  updatedAt: number;
}
