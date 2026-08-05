export type Plan = "free" | "starter" | "pro" | "agency";
export type BillingPeriod = "monthly" | "yearly";

export type ReferralSource =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "google"
  | "word_of_mouth"
  | "other";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  plan: Plan;
  billingPeriod?: BillingPeriod;
  referralSource?: ReferralSource;
  referralSourceDetail?: string;
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
  | "weather"       // ⛅ Météo
  | "addons";       // 💳 Services payants

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
  /** Langue dans laquelle le contenu de base du livret est rédigé (langue de l'interface à la création) */
  defaultLang?: SupportedLang;
  isPublished: boolean;
  viewCount?: number;
  translations?: Partial<BookletTranslations>;
  /** Dénormalisé depuis host_connect_accounts : services payants achetables sur ce livret */
  addonsPurchasable?: boolean;
  createdAt: number;
  updatedAt: number;
}

// ── Services payants (add-ons) ──────────────────────────────────────────────────

// Un service n'a qu'un seul mécanisme de prix à la fois :
// - one_time  : prix fixe (amount)
// - per_day   : prix × nombre de jours (amount, quantité saisie à l'achat)
// - per_unit  : prix × quantité sur une unité libre (amount = prix/unité, unitLabel/min/max)
// - choice    : le voyageur choisit une quantité pour chacun des choix proposés (choices),
//               le total est la somme de (quantité × prix) sur les choix sélectionnés
export type ServicePriceType = "one_time" | "per_day" | "per_unit" | "choice";

export interface ServiceChoiceItem {
  id: string;
  label: string;
  amount: number; // centimes, prix par unité de ce choix
  maxQuantity: number; // quantité maximale sélectionnable pour ce choix
}

export interface BookletService {
  id: string;
  bookletId: string;
  hostUid: string;
  sourceServiceId?: string;
  isDefault: boolean;
  name: string;
  description?: string;
  emoji?: string;
  image?: string;
  priceType: ServicePriceType;
  amount: number; // centimes, EUR — prix fixe/par jour/par unité (ignoré si priceType === "choice")
  currency: "eur";
  enabled: boolean;
  order: number;
  // priceType === "per_unit"
  unitLabel?: string;
  unitMin?: number;
  unitMax?: number;
  // priceType === "choice"
  choices?: ServiceChoiceItem[];
  createdAt: number;
  updatedAt: number;
}

export interface ServicePurchaseChoiceSelection {
  label: string;
  quantity: number;
}

export interface ServicePurchase {
  id: string;
  bookletId: string;
  serviceId: string;
  hostUid: string;
  serviceName: string;
  quantity: number; // pour per_day/per_unit — unitLabel snapshotté séparément
  unitLabel?: string;
  choiceSelections?: ServicePurchaseChoiceSelection[]; // si priceType === "choice" au moment de l'achat
  amountTotal: number; // centimes
  commissionAmount: number; // centimes
  commissionRate: number; // %
  hostPayoutAmount: number; // centimes
  currency: "eur";
  guestEmail?: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string;
  status: "pending" | "paid" | "failed" | "refunded";
  createdAt: number;
  paidAt?: number;
}

export interface HostConnectAccount {
  userId: string;
  stripeAccountId: string;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  createdAt: number;
}
