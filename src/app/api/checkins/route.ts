import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookletId = searchParams.get("bookletId");
  const userId = searchParams.get("userId");

  if (!bookletId || !userId) {
    return Response.json({ error: "Missing params" }, { status: 400 });
  }

  // Vérifie que le livret appartient bien à cet utilisateur
  const bookletDoc = await adminDb.collection("booklets").doc(bookletId).get();
  if (!bookletDoc.exists || bookletDoc.data()?.userId !== userId) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const snap = await adminDb
    .collection("checkins")
    .where("bookletId", "==", bookletId)
    .orderBy("createdAt", "desc")
    .get();

  const checkins = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return Response.json({ checkins });
}
