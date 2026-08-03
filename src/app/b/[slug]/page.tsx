import { Metadata } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { Booklet } from "@/types";
import { BookletViewer } from "@/components/booklet/BookletViewer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

// Manifest dedie par livret : la start_url pointe vers ce livret precis, pour
// qu'"Ajouter a l'ecran d'accueil" cree un raccourci vers le bon livret plutot
// que vers la racine de la plateforme (voir /api/manifest/[slug]).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { manifest: `/api/manifest/${slug}` };
}

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
  const booklet = { ...doc.data(), id: doc.id } as Booklet;

  const effectiveBooklet = templateOverride
    ? { ...booklet, templateId: templateOverride }
    : booklet;

  return <BookletViewer booklet={effectiveBooklet} />;
}
