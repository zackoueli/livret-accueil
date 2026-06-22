"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Copy, Check, Users, TrendingUp, Wallet, ArrowLeft,
  ExternalLink, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AffiliateCommission, Referral } from "@/types";

interface ConnectStatus {
  connected: boolean;
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  totalEarned?: number;
  totalPaid?: number;
}

function fmt(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function AffiliationPageInner() {
  const { user } = useAuthStore();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>({ connected: false });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [loadingPayout, setLoadingPayout] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const connectParam = searchParams.get("connect");
    if (connectParam === "success") {
      toast.success("Compte bancaire connecté avec succès !");
    } else if (connectParam === "refresh") {
      toast("Finalise la vérification de ton compte pour activer les virements.", { icon: "ℹ️" });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    try {
      // Code de parrainage
      const codeDoc = await getDoc(doc(db, "referral_codes", user.uid));
      if (codeDoc.exists()) setReferralCode(codeDoc.data().code);

      // Statut Connect
      const statusRes = await fetch(`/api/affiliate/connect/status?userId=${user.uid}`);
      const statusData = await statusRes.json();
      setConnectStatus(statusData);

      // Referrals
      const referralsSnap = await getDocs(
        query(collection(db, "referrals"), where("referrerId", "==", user.uid))
      );
      setReferrals(referralsSnap.docs.map((d) => d.data() as Referral));

      // Commissions
      const commissionsSnap = await getDocs(
        query(
          collection(db, "affiliate_commissions"),
          where("referrerId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(50)
        )
      );
      const comms = commissionsSnap.docs.map((d) => d.data() as AffiliateCommission);
      setCommissions(comms);
      setPendingTotal(
        comms.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const referralLink = referralCode
    ? `https://app.bunkly.co/auth?ref=${referralCode}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectOnboard = async () => {
    if (!user) return;
    setLoadingConnect(true);
    try {
      const res = await fetch("/api/affiliate/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, email: user.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error("Erreur lors de la connexion bancaire");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoadingConnect(false);
    }
  };

  const handlePayout = async () => {
    if (!user) return;
    setLoadingPayout(true);
    try {
      const res = await fetch("/api/affiliate/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Virement de ${fmt(data.amount)} initié !`);
        loadData();
      } else {
        toast.error(data.error ?? "Erreur lors du virement");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoadingPayout(false);
    }
  };

  const convertedCount = referrals.filter((r) => r.status === "converted").length;
  const canPayout = connectStatus.payoutsEnabled && pendingTotal >= 3000;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour au dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Programme d'affiliation</h1>
          <p className="text-sm text-gray-400 mt-1">
            Parrainez des hôtes et gagnez 15% sur leurs paiements pendant 12 mois.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filleuls</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{referrals.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">{convertedCount} convertis</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total gagné</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{fmt(connectStatus.totalEarned ?? 0)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmt(connectStatus.totalPaid ?? 0)} versés</p>
          </div>
          <div className="col-span-2 bg-orange-50 rounded-2xl border border-orange-100 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Solde disponible</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{fmt(pendingTotal)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Retrait disponible dès 30 €</p>
          </div>
        </div>

        {/* Lien de parrainage */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Votre lien de parrainage</h2>
          {referralCode ? (
            <>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 mb-3">
                <span className="text-sm text-gray-600 truncate flex-1">{referralLink}</span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Code : <span className="font-mono font-bold text-gray-700">{referralCode}</span>
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Chargement de votre code...</p>
          )}
        </div>

        {/* Stripe Connect */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Compte bancaire</h2>
          <p className="text-xs text-gray-400 mb-4">
            Connectez votre IBAN pour recevoir vos virements via Stripe.
          </p>

          {!connectStatus.connected || !connectStatus.onboardingComplete ? (
            <button
              onClick={handleConnectOnboard}
              disabled={loadingConnect}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors disabled:opacity-50">
              <ExternalLink className="w-4 h-4" />
              {loadingConnect ? "Chargement..." : "Connecter mon compte bancaire"}
            </button>
          ) : connectStatus.payoutsEnabled ? (
            <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Compte vérifié — virements activés
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                Vérification en cours
              </div>
              <button
                onClick={handleConnectOnboard}
                disabled={loadingConnect}
                className="text-sm text-orange-500 hover:text-orange-600 font-semibold underline">
                {loadingConnect ? "Chargement..." : "Finaliser la vérification"}
              </button>
            </div>
          )}
        </div>

        {/* Bouton retrait */}
        <button
          onClick={handlePayout}
          disabled={!canPayout || loadingPayout}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-sm transition-all mb-6 disabled:cursor-not-allowed">
          {loadingPayout
            ? "Virement en cours..."
            : canPayout
            ? `Retirer ${fmt(pendingTotal)}`
            : pendingTotal < 3000
            ? `Minimum 30 € requis (${fmt(pendingTotal)} disponibles)`
            : "Finalisez la vérification KYC pour retirer"}
        </button>

        {/* Historique commissions */}
        {commissions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-900">Historique des commissions</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {commissions.map((comm) => (
                <div key={comm.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    {comm.status === "paid" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{fmt(comm.amount)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(comm.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    comm.status === "paid"
                      ? "bg-green-50 text-green-600"
                      : "bg-amber-50 text-amber-600"
                  }`}>
                    {comm.status === "paid" ? "Versée" : "En attente"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export function AffiliationPage() {
  return (
    <Suspense>
      <AffiliationPageInner />
    </Suspense>
  );
}
