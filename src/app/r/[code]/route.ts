import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { isValidCode, buildRefCookieHeader } from "@/lib/referral";

// Lien de partage d'affiliation (ex. bunkly.com/r/ABC-1234) : trace le clic
// puis redirige vers la landing avec le cookie de parrainage posé.
//
// Limite connue et assumée : les previews automatiques de liens (Slack, Discord,
// iMessage, WhatsApp…) déclenchent aussi ce GET, ce qui gonfle le compteur de
// clics. Pas de déduplication ajoutée (coûterait une lecture Firestore par clic
// pour un gain marginal) — le libellé admin doit rester "Clics", pas "Visiteurs".
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const redirectUrl = new URL("/", request.url);

  if (!isValidCode(code)) {
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const codeSnap = await adminDb
      .collection("referral_codes")
      .where("code", "==", code)
      .limit(1)
      .get();

    if (!codeSnap.empty) {
      const referrerId = codeSnap.docs[0].data().userId as string;
      const id = adminDb.collection("affiliate_events").doc().id;
      await adminDb.collection("affiliate_events").doc(id).set({
        id,
        codeType: "referral",
        type: "click",
        code,
        referrerId,
        userAgent: request.headers.get("user-agent") ?? undefined,
        createdAt: Date.now(),
      });
    }
  } catch (e) {
    console.error("[r/[code]] Failed to log click event:", e);
  }

  const response = NextResponse.redirect(redirectUrl);
  response.headers.set("Set-Cookie", buildRefCookieHeader(code));
  return response;
}
