import { NextRequest } from "next/server";

export const runtime = "nodejs";

const SUPPORTED_LANGS = ["fr", "en", "es", "de", "it", "ar"];

export async function POST(request: NextRequest) {
  const { texts, targetLang } = await request.json();

  if (!texts || !targetLang) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }
  if (!SUPPORTED_LANGS.includes(targetLang)) {
    return Response.json({ error: "Unsupported language" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Translation API not configured" }, { status: 500 });
  }

  // texts est un tableau de strings
  const arr: string[] = Array.isArray(texts) ? texts : [texts];

  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: arr, target: targetLang, source: "fr", format: "text" }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[translate] Google API error:", err);
    return Response.json({ error: "Translation failed" }, { status: 500 });
  }

  const data = await res.json();
  const translations: string[] = data.data.translations.map(
    (t: { translatedText: string }) => t.translatedText
  );

  return Response.json({ translations });
}
