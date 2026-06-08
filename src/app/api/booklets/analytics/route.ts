import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const bookletId = request.nextUrl.searchParams.get("bookletId");
  if (!bookletId) return Response.json({ error: "Missing bookletId" }, { status: 400 });

  const doc = await adminDb.collection("booklet_analytics").doc(bookletId).get();
  if (!doc.exists) return Response.json({ sections: {}, updatedAt: null });

  return Response.json(doc.data());
}
