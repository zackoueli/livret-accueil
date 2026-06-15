import { NextRequest, NextResponse } from "next/server";

export const PORTS = [
  { id: "3", name: "Dunkerque" },
  { id: "4", name: "Gravelines" },
  { id: "5", name: "Calais" },
  { id: "6", name: "Wissant" },
  { id: "7", name: "Boulogne-sur-Mer" },
  { id: "8", name: "Le Touquet" },
  { id: "9", name: "Berck Plage - Fort Mahon" },
  { id: "150", name: "Entrée baie de Somme (Le Crotoy)" },
  { id: "11", name: "Cayeux-sur-Mer" },
  { id: "12", name: "Le Treport" },
  { id: "14", name: "Dieppe" },
  { id: "15", name: "Saint-Valery-en-Caux" },
  { id: "16", name: "Fécamp" },
  { id: "17", name: "Etretat" },
  { id: "18", name: "Le Havre-Antifer" },
  { id: "19", name: "Le Havre" },
  { id: "22", name: "Honfleur" },
  { id: "23", name: "Trouville / Deauville" },
  { id: "24", name: "Dives-sur-Mer" },
  { id: "25", name: "Ouistreham" },
  { id: "26", name: "Courseulles-sur-Mer" },
  { id: "27", name: "Arromanches-Les-Bains" },
  { id: "28", name: "Port-en-Bessin" },
  { id: "29", name: "Grandcamp" },
  { id: "30", name: "Iles Saint-Marcouf" },
  { id: "31", name: "Saint-Vaast-La-Hougue" },
  { id: "32", name: "Barfleur" },
  { id: "33", name: "Cherbourg" },
  { id: "34", name: "Omonville-la-Rogue" },
  { id: "35", name: "Goury" },
  { id: "37", name: "Diélette" },
  { id: "38", name: "Carteret" },
  { id: "39", name: "Portbail" },
  { id: "40", name: "Les Écréhou - L'Écrevière" },
  { id: "41", name: "Saint-Germain-sur-Ay" },
  { id: "42", name: "Le Sénéquet" },
  { id: "43", name: "Pointe d'Agon" },
  { id: "45", name: "Granville" },
  { id: "47", name: "Iles Chausey (Grande-Ile)" },
  { id: "48", name: "Cancale" },
  { id: "52", name: "Saint-Malo" },
  { id: "53", name: "Ile des Hébihens" },
  { id: "54", name: "Saint-Cast" },
  { id: "55", name: "Erquy" },
  { id: "56", name: "Dahouet" },
  { id: "57", name: "Baie de Saint-Brieuc (Le Légué)" },
  { id: "58", name: "Binic" },
  { id: "59", name: "Saint-Quay-Portrieux" },
  { id: "60", name: "Ile de Bréhat" },
  { id: "61", name: "Les Héaux-de-Bréhat" },
  { id: "62", name: "Paimpol" },
  { id: "63", name: "Lézardrieux" },
  { id: "64", name: "Port-Béni" },
  { id: "65", name: "Tréguier" },
  { id: "66", name: "Perros-Guirec" },
  { id: "67", name: "Ploumanac'h" },
  { id: "68", name: "Trébeurden" },
  { id: "157", name: "Locquemeau" },
  { id: "69", name: "Locquirec" },
  { id: "70", name: "Anse de Primel" },
  { id: "71", name: "Baie de Morlaix - Carantec" },
  { id: "72", name: "Roscoff" },
  { id: "73", name: "Brignogan-Plage" },
  { id: "74", name: "Aber Wrac'h" },
  { id: "75", name: "L'Aber Benoît" },
  { id: "76", name: "Portsall" },
  { id: "77", name: "L'Aber Ildut - Lanildut" },
  { id: "78", name: "Ile d'Ouessant (Baie de Lampaul)" },
  { id: "79", name: "Ile Molène" },
  { id: "80", name: "Le Conquet" },
  { id: "81", name: "Trez-Hir" },
  { id: "82", name: "Brest" },
  { id: "83", name: "Camaret-sur-Mer" },
  { id: "84", name: "Morgat" },
  { id: "85", name: "Douarnenez" },
  { id: "86", name: "Ile de Sein" },
  { id: "87", name: "Audierne" },
  { id: "88", name: "Penmarc'h / Saint Guénolé" },
  { id: "89", name: "Le Guilvinec" },
  { id: "90", name: "Lesconil" },
  { id: "91", name: "Loctudy" },
  { id: "92", name: "Bénodet" },
  { id: "93", name: "Concarneau" },
  { id: "94", name: "Penfret (Iles de Glénan)" },
  { id: "155", name: "Port Manec'h" },
  { id: "151", name: "Le Pouldu" },
  { id: "95", name: "Lorient" },
  { id: "97", name: "Port-Louis (Locmalo)" },
  { id: "98", name: "Ile de Groix (Port-Tudy)" },
  { id: "99", name: "Etel" },
  { id: "100", name: "Quiberon (Port-Maria)" },
  { id: "101", name: "Belle-Ile (Le Palais)" },
  { id: "102", name: "Quiberon (Port-Haliguen)" },
  { id: "103", name: "La Trinité-sur-Mer" },
  { id: "105", name: "Auray (St-Goustan)" },
  { id: "154", name: "Locmariaquer" },
  { id: "106", name: "Arradon" },
  { id: "107", name: "Vannes" },
  { id: "108", name: "Saint-Armel (Le Passage)" },
  { id: "109", name: "Le Logeo" },
  { id: "104", name: "Port-Navalo" },
  { id: "156", name: "Port du Crouesty" },
  { id: "110", name: "Penerf" },
  { id: "111", name: "Tréhiguier" },
  { id: "112", name: "Hoëdic" },
  { id: "113", name: "Houat" },
  { id: "114", name: "Le Croisic" },
  { id: "115", name: "Le Pouliguen" },
  { id: "116", name: "Pornichet" },
  { id: "117", name: "Saint-Nazaire" },
  { id: "118", name: "Pointe de Saint-Gildas" },
  { id: "119", name: "Pornic" },
  { id: "120", name: "Noirmoutier (L'Herbaudière)" },
  { id: "121", name: "Fromentine Bouée" },
  { id: "122", name: "Fromentine Port" },
  { id: "123", name: "Ile d'Yeu (Port-Joinville)" },
  { id: "124", name: "Saint-Gilles-Croix-de-Vie" },
  { id: "125", name: "Les Sables-d'Olonne" },
  { id: "126", name: "Ile de Ré (Saint-Martin)" },
  { id: "127", name: "La Rochelle-Pallice" },
  { id: "128", name: "Ile d'Aix" },
  { id: "159", name: "Saint-Denis d'Oléron" },
  { id: "153", name: "Ile d'Oléron (La Cotinière)" },
  { id: "129", name: "Pointe de Gatseau" },
  { id: "130", name: "Cordouan" },
  { id: "131", name: "Royan" },
  { id: "132", name: "Pointe de Grave (Port-Bloc)" },
  { id: "133", name: "Richards" },
  { id: "162", name: "Laména" },
  { id: "160", name: "Pauillac" },
  { id: "161", name: "Bordeaux" },
  { id: "134", name: "Lacanau (Large)" },
  { id: "135", name: "Cap Ferret" },
  { id: "136", name: "Arcachon (Jetée d'Eyrac)" },
  { id: "137", name: "Biscarrosse" },
  { id: "138", name: "Mimizan" },
  { id: "139", name: "Vieux-Boucau" },
  { id: "140", name: "Boucau-Bayonne / Biarritz" },
  { id: "143", name: "Capbreton" },
  { id: "141", name: "Saint-Jean-de-Luz" },
];

export interface TideEntry {
  type: "PM" | "BM";
  time: string;
  height: string;
  coef?: string;
}

export interface TidesData {
  portId: string;
  portName: string;
  date: string;
  tides: TideEntry[];
}

function parseTidesFromHtml(html: string): TideEntry[] {
  // Les données sont dans les attributs data-ht et data-hm du premier jour (index 0)
  // data-hm="09h41_t" → t = pleine mer (top), b = basse mer (bottom)
  // data-ht="6,20m"
  const tidesRaw: { time: string; height: string; isHigh: boolean }[] = [];
  const flagRe = /data-ht="([^"]+)"\s+data-hm="([^"]+)"/g;
  let match;
  while ((match = flagRe.exec(html)) !== null) {
    const height = match[1];
    const hm = match[2]; // e.g. "09h41_t" or "04h01_b"
    const time = hm.replace(/_[tb]$/, "");
    const isHigh = hm.endsWith("_t");
    tidesRaw.push({ time, height, isHigh });
  }

  // Les coefficients sont dans les <b> suivant les PM dans le tableau principal
  // Pattern dans MareeJours: coef apparaît dans les <b> de la colonne Coeff. pour le jour 0
  const coefs: string[] = [];
  const coefRe = /<b>(\d+)<\/b>/g;
  // On cherche dans le bloc MareeJours_0
  const joursMatch = html.match(/id="MareeJours_0"[^<]*<th>[^<]*<\/th><td>([^<]*)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td>/);
  if (joursMatch) {
    const coefBlock = joursMatch[3];
    const coefMatches = [...coefBlock.matchAll(/<b>(\d+)<\/b>/g)];
    coefMatches.forEach(m => coefs.push(m[1]));
  }

  // Dédupliquer : la page répète chaque PM/BM deux fois (tableau + détail)
  const seen = new Set<string>();
  const result: TideEntry[] = [];
  let coefIdx = 0;
  for (const t of tidesRaw) {
    const key = `${t.time}_${t.isHigh}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const entry: TideEntry = {
      type: t.isHigh ? "PM" : "BM",
      time: t.time,
      height: t.height,
    };
    if (t.isHigh && coefs[coefIdx] !== undefined) {
      entry.coef = coefs[coefIdx++];
    }
    result.push(entry);
  }
  return result.sort((a, b) => a.time.localeCompare(b.time));
}

export async function GET(req: NextRequest) {
  const portId = req.nextUrl.searchParams.get("portId");

  // Liste des ports
  if (!portId) {
    return NextResponse.json({ ports: PORTS }, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  }

  // Validation : seuls les IDs numériques connus
  if (!/^\d+$/.test(portId) || !PORTS.find(p => p.id === portId)) {
    return NextResponse.json({ error: "Port inconnu" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://maree.info/${portId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; livret-accueil/1.0)" },
      next: { revalidate: 1800 }, // cache 30 min
    });
    if (!res.ok) throw new Error(`maree.info returned ${res.status}`);
    const html = await res.text();

    const port = PORTS.find(p => p.id === portId)!;
    const tides = parseTidesFromHtml(html);

    // Extraire la date depuis le HTML (présente dans le title ou dans un th)
    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

    const data: TidesData = {
      portId,
      portName: port.name,
      date: today,
      tides,
    };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error("tides scrape error:", err);
    return NextResponse.json({ error: "Impossible de récupérer les marées" }, { status: 502 });
  }
}
