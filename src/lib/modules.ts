import { ModuleType } from "@/types";

export type FieldType = "text" | "textarea" | "time" | "phone" | "url" | "number" | "places";

export interface ModuleField {
  key: string;
  label: string;
  placeholder: string;
  type: FieldType;
  hint?: string;
}

export interface ModuleMeta {
  label: string;
  emoji: string;
  description: string;
  optional?: boolean;
}

// ── Métadonnées ────────────────────────────────────────────────────────────────

export const MODULE_META: Record<ModuleType, ModuleMeta> = {
  // Principaux
  arrival:       { label: "Arrivée & Départ",      emoji: "🔑", description: "Check-in/out, codes d'accès, clés, horaires" },
  accommodation: { label: "Le logement",            emoji: "🏠", description: "WiFi, équipements, chauffage, climatisation" },
  rules:         { label: "Règles du séjour",       emoji: "📋", description: "Animaux, fumeurs, nuisances, capacité" },
  kitchen:       { label: "Cuisine & Ménage",       emoji: "🍳", description: "Ustensiles, poubelles, linge, produits" },
  neighborhood:  { label: "Quartier & Activités",   emoji: "📍", description: "Restaurants, commerces, transports, attractions" },
  safety:        { label: "Sécurité & Urgences",    emoji: "🚨", description: "Numéros utiles, extincteur, disjoncteur" },
  contact:       { label: "Contact & Services",     emoji: "📞", description: "Hôte, conciergerie, maintenance" },
  checkout:      { label: "Départ & Avis",          emoji: "⭐", description: "Procédure de départ, laisser un avis" },
  // Optionnels
  baby:          { label: "Bébé & Enfants",         emoji: "👶", description: "Lit bébé, équipements enfants", optional: true },
  pets:          { label: "Animaux acceptés",       emoji: "🐾", description: "Zones autorisées, règles pour animaux", optional: true },
  pool:          { label: "Piscine & Extérieur",    emoji: "🏊", description: "Horaires, règles de sécurité piscine", optional: true },
  coworking:     { label: "Télétravail",            emoji: "💻", description: "Bureau, WiFi pro, écrans disponibles", optional: true },
  transport:     { label: "Transport & Parking",    emoji: "🚗", description: "Place dédiée, accès, transports en commun", optional: true },
  accessibility: { label: "Accessibilité",          emoji: "♿", description: "Équipements PMR, ascenseur, accès adapté", optional: true },
  experiences:   { label: "Expériences locales",    emoji: "🗺️", description: "Bons plans du propriétaire", optional: true },
  eco:           { label: "Éco-responsable",        emoji: "🌿", description: "Tri, économies d'énergie, gestes verts", optional: true },
  practical:     { label: "Infos pratiques",        emoji: "ℹ️", description: "Pharmacie, médecin, mairie, services", optional: true },
};

// ── Champs par module ──────────────────────────────────────────────────────────

export const MODULE_FIELDS: Record<ModuleType, ModuleField[]> = {
  arrival: [
    { key: "checkin_time",    label: "Heure d'arrivée",       placeholder: "16:00",                              type: "time" },
    { key: "checkout_time",   label: "Heure de départ",       placeholder: "11:00",                              type: "time" },
    { key: "access_code",     label: "Code d'accès / digicode", placeholder: "1234A",                            type: "text" },
    { key: "key_location",    label: "Localisation des clés", placeholder: "Boîte à clés au portail, code 5678", type: "textarea" },
    { key: "checkin_process", label: "Procédure d'arrivée",   placeholder: "1. Composer le code...\n2. Monter au 2e étage...", type: "textarea" },
    { key: "parking",         label: "Stationnement",         placeholder: "Place n°12 dans le parking souterrain", type: "textarea" },
  ],

  accommodation: [
    { key: "wifi_name",     label: "Nom du WiFi",        placeholder: "MonLogement_5G",       type: "text" },
    { key: "wifi_password", label: "Mot de passe WiFi",  placeholder: "motdepasse123",         type: "text" },
    { key: "heating",       label: "Chauffage",          placeholder: "Thermostat dans le couloir, régler à 20°C...", type: "textarea" },
    { key: "ac",            label: "Climatisation",      placeholder: "Télécommande dans le tiroir de la commode...", type: "textarea" },
    { key: "appliances",    label: "Électroménager",     placeholder: "Machine à laver au sous-sol, programme 40°...", type: "textarea" },
    { key: "tv",            label: "TV & Divertissements", placeholder: "Netflix inclus, login : ...",            type: "textarea" },
    { key: "other",         label: "Autres équipements", placeholder: "Lave-vaisselle, aspirateur dans le placard...", type: "textarea" },
  ],

  rules: [
    { key: "max_guests",  label: "Nombre maximum de personnes", placeholder: "4 personnes maximum",      type: "text" },
    { key: "smoking",     label: "Règle tabac",                 placeholder: "Non-fumeur strictement. Balcon autorisé.", type: "textarea" },
    { key: "pets",        label: "Animaux",                     placeholder: "Animaux non acceptés / Chiens acceptés sous conditions.", type: "textarea" },
    { key: "noise",       label: "Nuisances sonores",           placeholder: "Silence après 22h, voisins proches.", type: "textarea" },
    { key: "parties",     label: "Fêtes & événements",          placeholder: "Fêtes et événements non autorisés.", type: "textarea" },
    { key: "other",       label: "Autres règles",               placeholder: "Merci de retirer vos chaussures...",  type: "textarea" },
  ],

  kitchen: [
    { key: "equipment",   label: "Équipements disponibles",  placeholder: "Four, micro-ondes, cafetière Nespresso, grille-pain...", type: "textarea" },
    { key: "trash",       label: "Poubelles & tri sélectif", placeholder: "Jaune : plastiques\nVert : verre\nGris : déchets généraux", type: "textarea" },
    { key: "linen",       label: "Linge de maison",          placeholder: "Draps et serviettes fournis. Rechange dans l'armoire.", type: "textarea" },
    { key: "cleaning",    label: "Ménage & produits",        placeholder: "Produits sous l'évier. Aspirateur dans le placard couloir.", type: "textarea" },
    { key: "checkout_cleaning", label: "Ménage au départ",  placeholder: "Merci de faire la vaisselle et sortir les poubelles.", type: "textarea" },
  ],

  neighborhood: [
    { key: "restaurants", label: "Restaurants & cafés",   placeholder: "Le Bistrot du Coin (5 min) — notre préféré !\nPizzeria Napoli (10 min)", type: "textarea" },
    { key: "shops",       label: "Commerces & marchés",   placeholder: "Supermarché Carrefour (2 min à pied)\nMarché le samedi matin place de la mairie", type: "textarea" },
    { key: "activities",  label: "Activités & attractions", placeholder: "Musée de la ville (15 min)\nPlage à 20 min en voiture", type: "textarea" },
    { key: "transport",   label: "Transports",             placeholder: "Bus n°5 arrêt à 100m (toutes les 10 min)\nGare à 2km", type: "textarea" },
    { key: "places",      label: "Lieux avec adresses",   placeholder: "Boulangerie Paul | 12 rue de la Paix\nPharmaceute | 3 avenue du Général", type: "places",
      hint: "Format : Nom du lieu | Adresse (une ligne par lieu)" },
  ],

  safety: [
    { key: "emergency",      label: "Numéros d'urgence",      placeholder: "SAMU : 15\nPompiers : 18\nPolice : 17\nUrgences EU : 112", type: "textarea" },
    { key: "owner_phone",    label: "Téléphone de l'hôte",    placeholder: "+33 6 12 34 56 78",  type: "phone" },
    { key: "fire_extinguisher", label: "Extincteur",          placeholder: "Dans le couloir à côté de la porte d'entrée.", type: "textarea" },
    { key: "circuit_breaker",   label: "Disjoncteur électrique", placeholder: "Placard technique en bas des escaliers.", type: "textarea" },
    { key: "water_shutoff",     label: "Coupure d'eau",       placeholder: "Vanne principale sous l'évier de la cuisine.", type: "textarea" },
    { key: "hospital",          label: "Hôpital / urgences",  placeholder: "CHU de Bordeaux — 10 min en voiture, 33 rue de la République", type: "textarea" },
  ],

  contact: [
    { key: "host_name",         label: "Nom de l'hôte",          placeholder: "Jean Dupont",          type: "text" },
    { key: "host_phone",        label: "Téléphone",               placeholder: "+33 6 12 34 56 78",    type: "phone" },
    { key: "host_email",        label: "Email",                   placeholder: "jean@exemple.fr",      type: "text" },
    { key: "response_time",     label: "Délai de réponse",        placeholder: "Je réponds en général sous 1h.",   type: "text" },
    { key: "concierge",         label: "Conciergerie / service",  placeholder: "Conciergerie disponible 24h/24 au...", type: "textarea" },
    { key: "maintenance",       label: "Maintenance / pannes",    placeholder: "En cas de panne, contacter Michel au 06...", type: "textarea" },
  ],

  checkout: [
    { key: "checkout_time",    label: "Heure de départ",          placeholder: "11:00",  type: "time" },
    { key: "process",          label: "Procédure de départ",      placeholder: "1. Sortir les poubelles\n2. Fermer toutes les fenêtres\n3. Déposer les clés...", type: "textarea" },
    { key: "keys_return",      label: "Retour des clés",          placeholder: "Laisser les clés sur la table de l'entrée.", type: "textarea" },
    { key: "review_airbnb",    label: "Lien avis Airbnb",         placeholder: "https://airbnb.com/...",  type: "url" },
    { key: "review_google",    label: "Lien avis Google",         placeholder: "https://g.page/...",      type: "url" },
    { key: "thank_you",        label: "Message de remerciement",  placeholder: "Merci pour votre séjour ! Nous espérons vous revoir bientôt.", type: "textarea" },
  ],

  // ── Optionnels ───────────────────────────────────────────────────────────────

  baby: [
    { key: "available",  label: "Équipements bébé disponibles", placeholder: "Lit bébé, chaise haute, baignoire bébé.", type: "textarea" },
    { key: "safety",     label: "Sécurité enfants",             placeholder: "Protège-prises installés, barrière escalier disponible.", type: "textarea" },
    { key: "rental",     label: "Location possible",            placeholder: "Poussette disponible sur demande.", type: "textarea" },
  ],

  pets: [
    { key: "rules",      label: "Règles pour animaux",          placeholder: "Chiens acceptés max 2, non autorisés sur les canapés.", type: "textarea" },
    { key: "zones",      label: "Zones autorisées",             placeholder: "Accès libre sauf chambre principale.", type: "textarea" },
    { key: "nearby",     label: "Parcs & vétérinaires proches", placeholder: "Parc à chiens à 5 min. Vétérinaire rue de la Forêt.", type: "textarea" },
  ],

  pool: [
    { key: "hours",      label: "Horaires",                     placeholder: "Accessible de 8h à 22h.", type: "textarea" },
    { key: "rules",      label: "Règles de sécurité",           placeholder: "Pas de plongeons. Douche obligatoire. Surveillance parentale.", type: "textarea" },
    { key: "equipment",  label: "Équipements disponibles",      placeholder: "Transats, parasols, serviettes de piscine dans la cabane.", type: "textarea" },
    { key: "maintenance", label: "Entretien",                   placeholder: "La piscine est traitée chaque lundi.", type: "textarea" },
  ],

  coworking: [
    { key: "desk",       label: "Espace de travail",            placeholder: "Bureau ergonomique dans la chambre 2, lampe et prises.", type: "textarea" },
    { key: "wifi_pro",   label: "WiFi dédié",                   placeholder: "Réseau : WorkSpace_Pro — Mdp : travail2024", type: "textarea" },
    { key: "screens",    label: "Écrans disponibles",           placeholder: "Écran 27\" avec câble HDMI dans le placard.", type: "textarea" },
    { key: "printing",   label: "Impression",                   placeholder: "Imprimante dans le bureau, papier dans le tiroir du bas.", type: "textarea" },
  ],

  transport: [
    { key: "parking",    label: "Parking dédié",                placeholder: "Place n°8 dans le parking privé, badge dans l'entrée.", type: "textarea" },
    { key: "public",     label: "Transports en commun",         placeholder: "Métro ligne 2 à 3 min à pied (station République).", type: "textarea" },
    { key: "taxi",       label: "Taxi / VTC",                   placeholder: "Uber disponible. Taxi local : 06 XX XX XX XX", type: "textarea" },
    { key: "bike",       label: "Vélos & trottinettes",         placeholder: "2 vélos disponibles dans le garage (casques inclus).", type: "textarea" },
    { key: "airport",    label: "Aéroport",                     placeholder: "Aéroport CDG à 35 min. RER B depuis Châtelet.", type: "textarea" },
  ],

  accessibility: [
    { key: "access",     label: "Accès",                        placeholder: "Entrée de plain-pied, pas de marches.", type: "textarea" },
    { key: "elevator",   label: "Ascenseur",                    placeholder: "Ascenseur disponible, porte 80cm.", type: "textarea" },
    { key: "bathroom",   label: "Salle de bain adaptée",        placeholder: "Douche à l'italienne, barres d'appui.", type: "textarea" },
    { key: "equipment",  label: "Équipements PMR",              placeholder: "Fauteuil roulant disponible sur demande.", type: "textarea" },
  ],

  experiences: [
    { key: "hidden_gems", label: "Coups de cœur",               placeholder: "La Brouette — restaurant caché rue des Arts, réservation conseillée.", type: "textarea" },
    { key: "activities",  label: "Activités recommandées",      placeholder: "Kayak sur la rivière (location à 10 min), randonnée du Rocher...", type: "textarea" },
    { key: "events",      label: "Événements locaux",           placeholder: "Marché nocturne le vendredi soir en été.", type: "textarea" },
    { key: "places",      label: "Lieux avec adresses",         placeholder: "Cave à vins | 5 rue du Château\nFerme bio | Route de Montagne", type: "places",
      hint: "Format : Nom du lieu | Adresse (une ligne par lieu)" },
  ],

  eco: [
    { key: "sorting",    label: "Tri des déchets",              placeholder: "Jaune : plastiques, canettes\nVert : verre\nGris : tout le reste.", type: "textarea" },
    { key: "energy",     label: "Économies d'énergie",          placeholder: "Éteignez la climatisation en quittant le logement.", type: "textarea" },
    { key: "water",      label: "Économies d'eau",              placeholder: "La région est sujette à la sécheresse, merci d'économiser l'eau.", type: "textarea" },
    { key: "other",      label: "Autres gestes verts",          placeholder: "Produits ménagers écologiques fournis.", type: "textarea" },
  ],

  practical: [
    { key: "pharmacy",   label: "Pharmacie",                    placeholder: "Pharmacie du Centre — 10 rue Gambetta, ouverte 9h-19h.", type: "textarea" },
    { key: "doctor",     label: "Médecin",                      placeholder: "Dr. Martin — 05 56 XX XX XX (sur RDV).", type: "textarea" },
    { key: "supermarket", label: "Supermarché",                 placeholder: "Carrefour City à 200m, ouvert 7h-22h7j/7.", type: "textarea" },
    { key: "city_hall",  label: "Mairie & services",            placeholder: "Mairie ouverte lundi-vendredi 9h-17h.", type: "textarea" },
    { key: "laundry",    label: "Laverie",                      placeholder: "Laverie automatique rue de la Gare, ouverte 24h/24.", type: "textarea" },
  ],
};

// ── Modules principaux (toujours présents par défaut) ─────────────────────────

export const CORE_MODULES: ModuleType[] = [
  "arrival",
  "accommodation",
  "rules",
  "kitchen",
  "neighborhood",
  "safety",
  "contact",
  "checkout",
];

// ── Modules optionnels ────────────────────────────────────────────────────────

export const OPTIONAL_MODULES: ModuleType[] = [
  "baby",
  "pets",
  "pool",
  "coworking",
  "transport",
  "accessibility",
  "experiences",
  "eco",
  "practical",
];

// ── Formatage de l'heure HH:MM → HHhMM ───────────────────────────────────────

export function formatTime(val: string): string {
  if (!val) return val;
  const m = val.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return `${m[1]}h${m[2]}`;
  return val;
}
