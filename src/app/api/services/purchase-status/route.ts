import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return Response.json({ error: "Missing session_id" }, { status: 400 });
  }

  const snap = await adminDb
    .collection("service_purchases")
    .where("stripeCheckoutSessionId", "==", sessionId)
    .limit(1)
    .get();

  if (snap.empty) {
    return Response.json({ status: "processing" });
  }

  const purchase = snap.docs[0].data();
  return Response.json({
    status: purchase.status,
    serviceName: purchase.serviceName,
    amountTotal: purchase.amountTotal,
  });
}
