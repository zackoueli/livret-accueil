"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { Eye, EyeOff, BookOpen, Check } from "lucide-react";
import { registerWithEmail, loginWithEmail, loginWithGoogle } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

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
        await registerWithEmail(form.email, form.password, form.name);
      } else {
        await loginWithEmail(form.email, form.password);
      }
      // La redirection se fait via useEffect ci-dessus
    } catch (err: any) {
      toast.error(err.message);
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
            Livrets d'accueil digitaux
          </p>
          <h2 className="text-4xl font-black text-white leading-tight mb-6">
            L'accueil parfait<br />pour vos voyageurs
          </h2>
          <p className="text-white/60 text-base leading-relaxed mb-8 max-w-sm">
            Créez un livret moderne en 5 minutes. QR code, multilingue, mis à jour en temps réel.
          </p>
          <ul className="space-y-3">
            {[
              "WiFi, check-in, règlement, activités...",
              "Traduit automatiquement en 5 langues",
              "Partagé via QR code ou lien direct",
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
            "Mes voyageurs adorent ! Fini le PDF que personne ne lisait."
          </p>
          <div className="flex items-center gap-2.5">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80"
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <p className="text-white text-xs font-semibold">Sophie M.</p>
              <p className="text-white/40 text-xs">Hôte Airbnb · Paris</p>
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
                {mode === "register" ? "Créer mon compte" : "Bon retour !"}
              </h1>
              <p className="text-sm text-gray-400 max-lg:text-white/60 mt-1">
                {mode === "register"
                  ? "Gratuit · Sans carte bancaire"
                  : "Connectez-vous à votre espace hôte"}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-6 gap-1">
              <button
                onClick={() => setMode("register")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === "register" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                Inscription
              </button>
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                Connexion
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
              Continuer avec Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">ou</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom et nom</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                    placeholder="Jean Dupont"
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                  placeholder="vous@exemple.fr"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe</label>
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

              {mode === "register" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmer le mot de passe</label>
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
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-orange-200 hover:shadow-orange-300 mt-1 text-sm">
                {loading
                  ? "Chargement..."
                  : mode === "register"
                    ? "Créer mon compte gratuitement →"
                    : "Se connecter →"}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-5">
              Sans carte bancaire · Annulable à tout moment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
