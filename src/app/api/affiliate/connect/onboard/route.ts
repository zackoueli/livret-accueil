import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();
    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    const accountDoc = await adminDb.collection("affiliate_accounts").doc(userId).get();
    let stripeAccountId: string;

    if (accountDoc.exists && accountDoc.data()?.stripeAccountId) {
      stripeAccountId = accountDoc.data()!.stripeAccountId;
    } else {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email,
        capabilities: {
          transfers: { requested: true },
        },
        settings: {
          payouts: { schedule: { interval: "manual" } },
        },
      });
      stripeAccountId = account.id;

      await adminDb.collection("affiliate_accounts").doc(userId).set({
        userId,
        stripeAccountId,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        totalEarned: 0,
        totalPaid: 0,
        createdAt: Date.now(),
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.bunkly.co";
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/fr/dashboard/affiliation?connect=refresh`,
      return_url: `${appUrl}/fr/dashboard/affiliation?connect=success`,
      type: "account_onboarding",
    });

    return Response.json({ url: accountLink.url });
  } catch (err) {
    console.error("[affiliate/connect/onboard]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
