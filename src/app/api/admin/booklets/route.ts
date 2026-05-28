import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  const snap = await adminDb.collection("booklets").orderBy("createdAt", "desc").get();
  const booklets = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      title: d.title ?? "",
      propertyName: d.propertyName ?? "",
      slug: d.slug ?? "",
      userId: d.userId ?? "",
      templateId: d.templateId ?? "moderne",
      viewCount: d.viewCount ?? 0,
      createdAt: d.createdAt ?? 0,
      published: d.published ?? false,
    };
  });
  return NextResponse.json(booklets);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await adminDb.collection("booklets").doc(id).delete();
  return NextResponse.json({ ok: true });
}
