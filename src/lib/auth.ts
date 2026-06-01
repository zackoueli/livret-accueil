import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile } from "@/types";

export async function registerWithEmail(email: string, password: string, name: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  const profile: UserProfile = {
    uid: cred.user.uid,
    email,
    displayName: name,
    photoURL: null,
    plan: "actif",
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "users", cred.user.uid), profile);
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
    const existing = await import("firebase/firestore").then(({ getDoc }) => getDoc(userRef));
    const profile = {
      uid: result.user.uid,
      email: result.user.email!,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      ...(existing.exists() ? {} : { plan: "actif", createdAt: Date.now() }),
    };
    await setDoc(userRef, profile, { merge: true });
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

export async function signOut() {
  await firebaseSignOut(auth);
}
