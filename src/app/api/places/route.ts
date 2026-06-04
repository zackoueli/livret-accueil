import { NextRequest, NextResponse } from "next/server";

const KEY = process.env.GOOGLE_PLACES_API_KEY!;

// Recherche de lieux
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const placeId = req.nextUrl.searchParams.get("placeId");

  if (placeId) {
    // Détails d'un lieu
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,types,photos&language=fr&key=${KEY}`
    );
    const data = await res.json();
    if (data.status !== "OK") return NextResponse.json({ error: data.status }, { status: 400 });

    const p = data.result;

    // Photo principale via Places Photos API
    let photo = "";
    if (p.photos?.[0]?.photo_reference) {
      photo = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photos[0].photo_reference}&key=${KEY}`;
    }

    // Horaires formatés
    let openHours = "";
    if (p.opening_hours?.weekday_text?.length) {
      openHours = p.opening_hours.weekday_text.join(" · ");
    }

    // Prix
    const priceMap: Record<number, string> = { 1: "€", 2: "€€", 3: "€€€", 4: "€€€" };
    const priceRange = priceMap[p.price_level] ?? "";

    // Catégorie
    let category: string = "other";
    if (p.types?.some((t: string) => ["restaurant", "food", "cafe", "bakery", "bar"].includes(t))) category = "restaurant";
    else if (p.types?.some((t: string) => ["tourist_attraction", "museum", "park", "amusement_park", "zoo", "aquarium", "gym", "spa", "beach"].includes(t))) category = "activity";
    else if (p.types?.some((t: string) => ["store", "shopping_mall", "market", "supermarket"].includes(t))) category = "shop";
    else if (p.types?.some((t: string) => ["transit_station", "bus_station", "train_station", "airport"].includes(t))) category = "transport";

    return NextResponse.json({ name: p.name, address: p.formatted_address, phone: p.formatted_phone_number ?? "", website: p.website ?? "", openHours, priceRange, photo, category });
  }

  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  // Recherche textuelle
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&language=fr&key=${KEY}`
  );
  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return NextResponse.json({ error: data.status }, { status: 400 });
  }

  const results = (data.results ?? []).slice(0, 5).map((r: any) => ({
    placeId: r.place_id,
    name: r.name,
    address: r.formatted_address,
    rating: r.rating,
    types: r.types,
  }));

  return NextResponse.json({ results });
}
