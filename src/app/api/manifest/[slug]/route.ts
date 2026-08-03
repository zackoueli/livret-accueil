import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let name = "Bunkly";
  const snap = await adminDb
    .collection("booklets")
    .where("slug", "==", slug)
    .where("isPublished", "==", true)
    .limit(1)
    .get();
  if (!snap.empty) {
    const booklet = snap.docs[0].data();
    name = booklet.propertyName || booklet.title || "Bunkly";
  }
  const shortName = name.length > 12 ? "Bunkly" : name;

  const manifest = {
    name,
    short_name: shortName,
    description: "Livret d'accueil digital",
    start_url: `/b/${slug}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f97316",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return Response.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
