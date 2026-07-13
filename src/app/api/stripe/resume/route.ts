import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb, requireAuthUid } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  const { userId } = await request.json();

  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 400 });
  }

  const authUid = await requireAuthUid(request);
  if (!authUid || authUid !== userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userDoc = await adminDb.collection("users").doc(userId).get();
  const subscriptionId = userDoc.data()?.stripeSubscriptionId;

  if (!subscriptionId) {
    return Response.json({ error: "No active subscription found" }, { status: 404 });
  }

  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });

  return Response.json({ ok: true });
}
