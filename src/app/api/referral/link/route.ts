import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const { referredId, code } = await request.json();
    if (!referredId || !code) {
      return Response.json({ error: "Missing params" }, { status: 400 });
    }

    // Trouver le referrer par son code
    const codeSnap = await adminDb
      .collection("referral_codes")
      .where("code", "==", code)
      .limit(1)
      .get();

    if (codeSnap.empty) {
      // Pas un code d'affiliation — peut-être un lien de tracking marketing
      // interne (créé dans l'admin), qui n'a pas de notion de parrain/filleul.
      const marketingSnap = await adminDb
        .collection("marketing_links")
        .where("code", "==", code)
        .limit(1)
        .get();
      if (!marketingSnap.empty) {
        await marketingSnap.docs[0].ref.update({ signupCount: FieldValue.increment(1) });
        return Response.json({ ok: true });
      }
      return Response.json({ error: "Invalid code" }, { status: 404 });
    }

    const referrerId = codeSnap.docs[0].data().userId as string;

    if (referrerId === referredId) {
      return Response.json({ error: "Cannot refer yourself" }, { status: 400 });
    }

    // Idempotence : vérifier si ce referredId est déjà lié
    const existingSnap = await adminDb
      .collection("referrals")
      .where("referredId", "==", referredId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return Response.json({ ok: true });
    }

    const id = adminDb.collection("referrals").doc().id;
    await adminDb.collection("referrals").doc(id).set({
      id,
      referrerId,
      referredId,
      code,
      status: "pending",
      createdAt: Date.now(),
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[referral/link]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
