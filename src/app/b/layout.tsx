import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Livret d'accueil",
};

export default function BookletLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
