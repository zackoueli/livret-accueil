import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "react-hot-toast";
import "../globals.css";

export const metadata: Metadata = {
  title: "Livret d'accueil — Créez votre livret digital",
  description: "Créez un livret d'accueil digital élégant pour votre gîte, Airbnb ou location saisonnière.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
