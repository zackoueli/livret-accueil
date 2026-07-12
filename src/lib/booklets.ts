import {
  collection,
  setDoc,
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
import { Booklet, BookletModule, BookletTranslations, Folder, ModuleType, Plan } from "@/types";

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

export async function createBooklet(userId: string, title: string, contentTemplateId = "blank", layoutId = "simple", ownerPlan: Plan = "free"): Promise<string> {
  const slug = await generateUniqueSlug();
  const tpl = getTemplate(contentTemplateId);
  const booklet: Omit<Booklet, "id"> = {
    userId,
    ownerPlan,
    title,
    slug,
    templateId: layoutId,
    accentColor: tpl.accentColor,
    propertyName: tpl.propertyName || title,
    address: tpl.address ?? "",
    coverImage: tpl.coverImage ?? "",
    modules: tpl.modules(),
    isPublished: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  // ID genere localement (pas d'aller-retour reseau) : un eventuel retry du SDK
  // sur cette meme reference ecrase le meme document au lieu d'en creer un second.
  const ref = doc(collection(db, "booklets"));
  await setDoc(ref, booklet);
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

export async function saveBookletTranslations(id: string, translations: Partial<BookletTranslations>) {
  await updateDoc(doc(db, "booklets", id), { translations, updatedAt: Date.now() });
}

export async function deleteBooklet(id: string) {
  await deleteDoc(doc(db, "booklets", id));
}

// ── Folders ────────────────────────────────────────────────────────────────────

export async function getUserFolders(userId: string): Promise<Folder[]> {
  const q = query(collection(db, "folders"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Folder))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function createFolder(userId: string, name: string, color: string): Promise<Folder> {
  const data = { userId, name, color, createdAt: Date.now() };
  const ref = doc(collection(db, "folders"));
  await setDoc(ref, data);
  return { id: ref.id, ...data };
}

export async function updateFolder(id: string, data: Partial<Pick<Folder, "name" | "color">>) {
  await updateDoc(doc(db, "folders", id), data);
}

export async function deleteFolder(id: string) {
  await deleteDoc(doc(db, "folders", id));
}

export async function moveBookletToFolder(bookletId: string, folderId: string | null) {
  const clean = folderId ? { folderId, updatedAt: Date.now() } : { folderId: deleteField(), updatedAt: Date.now() };
  await updateDoc(doc(db, "booklets", bookletId), clean);
}

// ── Booklets ───────────────────────────────────────────────────────────────────

async function generateUniqueSlug(): Promise<string> {
  const res = await fetch("/api/booklets/generate-slug");
  if (!res.ok) throw new Error("Impossible de générer un slug unique");
  const data = await res.json();
  return data.slug as string;
}

export async function duplicateBooklet(booklet: Booklet, title?: string): Promise<string> {
  const newSlug = await generateUniqueSlug();
  const copy: Omit<Booklet, "id"> = {
    ...booklet,
    title: title?.trim() || `${booklet.title} (copie)`,
    slug: newSlug,
    isPublished: false,
    viewCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const ref = doc(collection(db, "booklets"));
  await setDoc(ref, copy);
  return ref.id;
}
