import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile } from "@/types";
import { generateReferralCode, getRefCookie } from "./referral";

export async function registerWithEmail(
  email: string,
  password: string,
  name: string,
  refCode?: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  const profile: UserProfile = {
    uid: cred.user.uid,
    email,
    displayName: name,
    photoURL: null,
    plan: "free",
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "users", cred.user.uid), profile);

  // Générer un code de parrainage pour ce nouvel utilisateur
  const code = generateReferralCode();
  await setDoc(doc(db, "referral_codes", cred.user.uid), {
    userId: cred.user.uid,
    code,
    createdAt: Date.now(),
  });

  // Lier le parrainage si l'utilisateur vient d'un lien ref
  if (refCode) {
    try {
      await fetch("/api/referral/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referredId: cred.user.uid, code: refCode }),
      });
    } catch {
      // non-bloquant
    }
  }

  return cred.user;
}

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    // Ne jamais écraser plan — on écrit seulement les champs de profil de base
    // et on initialise plan à "free" uniquement si le document n'existe pas encore
    const userRef = doc(db, "users", result.user.uid);
    const { getDoc } = await import("firebase/firestore");
    const existing = await getDoc(userRef);
    const profile = {
      uid: result.user.uid,
      email: result.user.email!,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      ...(existing.exists() ? {} : { plan: "free", createdAt: Date.now() }),
    };
    await setDoc(userRef, profile, { merge: true });

    // Générer le code de parrainage si c'est un nouveau user Google
    if (!existing.exists()) {
      const code = generateReferralCode();
      await setDoc(doc(db, "referral_codes", result.user.uid), {
        userId: result.user.uid,
        code,
        createdAt: Date.now(),
      });
      const refCode = getRefCookie();
      if (refCode) {
        try {
          await fetch("/api/referral/link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referredId: result.user.uid, code: refCode }),
          });
        } catch {
          // non-bloquant
        }
      }
    }

    return result.user;
  } catch (err: any) {
    // COOP warning : la popup s'est fermée mais l'auth a quand même réussi
    if (err?.code === "auth/cancelled-popup-request" || err?.message?.includes("Cross-Origin")) {
      // Attendre que Firebase détecte le changement d'état
      return new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000));
    }
    throw err;
  }
}

export async function resetPassword(email: string) {
  await firebaseSendPasswordResetEmail(auth, email);
}

export async function signOut() {
  await firebaseSignOut(auth);
}
