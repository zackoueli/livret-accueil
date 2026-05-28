import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  const [usersSnap, bookletsSnap] = await Promise.all([
    adminDb.collection("users").get(),
    adminDb.collection("booklets").get(),
  ]);

  let free = 0, actif = 0;
  usersSnap.forEach((doc) => {
    const data = doc.data();
    if (data.plan === "actif") actif++;
    else free++;
  });

  let totalViews = 0;
  bookletsSnap.forEach((doc) => {
    totalViews += doc.data().viewCount ?? 0;
  });

  // MRR depuis Stripe (users actifs × prix mensuel)
  // On calcule à partir des subscriptions actives en base
  let mrr = 0;
  usersSnap.forEach((doc) => {
    const d = doc.data();
    if (d.plan === "actif" && d.subscriptionStatus === "active") {
      mrr += d.billingPeriod === "yearly" ? 990 / 12 : 990;
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
  });
}
