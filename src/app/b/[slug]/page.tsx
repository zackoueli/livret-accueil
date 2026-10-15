import { Metadata } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { Booklet, Plan } from "@/types";
import { planAllowsDesign } from "@/lib/plans";
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
  searchParams: Promise<{ templateOverride?: string; accentOverride?: string }>;
}) {
  const { slug } = await params;
  const { templateOverride, accentOverride } = await searchParams;

  const snap = await adminDb
    .collection("booklets")
    .where("slug", "==", slug)
    .where("isPublished", "==", true)
    .limit(1)
    .get();

  if (snap.empty) notFound();

  const doc = snap.docs[0];
  const booklet = { ...doc.data(), id: doc.id } as Booklet;

  // Un livret au design réservé aux abonnés ne peut pas être publié par un compte gratuit
  // (l'éditeur bloque, et la fin d'abonnement dépublie) : filet de sécurité côté serveur.
  // Le plan est lu sur le compte du propriétaire : `booklet.ownerPlan` est une copie
  // dénormalisée qui peut être périmée (plan changé depuis l'admin, livret créé avant, etc.).
  const owner = booklet.userId ? (await adminDb.collection("users").doc(booklet.userId).get()).data() : undefined;
  const rawPlan = (owner?.plan ?? booklet.ownerPlan ?? "free") as string;
  const proTrialExpired = !!owner?.proTrial && !!owner.subscriptionEndDate && owner.subscriptionEndDate * 1000 < Date.now();
  const ownerPlan = (proTrialExpired ? "free" : rawPlan === "actif" ? "pro" : rawPlan) as Plan;
  if (!planAllowsDesign(ownerPlan, booklet.templateId)) notFound();
  booklet.ownerPlan = ownerPlan;

  // Overrides pour les apercus internes (modale de creation, editeur) : ne modifient
  // jamais le livret stocke, juste le rendu de cette requete.
  const validHex = accentOverride && /^#[0-9a-fA-F]{6}$/.test(accentOverride) ? accentOverride : undefined;
  const effectiveBooklet = (templateOverride || validHex)
    ? {
        ...booklet,
        ...(templateOverride ? { templateId: templateOverride } : {}),
        ...(validHex ? { accentColor: validHex } : {}),
      }
    : booklet;

  return <BookletViewer booklet={effectiveBooklet} />;
}
