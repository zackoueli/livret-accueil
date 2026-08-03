"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { usePlan } from "@/hooks/usePlan";
import { HostConnectPanel } from "./HostConnectPanel";

interface ConnectStatus {
  connected: boolean;
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

function PaymentsPageInner() {
  const { user } = useAuthStore();
  const { commissionRate } = usePlan();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<ConnectStatus>({ connected: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const connectParam = searchParams.get("connect");
    if (connectParam === "success") {
      toast.success("Compte bancaire connecté avec succès !");
    } else if (connectParam === "refresh") {
      toast("Finalise la vérification de ton compte pour activer les paiements.", { icon: "ℹ️" });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadStatus();
  }, [user]);

  async function loadStatus() {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/host/connect/status?userId=${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

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
        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour au dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Services payants</h1>
          <p className="text-sm text-gray-400 mt-1">
            Proposez des services optionnels payants à vos voyageurs directement depuis vos livrets.
          </p>
        </div>

        <div className="bg-orange-50 rounded-2xl border border-orange-100 p-5 mb-6">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">
            Commission plateforme
          </p>
          <p className="text-2xl font-black text-gray-900">{commissionRate}%</p>
          <p className="text-xs text-gray-400 mt-1">
            Passez à un plan supérieur pour réduire votre commission sur chaque vente.
          </p>
        </div>

        <HostConnectPanel status={status} onStatusChange={loadStatus} />
      </div>
    </div>
  );
}

export function PaymentsPage() {
  return (
    <Suspense>
      <PaymentsPageInner />
    </Suspense>
  );
}
