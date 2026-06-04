import { adminDb } from "@/lib/firebase-admin";
import { Booklet } from "@/types";
import { BookletViewer } from "@/components/booklet/BookletViewer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BookletPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ templateOverride?: string }>;
}) {
  const { slug } = await params;
  const { templateOverride } = await searchParams;

  const snap = await adminDb
    .collection("booklets")
    .where("slug", "==", slug)
    .where("isPublished", "==", true)
    .limit(1)
    .get();

  if (snap.empty) notFound();

  const doc = snap.docs[0];
  const booklet = { id: doc.id, ...doc.data() } as Booklet;

  const effectiveBooklet = templateOverride
    ? { ...booklet, templateId: templateOverride }
    : booklet;

  return <BookletViewer booklet={effectiveBooklet} />;
}
