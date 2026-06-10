import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendExpirationWarning } from "@/lib/emails";

export const runtime = "nodejs";

// Appelé quotidiennement par Vercel Cron (voir vercel.json)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  const in7days = now + 7 * 24 * 60 * 60;
  const in8days = now + 8 * 24 * 60 * 60;

  // Trouve les users dont subscriptionEndDate est dans les prochaines 7-8j
  const snap = await adminDb.collection("users")
    .where("plan", "in", ["pro", "agency"])
    .where("subscriptionEndDate", ">=", in7days)
    .where("subscriptionEndDate", "<=", in8days)
    .get();

  let sent = 0;
  for (const doc of snap.docs) {
    const user = doc.data();
    if (!user.email) continue;
    const renewalDate = new Date(user.subscriptionEndDate * 1000).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
    try {
      await sendExpirationWarning({
        to: user.email,
        name: user.displayName || "",
        daysLeft: 7,
        renewalDate,
      });
      sent++;
    } catch (e) {
      console.error(`[cron] Failed to send warning to ${user.email}:`, e);
    }
  }

  console.log(`[cron] expiration-warning: ${sent} email(s) sent`);
  return Response.json({ sent });
}
