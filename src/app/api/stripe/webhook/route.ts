import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { sendPurchaseConfirmation, sendSubscriptionExpired, sendAffiliateCommissionEmail } from "@/lib/emails";

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

  // Dénormalise le plan de l'utilisateur sur tous ses livrets (badge Bunkly, etc.)
  const syncOwnerPlan = async (uid: string, plan: string) => {
    const bookletsSnap = await adminDb.collection("booklets").where("userId", "==", uid).get();
    if (bookletsSnap.empty) return;
    const batch = adminDb.batch();
    for (const doc of bookletsSnap.docs) {
      batch.update(doc.ref, { ownerPlan: plan });
    }
    await batch.commit();
  };

  const resolvePlanFromPriceId = (priceId: string | undefined): "starter" | "pro" | "agency" => {
    if (priceId === process.env.STRIPE_PRICE_AGENCY_MONTHLY || priceId === process.env.STRIPE_PRICE_AGENCY_YEARLY) return "agency";
    if (priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY || priceId === process.env.STRIPE_PRICE_STARTER_YEARLY) return "starter";
    return "pro";
  };

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
      const newPlan = resolvePlanFromPriceId(priceId);
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
      await syncOwnerPlan(uid, newPlan);
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
      const updatedPlan = resolvePlanFromPriceId(updatedPriceId);
      const finalPlan = isActive ? updatedPlan : "free";

      await adminDb.collection("users").doc(uid).set(
        {
          plan: finalPlan,
          billingPeriod: period,
          stripeSubscriptionId: sub.id,
          subscriptionStatus: sub.status,
          subscriptionEndDate: getEndDate(sub),
        },
        { merge: true }
      );
      await syncOwnerPlan(uid, finalPlan);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const uid = getUid(sub);
      if (!uid) break;

      // Lire les données user avant de les écraser (pour l'email)
      const userDoc = await adminDb.collection("users").doc(uid).get();
      const userData = userDoc.data();

      await adminDb.collection("users").doc(uid).set(
        {
          plan: "free",
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
          subscriptionEndDate: getEndDate(sub),
        },
        { merge: true }
      );
      await syncOwnerPlan(uid, "free");

      // Dépublier tous les livrets au-delà de la limite gratuite (2)
      try {
        const FREE_LIMIT = 2;
        const bookletsSnap = await adminDb.collection("booklets")
          .where("userId", "==", uid)
          .where("isPublished", "==", true)
          .get();

        const publishedDocs = bookletsSnap.docs.sort((a, b) =>
          (b.data().updatedAt ?? 0) - (a.data().updatedAt ?? 0)
        );

        // Garder les 2 plus récents publiés, dépublier le reste
        const toUnpublish = publishedDocs.slice(FREE_LIMIT);
        const batch = adminDb.batch();
        for (const doc of toUnpublish) {
          batch.update(doc.ref, { isPublished: false });
        }
        if (toUnpublish.length > 0) await batch.commit();
        console.log(`[webhook] unpublished ${toUnpublish.length} booklet(s) for user ${uid}`);
      } catch (e) {
        console.error("[webhook] Failed to unpublish booklets:", e);
      }

      // Email passage en free
      try {
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

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        (invoice as unknown as Record<string, Record<string, Record<string, string>>>)
          .parent?.subscription_details?.subscription;
      if (!subId) break;

      const sub = await stripe.subscriptions.retrieve(subId);
      const uid = getUid(sub);
      if (!uid) break;

      try {
        await handleAffiliateCommission(invoice, uid);
      } catch (e) {
        console.error("[webhook] affiliate commission error:", e);
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const snap = await adminDb
        .collection("affiliate_accounts")
        .where("stripeAccountId", "==", account.id)
        .limit(1)
        .get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({
          onboardingComplete: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
        });
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

async function handleAffiliateCommission(invoice: Stripe.Invoice, referredId: string) {
  // Idempotence : ne pas créer deux fois pour la même invoice
  const existingComm = await adminDb
    .collection("affiliate_commissions")
    .where("stripeInvoiceId", "==", invoice.id)
    .limit(1)
    .get();
  if (!existingComm.empty) return;

  // Chercher un referral pour ce user
  const pendingSnap = await adminDb
    .collection("referrals")
    .where("referredId", "==", referredId)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  const convertedSnap = await adminDb
    .collection("referrals")
    .where("referredId", "==", referredId)
    .where("status", "==", "converted")
    .limit(1)
    .get();

  let referralDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  const now = Date.now();

  if (!pendingSnap.empty) {
    // Premier paiement : convertir le referral
    referralDoc = pendingSnap.docs[0];
    const expiresAt = now + 365 * 24 * 60 * 60 * 1000; // 12 mois
    await referralDoc.ref.update({ status: "converted", convertedAt: now, expiresAt });
  } else if (!convertedSnap.empty) {
    referralDoc = convertedSnap.docs[0];
    const referralData = referralDoc.data();
    // Vérifier la fenêtre de 12 mois
    if (referralData.expiresAt && now > referralData.expiresAt) {
      await referralDoc.ref.update({ status: "expired" });
      return;
    }
  }

  if (!referralDoc) return;

  const referralData = referralDoc.data();
  const commissionAmount = Math.floor((invoice.amount_paid ?? 0) * 0.15);
  if (commissionAmount <= 0) return;

  // Créer la commission
  const commId = adminDb.collection("affiliate_commissions").doc().id;
  await adminDb.collection("affiliate_commissions").doc(commId).set({
    id: commId,
    referralId: referralDoc.id,
    referrerId: referralData.referrerId,
    referredId,
    stripeInvoiceId: invoice.id,
    amount: commissionAmount,
    status: "pending",
    createdAt: now,
  });

  // Incrémenter totalEarned sur affiliate_accounts
  await adminDb.collection("affiliate_accounts").doc(referralData.referrerId).set(
    {
      userId: referralData.referrerId,
      totalEarned: FieldValue.increment(commissionAmount),
      totalPaid: FieldValue.increment(0),
    },
    { merge: true }
  );

  // Email de notification au referrer
  try {
    const referrerDoc = await adminDb.collection("users").doc(referralData.referrerId).get();
    const referrerData = referrerDoc.data();
    if (referrerData?.email) {
      await sendAffiliateCommissionEmail({
        to: referrerData.email,
        name: referrerData.displayName || "",
        amount: commissionAmount,
      });
    }
  } catch (e) {
    console.error("[webhook] Failed to send commission email:", e);
  }
}
