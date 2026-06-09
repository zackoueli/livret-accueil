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
  | "practical";    // ℹ️ Infos pratiques

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

export interface Booklet {
  id: string;
  userId: string;
  templateId?: string;
  paletteId?: string;
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
  createdAt: number;
  updatedAt: number;
}
