import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { adminDb, requireAdmin } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [snap, usersSnap] = await Promise.all([
    adminDb.collection("booklets").orderBy("createdAt", "desc").get(),
    adminDb.collection("users").get(),
  ]);

  const emailByUserId = new Map<string, string>();
  usersSnap.forEach((doc) => emailByUserId.set(doc.id, doc.data().email ?? ""));

  const booklets = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      title: d.title ?? "",
      propertyName: d.propertyName ?? "",
      slug: d.slug ?? "",
      userId: d.userId ?? "",
      userEmail: emailByUserId.get(d.userId) ?? "",
      templateId: d.templateId ?? "moderne",
      viewCount: d.viewCount ?? 0,
      createdAt: d.createdAt ?? 0,
      published: d.isPublished ?? false,
    };
  });
  return NextResponse.json(booklets);
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await adminDb.collection("booklets").doc(id).delete();
  return NextResponse.json({ ok: true });
}
