import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Bunkly",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.png", shortcut: "/icon.png", apple: "/icon.png" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bunkly",
  },
};

export default function BookletLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="theme-color" content="#f97316" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>{children}</body>
    </html>
  );
}
