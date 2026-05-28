import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const excludeId = searchParams.get("excludeId");

  if (!slug) return Response.json({ error: "Missing slug" }, { status: 400 });

  const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (clean.length < 3) return Response.json({ available: false, reason: "too_short" });

  const snap = await adminDb.collection("booklets").where("slug", "==", clean).limit(1).get();
  const conflict = snap.docs.find((d) => d.id !== excludeId);

  return Response.json({ available: !conflict, slug: clean });
}
