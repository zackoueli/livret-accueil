import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { PLAN_COMMISSION } from "@/lib/plans";
import { computeServiceTotal, ServiceSelection } from "@/lib/serviceOptions";
import { BookletService, Plan } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { bookletId, serviceId, selection } = await request.json();
    if (!bookletId || !serviceId) {
      return Response.json({ error: "Missing bookletId or serviceId" }, { status: 400 });
    }

    const bookletDoc = await adminDb.collection("booklets").doc(bookletId).get();
    if (!bookletDoc.exists || bookletDoc.data()?.isPublished !== true) {
      return Response.json({ error: "Booklet not found" }, { status: 404 });
    }
    const booklet = bookletDoc.data()!;

    const serviceDoc = await adminDb.collection("booklet_services").doc(serviceId).get();
    if (!serviceDoc.exists || serviceDoc.data()?.bookletId !== bookletId || serviceDoc.data()?.enabled !== true) {
      return Response.json({ error: "Service not found" }, { status: 404 });
    }
    const service = serviceDoc.data() as BookletService;

    const hostConnectDoc = await adminDb.collection("host_connect_accounts").doc(booklet.userId).get();
    const hostConnect = hostConnectDoc.data();
    if (!hostConnectDoc.exists || hostConnect?.chargesEnabled !== true) {
      return Response.json({ error: "Host not payable" }, { status: 400 });
    }

    // Recalcul entièrement côté serveur — jamais de montant/quantité fourni par le client.
    const { totalAmount, quantity, choiceSelections } = computeServiceTotal(
      service,
      (selection ?? {}) as ServiceSelection
    );

    if (totalAmount <= 0) {
      return Response.json({ error: "Nothing selected" }, { status: 400 });
    }

    const commissionRate = PLAN_COMMISSION[(booklet.ownerPlan as Plan) ?? "free"];
    const applicationFeeAmount = Math.round((totalAmount * commissionRate) / 100);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.bunkly.co";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: totalAmount,
            product_data: { name: service.name },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: { destination: hostConnect!.stripeAccountId },
      },
      metadata: {
        type: "service_purchase",
        bookletId,
        serviceId,
        hostUid: booklet.userId,
        serviceName: service.name,
        quantity: String(quantity),
        unitLabel: service.priceType === "per_unit" ? (service.unitLabel ?? "") : "",
        // Encodage minimal (id + quantité uniquement) — le webhook relit la définition
        // des choix du service pour résoudre les libellés humains, même logique que
        // serviceName déjà snapshotté plutôt que fourni par le client.
        choiceSelections: JSON.stringify(choiceSelections.map((c) => ({ i: c.choice.id, q: c.quantity }))),
        commissionRate: String(commissionRate),
      },
      success_url: `${appUrl}/b/${booklet.slug}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/b/${booklet.slug}?purchase=cancel`,
    });

    return Response.json({ url: session.url });
  } catch (err: any) {
    console.error("[services/checkout]", err);
    return Response.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}
