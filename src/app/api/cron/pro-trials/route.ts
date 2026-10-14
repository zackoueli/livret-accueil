import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { endProTrial } from "@/lib/proTrial";
import { sendSubscriptionExpired, sendTrialEndingSoon } from "@/lib/emails";

export const runtime = "nodejs";

const REMINDER_DAYS = 3;
const DAY = 24 * 60 * 60;

// Appelé quotidiennement par Vercel Cron (voir vercel.json) :
// - rappel REMINDER_DAYS jours avant la fin des essais Pro sans Stripe
// - repasse en free les essais expirés
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  const snap = await adminDb.collection("users").where("proTrial", "==", true).get();

  let expired = 0, reminded = 0;
  for (const doc of snap.docs) {
    const user = doc.data();
    const endDate = user.subscriptionEndDate;
    if (!endDate) continue;

    if (endDate <= now) {
      try {
        await endProTrial(doc.id);
        expired++;
        if (user.email) {
          await sendSubscriptionExpired({ to: user.email, name: user.displayName || "" });
        }
      } catch (e) {
        console.error(`[cron] Failed to end pro trial for ${doc.id}:`, e);
      }
      continue;
    }

    // Fenêtre de 24h (le cron passe une fois par jour) → un seul rappel par essai
    const remaining = endDate - now;
    if (user.email && remaining > (REMINDER_DAYS - 1) * DAY && remaining <= REMINDER_DAYS * DAY) {
      try {
        await sendTrialEndingSoon({
          to: user.email,
          name: user.displayName || "",
          daysLeft: REMINDER_DAYS,
          endDate: new Date(endDate * 1000).toLocaleDateString("fr-FR", {
            day: "numeric", month: "long", year: "numeric",
          }),
        });
        reminded++;
      } catch (e) {
        console.error(`[cron] Failed to send trial reminder to ${user.email}:`, e);
      }
    }
  }

  console.log(`[cron] pro-trials: ${expired} trial(s) expired, ${reminded} reminder(s) sent`);
  return Response.json({ expired, reminded });
}
