import { adminDb } from "@/lib/firebase-admin";
import { PLAN_LIMITS, FREE_DESIGNS } from "@/lib/plans";

// Essai Pro sans Stripe : offert à l'inscription ou depuis l'admin.
// Le user est marqué `proTrial: true` ; le cron /api/cron/pro-trials le repasse
// en free une fois `subscriptionEndDate` dépassée.

export const PRO_TRIAL_DAYS = 14;

// Dénormalise le plan de l'utilisateur sur tous ses livrets (badge Bunkly, etc.)
async function syncOwnerPlan(uid: string, plan: string) {
  const bookletsSnap = await adminDb.collection("booklets").where("userId", "==", uid).get();
  if (bookletsSnap.empty) return;
  const batch = adminDb.batch();
  for (const doc of bookletsSnap.docs) {
    batch.update(doc.ref, { ownerPlan: plan });
  }
  await batch.commit();
}

// Retour au plan gratuit : on ne touche pas au design des livrets, on dépublie ceux
// qui ne respectent plus le plan gratuit. Restent publiés au plus PLAN_LIMITS.free livret(s)
// au design gratuit, les plus récemment modifiés en priorité.
// L'éditeur bloque ensuite la republication tant que le design est réservé aux abonnés.
export async function unpublishBeyondFreePlan(uid: string): Promise<number> {
  const bookletsSnap = await adminDb.collection("booklets")
    .where("userId", "==", uid)
    .where("isPublished", "==", true)
    .get();
  const keep = new Set(
    bookletsSnap.docs
      .filter((doc) => FREE_DESIGNS.includes(doc.data().templateId ?? "simple"))
      .sort((a, b) => (b.data().updatedAt ?? 0) - (a.data().updatedAt ?? 0))
      .slice(0, PLAN_LIMITS.free.booklets)
      .map((doc) => doc.id)
  );
  const toUnpublish = bookletsSnap.docs.filter((doc) => !keep.has(doc.id));
  if (toUnpublish.length === 0) return 0;
  const batch = adminDb.batch();
  for (const doc of toUnpublish) {
    batch.update(doc.ref, { isPublished: false });
  }
  await batch.commit();
  return toUnpublish.length;
}

export async function grantProTrial(uid: string): Promise<number> {
  const endDate = Math.floor(Date.now() / 1000) + PRO_TRIAL_DAYS * 24 * 60 * 60;
  await adminDb.collection("users").doc(uid).set(
    {
      plan: "pro",
      billingPeriod: "monthly",
      subscriptionStatus: "trialing",
      subscriptionEndDate: endDate,
      // Pas de renouvellement : l'UI affiche « accès jusqu'au … »
      cancelAtPeriodEnd: true,
      proTrial: true,
      trialUsed: true,
    },
    { merge: true }
  );
  await syncOwnerPlan(uid, "pro");
  return endDate;
}

export async function endProTrial(uid: string) {
  await adminDb.collection("users").doc(uid).set(
    {
      plan: "free",
      subscriptionStatus: "canceled",
      cancelAtPeriodEnd: false,
      proTrial: false,
    },
    { merge: true }
  );
  await syncOwnerPlan(uid, "free");
  await unpublishBeyondFreePlan(uid);
}
