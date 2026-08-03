import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb, requireAuthUid } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();
    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    const authUid = await requireAuthUid(request);
    if (!authUid || authUid !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountDoc = await adminDb.collection("host_connect_accounts").doc(userId).get();
    let stripeAccountId: string;

    if (accountDoc.exists && accountDoc.data()?.stripeAccountId) {
      stripeAccountId = accountDoc.data()!.stripeAccountId;
    } else {
      // Pas de payout schedule "manual" ici : les ventes de services utilisent des
      // destination charges (application_fee_amount + transfer_data.destination), les
      // fonds doivent donc suivre le planning de virement par défaut du compte Stripe.
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email,
        capabilities: {
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;

      await adminDb.collection("host_connect_accounts").doc(userId).set({
        userId,
        stripeAccountId,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        createdAt: Date.now(),
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.bunkly.co";
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/fr/dashboard/payments?connect=refresh`,
      return_url: `${appUrl}/fr/dashboard/payments?connect=success`,
      type: "account_onboarding",
    });

    return Response.json({ url: accountLink.url });
  } catch (err: any) {
    console.error("[host/connect/onboard]", err);
    return Response.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}
