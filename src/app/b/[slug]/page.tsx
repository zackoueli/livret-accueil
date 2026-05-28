import { adminDb } from "@/lib/firebase-admin";
import { Booklet } from "@/types";
import { BookletViewer } from "@/components/booklet/BookletViewer";
import { notFound } from "next/navigation";

export default async function BookletPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const snap = await adminDb
    .collection("booklets")
    .where("slug", "==", slug)
    .where("isPublished", "==", true)
    .limit(1)
    .get();

  if (snap.empty) notFound();

  const doc = snap.docs[0];
  const booklet = { id: doc.id, ...doc.data() } as Booklet;

  const userDoc = await adminDb.collection("users").doc(booklet.userId).get();
  if (userDoc.data()?.plan !== "actif") notFound();

  return <BookletViewer booklet={booklet} />;
}
