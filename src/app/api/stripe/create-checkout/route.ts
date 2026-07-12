import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb, requireAuthUid } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  const { userId, email, billingPeriod, plan, locale } = await request.json();

  if (!userId || !email || !billingPeriod) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }

  const authUid = await requireAuthUid(request);
  if (!authUid || authUid !== userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isYearly = billingPeriod === "yearly";
  const PRICE_IDS: Record<string, { monthly?: string; yearly?: string }> = {
    starter: { monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY, yearly: process.env.STRIPE_PRICE_STARTER_YEARLY },
    pro:     { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY, yearly: process.env.STRIPE_PRICE_PRO_YEARLY },
    agency:  { monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY, yearly: process.env.STRIPE_PRICE_AGENCY_YEARLY },
  };
  const priceId = isYearly ? PRICE_IDS[plan]?.yearly : PRICE_IDS[plan]?.monthly;
  if (!priceId) {
    return Response.json({ error: "Plan indisponible" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const localePath = locale ? `/${locale}` : "";

  // Retrieve or create Stripe customer
  const userDoc = await adminDb.collection("users").doc(userId).get();
  const userData = userDoc.data();
  let customerId: string | undefined = userData?.stripeCustomerId;

  if (customerId) {
    // Vérifie que le customer existe bien en mode live (pas un ID test)
    try {
      await stripe.customers.retrieve(customerId);
    } catch {
      customerId = undefined;
    }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { firebaseUid: userId },
    });
    customerId = customer.id;
    await adminDb.collection("users").doc(userId).set(
      { stripeCustomerId: customer.id },
      { merge: true }
    );
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}${localePath}/dashboard?checkout=success`,
    cancel_url: `${appUrl}${localePath}/dashboard?checkout=cancel`,
    metadata: { firebaseUid: userId },
    subscription_data: {
      metadata: { firebaseUid: userId },
    },
    allow_promotion_codes: true,
  });

  return Response.json({ url: session.url });
}
