import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  const { userId, locale } = await request.json();

  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 400 });
  }

  const userDoc = await adminDb.collection("users").doc(userId).get();
  const customerId = userDoc.data()?.stripeCustomerId;

  if (!customerId) {
    return Response.json({ error: "No Stripe customer found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const localePath = locale ? `/${locale}` : "";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}${localePath}/dashboard/settings`,
  });

  return Response.json({ url: session.url });
}
