import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const { bookletId, section } = await request.json();
  if (!bookletId || !section) return Response.json({ error: "Missing fields" }, { status: 400 });

  const ref = adminDb.collection("booklet_analytics").doc(bookletId);
  await ref.set(
    { sections: { [section]: FieldValue.increment(1) }, updatedAt: Date.now() },
    { merge: true }
  );

  return Response.json({ ok: true });
}
