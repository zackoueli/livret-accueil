import { NextRequest } from "next/server";
import { sendPurchaseConfirmation, sendExpirationWarning, sendSubscriptionExpired } from "@/lib/emails";

// Route de test — À SUPPRIMER EN PRODUCTION
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not available in production", { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "purchase";
  const to = request.nextUrl.searchParams.get("to") ?? "mathieu.wreizh@gmail.com";

  if (type === "purchase") {
    await sendPurchaseConfirmation({ to, name: "Mathieu", plan: "pro", billingPeriod: "monthly" });
  } else if (type === "warning") {
    await sendExpirationWarning({ to, name: "Mathieu", daysLeft: 7, renewalDate: "17 juin 2025" });
  } else if (type === "expired") {
    await sendSubscriptionExpired({ to, name: "Mathieu" });
  }

  return Response.json({ sent: true, type, to });
}
