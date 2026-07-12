import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb, requireAuthUid } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    const authUid = await requireAuthUid(request);
    if (!authUid || authUid !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountDoc = await adminDb.collection("affiliate_accounts").doc(userId).get();
    if (!accountDoc.exists) {
      return Response.json({ connected: false, totalEarned: 0, totalPaid: 0 });
    }

    const data = accountDoc.data()!;

    // Rafraîchir le statut depuis Stripe
    try {
      const account = await stripe.accounts.retrieve(data.stripeAccountId);
      await accountDoc.ref.update({
        onboardingComplete: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      });
      return Response.json({
        connected: true,
        onboardingComplete: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        totalEarned: data.totalEarned ?? 0,
        totalPaid: data.totalPaid ?? 0,
      });
    } catch {
      // Si le compte Stripe est introuvable, retourner les données locales
      return Response.json({
        connected: true,
        onboardingComplete: data.onboardingComplete ?? false,
        chargesEnabled: data.chargesEnabled ?? false,
        payoutsEnabled: data.payoutsEnabled ?? false,
        totalEarned: data.totalEarned ?? 0,
        totalPaid: data.totalPaid ?? 0,
      });
    }
  } catch (err) {
    console.error("[affiliate/connect/status]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
