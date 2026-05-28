import type { Metadata } from "next";
import "../globals.css";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Admin — Livret" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
