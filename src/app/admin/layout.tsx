import type { Metadata } from "next";
import "../globals.css";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Admin — Bunkly", robots: { index: false, follow: false }, icons: { icon: "/favicon.svg" } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
