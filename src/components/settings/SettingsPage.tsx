"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  BookOpen, Crown, Check, ArrowLeft, CreditCard,
  LogOut, Calendar, Zap, Lock, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { signOut } from "@/lib/auth";

export function SettingsPage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, profile } = useAuthStore();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const isFree = profile?.plan === "free";
  const isActif = profile?.plan === "actif";

  const handleUpgrade = async () => {
    if (!user || !profile) return;
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          billingPeriod,
          locale,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error("Erreur lors de la création de la session");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handlePortal = async () => {
    if (!user) return;
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, locale }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error("Erreur lors de l'ouverture du portail");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}`);
  };

  if (!user || !profile) return null;

  const subscriptionEndDate = profile.subscriptionEndDate
    ? new Date(profile.subscriptionEndDate * 1000).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <a href={`/${locale}`} className="flex items-center gap-2 font-bold text-xl text-gray-900">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              Livret<span className="text-orange-500">.</span>
            </a>
          </div>
          <button onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gérez votre compte et votre abonnement</p>
        </div>

        {/* Profile card */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Compte</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-lg font-bold text-white shrink-0">
              {(profile.displayName || user.email || "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{profile.displayName || "Utilisateur"}</p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
            <div className="ml-auto">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                isActif
                  ? "bg-green-50 text-green-600"
                  : "bg-amber-50 text-amber-600"
              }`}>
                {isActif ? <><Zap className="w-3 h-3" /> Plan Actif</> : <><Lock className="w-3 h-3" /> Plan Gratuit</>}
              </span>
            </div>
          </div>
        </section>

        {/* Subscription details (active plan) */}
        {isActif && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Abonnement</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" /> Plan
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  Actif · {profile.billingPeriod === "yearly" ? "Annuel" : "Mensuel"}
                </span>
              </div>
              {profile.subscriptionStatus && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut</span>
                  <span className={`text-sm font-semibold capitalize ${
                    profile.subscriptionStatus === "active" ? "text-green-600" :
                    profile.subscriptionStatus === "past_due" ? "text-red-500" :
                    "text-gray-500"
                  }`}>
                    {profile.subscriptionStatus === "active" ? "Actif" :
                     profile.subscriptionStatus === "past_due" ? "Paiement en attente" :
                     profile.subscriptionStatus === "canceled" ? "Annulé" :
                     profile.subscriptionStatus}
                  </span>
                </div>
              )}
              {subscriptionEndDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" /> Prochain renouvellement
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{subscriptionEndDate}</span>
                </div>
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <button
                onClick={handlePortal}
                disabled={loadingPortal}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-40">
                <ExternalLink className="w-4 h-4" />
                {loadingPortal ? "Chargement..." : "Gérer la facturation (Stripe)"}
              </button>
            </div>
          </section>
        )}

        {/* Upgrade section (free plan) */}
        {isFree && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 px-6 pt-6 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-orange-500" />
                <h2 className="font-bold text-gray-900">Passer au plan Actif</h2>
              </div>
              <p className="text-sm text-gray-500">Publiez, partagez et activez vos livrets avec vos voyageurs.</p>
            </div>

            <div className="px-6 py-5">
              {/* Billing toggle */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setBillingPeriod("monthly")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      billingPeriod === "monthly"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-400 hover:text-gray-600"
                    }`}>
                    Mensuel
                  </button>
                  <button
                    onClick={() => setBillingPeriod("yearly")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      billingPeriod === "yearly"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-400 hover:text-gray-600"
                    }`}>
                    Annuel
                  </button>
                </div>
                {billingPeriod === "yearly" && (
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                    −36% · 2 mois offerts
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-5">
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-bold text-gray-900">
                    {billingPeriod === "yearly" ? "5,75" : "9"}€
                  </span>
                  <span className="text-sm text-gray-400 mb-1">/mois</span>
                </div>
                {billingPeriod === "yearly" && (
                  <p className="text-xs text-gray-400 mt-0.5">Facturé 69€/an</p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {[
                  "Livrets illimités",
                  "Publication & partage par lien",
                  "QR Code téléchargeable",
                  "5 langues disponibles",
                  "Mises à jour instantanées",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-orange-500" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleUpgrade}
                disabled={loadingCheckout}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors disabled:opacity-40 shadow-sm shadow-orange-200">
                {loadingCheckout ? "Redirection..." : "Commencer maintenant →"}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
