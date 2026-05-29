import { ModuleType } from "@/types";

export const MODULE_META: Record<ModuleType, { label: string; emoji: string; description: string }> = {
  welcome:    { label: "Bienvenue",          emoji: "👋", description: "Message d'accueil personnalisé" },
  practical:  { label: "Infos pratiques",    emoji: "📋", description: "WiFi, codes d'accès, parking" },
  checkin:    { label: "Check-in / Check-out", emoji: "🗝️", description: "Horaires et procédures d'arrivée" },
  rules:      { label: "Règlement intérieur", emoji: "📜", description: "Règles de la maison" },
  guide:      { label: "Guide de la maison",  emoji: "🏠", description: "Électroménager, chauffage, déchets" },
  contacts:   { label: "Contacts",            emoji: "📞", description: "Urgences, propriétaire, voisins" },
  activities: { label: "Activités locales",   emoji: "🗺️", description: "Randonnées, visites, plages" },
  gooddeals:  { label: "Bons plans",          emoji: "⭐", description: "Restaurants, commerces, marchés" },
  transport:  { label: "Transport",           emoji: "🚗", description: "Accès, taxi, transports en commun" },
  faq:        { label: "FAQ",                 emoji: "💬", description: "Questions fréquentes des voyageurs" },
  upselling:  { label: "Services & Boutique", emoji: "🛍️", description: "Proposez des services à vos voyageurs" },
};

export const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English",  flag: "🇬🇧" },
  { code: "es", label: "Español",  flag: "🇪🇸" },
  { code: "de", label: "Deutsch",  flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

export const MODULE_FIELDS: Record<ModuleType, { key: string; label: string; placeholder: string; type: "text" | "textarea" | "richtext" | "video" | "places" | "time" }[]> = {
  welcome: [
    { key: "title",   label: "Titre",          placeholder: "Bienvenue au Gîte des Pins !", type: "text" },
    { key: "message", label: "Message d'accueil", placeholder: "Nous sommes ravis de vous accueillir...", type: "richtext" },
    { key: "video",   label: "Vidéo de bienvenue (YouTube / Vimeo)", placeholder: "https://youtube.com/watch?v=...", type: "video" },
  ],
  practical: [
    { key: "wifi_name",     label: "Nom du WiFi",       placeholder: "GîtePins_2024",    type: "text" },
    { key: "wifi_password", label: "Mot de passe WiFi", placeholder: "monmotdepasse",     type: "text" },
    { key: "door_code",     label: "Code d'entrée",     placeholder: "1234",              type: "text" },
    { key: "parking",       label: "Parking",           placeholder: "Stationnement libre devant la maison", type: "textarea" },
    { key: "other",         label: "Autres infos",      placeholder: "Boîte à clés au portail...", type: "textarea" },
  ],
  checkin: [
    { key: "checkin_time",    label: "Heure d'arrivée",    placeholder: "16:00",  type: "time" },
    { key: "checkout_time",   label: "Heure de départ",    placeholder: "11:00",  type: "time" },
    { key: "checkin_process", label: "Procédure d'arrivée", placeholder: "Les clés se trouvent dans la boîte à clés...", type: "richtext" },
    { key: "checkout_process",label: "Procédure de départ", placeholder: "Merci de laisser les clés sur la table...", type: "richtext" },
  ],
  rules: [
    { key: "rules", label: "Règlement de la maison", placeholder: "• Pas de fumée à l'intérieur\n• Animaux acceptés sur accord\n• Respectez le voisinage après 22h...", type: "richtext" },
  ],
  guide: [
    { key: "heating",    label: "Chauffage",        placeholder: "Le thermostat se trouve dans le couloir...", type: "textarea" },
    { key: "appliances", label: "Électroménager",   placeholder: "La machine à laver est au sous-sol...", type: "textarea" },
    { key: "trash",      label: "Tri des déchets",  placeholder: "Poubelles jaunes : plastiques...", type: "textarea" },
    { key: "other",      label: "Autres infos",     placeholder: "Le jardin est accessible librement...", type: "textarea" },
    { key: "video",      label: "Vidéo explicative (YouTube / Vimeo)", placeholder: "https://youtube.com/watch?v=...", type: "video" },
  ],
  contacts: [
    { key: "owner_name",  label: "Nom du propriétaire", placeholder: "Jean Dupont",       type: "text" },
    { key: "owner_phone", label: "Téléphone",            placeholder: "06 12 34 56 78",    type: "text" },
    { key: "emergency",   label: "Urgences",             placeholder: "15 (SAMU), 17 (Police), 18 (Pompiers)", type: "textarea" },
    { key: "doctor",      label: "Médecin local",        placeholder: "Dr. Martin — 04 90 12 34 56", type: "text" },
    { key: "neighbors",   label: "Voisins",              placeholder: "Les Dupuis au n°12 peuvent vous aider", type: "textarea" },
  ],
  activities: [
    { key: "activities", label: "Activités recommandées", placeholder: "• Randonnée aux Baux-de-Provence (15 min)\n• Kayak sur le Rhône...", type: "richtext" },
    { key: "places", label: "Points d'intérêt (un par ligne : Nom | Adresse)", placeholder: "Château des Baux | Les Baux-de-Provence, 13520\nGorges du Verdon | Route des Gorges, 04120", type: "places" },
  ],
  gooddeals: [
    { key: "restaurants", label: "Restaurants",  placeholder: "• Le Mas des Alpilles ⭐⭐⭐\n• La Boulangerie du Village...", type: "richtext" },
    { key: "shops",       label: "Commerces",    placeholder: "• Supermarché Carrefour (2 km)\n• Marché le mardi matin...", type: "textarea" },
    { key: "others",      label: "Autres bons plans", placeholder: "Producteurs locaux, caves...", type: "textarea" },
    { key: "places", label: "Adresses à retrouver (un par ligne : Nom | Adresse)", placeholder: "Le Mas des Alpilles | Route d'Arles, 13520 Les Baux\nBoulangerie Martin | 12 rue du Four, 13520", type: "places" },
  ],
  transport: [
    { key: "by_car",    label: "En voiture",        placeholder: "Depuis Avignon : D99 direction Maussane (20 min)", type: "textarea" },
    { key: "by_train",  label: "En train",          placeholder: "Gare la plus proche : Avignon TGV (25 km)", type: "textarea" },
    { key: "taxi",      label: "Taxi / VTC",        placeholder: "Taxi Provence : 06 XX XX XX XX", type: "text" },
    { key: "airport",   label: "Aéroport",          placeholder: "Aéroport Marseille-Provence (45 min)", type: "textarea" },
  ],
  faq: [
    { key: "faq", label: "Questions fréquentes", placeholder: "Q: Y a-t-il du linge de maison ?\nR: Oui, draps et serviettes sont fournis.\n\nQ: Les animaux sont-ils acceptés ?...", type: "richtext" },
  ],
  upselling: [
    { key: "intro", label: "Introduction", placeholder: "Profitez de nos services pour rendre votre séjour inoubliable...", type: "textarea" },
    { key: "items", label: "Services (format : Nom | Description | Prix | Lien)", placeholder: "Transfert aéroport | Navette privée | 45€ | https://...\nPetit-déjeuner | Livré chaque matin | 12€/pers | https://...", type: "places" },
  ],
};
