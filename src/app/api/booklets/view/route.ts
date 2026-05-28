import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const { bookletId } = await request.json();
  if (!bookletId) return Response.json({ error: "Missing bookletId" }, { status: 400 });

  await adminDb.collection("booklets").doc(bookletId).update({
    viewCount: FieldValue.increment(1),
  });

  return Response.json({ ok: true });
}
