import { NextRequest } from "next/server";
import { adminDb, requireAdmin } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [accountsSnap, commissionsSnap, referralsSnap] = await Promise.all([
      adminDb.collection("affiliate_accounts").get(),
      adminDb.collection("affiliate_commissions").orderBy("createdAt", "desc").limit(200).get(),
      adminDb.collection("referrals").get(),
    ]);

    // Enrichir les comptes avec les emails depuis Firestore users
    const accounts = await Promise.all(
      accountsSnap.docs.map(async (d) => {
        const data = d.data();
        const userDoc = await adminDb.collection("users").doc(data.userId).get();
        const userData = userDoc.data();
        return {
          ...data,
          email: userData?.email ?? null,
          displayName: userData?.displayName ?? null,
          referralCount: referralsSnap.docs.filter(
            (r) => r.data().referrerId === data.userId
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
