import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Webhook error: ${message}`, { status: 400 });
  }

  const getUid = (obj: { metadata?: Stripe.Metadata | null }) =>
    obj.metadata?.firebaseUid ?? null;

  // API 2026-04-22.dahlia: current_period_end → billing_cycle_anchor
  const getEndDate = (sub: Stripe.Subscription): number =>
    (sub as unknown as Record<string, number>).billing_cycle_anchor ?? 0;

  console.log(`[webhook] event: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = getUid(session);
      console.log(`[webhook] checkout.session.completed — uid: ${uid}, session.id: ${session.id}, metadata:`, session.metadata);
      if (!uid) {
        console.error("[webhook] No firebaseUid in session metadata — skipping");
        break;
      }

      const sub = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const period =
        sub.items.data[0]?.price.recurring?.interval === "year"
          ? "yearly"
          : "monthly";

      console.log(`[webhook] updating user ${uid} to actif, period: ${period}`);
      await adminDb.collection("users").doc(uid).set(
        {
          plan: "actif",
          billingPeriod: period,
          stripeSubscriptionId: sub.id,
          subscriptionStatus: sub.status,
          subscriptionEndDate: getEndDate(sub),
        },
        { merge: true }
      );
      console.log(`[webhook] user ${uid} updated to actif ✓`);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const uid = getUid(sub);
      if (!uid) break;

      const period =
        sub.items.data[0]?.price.recurring?.interval === "year"
          ? "yearly"
          : "monthly";
      const isActive = sub.status === "active" || sub.status === "trialing";

      await adminDb.collection("users").doc(uid).set(
        {
          plan: isActive ? "actif" : "free",
          billingPeriod: period,
          stripeSubscriptionId: sub.id,
          subscriptionStatus: sub.status,
          subscriptionEndDate: getEndDate(sub),
        },
        { merge: true }
      );
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const uid = getUid(sub);
      if (!uid) break;

      await adminDb.collection("users").doc(uid).set(
        {
          plan: "free",
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
          subscriptionEndDate: getEndDate(sub),
        },
        { merge: true }
      );
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // API 2026: invoice.subscription → invoice.parent.subscription_details.subscription
      const subId =
        (invoice as unknown as Record<string, Record<string, Record<string, string>>>)
          .parent?.subscription_details?.subscription;
      if (!subId) break;

      const sub = await stripe.subscriptions.retrieve(subId);
      const uid = getUid(sub);
      if (!uid) break;

      await adminDb
        .collection("users")
        .doc(uid)
        .set({ subscriptionStatus: "past_due" }, { merge: true });
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
