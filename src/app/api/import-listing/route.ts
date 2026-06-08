import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return NextResponse.json({ error: "Texte trop court" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Tu es un assistant qui extrait des informations structurées d'une annonce de location courte durée (Airbnb, Booking, etc.).

Analyse ce texte et extrais les informations disponibles. Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après.

Champs à extraire (laisse null si non trouvé) :
{
  "propertyName": "nom du logement",
  "address": "adresse complète",
  "checkin_time": "heure d'arrivée au format HH:MM (ex: 16:00)",
  "checkout_time": "heure de départ au format HH:MM (ex: 11:00)",
  "wifi_name": "nom du réseau WiFi",
  "wifi_password": "mot de passe WiFi",
  "max_guests": "capacité maximale (ex: 4 personnes)",
  "parking": "informations parking/stationnement",
  "smoking": "règle tabac",
  "pets": "règle animaux",
  "noise": "règle nuisances sonores",
  "welcome_message": "message de bienvenue",
  "host_name": "nom de l'hôte",
  "host_phone": "téléphone de l'hôte",
  "host_email": "email de l'hôte",
  "access_code": "code d'accès ou digicode",
  "key_location": "localisation des clés",
  "heating": "informations chauffage",
  "ac": "informations climatisation",
  "tv": "informations TV/divertissements",
  "equipment": "équipements cuisine",
  "transport": "transports disponibles",
  "hidden_gems": "coups de cœur de l'hôte"
}

Texte de l'annonce :
${text.slice(0, 4000)}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Réponse invalide" }, { status: 500 });
    }

    // Extract JSON from response (handle markdown code blocks)
    const rawText = content.text.trim();
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawText];
    const jsonText = jsonMatch[1] ?? rawText;

    const extracted = JSON.parse(jsonText);
    return NextResponse.json({ data: extracted });
  } catch (err) {
    console.error("[import-listing]", err);
    return NextResponse.json({ error: "Erreur lors de l'extraction" }, { status: 500 });
  }
}
