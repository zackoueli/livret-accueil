export type Plan = "free" | "starter" | "pro" | "agency";
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
  cancelAtPeriodEnd?: boolean;
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

// ── Affiliation ────────────────────────────────────────────────────────────────

export interface ReferralCode {
  userId: string;
  code: string;
  createdAt: number;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  code: string;
  status: "pending" | "converted" | "expired";
  createdAt: number;
  convertedAt?: number;
  expiresAt?: number;
}

export interface AffiliateCommission {
  id: string;
  referralId: string;
  referrerId: string;
  referredId: string;
  stripeInvoiceId: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: number;
  paidAt?: number;
  stripeTransferId?: string;
}

export interface AffiliateAccount {
  userId: string;
  stripeAccountId: string;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  totalEarned: number;
  totalPaid: number;
  createdAt: number;
}

export interface Booklet {
  id: string;
  userId: string;
  ownerPlan?: Plan;
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
