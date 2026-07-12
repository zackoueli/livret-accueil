import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb, requireAuthUid } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const MIN_PAYOUT_CENTS = 3000; // €30

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    const authUid = await requireAuthUid(request);
    if (!authUid || authUid !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountDoc = await adminDb.collection("affiliate_accounts").doc(userId).get();
    if (!accountDoc.exists) {
      return Response.json({ error: "No Connect account found" }, { status: 400 });
    }

    const accountData = accountDoc.data()!;
    if (!accountData.payoutsEnabled) {
      return Response.json({ error: "Account not ready for payouts. Complete KYC verification first." }, { status: 400 });
    }

    // Récupérer toutes les commissions en attente
    const commissionsSnap = await adminDb
      .collection("affiliate_commissions")
      .where("referrerId", "==", userId)
      .where("status", "==", "pending")
      .get();

    if (commissionsSnap.empty) {
      return Response.json({ error: "No pending commissions" }, { status: 400 });
    }

    const totalAmount = commissionsSnap.docs.reduce(
      (sum, doc) => sum + (doc.data().amount as number),
      0
    );

    if (totalAmount < MIN_PAYOUT_CENTS) {
      return Response.json({
        error: `Minimum €30 required. Current balance: €${(totalAmount / 100).toFixed(2)}`,
      }, { status: 400 });
    }

    // Créer le virement Stripe vers le compte Connect
    const transfer = await stripe.transfers.create({
      amount: totalAmount,
      currency: "eur",
      destination: accountData.stripeAccountId,
      description: `Bunkly affiliation — ${commissionsSnap.size} commission(s)`,
    });

    // Mettre à jour les commissions et le total versé en batch
    const batch = adminDb.batch();
    const now = Date.now();

    for (const commDoc of commissionsSnap.docs) {
      batch.update(commDoc.ref, {
        status: "paid",
        paidAt: now,
        stripeTransferId: transfer.id,
      });
    }

    batch.update(accountDoc.ref, {
      totalPaid: FieldValue.increment(totalAmount),
    });

    await batch.commit();

    return Response.json({
      ok: true,
      transferId: transfer.id,
      amount: totalAmount,
      commissionsCount: commissionsSnap.size,
    });
  } catch (err) {
    console.error("[affiliate/payout]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
