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

    const accountDoc = await adminDb.collection("host_connect_accounts").doc(userId).get();
    if (!accountDoc.exists) {
      return Response.json({ connected: false });
    }

    const data = accountDoc.data()!;

    try {
      const account = await stripe.accounts.retrieve(data.stripeAccountId);
      await accountDoc.ref.update({
        onboardingComplete: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      });

      // Dénormalise l'éligibilité aux achats de services sur tous les livrets de
      // l'hôte — le webhook account.updated le fait aussi, mais cette route est
      // appelée à chaque affichage du dashboard donc sert de filet de sécurité
      // si le webhook n'est pas arrivé (ex: local sans tunnel Stripe actif).
      const bookletsSnap = await adminDb.collection("booklets").where("userId", "==", userId).get();
      if (!bookletsSnap.empty) {
        const batch = adminDb.batch();
        for (const doc of bookletsSnap.docs) {
          if (doc.data().addonsPurchasable !== account.charges_enabled) {
            batch.update(doc.ref, { addonsPurchasable: account.charges_enabled });
          }
        }
        await batch.commit();
      }

      return Response.json({
        connected: true,
        onboardingComplete: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      });
    } catch {
      return Response.json({
        connected: true,
        onboardingComplete: data.onboardingComplete ?? false,
        chargesEnabled: data.chargesEnabled ?? false,
        payoutsEnabled: data.payoutsEnabled ?? false,
      });
    }
  } catch (err) {
    console.error("[host/connect/status]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
