import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

export const runtime = "nodejs";

const SUPPORTED_LANGS = ["fr", "en", "es", "de", "it", "ar"];
const MONTHLY_LIMIT = 50_000;

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function POST(request: NextRequest) {
  const { texts, targetLang } = await request.json();

  if (!texts || !targetLang) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }
  if (!SUPPORTED_LANGS.includes(targetLang)) {
    return Response.json({ error: "Unsupported language" }, { status: 400 });
  }

  // Authenticate user
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await getAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  // Check quota
  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data() ?? {};

  const month = currentMonth();
  const storedMonth = userData.translationCharsMonth ?? "";
  const charsUsed = storedMonth === month ? (userData.translationCharsUsed ?? 0) : 0;

  const arr: string[] = Array.isArray(texts) ? texts : [texts];
  const totalChars = arr.reduce((sum, s) => sum + s.length, 0);

  if (charsUsed + totalChars > MONTHLY_LIMIT) {
    const remaining = Math.max(0, MONTHLY_LIMIT - charsUsed);
    return Response.json(
      { error: "quota_exceeded", charsUsed, limit: MONTHLY_LIMIT, remaining },
      { status: 429 }
    );
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Translation API not configured" }, { status: 500 });
  }

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

  // Update quota counter
  await userRef.set(
    {
      translationCharsUsed: charsUsed + totalChars,
      translationCharsMonth: month,
    },
    { merge: true }
  );

  return Response.json({
    translations,
    charsUsed: charsUsed + totalChars,
    limit: MONTHLY_LIMIT,
  });
}
