import { BookletModule } from "@/types";
import { nanoid } from "nanoid";

export interface BookletTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  accentColor: string;
  propertyName: string;
  address: string;
  modules: () => BookletModule[];
}

function makeModules(content: Record<string, Record<string, string>>): BookletModule[] {
  const types = ["arrival", "accommodation", "rules", "kitchen", "neighborhood", "safety", "contact", "checkout"] as const;
  return types.map((type, i) => ({
    id: nanoid(),
    type,
    enabled: true,
    order: i,
    content: content[type] ?? {},
    images: [],
    documents: [],
  }));
}

export const TEMPLATES: BookletTemplate[] = [
  {
    id: "blank",
    name: "Vierge",
    emoji: "✨",
    description: "Partez de zéro et remplissez chaque champ à votre rythme.",
    accentColor: "#007AFF",
    propertyName: "",
    address: "",
    modules: () => makeModules({}),
  },

  {
    id: "villa",
    name: "Villa & Maison",
    emoji: "🏡",
    description: "Idéal pour une maison avec jardin, piscine ou terrain.",
    accentColor: "#f97316",
    propertyName: "Villa Les Palmiers",
    address: "12 chemin des Oliviers, 06160 Juan-les-Pins",
    modules: () => makeModules({
      arrival: {
        welcome_message: "Bienvenue à la Villa Les Palmiers ! Nous sommes ravis de vous accueillir. Vous trouverez tout ce dont vous avez besoin dans ce livret. N'hésitez pas à nous contacter si vous avez la moindre question.",
        checkin_time: "16:00",
        checkout_time: "11:00",
        access_code: "4782",
        key_location: "Boîte à clés fixée au portail, code 4782. Merci de la remettre en place après chaque sortie.",
        checkin_process: "Composez le code 4782 sur le digicode du portail\nSuivez l'allée jusqu'à l'entrée principale\nLes clés sont dans la boîte à clés à droite de la porte\nCode boîte : 4782\nBienvenue !",
        parking: "2 places dans l'allée, portail automatique avec la télécommande dans l'entrée.",
      },
      accommodation: {
        wifi_name: "VillaLesPalmiers_5G",
        wifi_password: "soleil2024",
        heating: "Thermostat Nest dans le couloir principal. Régler entre 19°C et 22°C maximum. Ne pas dépasser 22°C.",
        ac: "Climatisation réversible dans chaque chambre. Télécommande sur la table de chevet. Mode snowflake pour le froid.",
        appliances: "Machine à laver : buanderie au rez-de-chaussée, programme 40°C recommandé.\nSèche-linge : idem, programme coton 60 min.\nLave-vaisselle : cuisine, pastilles sous l'évier.",
        tv: "TV Samsung 65\" avec Netflix, Prime Video et Canal+. Identifiants sur la carte posée sur la TV.\nTNT disponible, bouton SOURCE pour changer.",
        other: "Barbecue sur la terrasse (charbon dans le placard extérieur), piscine chauffée à 26°C d'avril à octobre.",
      },
      rules: {
        max_guests: "8 personnes maximum.",
        smoking: "Non-fumeur à l'intérieur. Fumoir autorisé sur la terrasse côté jardin uniquement.",
        pets: "Animaux acceptés sur demande préalable. Maximum 2 animaux de compagnie. Interdits sur les canapés et dans les chambres.",
        noise: "Silence après 22h, voisins proches. Musique en extérieur tolérée jusqu'à 21h.",
        parties: "Événements et fêtes non autorisés sans accord préalable écrit.",
        other: "Merci de retirer vos chaussures à l'entrée. Piscine interdite aux enfants non surveillés.",
      },
      kitchen: {
        equipment: "Cuisine entièrement équipée : four, micro-ondes, cafetière Nespresso (capsules fournies), grille-pain, blender, plancha électrique.",
        trash: "Jaune : plastiques et cartons\nVert : verre uniquement\nGris : déchets ménagers\nCollecte : mardi et vendredi matin, sortir les poubelles la veille.",
        linen: "Draps et serviettes fournis et changés en milieu de séjour (7 nuits+). Rechange dans l'armoire du couloir.",
        cleaning: "Produits ménagers sous l'évier cuisine et salle de bain. Aspirateur Dyson dans le placard couloir.",
        checkout_cleaning: "Merci de faire la vaisselle, sortir les poubelles, vider le réfrigérateur et laisser les clés sur la table de l'entrée.",
      },
      neighborhood: {
        transport: "Aéroport Nice Côte d'Azur à 15 min en voiture.\nTaxi local : +33 4 93 XX XX XX\nBus ligne 200 : arrêt à 300m, toutes les 20 min.",
        hidden_gems: "Le restaurant La Tonnelle à 5 min à pied — demandez la table en terrasse face à la mer. Réservation conseillée le week-end.",
      },
      safety: {
        emergency: "SAMU : 15\nPompiers : 18\nPolice : 17\nUrgences EU : 112\nAntipoison : 0 800 59 59 59",
        owner_phone: "+33 6 12 34 56 78",
        fire_extinguisher: "Extincteur rouge dans le couloir principal à côté des escaliers. Couverture anti-feu dans la cuisine.",
        circuit_breaker: "Tableau électrique dans le placard technique à l'entrée de la buanderie.",
        water_shutoff: "Vanne principale sous l'évier de la cuisine. Couper en cas de fuite.",
        hospital: "Clinique Saint-George — 15 min en voiture. Avenue de Californie, Nice.",
      },
      contact: {
        host_name: "Sophie & Marc",
        host_phone: "+33 6 12 34 56 78",
        host_email: "contact@villalespalmiers.fr",
        response_time: "Disponibles 9h-20h. Réponse en moins d'1h en général.",
        about: "Nous habitons à 10 minutes de la villa et sommes là pour rendre votre séjour parfait. N'hésitez pas !",
        concierge: "Conciergerie Riviera Prestige disponible 24h/24 : +33 4 93 XX XX XX",
        maintenance: "En cas de panne urgente hors heures : +33 6 98 76 54 32 (Pierre, gardien).",
      },
      checkout: {
        checkout_time: "11:00",
        process: "Faire la vaisselle et ranger la cuisine\nVider et nettoyer le réfrigérateur\nSortir les poubelles\nFermer toutes les fenêtres et portes\nÉteindre la climatisation et les lumières\nRemettre les clés dans la boîte à clés (code 4782)\nFermer le portail",
        keys_return: "Remettez les clés dans la boîte à clés à droite de la porte d'entrée et refermez le portail.",
        late_checkout_info: "Late checkout jusqu'à 14h sur demande (50€). Contactez-nous 48h avant.",
        review_airbnb: "https://airbnb.com/",
        review_google: "https://g.page/",
        thank_you: "Merci pour votre séjour à la Villa Les Palmiers ! Nous espérons vous revoir très vite sur la Côte d'Azur. 🌴",
      },
    }),
  },

  {
    id: "apartment",
    name: "Appartement urbain",
    emoji: "🏙️",
    description: "Parfait pour un appartement en ville, studio ou loft.",
    accentColor: "#8b5cf6",
    propertyName: "L'Appart du Marais",
    address: "15 rue de Bretagne, 75003 Paris",
    modules: () => makeModules({
      arrival: {
        welcome_message: "Bienvenue dans l'Appart du Marais ! Vous êtes au cœur du 3ème arrondissement, à deux pas des plus belles adresses parisiennes. Tout est prêt pour votre arrivée.",
        checkin_time: "15:00",
        checkout_time: "11:00",
        access_code: "1357B",
        key_location: "Boîte à clés sécurisée à gauche de la porte d'entrée de l'immeuble. Code 1357 puis appuyer sur B.",
        checkin_process: "Composer le code 1357B sur la boîte à clés\nPrendre la clé de l'appartement ET le badge immeuble\nEntrer code digicode immeuble : 3421\nMonter au 3ème étage, appartement 3B (à droite en sortant de l'ascenseur)\nLaisser les clés sur le plan de travail à votre départ",
        parking: "Parking public Sainte-Avoye à 200m (5€/nuit). Pas de stationnement sur place.",
        early_checkin: "Arrivée anticipée possible dès 12h sous réserve de disponibilité (30€). Contactez-nous 48h avant.",
      },
      accommodation: {
        wifi_name: "AppartMarais",
        wifi_password: "paris75003",
        heating: "Radiateurs électriques dans chaque pièce. Thermostat mural dans le salon, régler à 20°C max.",
        appliances: "Machine à laver dans la salle de bain (programme 30°C et 40°C). Sèche-linge non disponible — séchoir dans le placard couloir.\nLave-vaisselle sous le plan de travail.",
        tv: "TV avec Netflix inclus. Identifiants sur le carnet posé sur la TV.",
        checkin_code: "Boîte aux lettres n°12, code 4482.",
        other: "Digicode immeuble : 3421. Badge magnétique pour l'ascenseur dans le tiroir de l'entrée.",
      },
      rules: {
        max_guests: "4 personnes maximum (déclaration obligatoire).",
        smoking: "Strictement non-fumeur y compris sur le balcon (règlement de copropriété).",
        pets: "Animaux non acceptés.",
        noise: "Silence strict après 22h. Immeuble familial avec de jeunes enfants.",
        parties: "Aucune fête ni réunion autorisée.",
        other: "Respectez les voisins. Pas de musique après 22h. Poubelles dans le local en bas de l'immeuble.",
      },
      kitchen: {
        equipment: "Cuisine équipée : plaques à induction, four, micro-ondes, cafetière filtre Moccamaster, bouilloire, grille-pain.",
        trash: "Local poubelles en bas de l'immeuble (code 3421).\nJaune : plastiques et papiers\nVerre : bac vert\nGris : ordures ménagères\nCollecte quotidienne sauf dimanche.",
        linen: "Draps et serviettes fournis. Rechange dans le placard de la chambre (étagère du bas).",
        cleaning: "Produits sous l'évier. Balai et aspirateur dans le placard couloir.",
        checkout_cleaning: "Merci de faire la vaisselle, sortir les poubelles et laisser l'appartement propre.",
      },
      neighborhood: {
        transport: "Métro Arts et Métiers (lignes 3 et 11) à 3 min à pied.\nVélib' station à 50m.\nBus 75 et 96 à l'angle de la rue.",
        hidden_gems: "Marché des Enfants Rouges (plus vieux marché couvert de Paris) à 2 min — essayez le stand marocain, c'est exceptionnel !",
      },
      safety: {
        emergency: "SAMU : 15\nPompiers : 18\nPolice : 17\nUrgences EU : 112",
        owner_phone: "+33 6 23 45 67 89",
        fire_extinguisher: "Extincteur dans le placard de l'entrée.",
        circuit_breaker: "Tableau électrique dans le placard de l'entrée, en haut à droite.",
        water_shutoff: "Vanne principale sous l'évier de la cuisine.",
        hospital: "Hôpital Saint-Louis — 10 min à pied. 1 avenue Claude Vellefaux, Paris 10.",
      },
      contact: {
        host_name: "Julie",
        host_phone: "+33 6 23 45 67 89",
        host_email: "julie@appartmarais.fr",
        response_time: "Disponible 8h-22h, 7j/7. Je réponds généralement en moins de 30 minutes.",
        about: "Parisienne de naissance, je mets un point d'honneur à partager mes meilleures adresses. Mon livret de recommandations est sur la table basse !",
        maintenance: "Problème urgent : +33 6 23 45 67 89 (disponible 24h/24 pour les urgences).",
      },
      checkout: {
        checkout_time: "11:00",
        process: "Faire la vaisselle\nVider le réfrigérateur\nSortir les poubelles (local en bas)\nFermer les fenêtres et volets\nÉteindre toutes les lumières\nLaisser les clés ET le badge sur le plan de travail\nTirer la porte (fermeture automatique)",
        keys_return: "Laissez les clés et le badge magnétique sur le plan de travail de la cuisine. La porte se ferme automatiquement.",
        review_airbnb: "https://airbnb.com/",
        thank_you: "Merci pour votre séjour ! Paris vous attend à nouveau avec plaisir. 🗼",
      },
    }),
  },

  {
    id: "chalet",
    name: "Chalet montagne",
    emoji: "🏔️",
    description: "Pour un chalet à la montagne, été comme hiver.",
    accentColor: "#10b981",
    propertyName: "Le Chalet des Cimes",
    address: "42 route des Grandes Alpes, 74120 Megève",
    modules: () => makeModules({
      arrival: {
        welcome_message: "Bienvenue au Chalet des Cimes ! Installez-vous, le feu de cheminée vous attend. Que vous soyez là pour skier, randonner ou simplement vous ressourcer, nous espérons que ce séjour vous laissera des souvenirs inoubliables.",
        checkin_time: "17:00",
        checkout_time: "10:00",
        access_code: "2580",
        key_location: "Boîte à clés à droite du portail en bois. Code : 2580. Remettez-la impérativement en place à chaque sortie.",
        checkin_process: "Se garer sur l'espace dédié (panneau Chalet des Cimes)\nCode portail : 2580\nBoîte à clés à droite du portail : code 2580\nEntrez et profitez de la chaleur du chalet !\nLes skis peuvent être stockés dans le local dédié à droite de l'entrée",
        parking: "2 places couvertes devant le chalet (panneaux réservés). 4x4 ou chaînes obligatoires en hiver.",
        early_checkin: "Arrivée anticipée possible après 14h selon disponibilité. Bagagerie disponible à l'entrée.",
      },
      accommodation: {
        wifi_name: "ChaletDesCimes",
        wifi_password: "montagne2024",
        heating: "Cheminée dans le salon (bûches dans le panier, allume-feu sur la cheminée). Poêle à bois dans la cuisine. Chauffage central réglable sur le thermostat entrée : 20°C recommandé.",
        appliances: "Machine à laver : buanderie au rez-de-chaussée. Sèche-linge : idem.\nCave à vins dans la cave (les bouteilles marquées d'un ruban rouge sont à disposition).",
        tv: "TV avec Canal+, Netflix et des chaînes françaises. Télécommande sur la table basse du salon.",
        other: "Local à skis chauffé avec porte-skis individuels. Casques et bâtons à disposition. Sauna au sous-sol (allumage : 45 min avant utilisation).",
      },
      rules: {
        max_guests: "10 personnes maximum.",
        smoking: "Non-fumeur à l'intérieur. Fumoir sur le balcon côté forêt.",
        pets: "Chiens acceptés (maximum 2, propres et vaccinés). Essuie-pattes à l'entrée, merci de nettoyer après eux.",
        noise: "Calme après 22h30, village montagnard. Profitez de la sérénité !",
        parties: "Pas de fêtes sans accord préalable. Respect du voisinage obligatoire.",
        other: "Chaussons fournis à l'entrée (obligatoires à l'intérieur). Ne pas mettre de neige sur les parquets.",
      },
      kitchen: {
        equipment: "Cuisine professionnelle : piano de cuisson 6 feux, four, micro-ondes, cafetière Nespresso et percolateur, robot KitchenAid, raclette et fondue fournies.",
        trash: "Déchetterie à 2km (route du Col). Collecte le mercredi matin — sortir les poubelles la veille.\nJaune : emballages\nVert : verre\nGris : ordures ménagères",
        linen: "Linge de maison fourni et changé à mi-séjour (7 nuits+). Couvertures supplémentaires dans le coffre au pied des lits.",
        cleaning: "Femme de ménage passage en milieu de séjour (7 nuits+). Produits sous l'évier.",
        checkout_cleaning: "Merci de ranger la cuisine, vider le réfrigérateur, rassembler les déchets et laisser les clés sur la table.",
      },
      neighborhood: {
        transport: "Navette ski gratuite : arrêt à 100m (horaires affichés dans l'entrée).\nGare SNCF Sallanches à 20 min. Navette sur demande (30€).\nAéroport Genève à 1h.",
        hidden_gems: "Le restaurant L'Alpette au sommet du télésiège — panorama à 360° et fondue savoyarde inégalable. Réservez absolument le soir.",
      },
      safety: {
        emergency: "SAMU : 15\nPompiers : 18\nPolice : 17\nUrgences montagne : 04 50 XX XX XX\nPiste de secours : 04 50 XX XX XX",
        owner_phone: "+33 6 34 56 78 90",
        fire_extinguisher: "Extincteur dans la cuisine et à l'entrée. Détecteur de fumée dans chaque pièce.",
        circuit_breaker: "Tableau électrique dans le placard technique au sous-sol (à côté du sauna).",
        water_shutoff: "Vanne principale dans la cave technique. En hiver, coupure eau = risque gel : appelez-nous d'abord.",
        hospital: "Hôpital de Sallanches — 25 min. Clinique des Alpes à Chamonix — 35 min.",
      },
      contact: {
        host_name: "Antoine & Claire",
        host_phone: "+33 6 34 56 78 90",
        host_email: "contact@chaletdescimes.fr",
        response_time: "Disponibles 8h-21h. En cas d'urgence nocturne, appelez directement.",
        about: "Nous sommes Megèvans depuis trois générations. Notre chalet est notre maison — nous y mettons tout notre cœur. Claire prépare des paniers gourmands sur demande !",
        concierge: "Service conciergerie : réservation cours de ski, spa, restaurant, transferts. Contactez-nous 48h avant.",
        maintenance: "Urgence nuit : +33 6 34 56 78 90. Gardien Jean-Pierre sur place : +33 6 XX XX XX XX.",
      },
      checkout: {
        checkout_time: "10:00",
        process: "Ranger la cuisine et faire la vaisselle\nVider et nettoyer le réfrigérateur\nRemettre les couvres-lits\nÉteindre le poêle et fermer le pare-feu de la cheminée\nFermer les volets et fenêtres\nSortir les poubelles\nLaisser les clés dans la boîte à clés (code 2580)\nFermer le portail",
        keys_return: "Remettez les clés dans la boîte à clés à droite du portail (code 2580) et fermez bien le portail.",
        late_checkout_info: "Late checkout jusqu'à 13h possible hors saison (50€). Appelez-nous la veille.",
        review_airbnb: "https://airbnb.com/",
        thank_you: "Merci d'avoir séjourné au Chalet des Cimes. La montagne et nous vous attendons avec impatience pour une prochaine fois ! ⛷️🏔️",
      },
    }),
  },

  {
    id: "seaside",
    name: "Bord de mer",
    emoji: "🌊",
    description: "Studio, appartement ou maison face à l'océan ou la mer.",
    accentColor: "#0ea5e9",
    propertyName: "Le Nid des Vagues",
    address: "8 allée des Mouettes, 17000 La Rochelle",
    modules: () => makeModules({
      arrival: {
        welcome_message: "Bienvenue au Nid des Vagues ! Posez vos valises, l'océan est à 50 mètres. Nous espérons que le bruit des vagues et l'air iodé vous feront décrocher complètement.",
        checkin_time: "16:00",
        checkout_time: "10:00",
        access_code: "0613",
        key_location: "Boîte à clés sécurisée sur le poteau à l'entrée du jardin. Code : 0613.",
        checkin_process: "Entrer par le portillon du jardin (toujours ouvert)\nBoîte à clés sur le poteau à gauche : code 0613\nPorte principale — clé ronde\nRincer le sable à la douche extérieure avant d'entrer !\nBienvenue face à l'océan",
        parking: "1 place privée à l'arrière de la maison (panneau Nid des Vagues). Parking public gratuit à 100m.",
      },
      accommodation: {
        wifi_name: "NidDesVagues",
        wifi_password: "ocean2024",
        heating: "Radiateurs à inertie dans chaque pièce. Thermostat dans le couloir. Prévoir des sweats le soir, même en été.",
        appliances: "Machine à laver dans la buanderie, programme 40°C. Sèche-linge non disponible — corde à linge dans le jardin.\nBarbecue gaz sur la terrasse (recharge bouteille : station Total à 1km).",
        tv: "TV avec Netflix. Identifiants sur le post-it derrière la TV.",
        other: "Matériel de plage fourni : parasol, chaises longues, glacière, planches de bodyboard. Garage à vélos (2 vélos à disposition, casques inclus).",
      },
      rules: {
        max_guests: "6 personnes maximum.",
        smoking: "Non-fumeur à l'intérieur. Terrasse autorisée.",
        pets: "Chiens acceptés (maximum 1). Douche extérieure obligatoire après la plage.",
        noise: "Quartier résidentiel, calme après 22h. Terrasse jusqu'à 22h.",
        parties: "Pas de soirées sans accord préalable.",
        other: "Rincer le sable à la douche extérieure obligatoire avant d'entrer. Merci de respecter les dunes et la végétation.",
      },
      kitchen: {
        equipment: "Cuisine équipée : plaques vitrocéramiques, four, micro-ondes, cafetière à dosettes, bouilloire, grille-pain, centrifugeuse.",
        trash: "Collecte mardi et vendredi matin.\nJaune : emballages et plastiques\nVert : verre\nGris : ordures ménagères\nPoubelles à sortir la veille.",
        linen: "Draps et serviettes fournis. Serviettes de plage disponibles dans l'armoire de l'entrée.",
        cleaning: "Produits ménagers sous l'évier. Serpillière et seau dans la buanderie (sable inévitable !).",
        checkout_cleaning: "Rincer la douche extérieure, faire la vaisselle, vider le réfrigérateur et rassembler les déchets.",
      },
      neighborhood: {
        transport: "Vélos mis à disposition (2 vélos adultes + 1 enfant).\nBus ligne côtière : arrêt à 200m.\nGare La Rochelle à 15 min en vélo.",
        hidden_gems: "Les Pertuis — snack de plage local à 300m, les moules-frites sont légendaires. Uniquement le midi en saison.",
      },
      safety: {
        emergency: "SAMU : 15\nPompiers : 18\nPolice : 17\nCross Étel (sauvetage mer) : 196",
        owner_phone: "+33 6 45 67 89 01",
        fire_extinguisher: "Extincteur dans la cuisine.",
        circuit_breaker: "Tableau électrique dans la buanderie.",
        water_shutoff: "Vanne principale sous l'évier cuisine.",
        hospital: "Hôpital de La Rochelle — 20 min en voiture. Rue du Docteur Schweitzer.",
      },
      contact: {
        host_name: "Nathalie",
        host_phone: "+33 6 45 67 89 01",
        host_email: "nathalie@niddesvagues.fr",
        response_time: "Disponible 9h-20h. Je vis à 5 minutes, n'hésitez pas !",
        about: "J'ai grandi sur cette plage et je suis heureuse de partager ce petit coin de paradis. Mon conseil : allez voir le coucher de soleil depuis la pointe des Minimes.",
        maintenance: "Pour tout problème technique : +33 6 45 67 89 01.",
      },
      checkout: {
        checkout_time: "10:00",
        process: "Rincer la douche extérieure et le matériel de plage\nFaire la vaisselle\nVider le réfrigérateur\nRanger le matériel de plage dans le garage\nFermer les volets\nSortir les poubelles\nLaisser les clés dans la boîte à clés (code 0613)",
        keys_return: "Remettez les clés dans la boîte à clés sur le poteau à l'entrée (code 0613).",
        review_airbnb: "https://airbnb.com/",
        thank_you: "Merci pour votre séjour au Nid des Vagues ! L'océan et moi vous attendons l'été prochain 🌊",
      },
    }),
  },
];

export function getTemplate(id: string): BookletTemplate {
  return TEMPLATES.find(t => t.id === id) ?? TEMPLATES[0];
}
