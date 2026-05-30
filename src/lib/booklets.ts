import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  deleteField,
} from "firebase/firestore";
import { db } from "./firebase";
import { Booklet, BookletModule, ModuleType } from "@/types";

// Firestore rejette les `undefined`.
// - Au niveau racine : on utilise deleteField() pour supprimer le champ
// - Dans les objets imbriqués : on retire simplement la clé (deleteField() n'est pas supporté en nested)
function sanitizeForFirestore(
  obj: Record<string, unknown>,
  isRoot = true
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      if (isRoot) result[key] = deleteField();
      // sinon on omet simplement la clé
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = sanitizeForFirestore(value as Record<string, unknown>, false);
    } else {
      result[key] = value;
    }
  }
  return result;
}
import { nanoid } from "nanoid";

const DEFAULT_MODULES: BookletModule[] = [
  { id: nanoid(), type: "arrival",       enabled: true,  order: 0, content: {}, images: [], documents: [] },
  { id: nanoid(), type: "accommodation", enabled: true,  order: 1, content: {}, images: [], documents: [] },
  { id: nanoid(), type: "rules",         enabled: true,  order: 2, content: {}, images: [], documents: [] },
  { id: nanoid(), type: "kitchen",       enabled: true,  order: 3, content: {}, images: [], documents: [] },
  { id: nanoid(), type: "neighborhood",  enabled: true,  order: 4, content: {}, images: [], documents: [] },
  { id: nanoid(), type: "safety",        enabled: true,  order: 5, content: {}, images: [], documents: [] },
  { id: nanoid(), type: "contact",       enabled: true,  order: 6, content: {}, images: [], documents: [] },
  { id: nanoid(), type: "checkout",      enabled: true,  order: 7, content: {}, images: [], documents: [] },
];

export async function createBooklet(userId: string, title: string): Promise<string> {
  const slug = nanoid(10);
  const booklet: Omit<Booklet, "id"> = {
    userId,
    title,
    slug,
    accentColor: "#6366f1",
    propertyName: title,
    modules: DEFAULT_MODULES,
    isPublished: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const ref = await addDoc(collection(db, "booklets"), booklet);
  return ref.id;
}

export async function getUserBooklets(userId: string): Promise<Booklet[]> {
  const q = query(
    collection(db, "booklets"),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booklet));
}

export async function updateBooklet(id: string, data: Partial<Booklet>) {
  const clean = sanitizeForFirestore({ ...data, updatedAt: Date.now() } as Record<string, unknown>);
  await updateDoc(doc(db, "booklets", id), clean);
}

export async function deleteBooklet(id: string) {
  await deleteDoc(doc(db, "booklets", id));
}

export async function duplicateBooklet(booklet: Booklet): Promise<string> {
  const newSlug = nanoid(10);
  const copy: Omit<Booklet, "id"> = {
    ...booklet,
    title: `${booklet.title} (copie)`,
    slug: newSlug,
    isPublished: false,
    viewCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const ref = await addDoc(collection(db, "booklets"), copy);
  return ref.id;
}
