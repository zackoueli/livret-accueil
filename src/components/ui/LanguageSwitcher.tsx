"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Check, ChevronDown } from "lucide-react";
import { routing } from "@/i18n/routing";

const FLAGS: Record<string, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  es: "🇪🇸",
  de: "🇩🇪",
  it: "🇮🇹",
};

type Props = {
  /** "dark" pour les fonds sombres (landing), "light" pour les pages claires (settings) */
  variant?: "dark" | "light";
};

export function LanguageSwitcher({ variant = "light" }: Props) {
  const locale = useLocale();
  const t = useTranslations("languages");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const switchTo = (next: string) => {
    setOpen(false);
    if (next === locale) return;
    // Mémorise le choix pour les visites sans préfixe de langue dans l'URL
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`;
    const nextPath = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), `/${next}`) || `/${next}`;
    router.replace(`${nextPath}${window.location.search}`);
  };

  const dark = variant === "dark";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors ${
          dark
            ? "text-white/60 hover:text-white hover:bg-white/10"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
        }`}
        aria-label={t(locale as "fr")}
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase">{locale}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 w-44 rounded-2xl border shadow-xl overflow-hidden z-50 ${
            dark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-100"
          }`}
        >
          {routing.locales.map((l) => (
            <button
              key={l}
              onClick={() => switchTo(l)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                dark
                  ? "text-white/70 hover:bg-white/10 hover:text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{FLAGS[l]}</span>
              <span className="flex-1 text-left font-medium">{t(l)}</span>
              {l === locale && <Check className="w-4 h-4 text-orange-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
