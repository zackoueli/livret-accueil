import { NextRequest, NextResponse } from "next/server";

// Codes météo WMO → description + emoji
const WMO_CODES: Record<number, { label: string; emoji: string }> = {
  0:  { label: "Ciel dégagé",        emoji: "☀️" },
  1:  { label: "Peu nuageux",         emoji: "🌤️" },
  2:  { label: "Partiellement nuageux", emoji: "⛅" },
  3:  { label: "Nuageux",             emoji: "☁️" },
  45: { label: "Brouillard",          emoji: "🌫️" },
  48: { label: "Brouillard givrant",  emoji: "🌫️" },
  51: { label: "Bruine légère",       emoji: "🌦️" },
  53: { label: "Bruine",              emoji: "🌦️" },
  55: { label: "Bruine dense",        emoji: "🌧️" },
  61: { label: "Pluie légère",        emoji: "🌦️" },
  63: { label: "Pluie",              emoji: "🌧️" },
  65: { label: "Pluie forte",         emoji: "🌧️" },
  71: { label: "Neige légère",        emoji: "🌨️" },
  73: { label: "Neige",              emoji: "❄️" },
  75: { label: "Neige dense",         emoji: "❄️" },
  77: { label: "Grésil",             emoji: "🌨️" },
  80: { label: "Averses légères",     emoji: "🌦️" },
  81: { label: "Averses",            emoji: "🌧️" },
  82: { label: "Averses violentes",   emoji: "⛈️" },
  85: { label: "Averses de neige",    emoji: "🌨️" },
  86: { label: "Averses de neige dense", emoji: "❄️" },
  95: { label: "Orage",              emoji: "⛈️" },
  96: { label: "Orage avec grêle",   emoji: "⛈️" },
  99: { label: "Orage fort avec grêle", emoji: "⛈️" },
};

export interface WeatherData {
  city: string;
  temperature: number;
  feelsLike: number;
  weatherCode: number;
  description: string;
  emoji: string;
  windSpeed: number;
  humidity: number;
  uvIndex: number;
  forecast: {
    date: string;
    dayLabel: string;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
    emoji: string;
    description: string;
    precipProbability: number;
  }[];
}

async function nominatimSearch(query: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&countrycodes=fr`;
  const res = await fetch(url, {
    headers: { "User-Agent": "livret-accueil/1.0 (mathieu.wreizh@gmail.com)" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data[0]) return null;
  const d = data[0];
  const name = d.address?.city || d.address?.town || d.address?.village || d.address?.municipality || d.display_name.split(",")[0];
  return { lat: parseFloat(d.lat), lon: parseFloat(d.lon), name };
}

async function geocode(query: string): Promise<{ lat: number; lon: number; name: string } | null> {
  // Essai 1 : requête complète
  const result = await nominatimSearch(query);
  if (result) return result;

  // Essai 2 : extraire ville ou code postal depuis l'adresse
  // Format typique : "12 rue ..., 75001 Paris, France"
  const cpCityMatch = query.match(/\b(\d{5})\s+([A-Za-zÀ-ÿ\s-]+)/);
  if (cpCityMatch) {
    const fallback = await nominatimSearch(`${cpCityMatch[1]} ${cpCityMatch[2].trim()}`);
    if (fallback) return fallback;
    // Essai 3 : juste le code postal
    const cpOnly = await nominatimSearch(cpCityMatch[1]);
    if (cpOnly) return cpOnly;
  }

  // Essai 4 : sans restriction pays
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
  const res = await fetch(url, { headers: { "User-Agent": "livret-accueil/1.0 (mathieu.wreizh@gmail.com)" } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data[0]) return null;
  const d = data[0];
  const name = d.address?.city || d.address?.town || d.address?.village || d.display_name.split(",")[0];
  return { lat: parseFloat(d.lat), lon: parseFloat(d.lon), name };
}

const DAY_LABELS_FR = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const cityOverride = req.nextUrl.searchParams.get("city");

  const query = cityOverride || address;
  if (!query) return NextResponse.json({ error: "Missing address or city" }, { status: 400 });

  const geo = await geocode(query);
  if (!geo) return NextResponse.json({ error: "Localisation introuvable" }, { status: 404 });

  const { lat, lon, name } = geo;

  const meteoUrl = new URL("https://api.open-meteo.com/v1/forecast");
  meteoUrl.searchParams.set("latitude", lat.toFixed(4));
  meteoUrl.searchParams.set("longitude", lon.toFixed(4));
  meteoUrl.searchParams.set("current", "temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m,uv_index");
  meteoUrl.searchParams.set("daily", "weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  meteoUrl.searchParams.set("timezone", "Europe/Paris");
  meteoUrl.searchParams.set("forecast_days", "5");

  const meteoRes = await fetch(meteoUrl.toString(), { next: { revalidate: 1800 } });
  if (!meteoRes.ok) return NextResponse.json({ error: "Erreur météo" }, { status: 502 });

  const m = await meteoRes.json();
  const cur = m.current;
  const daily = m.daily;

  const code = cur.weathercode as number;
  const wmo = WMO_CODES[code] ?? { label: "Météo inconnue", emoji: "🌡️" };

  const forecast = (daily.time as string[]).map((dateStr: string, i: number) => {
    const d = new Date(dateStr);
    const wmoDay = WMO_CODES[daily.weathercode[i] as number] ?? { label: "–", emoji: "🌡️" };
    return {
      date: dateStr,
      dayLabel: DAY_LABELS_FR[d.getDay()],
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      weatherCode: daily.weathercode[i],
      emoji: wmoDay.emoji,
      description: wmoDay.label,
      precipProbability: daily.precipitation_probability_max[i] ?? 0,
    };
  });

  const data: WeatherData = {
    city: cityOverride ? (geo.name) : (name),
    temperature: Math.round(cur.temperature_2m),
    feelsLike: Math.round(cur.apparent_temperature),
    weatherCode: code,
    description: wmo.label,
    emoji: wmo.emoji,
    windSpeed: Math.round(cur.windspeed_10m),
    humidity: Math.round(cur.relativehumidity_2m),
    uvIndex: Math.round(cur.uv_index ?? 0),
    forecast,
  };

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
