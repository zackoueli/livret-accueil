import { adminDb } from "@/lib/firebase-admin";
import { nanoid } from "nanoid";

export async function GET() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = nanoid(10);
    const snap = await adminDb.collection("booklets").where("slug", "==", slug).limit(1).get();
    if (snap.empty) return Response.json({ slug });
  }
  return Response.json({ error: "Impossible de générer un slug unique" }, { status: 500 });
}
