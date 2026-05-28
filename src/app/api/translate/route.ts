import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { text, targetLang } = await request.json();

  if (!text || !targetLang) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }

  const langMap: Record<string, string> = {
    en: "en-GB", es: "es-ES", de: "de-DE", it: "it-IT", fr: "fr-FR",
  };
  const target = langMap[targetLang] ?? targetLang;

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|${target}`;
  const res = await fetch(url);
  const data = await res.json();

  const translated = data.responseData?.translatedText;
  if (!translated) return Response.json({ error: "Translation failed" }, { status: 500 });

  return Response.json({ translated });
}
