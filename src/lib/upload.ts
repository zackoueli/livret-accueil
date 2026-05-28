import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadDocument(
  file: File,
  path: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  if (file.type !== "application/pdf") throw new Error("PDF uniquement");
  if (file.size > 20 * 1024 * 1024) throw new Error("PDF trop lourd (max 20 Mo)");

  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => { resolve(await getDownloadURL(task.snapshot.ref)); }
    );
  });
}

export async function uploadMedia(
  file: File,
  path: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) throw new Error("Fichier non supporté (image ou vidéo uniquement)");
  if (isImage && file.size > 10 * 1024 * 1024) throw new Error("Image trop lourde (max 10 Mo)");
  if (isVideo && file.size > 100 * 1024 * 1024) throw new Error("Vidéo trop lourde (max 100 Mo)");

  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => { resolve(await getDownloadURL(task.snapshot.ref)); }
    );
  });
}

export async function uploadImage(
  file: File,
  path: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Fichier non supporté");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image trop lourde (max 10 Mo)");

  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => { resolve(await getDownloadURL(task.snapshot.ref)); }
    );
  });
}

export async function deleteImage(url: string) {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch {
    // ignore if already deleted
  }
}
