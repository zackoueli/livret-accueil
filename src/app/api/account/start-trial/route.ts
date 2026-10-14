import { NextRequest } from "next/server";
import { adminAuth, adminDb, requireAuthUid } from "@/lib/firebase-admin";
import { grantProTrial } from "@/lib/proTrial";

// Essai Pro de bienvenue, appelé juste après l'inscription (voir lib/auth.ts).
// Accordé une seule fois par compte, et uniquement aux comptes créés il y a moins de 24h.
const MAX_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const uid = await requireAuthUid(request);
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userDoc = await adminDb.collection("users").doc(uid).get();
  if (!userDoc.exists) return Response.json({ error: "Profil introuvable" }, { status: 404 });
  const d = userDoc.data()!;
  if (d.trialUsed || d.stripeSubscriptionId || (d.plan && d.plan !== "free")) {
    return Response.json({ granted: false });
  }

  const authUser = await adminAuth.getUser(uid);
  const createdAt = new Date(authUser.metadata.creationTime).getTime();
  if (Date.now() - createdAt > MAX_ACCOUNT_AGE_MS) {
    return Response.json({ granted: false });
  }

  const subscriptionEndDate = await grantProTrial(uid);
  return Response.json({ granted: true, subscriptionEndDate });
}
