"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { Eye, EyeOff, BookOpen, Check } from "lucide-react";
import { registerWithEmail, loginWithEmail, loginWithGoogle, resetPassword } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { getRefCookie, setRefCookie, clearRefCookie, isValidCode } from "@/lib/referral";

type Mode = "login" | "register";

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
      // La redirection se fait via useEffect ci-dessus
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
      // Si la promesse résout (pas de COOP), la redirection se fait via useEffect
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
    // Ne pas setLoading(false) ici — si COOP, on attend le useEffect
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Colonne gauche : photo + pitch ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        <img
          src="https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-margue-a-2157657342-34969307.jpg?alt=media&token=20fb6707-2d25-4cee-8e28-e028eacc68fc"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-orange-900/40" />

        {/* Logo */}
        <div className="relative">
          <img src="/Logo.png" alt="Bunkly" className="h-10 w-auto" />
        </div>

        {/* Pitch central */}
        <div className="relative">
          <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-4">
            {t("badge")}
          </p>
          <h2 className="text-4xl font-black text-white leading-tight mb-6">
            {t("pitchTitle")}
          </h2>
          <p className="text-white/60 text-base leading-relaxed mb-8 max-w-sm">
            {t("pitchSubtitle")}
          </p>
          <ul className="space-y-3">
            {[
              t("pitchItem1"),
              t("pitchItem2"),
              t("pitchItem3"),
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-white/70 text-sm">
                <div className="w-5 h-5 rounded-full bg-orange-500/30 border border-orange-500/50 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-orange-400" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Témoignage */}
        <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
          <p className="text-white/80 text-sm leading-relaxed italic mb-3">
            {t("testimonialText")}
          </p>
          <div className="flex items-center gap-2.5">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80"
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <p className="text-white text-xs font-semibold">{t("testimonialName")}</p>
              <p className="text-white/40 text-xs">{t("testimonialRole")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Colonne droite : formulaire ── */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen relative">

        {/* Background mobile */}
        <div className="lg:hidden absolute inset-0">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/livret-d-accueil-b98ba.firebasestorage.app/o/templates%2FModules%2Fpexels-margue-a-2157657342-34969307.jpg?alt=media&token=20fb6707-2d25-4cee-8e28-e028eacc68fc"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>

        <div className="relative flex flex-col flex-1 items-center justify-center px-6 py-12">

          {/* Logo mobile */}
          <div className="lg:hidden mb-10">
            <img src="/Logo.png" alt="Bunkly" className="h-10 w-auto" />
          </div>

          <div className="w-full max-w-sm">

            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl font-black text-gray-900 lg:text-gray-900 max-lg:text-white">
                {mode === "register" ? t("registerTitle") : t("loginTitle")}
              </h1>
              <p className="text-sm text-gray-400 max-lg:text-white/60 mt-1">
                {mode === "register" ? t("registerSubtitle") : t("loginSubtitle")}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-6 gap-1">
              <button
                onClick={() => setMode("register")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === "register" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                {t("tabRegister")}
              </button>
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                {t("tabLogin")}
              </button>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-2xl py-3.5 text-sm font-semibold text-gray-700 transition-colors mb-5 disabled:opacity-50 shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t("google")}
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">{t("or")}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 max-lg:text-white mb-1.5">{t("nameLabel")}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                    placeholder={t("namePlaceholder")}
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 max-lg:text-white mb-1.5">{t("emailLabel")}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                  placeholder={t("emailPlaceholder")}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 max-lg:text-white mb-1.5">{t("passwordLabel")}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
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
                <div className="flex justify-end -mt-1">
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
                  <label className="block text-sm font-semibold text-gray-700 max-lg:text-white mb-1.5">{t("confirmPasswordLabel")}</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 mt-1 text-sm">
                {loading
                  ? t("loading")
                  : mode === "register"
                    ? t("submitRegister")
                    : t("submitLogin")}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
