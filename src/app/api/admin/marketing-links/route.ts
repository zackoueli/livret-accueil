import { NextRequest, NextResponse } from "next/server";
import { adminDb, requireAdmin } from "@/lib/firebase-admin";
import { generateReferralCode } from "@/lib/referral";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const snap = await adminDb.collection("marketing_links").orderBy("createdAt", "desc").get();
    return NextResponse.json({ links: snap.docs.map((d) => d.data()) });
  } catch (err) {
    console.error("[admin/marketing-links GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }

    // Collision quasi improbable (charset 33^7) mais autant vérifier, même
    // pattern que pour un ID généré côté client.
    let code = generateReferralCode();
    for (let i = 0; i < 5; i++) {
      const existing = await adminDb.collection("marketing_links").where("code", "==", code).limit(1).get();
      if (existing.empty) break;
      code = generateReferralCode();
    }

    const ref = adminDb.collection("marketing_links").doc();
    const link = {
      id: ref.id,
      name: name.trim(),
      code,
      clickCount: 0,
      signupCount: 0,
      createdAt: Date.now(),
    };
    await ref.set(link);

    return NextResponse.json({ ok: true, link });
  } catch (err) {
    console.error("[admin/marketing-links POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await adminDb.collection("marketing_links").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/marketing-links DELETE]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
