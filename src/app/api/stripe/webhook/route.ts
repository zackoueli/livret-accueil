import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import Stripe from "stripe";
import { sendPurchaseConfirmation, sendSubscriptionExpired } from "@/lib/emails";

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

      const priceId = sub.items.data[0]?.price.id;
      const newPlan = priceId === process.env.STRIPE_PRICE_AGENCY_MONTHLY || priceId === process.env.STRIPE_PRICE_AGENCY_YEARLY ? "agency" : "pro";
      console.log(`[webhook] updating user ${uid} to ${newPlan}, period: ${period}`);
      await adminDb.collection("users").doc(uid).set(
        {
          plan: newPlan,
          billingPeriod: period,
          stripeSubscriptionId: sub.id,
          subscriptionStatus: sub.status,
          subscriptionEndDate: getEndDate(sub),
        },
        { merge: true }
      );
      console.log(`[webhook] user ${uid} updated to ${newPlan} ✓`);

      // Email de confirmation — on lit email+nom depuis Firestore (après écriture) et depuis le customer Stripe en fallback
      try {
        const userDoc = await adminDb.collection("users").doc(uid).get();
        const userData = userDoc.data();
        // Fallback : récupérer l'email depuis le customer Stripe si absent en Firestore
        let toEmail = userData?.email as string | undefined;
        let toName = (userData?.displayName as string) || "";
        if (!toEmail && session.customer) {
          const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
          toEmail = customer.email ?? undefined;
          toName = customer.name ?? "";
        }
        console.log(`[webhook] sending purchase email to: ${toEmail}`);
        if (toEmail) {
          await sendPurchaseConfirmation({ to: toEmail, name: toName, plan: newPlan, billingPeriod: period });
          console.log(`[webhook] purchase email sent ✓`);
        } else {
          console.error("[webhook] No email found for user", uid);
        }
      } catch (e) {
        console.error("[webhook] Failed to send purchase email:", e);
      }
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
      const updatedPriceId = sub.items.data[0]?.price.id;
      const updatedPlan = updatedPriceId === process.env.STRIPE_PRICE_AGENCY_MONTHLY || updatedPriceId === process.env.STRIPE_PRICE_AGENCY_YEARLY ? "agency" : "pro";

      await adminDb.collection("users").doc(uid).set(
        {
          plan: isActive ? updatedPlan : "free",
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

      // Email passage en free
      try {
        const userDoc = await adminDb.collection("users").doc(uid).get();
        const userData = userDoc.data();
        if (userData?.email) {
          await sendSubscriptionExpired({
            to: userData.email,
            name: userData.displayName || "",
          });
        }
      } catch (e) {
        console.error("[webhook] Failed to send expiration email:", e);
      }
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
