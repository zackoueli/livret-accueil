import { ServicePriceType } from "@/types";

export interface DefaultServiceDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  priceType: ServicePriceType;
  amount: number; // centimes, EUR
}

export const DEFAULT_SERVICES: DefaultServiceDefinition[] = [
  { id: "late_checkout",     name: "Départ tardif",           description: "Profitez de votre matinée, libérez le logement plus tard.", emoji: "🕐", priceType: "one_time", amount: 2000 },
  { id: "early_checkin",     name: "Arrivée anticipée",        description: "Accédez au logement avant l'heure standard d'arrivée.",      emoji: "🔑", priceType: "one_time", amount: 1500 },
  { id: "breakfast",         name: "Petit-déjeuner",           description: "Petit-déjeuner préparé et livré chaque matin.",               emoji: "🥐", priceType: "per_day",  amount: 1500 },
  { id: "champagne_welcome", name: "Accueil avec champagne",   description: "Une bouteille de champagne vous attend à votre arrivée.",     emoji: "🥂", priceType: "one_time", amount: 3000 },
  { id: "extra_cleaning",    name: "Ménage supplémentaire",    description: "Un passage de ménage additionnel pendant votre séjour.",      emoji: "🧹", priceType: "one_time", amount: 4000 },
  { id: "airport_transfer",  name: "Transfert aéroport",       description: "Prise en charge et dépose à l'aéroport le plus proche.",      emoji: "🚗", priceType: "one_time", amount: 3500 },
];
