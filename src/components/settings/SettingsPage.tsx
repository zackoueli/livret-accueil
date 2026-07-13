"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Crown, Check, ArrowLeft, CreditCard,
  LogOut, Calendar, Zap, Lock, ExternalLink, X,
} from "lucide-react";
import { BunklyLogo } from "@/components/ui/BunklyLogo";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { signOut } from "@/lib/auth";
import { PLANS_CONFIG } from "@/lib/plans";
import { usePlan } from "@/hooks/usePlan";
import { Suspense } from "react";

function SettingsPageInner() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, profile } = useAuthStore();
  const { plan: currentPlan } = usePlan();
  const [billing, setBilling] = useState<"monthly" | "yearly">(
    (searchParams.get("billing") as "monthly" | "yearly") ?? "yearly"
  );
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const handleUpgrade = async (planId: string) => {
    if (!user || !profile) return;
    setLoadingPlan(planId);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.uid, email: user.email, billingPeriod: billing, plan: planId, locale }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error("Erreur lors de la création de la session");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    if (!user) return;
    setLoadingPortal(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

  const handleCancel = async () => {
    if (!user) return;
    setLoadingCancel(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Abonnement résilié. Il restera actif jusqu'à la fin de la période en cours.");
        setConfirmingCancel(false);
        useAuthStore.getState().setProfile({ ...profile!, cancelAtPeriodEnd: true });
      } else {
        toast.error(data.error || "Erreur lors de la résiliation");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoadingCancel(false);
    }
  };

  const handleResume = async () => {
    if (!user) return;
    setLoadingCancel(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Résiliation annulée, votre abonnement continue.");
        useAuthStore.getState().setProfile({ ...profile!, cancelAtPeriodEnd: false });
      } else {
        toast.error(data.error || "Erreur lors de la réactivation");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoadingCancel(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}`);
  };

  if (!user || !profile) return null;

  const subscriptionEndDate = profile.subscriptionEndDate
    ? new Date(profile.subscriptionEndDate * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const planLabel: Record<string, string> = { free: "Gratuit", pro: "Pro", agency: "Agence" };
  const planColor: Record<string, string> = { free: "text-gray-500 bg-gray-100", pro: "text-orange-600 bg-orange-50", agency: "text-indigo-600 bg-indigo-50" };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/${locale}/dashboard`)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <a href={`/${locale}`} className="flex items-center gap-2">
              <BunklyLogo height={28} />
            </a>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gérez votre compte et votre abonnement</p>
        </div>

        {/* Profil */}
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
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${planColor[currentPlan] || "text-gray-500 bg-gray-100"}`}>
                {currentPlan === "free" ? <Lock className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                Plan {planLabel[currentPlan] || currentPlan}
              </span>
            </div>
          </div>
        </section>

        {/* Abonnement actif */}
        {currentPlan !== "free" && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Abonnement</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-400" /> Plan</span>
                <span className="text-sm font-semibold text-gray-900">
                  {planLabel[currentPlan]} · {profile.billingPeriod === "yearly" ? "Annuel" : "Mensuel"}
                </span>
              </div>
              {profile.subscriptionStatus && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut</span>
                  <span className={`text-sm font-semibold ${profile.cancelAtPeriodEnd ? "text-amber-600" : profile.subscriptionStatus === "active" ? "text-green-600" : profile.subscriptionStatus === "past_due" ? "text-red-500" : "text-gray-500"}`}>
                    {profile.cancelAtPeriodEnd ? "Résiliation programmée" : profile.subscriptionStatus === "active" ? "Actif" : profile.subscriptionStatus === "past_due" ? "Paiement en attente" : profile.subscriptionStatus === "canceled" ? "Annulé" : profile.subscriptionStatus}
                  </span>
                </div>
              )}
              {subscriptionEndDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> {profile.cancelAtPeriodEnd ? "Accès jusqu'au" : "Prochain renouvellement"}</span>
                  <span className="text-sm font-semibold text-gray-900">{subscriptionEndDate}</span>
                </div>
              )}
            </div>
            <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button onClick={handlePortal} disabled={loadingPortal}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-40">
                <ExternalLink className="w-4 h-4" />
                {loadingPortal ? "Chargement..." : "Gérer la facturation (Stripe)"}
              </button>

              {profile.cancelAtPeriodEnd ? (
                <button onClick={handleResume} disabled={loadingCancel}
                  className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors disabled:opacity-40">
                  {loadingCancel ? "..." : "Annuler la résiliation"}
                </button>
              ) : confirmingCancel ? (
                <span className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500">Confirmer la résiliation ?</span>
                  <button onClick={handleCancel} disabled={loadingCancel}
                    className="font-semibold text-red-600 hover:text-red-700 transition-colors disabled:opacity-40">
                    {loadingCancel ? "..." : "Oui, résilier"}
                  </button>
                  <button onClick={() => setConfirmingCancel(false)}
                    className="font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                    Annuler
                  </button>
                </span>
              ) : (
                <button onClick={() => setConfirmingCancel(true)}
                  className="text-sm font-semibold text-gray-400 hover:text-red-600 transition-colors">
                  Résilier mon abonnement
                </button>
              )}
            </div>
          </section>
        )}

        {/* Plans pricing */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {currentPlan === "free" ? "Passez à la vitesse supérieure" : "Changer de plan"}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">Sans engagement · Annulez à tout moment</p>
            </div>
            {/* Billing toggle */}
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button onClick={() => setBilling("monthly")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${billing === "monthly" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"}`}>
                  Mensuel
                </button>
                <button onClick={() => setBilling("yearly")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${billing === "yearly" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"}`}>
                  Annuel
                </button>
              </div>
              {billing === "yearly" && (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">2 mois offerts</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PLANS_CONFIG.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const price = billing === "yearly" ? plan.price.yearly : plan.price.monthly;
              const isLoading = loadingPlan === plan.id;

              return (
                <div key={plan.id}
                  className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col transition-all ${
                    plan.popular ? "border-orange-400 shadow-lg shadow-orange-100" : "border-gray-100 shadow-sm"
                  }`}>

                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Populaire
                      </span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3.5 right-4">
                      <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full">Actuel</span>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: plan.color + "20" }}>
                        <Crown className="w-4 h-4" style={{ color: plan.color }} />
                      </div>
                      <span className="font-bold text-gray-900 text-lg">{plan.name}</span>
                    </div>
                    <p className="text-sm text-gray-400">{plan.description}</p>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-gray-900">{price === 0 ? "0" : price.toFixed(2).replace(".", ",")}€</span>
                      {price > 0 && <span className="text-sm text-gray-400 mb-1.5">/mois</span>}
                    </div>
                    {billing === "yearly" && plan.yearlyTotal
                      ? <p className="text-xs text-gray-400 mt-0.5">Facturé {plan.yearlyTotal}€/an</p>
                      : price === 0 ? <p className="text-xs text-gray-400">Pour toujours</p>
                      : null
                    }
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-center gap-2.5 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${f.included ? "bg-green-100" : "bg-gray-100"}`}>
                          {f.included ? <Check className="w-2.5 h-2.5 text-green-600" /> : <X className="w-2.5 h-2.5 text-gray-400" />}
                        </div>
                        <span className={f.included ? "text-gray-700" : "text-gray-400"}>{f.label}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => !isCurrent && plan.id !== "free" && handleUpgrade(plan.id)}
                    disabled={isCurrent || plan.id === "free" || isLoading}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.popular ? "bg-orange-500 hover:bg-orange-600 text-white" : plan.id === "agency" ? "text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                    style={plan.id === "agency" && !isCurrent ? { background: plan.color } : {}}>
                    {isLoading ? "Redirection..." : isCurrent ? "Plan actuel" : plan.id === "free" ? "Plan actuel" : `Choisir ${plan.name} →`}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            Une question ? <a href="mailto:hello@bunkly.co" className="text-orange-500 hover:underline font-medium">hello@bunkly.co</a>
          </p>
        </section>
      </main>
    </div>
  );
}

export function SettingsPage() {
  return (
    <Suspense>
      <SettingsPageInner />
    </Suspense>
  );
}
