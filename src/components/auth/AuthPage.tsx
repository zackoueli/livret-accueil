"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { registerWithEmail, loginWithEmail, loginWithGoogle, resetPassword } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { getRefCookie, setRefCookie, clearRefCookie, isValidCode } from "@/lib/referral";

type Mode = "login" | "register";

const BG_IMAGE =
  "https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-margue-a-2157657342-34969307.jpg?alt=media&token=20fb6707-2d25-4cee-8e28-e028eacc68fc";

const DEMO_SLUG = "9gM1r69Boa";

// Vitrine des 4 designs de livret : mockups iframe live, pleinement interactifs
// (le visiteur navigue vraiment dedans). Deux colonnes de chaque côté du login.
type DesignItem = { id: string; template: string; accent: string; label: string };

const DESIGNS: DesignItem[] = [
  { id: "scroll", template: "simple", accent: "0EA5E9", label: "Scroll" },
  { id: "grid",   template: "grid",   accent: "8B5CF6", label: "Grille" },
  { id: "pastel", template: "pastel", accent: "F43F5E", label: "Pastel" },
  { id: "halo",   template: "clean",  accent: "F97316", label: "Halo" },
];

function DesignMock({ item }: { item: DesignItem }) {
  const url = `https://app.bunkly.co/b/${DEMO_SLUG}?templateOverride=${item.template}&accentOverride=%23${item.accent}`;
  return (
    <div className="w-[188px] xl:w-[224px] shrink-0" style={{ maxHeight: "92vh" }}>
      {/* Cadre téléphone */}
      <div
        className="relative rounded-[1.9rem] border-[6px] border-gray-900 bg-gray-900 overflow-hidden"
        style={{ boxShadow: "0 34px 70px -22px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)" }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-b-xl z-10" />
        <div className="relative rounded-[1.4rem] overflow-hidden bg-white" style={{ aspectRatio: "9 / 19.5" }}>
          <iframe
            src={url}
            title={item.label}
            className="border-0"
            style={{
              transform: "scale(0.55)",
              transformOrigin: "top left",
              width: "181.82%",
              height: "181.82%",
            }}
          />
        </div>
      </div>
      {/* Étiquette du design */}
      <div className="mt-2 flex justify-center">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white/90 bg-white/10 backdrop-blur-sm border border-white/15">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: `#${item.accent}` }} />
          {item.label}
        </span>
      </div>
    </div>
  );
}

export function AuthPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const locale = useLocale();
  const { user, loading: authLoading } = useAuthStore();
  const [mode, setMode] = useState<Mode>("register");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [resetSent, setResetSent] = useState(false);

  // Capture le code de parrainage depuis l'URL (?ref=XXX-XXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && isValidCode(ref)) {
      setRefCookie(ref);
    }
  }, []);

  // Redirige dès que Firebase confirme la connexion (gère le cas COOP Google)
  useEffect(() => {
    if (!authLoading && user) {
      router.push(`/${locale}/dashboard`);
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return toast.error(t("errors.emailRequired"));
    if (!form.password) return toast.error(t("errors.passwordRequired"));
    if (mode === "register") {
      if (!form.name) return toast.error(t("errors.nameRequired"));
      if (form.password !== form.confirmPassword) return toast.error(t("errors.passwordMismatch"));
    }
    setLoading(true);
    try {
      if (mode === "register") {
        const refCode = getRefCookie() ?? undefined;
        await registerWithEmail(form.email, form.password, form.name, refCode);
        clearRefCookie();
      } else {
        await loginWithEmail(form.email, form.password);
      }
    } catch (err: any) {
      const code = err?.code ?? "";
      const errorKeys: Record<string, string> = {
        "auth/invalid-credential": "invalidCredential",
        "auth/user-not-found": "userNotFound",
        "auth/wrong-password": "wrongPassword",
        "auth/email-already-in-use": "emailInUse",
        "auth/weak-password": "weakPassword",
        "auth/invalid-email": "invalidEmail",
        "auth/too-many-requests": "tooManyRequests",
        "auth/network-request-failed": "network",
      };
      toast.error(t(`errors.${errorKeys[code] ?? "generic"}`));
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!form.email) return toast.error(t("resetEmailFirst"));
    setLoading(true);
    try {
      await resetPassword(form.email);
      setResetSent(true);
      toast.success(t("resetEmailSent"));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden flex items-center justify-center px-4">

      {/* ── Fond photo plein écran, flouté ── */}
      <img src={BG_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover scale-110" style={{ filter: "blur(14px)" }} />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/55 to-orange-950/50" />

      {/* ── Vitrine : 2 designs à gauche + login + 2 à droite (desktop) ── */}
      <div className="relative z-20 flex items-center justify-center gap-4 xl:gap-8 w-full max-w-[1700px]">

        {/* Groupe gauche — les 2 mockups côte à côte */}
        <div className="hidden lg:flex gap-3 xl:gap-5">
          {DESIGNS.slice(0, 2).map((d) => <DesignMock key={d.id} item={d} />)}
        </div>

        {/* Panneau login, carte blanche opaque */}
        <div
          className="w-full max-w-sm bg-white rounded-[1.75rem] px-6 sm:px-8 py-6 shrink-0 max-h-[92vh] overflow-y-auto"
          style={{ boxShadow: "0 40px 90px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.04)" }}
        >
        {/* Header */}
        <div className="mb-4 text-center">
          <img src="/Logo.png" alt="Bunkly" className="h-8 w-auto mx-auto mb-3" />
          <h1 className="text-xl font-black text-gray-900">
            {mode === "register" ? t("registerTitle") : t("loginTitle")}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4 gap-1">
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === "register" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
            {t("tabRegister")}
          </button>
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
            {t("tabLogin")}
          </button>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-semibold text-gray-700 transition-colors mb-4 disabled:opacity-50 shadow-sm">
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t("google")}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">{t("or")}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t("nameLabel")}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                placeholder={t("namePlaceholder")}
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t("emailLabel")}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
              placeholder={t("emailPlaceholder")}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t("passwordLabel")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                placeholder="••••••••"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === "login" && (
            <div className="flex justify-end -mt-0.5">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors">
                {resetSent ? t("resetSent") : t("forgotPassword")}
              </button>
            </div>
          )}

          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t("confirmPasswordLabel")}</label>
              <input
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-1 text-sm">
            {loading
              ? t("loading")
              : mode === "register"
                ? t("submitRegister")
                : t("submitLogin")}
          </button>
        </form>
        </div>

        {/* Groupe droite — les 2 mockups côte à côte */}
        <div className="hidden lg:flex gap-3 xl:gap-5">
          {DESIGNS.slice(2, 4).map((d) => <DesignMock key={d.id} item={d} />)}
        </div>

      </div>
    </div>
  );
}
