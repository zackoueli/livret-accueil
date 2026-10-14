import { NextRequest, NextResponse } from "next/server";
import { adminDb, requireAdmin } from "@/lib/firebase-admin";
import { grantProTrial, endProTrial } from "@/lib/proTrial";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snap = await adminDb.collection("users").get();
  const users = snap.docs
    .map((doc) => {
      const d = doc.data();
      return {
        uid: doc.id,
        email: d.email ?? "",
        displayName: d.displayName ?? "",
        plan: d.plan === "actif" ? "pro" : (d.plan ?? "free"),
        subscriptionStatus: d.subscriptionStatus ?? null,
        subscriptionEndDate: d.subscriptionEndDate ?? null,
        hasStripeSubscription: !!d.stripeSubscriptionId,
        proTrial: d.proTrial === true,
        createdAt: d.createdAt ?? 0,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json(users);
}

// { uid, action: "grant_trial" | "revoke_trial" }
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { uid, action } = await request.json();
  if (!uid) return NextResponse.json({ error: "Missing uid" }, { status: 400 });

  const userDoc = await adminDb.collection("users").doc(uid).get();
  if (!userDoc.exists) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  const d = userDoc.data()!;

  if (action === "grant_trial") {
    // Ne pas écraser un abonnement Stripe en cours
    const stripeActive = !!d.stripeSubscriptionId && !d.proTrial &&
      ["active", "trialing", "past_due"].includes(d.subscriptionStatus);
    if (stripeActive) {
      return NextResponse.json({ error: "Ce compte a déjà un abonnement Stripe actif" }, { status: 409 });
    }
    const subscriptionEndDate = await grantProTrial(uid);
    return NextResponse.json({ ok: true, subscriptionEndDate });
  }

  if (action === "revoke_trial") {
    if (!d.proTrial) return NextResponse.json({ error: "Aucun essai Pro en cours" }, { status: 400 });
    await endProTrial(uid);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
