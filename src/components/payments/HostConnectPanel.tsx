"use client";

import { useState } from "react";
import { ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

interface ConnectStatus {
  connected: boolean;
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

interface HostConnectPanelProps {
  status: ConnectStatus;
  onStatusChange?: () => void;
}

export function HostConnectPanel({ status, onStatusChange }: HostConnectPanelProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleConnectOnboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/host/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.uid, email: user.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? "Erreur lors de la connexion bancaire");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
      onStatusChange?.();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-bold text-gray-900 mb-1">Encaissement des services payants</h2>
      <p className="text-xs text-gray-400 mb-4">
        Connectez votre compte bancaire via Stripe pour pouvoir vendre des services payants
        (petit-déjeuner, late checkout...) dans vos livrets. Le bouton d'achat n'apparaît sur
        vos livrets qu'une fois cette étape terminée.
      </p>

      {!status.connected || !status.onboardingComplete ? (
        <button
          onClick={handleConnectOnboard}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors disabled:opacity-50">
          <ExternalLink className="w-4 h-4" />
          {loading ? "Chargement..." : "Activer les paiements"}
        </button>
      ) : status.chargesEnabled ? (
        <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          Paiements actifs — vos services sont achetables
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            Vérification en cours
          </div>
          <button
            onClick={handleConnectOnboard}
            disabled={loading}
            className="text-sm text-orange-500 hover:text-orange-600 font-semibold underline">
            {loading ? "Chargement..." : "Finaliser la vérification"}
          </button>
        </div>
      )}
    </div>
  );
}
