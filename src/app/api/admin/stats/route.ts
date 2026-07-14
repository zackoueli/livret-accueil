import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  const [usersSnap, bookletsSnap] = await Promise.all([
    adminDb.collection("users").get(),
    adminDb.collection("booklets").get(),
  ]);

  let free = 0, actif = 0;
  const referralSources: Record<string, number> = {};
  usersSnap.forEach((doc) => {
    const data = doc.data();
    if (data.plan === "starter" || data.plan === "pro" || data.plan === "agency") actif++;
    else free++;
    const source = data.referralSource || "unknown";
    referralSources[source] = (referralSources[source] ?? 0) + 1;
  });

  let totalViews = 0;
  bookletsSnap.forEach((doc) => {
    totalViews += doc.data().viewCount ?? 0;
  });

  // MRR depuis Stripe (users actifs × prix mensuel équivalent)
  const MONTHLY_PRICE: Record<string, number> = { starter: 900, pro: 2900, agency: 5900 };
  const YEARLY_PRICE: Record<string, number> = { starter: 6900, pro: 22200, agency: 45300 };
  let mrr = 0;
  usersSnap.forEach((doc) => {
    const d = doc.data();
    const isActive = d.subscriptionStatus === "active" || d.subscriptionStatus === "trialing";
    if (!isActive) return;
    if (d.plan === "starter" || d.plan === "pro" || d.plan === "agency") {
      mrr += d.billingPeriod === "yearly" ? YEARLY_PRICE[d.plan] / 12 : MONTHLY_PRICE[d.plan];
    }
  });

  // Livrets créés ce mois
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  let bookletsThisMonth = 0;
  bookletsSnap.forEach((doc) => {
    const d = doc.data();
    if (d.createdAt && d.createdAt > startOfMonth.getTime()) bookletsThisMonth++;
  });

  return NextResponse.json({
    users: { free, actif, total: free + actif },
    booklets: { total: bookletsSnap.size, thisMonth: bookletsThisMonth },
    views: totalViews,
    mrr: Math.round(mrr / 100),
    referralSources,
  });
}
