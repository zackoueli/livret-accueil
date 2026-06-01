const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.bunkly.co";

export function bookletUrl(slug: string): string {
  return `${APP_URL}/b/${slug}`;
}
