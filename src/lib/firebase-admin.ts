import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { NextRequest } from "next/server";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();

// Verifie le Firebase ID token du header Authorization et retourne l'uid de
// l'appelant. A utiliser sur toute route API qui agit au nom d'un utilisateur
// (ex: Stripe checkout/portal, payouts affiliation) pour empecher qu'un client
// agisse au nom d'un userId arbitraire passe dans le body/query.
export async function requireAuthUid(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// Liste des emails autorisés à accéder au panel admin, définie côté serveur
// uniquement (jamais dans du code client / bundle JS).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Verifie le Firebase ID token du header Authorization et confirme que
// l'appelant fait partie des admins autorisés (ADMIN_EMAILS). A utiliser sur
// toute route API sous /api/admin/*.
export async function requireAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return false;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email?.toLowerCase();
    return !!email && ADMIN_EMAILS.includes(email);
  } catch {
    return false;
  }
}
