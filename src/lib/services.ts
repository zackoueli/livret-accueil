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
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { BookletService } from "@/types";
import { DEFAULT_SERVICES } from "./defaultServices";

export async function seedDefaultServices(bookletId: string, hostUid: string) {
  const batch = writeBatch(db);
  DEFAULT_SERVICES.forEach((def, index) => {
    const ref = doc(collection(db, "booklet_services"));
    const service: BookletService = {
      id: ref.id,
      bookletId,
      hostUid,
      sourceServiceId: def.id,
      isDefault: true,
      name: def.name,
      description: def.description,
      emoji: def.emoji,
      priceType: def.priceType,
      amount: def.amount,
      currency: "eur",
      enabled: false,
      order: index,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    batch.set(ref, service);
  });
  await batch.commit();
}

export async function getBookletServices(bookletId: string, hostUid: string): Promise<BookletService[]> {
  const q = query(
    collection(db, "booklet_services"),
    where("bookletId", "==", bookletId),
    where("hostUid", "==", hostUid),
    orderBy("order", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as BookletService);
}

export async function createBookletService(
  bookletId: string,
  hostUid: string,
  data: Partial<BookletService>
): Promise<string> {
  const ref = doc(collection(db, "booklet_services"));
  const service: BookletService = {
    id: ref.id,
    bookletId,
    hostUid,
    isDefault: false,
    name: "",
    priceType: "one_time",
    amount: 0,
    currency: "eur",
    enabled: false,
    order: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...data,
  };
  await setDoc(ref, service);
  return ref.id;
}

export async function updateBookletService(id: string, data: Partial<BookletService>) {
  const { id: _omit, bookletId: _b, hostUid: _h, ...rest } = data as Record<string, unknown> & {
    id?: string; bookletId?: string; hostUid?: string;
  };
  await updateDoc(doc(db, "booklet_services", id), { ...rest, updatedAt: Date.now() });
}

export async function deleteBookletService(id: string) {
  await deleteDoc(doc(db, "booklet_services", id));
}
