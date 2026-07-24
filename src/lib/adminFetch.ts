import { auth } from "./firebase";

export async function adminFetch(input: string, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token ?? ""}`,
    },
  });
}
