// Charset sans caractères ambigus (O/0, I/1/l)
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(): string {
  const part = (len: number) =>
    Array.from(
      { length: len },
      () => CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join("");
  return `${part(3)}-${part(4)}`;
}

export const REF_COOKIE = "bunkly_ref";
const REF_COOKIE_DAYS = 30;
const CODE_PATTERN = /^[A-Z0-9]{3}-[A-Z0-9]{4}$/;

export function getRefCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${REF_COOKIE}=`));
  return match ? match.split("=")[1] : null;
}

export function setRefCookie(code: string): void {
  if (typeof document === "undefined") return;
  const expires = new Date(
    Date.now() + REF_COOKIE_DAYS * 24 * 60 * 60 * 1000
  ).toUTCString();
  document.cookie = `${REF_COOKIE}=${code}; expires=${expires}; path=/; SameSite=Lax`;
}

export function clearRefCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${REF_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function isValidCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}
