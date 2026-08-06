import { NextRequest } from "next/server";
import { adminDb, requireAdmin } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [accountsSnap, commissionsSnap, referralsSnap, clickEventsSnap, referralCodesSnap] = await Promise.all([
      adminDb.collection("affiliate_accounts").get(),
      adminDb.collection("affiliate_commissions").orderBy("createdAt", "desc").limit(200).get(),
      adminDb.collection("referrals").get(),
      adminDb.collection("affiliate_events").where("codeType", "==", "referral").orderBy("createdAt", "desc").limit(1000).get(),
      adminDb.collection("referral_codes").get(),
    ]);

    const codeByUserId: Record<string, string> = {};
    for (const d of referralCodesSnap.docs) {
      codeByUserId[d.data().userId as string] = d.data().code as string;
    }

    const clicksByCode: Record<string, number> = {};
    for (const d of clickEventsSnap.docs) {
      const code = d.data().code as string;
      clicksByCode[code] = (clicksByCode[code] ?? 0) + 1;
    }

    const stripeAccountByUserId: Record<string, FirebaseFirestore.DocumentData> = {};
    for (const d of accountsSnap.docs) {
      stripeAccountByUserId[d.data().userId as string] = d.data();
    }

    // Liste basée sur referral_codes (tout utilisateur en a un dès l'inscription),
    // pas sur affiliate_accounts (créé seulement si l'onboarding Stripe Connect a
    // été fait) — sinon un affilié qui a partagé son lien sans connecter Stripe
    // disparaît complètement des stats.
    const accounts = await Promise.all(
      referralCodesSnap.docs.map(async (d) => {
        const userId = d.data().userId as string;
        const code = d.data().code as string;
        const stripeAccount = stripeAccountByUserId[userId];
        const userDoc = await adminDb.collection("users").doc(userId).get();
        const userData = userDoc.data();
        return {
          userId,
          stripeAccountId: stripeAccount?.stripeAccountId ?? null,
          onboardingComplete: stripeAccount?.onboardingComplete ?? false,
          chargesEnabled: stripeAccount?.chargesEnabled ?? false,
          payoutsEnabled: stripeAccount?.payoutsEnabled ?? false,
          totalEarned: stripeAccount?.totalEarned ?? 0,
          totalPaid: stripeAccount?.totalPaid ?? 0,
          email: userData?.email ?? null,
          displayName: userData?.displayName ?? null,
          code,
          clickCount: clicksByCode[code] ?? 0,
          referralCount: referralsSnap.docs.filter(
            (r) => r.data().referrerId === userId
          ).length,
          conversionCount: referralsSnap.docs.filter(
            (r) => r.data().referrerId === userId && r.data().status === "converted"
          ).length,
        };
      })
    );

    return Response.json({
      accounts,
      commissions: commissionsSnap.docs.map((d) => d.data()),
      referrals: referralsSnap.docs.map((d) => d.data()),
    });
  } catch (err) {
    console.error("[admin/affiliates GET]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { commissionId, status } = await request.json();
    if (!commissionId || !status) {
      return Response.json({ error: "Missing params" }, { status: 400 });
    }
    await adminDb.collection("affiliate_commissions").doc(commissionId).update({ status });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[admin/affiliates PATCH]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
