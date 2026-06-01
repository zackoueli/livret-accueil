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
import { getTemplate } from "./templates";

export async function createBooklet(userId: string, title: string, templateId = "blank"): Promise<string> {
  const slug = nanoid(10);
  const tpl = getTemplate(templateId);
  const booklet: Omit<Booklet, "id"> = {
    userId,
    title,
    slug,
    accentColor: tpl.accentColor,
    propertyName: tpl.propertyName || title,
    address: tpl.address || "",
    coverImage: tpl.coverImage || "",
    modules: tpl.modules(),
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
