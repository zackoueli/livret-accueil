import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const snap = await adminDb.collection("articles").orderBy("createdAt", "desc").get();
  const articles = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(articles);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, slug, excerpt, content, metaTitle, metaDesc, published } = body;
  if (!title || !slug) return NextResponse.json({ error: "title and slug required" }, { status: 400 });

  const ref = await adminDb.collection("articles").add({
    title,
    slug,
    excerpt: excerpt ?? "",
    content: content ?? "",
    metaTitle: metaTitle ?? title,
    metaDesc: metaDesc ?? excerpt ?? "",
    published: published ?? false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return NextResponse.json({ id: ref.id });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await adminDb.collection("articles").doc(id).update({ ...fields, updatedAt: Date.now() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await adminDb.collection("articles").doc(id).delete();
  return NextResponse.json({ ok: true });
}
