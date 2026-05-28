export type Plan = "free" | "actif";
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
}

export type ModuleType =
  | "welcome"
  | "practical"
  | "checkin"
  | "rules"
  | "guide"
  | "contacts"
  | "activities"
  | "gooddeals"
  | "transport"
  | "faq"
  | "upselling";

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

export type SplashMediaType = "image" | "video";
export type SplashTitleFont = "sans" | "serif" | "mono";
export type SplashTitleSize = "sm" | "md" | "lg" | "xl";
export type SplashTitleWeight = "normal" | "semibold" | "bold" | "black";
export type SplashOverlay = "none" | "light" | "medium" | "dark";

export interface SplashConfig {
  // Média de fond
  mediaType?: SplashMediaType;
  mediaUrl?: string;
  youtubeUrl?: string;
  overlayOpacity?: SplashOverlay;
  // Contenu texte
  customTitle?: string;              // surcharge propertyName
  customSubtitle?: string;           // surcharge description
  badgeText?: string;                // petit texte au-dessus du titre (ex: "Livret d'accueil")
  buttonText?: string;               // surcharge "Ouvrir le livret →"
  // Style titre
  titleFont?: SplashTitleFont;
  titleSize?: SplashTitleSize;
  titleWeight?: SplashTitleWeight;
  titleColor?: string;
  subtitleColor?: string;
  // Style bouton
  buttonColor?: string;
  buttonTextColor?: string;
  // Logo
  logoUrl?: string;
  logoSize?: "sm" | "md" | "lg";
}

export interface CheckIn {
  id: string;
  bookletId: string;
  guestName: string;
  guestEmail: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  signature: string; // base64 dataURL
  acceptedRules: boolean;
  createdAt: number;
}

export interface Booklet {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  accentColor: string;
  logoUrl?: string;
  propertyName: string;
  address?: string;
  modules: BookletModule[];
  defaultLanguage: string;
  availableLanguages: string[];
  isPublished: boolean;
  viewCount?: number;
  splashConfig?: SplashConfig;
  createdAt: number;
  updatedAt: number;
}
