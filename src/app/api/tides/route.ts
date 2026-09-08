import { NextRequest, NextResponse } from "next/server";

export interface Port {
  id: string;
  name: string;
  /** Ports hors métropole : maree.info ne les couvre pas, on passe direct par
   *  Open-Meteo Marine avec des coordonnées et un fuseau explicites. */
  coords?: { lat: number; lon: number };
  /** Fuseau IANA (défaut : Europe/Paris pour la métropole). */
  timezone?: string;
}

export const PORTS: Port[] = [
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

  // ── Antilles françaises (Open-Meteo Marine, pas de coefficient SHOM) ──────────
  { id: "gp-pointe-a-pitre", name: "Pointe-à-Pitre (Guadeloupe)",   coords: { lat: 16.2415, lon: -61.5340 }, timezone: "America/Guadeloupe" },
  { id: "gp-basse-terre",    name: "Basse-Terre (Guadeloupe)",      coords: { lat: 15.9958, lon: -61.7292 }, timezone: "America/Guadeloupe" },
  { id: "gp-saint-francois", name: "Saint-François (Guadeloupe)",    coords: { lat: 16.2528, lon: -61.2708 }, timezone: "America/Guadeloupe" },
  { id: "gp-deshaies",       name: "Deshaies (Guadeloupe)",         coords: { lat: 16.3040, lon: -61.7940 }, timezone: "America/Guadeloupe" },
  { id: "gp-saint-martin",   name: "Marigot (Saint-Martin)",        coords: { lat: 18.0686, lon: -63.0847 }, timezone: "America/Marigot" },
  { id: "mq-fort-de-france", name: "Fort-de-France (Martinique)",    coords: { lat: 14.6004, lon: -61.0733 }, timezone: "America/Martinique" },
  { id: "mq-le-marin",       name: "Le Marin (Martinique)",         coords: { lat: 14.4700, lon: -60.8700 }, timezone: "America/Martinique" },
  { id: "mq-saint-pierre",   name: "Saint-Pierre (Martinique)",      coords: { lat: 14.7420, lon: -61.1750 }, timezone: "America/Martinique" },
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
  // Extraire le bloc du premier jour depuis MareeJours_0
  // Structure : id="MareeJours_0" ... <td>heures</td><td>hauteurs</td><td>coefs</td>
  const dayMatch = html.match(/id="MareeJours_0"[^>]*>([\s\S]*?)<\/tr>/);
  if (!dayMatch) return [];

  const dayHtml = dayMatch[1];

  // Extraire les 3 colonnes td (heures, hauteurs, coefficients)
  const tds = [...dayHtml.matchAll(/<td>([\s\S]*?)<\/td>/g)].map(m => m[1]);
  if (tds.length < 3) return [];

  const timesHtml   = tds[0]; // <b>05h42</b><br>11h59<br><b>18h03</b>
  const heightsHtml = tds[1]; // <b>6,86m</b><br>1,25m<br><b>7,07m</b>
  const coefsHtml   = tds[2]; // <b>90</b><br>&nbsp;<br><b>93</b>

  // Parser les heures : les <b> = PM, les textes sans <b> = BM
  const timeEntries: { time: string; isHigh: boolean }[] = [];
  const timeRe = /(<b>([^<]+)<\/b>|([0-9]{2}h[0-9]{2}))/g;
  let m;
  while ((m = timeRe.exec(timesHtml)) !== null) {
    if (m[2]) timeEntries.push({ time: m[2], isHigh: true });  // dans <b>
    else if (m[3]) timeEntries.push({ time: m[3], isHigh: false }); // texte brut
  }

  // Parser les hauteurs dans le même ordre
  const heightEntries: string[] = [];
  const heightRe = /(<b>([^<]+)<\/b>|([0-9]+,[0-9]+m))/g;
  while ((m = heightRe.exec(heightsHtml)) !== null) {
    heightEntries.push(m[2] || m[3]);
  }

  // Parser les coefficients : <b>90</b> pour les PM, &nbsp; pour les BM
  const coefMap: Map<number, string> = new Map();
  const coefParts = coefsHtml.split(/<br\s*\/?>/);
  coefParts.forEach((part, i) => {
    const coefM = part.match(/<b>(\d+)<\/b>/);
    if (coefM) coefMap.set(i, coefM[1]);
  });

  const result: TideEntry[] = [];
  for (let i = 0; i < timeEntries.length; i++) {
    const entry: TideEntry = {
      type: timeEntries[i].isHigh ? "PM" : "BM",
      time: timeEntries[i].time,
      height: heightEntries[i] ?? "",
    };
    if (coefMap.has(i)) entry.coef = coefMap.get(i);
    result.push(entry);
  }
  return result.sort((a, b) => a.time.localeCompare(b.time));
}

async function fetchFromMareeInfo(portId: string): Promise<TideEntry[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(`https://maree.info/${portId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fr-FR,fr;q=0.9",
    },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!res.ok) throw new Error(`maree.info returned ${res.status}`);
  const html = await res.text();
  const tides = parseTidesFromHtml(html);
  if (tides.length === 0) throw new Error("maree.info: no tide data parsed");
  return tides;
}

// ── Fallback Open-Meteo (maree.info bloque certaines IP d'hébergeurs) ─────────
// On géocode le port, puis on déduit PM/BM des hauteurs horaires du niveau de
// la mer. Pas de coefficient disponible via cette source.

const geoCache = new Map<string, { lat: number; lon: number }>();

async function geocodePort(name: string): Promise<{ lat: number; lon: number } | null> {
  const cached = geoCache.get(name);
  if (cached) return cached;
  const paren = name.match(/\((.*?)\)/);
  const candidates = [
    name.replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").trim(),
    ...(paren ? [paren[1]] : []),
    name.split("/")[0].trim(),
  ];
  for (const q of candidates) {
    if (!q) continue;
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=fr`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const results: { latitude: number; longitude: number; country_code?: string }[] = data.results ?? [];
      const hit = results.find(r => r.country_code === "FR") ?? results[0];
      if (hit) {
        const coords = { lat: hit.latitude, lon: hit.longitude };
        geoCache.set(name, coords);
        return coords;
      }
    } catch { /* candidat suivant */ }
  }
  return null;
}

/** Heure locale actuelle "YYYY-MM-DD" dans le fuseau donné. */
function todayInTimezone(timezone: string): string {
  // en-CA => "YYYY-MM-DD"
  return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
}

async function fetchJsonWithRetry(url: string, tries = 3): Promise<unknown> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < tries; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 400 * attempt));
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { next: { revalidate: 1800 }, signal: controller.signal })
        .finally(() => clearTimeout(timeout));
      if (!res.ok) throw new Error(`open-meteo returned ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("open-meteo: request failed");
}

async function fetchFromOpenMeteo(
  port: Port,
  timezone = "Europe/Paris",
): Promise<TideEntry[]> {
  const coords = port.coords ?? (await geocodePort(port.name));
  if (!coords) throw new Error(`open-meteo: geocoding failed for "${port.name}"`);

  // Fenêtre large (hier → +2 j) : robuste quelle que soit l'heure d'appel et le fuseau.
  const data = await fetchJsonWithRetry(
    `https://marine-api.open-meteo.com/v1/marine?latitude=${coords.lat}&longitude=${coords.lon}` +
    `&hourly=sea_level_height_msl&timezone=${encodeURIComponent(timezone)}&past_days=1&forecast_days=2`
  ) as { hourly?: { time?: string[]; sea_level_height_msl?: (number | null)[] } };

  const times: string[] = data.hourly?.time ?? [];
  const heights: (number | null)[] = data.hourly?.sea_level_height_msl ?? [];
  if (times.length < 3) throw new Error("open-meteo: no sea level data");

  const today = todayInTimezone(timezone);

  // Hauteurs affichées par rapport au plus bas niveau de la journée courante.
  const todaysHeights = heights.filter((h, i): h is number => h !== null && times[i].slice(0, 10) === today);
  const floor = todaysHeights.length ? Math.min(...todaysHeights)
    : Math.min(...heights.filter((h): h is number => h !== null));

  type Extremum = { dayStr: string; totalMin: number; type: "PM" | "BM"; height: string };
  const extrema: Extremum[] = [];
  for (let i = 1; i < heights.length - 1; i++) {
    const prev = heights[i - 1], cur = heights[i], next = heights[i + 1];
    if (prev === null || cur === null || next === null) continue;
    const isMax = cur >= prev && cur > next;
    const isMin = cur <= prev && cur < next;
    if (!isMax && !isMin) continue;
    // Interpolation quadratique pour affiner l'heure et la hauteur de l'extremum
    const denom = prev - 2 * cur + next;
    const offset = denom !== 0 ? 0.5 * (prev - next) / denom : 0; // en heures
    const h = cur - 0.25 * (prev - next) * offset;
    // times[i] = "YYYY-MM-DDTHH:MM" déjà exprimé dans le fuseau demandé.
    // On lit les composantes murales de la chaîne, sans passer par `new Date`
    // (qui les réinterpréterait dans le fuseau du serveur).
    const [dayPart, hm] = times[i].split("T");
    let totalMin = Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5)) + Math.round(offset * 60);
    let dayStr = dayPart;
    if (totalMin < 0 || totalMin >= 1440) {
      const shiftDays = Math.floor(totalMin / 1440);
      totalMin -= shiftDays * 1440;
      const [yy, mm, dd] = dayPart.split("-").map(Number);
      const shifted = new Date(Date.UTC(yy, mm - 1, dd + shiftDays));
      dayStr = shifted.toISOString().slice(0, 10);
    }
    extrema.push({
      dayStr,
      totalMin,
      type: isMax ? "PM" : "BM",
      height: `${(h - floor).toFixed(2).replace(".", ",")}m`,
    });
  }

  // Priorité aux extrema d'aujourd'hui ; à défaut, on prend les prochaines
  // marées à venir (utile en toute fin de journée). Jamais d'échec si la
  // série est valide.
  let chosen = extrema.filter(e => e.dayStr === today);
  if (chosen.length === 0) {
    const [h, m] = new Date()
      .toLocaleTimeString("en-GB", { timeZone: timezone, hour12: false })
      .split(":");
    const nowMin = Number(h) * 60 + Number(m);
    chosen = extrema
      .filter(e => e.dayStr > today || (e.dayStr === today && e.totalMin >= nowMin))
      .slice(0, 4);
  }
  if (chosen.length === 0) throw new Error("open-meteo: no tide extrema found");

  return chosen
    .map(e => ({
      type: e.type,
      time: `${String(Math.floor(e.totalMin / 60)).padStart(2, "0")}h${String(e.totalMin % 60).padStart(2, "0")}`,
      height: e.height,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

// Cache de secours en mémoire : dernière réponse réussie par port.
// Sert de filet quand toutes les sources échouent (bien mieux qu'une erreur).
const lastGood = new Map<string, { data: TidesData; at: number }>();
const STALE_MAX_MS = 36 * 60 * 60 * 1000; // 36 h

export async function GET(req: NextRequest) {
  const portId = req.nextUrl.searchParams.get("portId");

  // Liste des ports
  if (!portId) {
    return NextResponse.json({ ports: PORTS }, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  }

  // Validation : uniquement les IDs connus (métropole numériques, DOM slugs)
  const port = PORTS.find(p => p.id === portId);
  if (!port) {
    return NextResponse.json({ error: "Port inconnu" }, { status: 400 });
  }

  const timezone = port.timezone ?? "Europe/Paris";
  let tides: TideEntry[] | null = null;

  if (/^\d+$/.test(port.id)) {
    // Métropole : maree.info (avec coefficient), fallback Open-Meteo Marine.
    try {
      tides = await fetchFromMareeInfo(port.id);
    } catch (err) {
      console.error("tides scrape error, falling back to open-meteo:", err);
      try {
        tides = await fetchFromOpenMeteo(port, timezone);
      } catch (err2) {
        console.error("tides open-meteo fallback error:", err2);
      }
    }
  } else {
    // Hors métropole : maree.info ne couvre pas, on va direct sur Open-Meteo Marine.
    try {
      tides = await fetchFromOpenMeteo(port, timezone);
    } catch (err) {
      console.error("tides open-meteo (DOM) error:", err);
    }
  }

  // Toutes les sources ont échoué : on ressert la dernière réponse connue.
  if (!tides) {
    const fallback = lastGood.get(port.id);
    if (fallback && Date.now() - fallback.at < STALE_MAX_MS) {
      return NextResponse.json(
        { ...fallback.data, stale: true },
        { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } },
      );
    }
    return NextResponse.json({ error: "Impossible de récupérer les marées" }, { status: 502 });
  }

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: timezone });

  const data: TidesData = {
    portId,
    portName: port.name,
    date: today,
    tides,
  };
  lastGood.set(port.id, { data, at: Date.now() });

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
