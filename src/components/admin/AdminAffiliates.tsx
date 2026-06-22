"use client";

import { useEffect, useState } from "react";
import { Users2, TrendingUp, Wallet, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { AffiliateAccount, AffiliateCommission, Referral } from "@/types";

type EnrichedAccount = AffiliateAccount & {
  email: string | null;
  displayName: string | null;
  referralCount: number;
};

function fmt(cents: number) {
  return (cents / 100).toFixed(2) + " €";
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-900/30 text-amber-400",
  paid: "bg-green-900/30 text-green-400",
  cancelled: "bg-red-900/30 text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  paid: "Versée",
  cancelled: "Annulée",
};

export function AdminAffiliates() {
  const [accounts, setAccounts] = useState<EnrichedAccount[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliates");
      const data = await res.json();
      setAccounts(data.accounts ?? []);
      setCommissions(data.commissions ?? []);
      setReferrals(data.referrals ?? []);
    } finally {
      setLoading(false);
    }
  }

  const updateCommissionStatus = async (id: string, status: string) => {
    await fetch("/api/admin/affiliates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commissionId: id, status }),
    });
    setCommissions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: status as AffiliateCommission["status"] } : c))
    );
  };

  const totalPending = commissions
    .filter((c) => c.status === "pending")
    .reduce((s, c) => s + c.amount, 0);
  const totalPaid = commissions
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + c.amount, 0);

  const filteredCommissions =
    filterStatus === "all"
      ? commissions
      : commissions.filter((c) => c.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Affiliés</h1>

      {/* Stats globales */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Affiliés</span>
          </div>
          <p className="text-2xl font-black text-white">{accounts.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">{referrals.length} parrainages total</p>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">En attente</span>
          </div>
          <p className="text-2xl font-black text-white">{fmt(totalPending)}</p>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-green-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Versé</span>
          </div>
          <p className="text-2xl font-black text-white">{fmt(totalPaid)}</p>
        </div>
      </div>

      {/* Tableau affiliés */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 mb-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-sm font-bold text-white">Liste des affiliés</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {["Utilisateur", "Filleuls", "Total gagné", "Versé", "Connect"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 text-sm py-8">
                    Aucun affilié pour l'instant
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.userId} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-3">
                      <p className="text-sm font-semibold text-white">{acc.displayName ?? "—"}</p>
                      <p className="text-xs text-gray-500">{acc.email ?? acc.userId}</p>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-300">{acc.referralCount}</td>
                    <td className="px-6 py-3 text-sm text-gray-300">{fmt(acc.totalEarned ?? 0)}</td>
                    <td className="px-6 py-3 text-sm text-gray-300">{fmt(acc.totalPaid ?? 0)}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        acc.payoutsEnabled
                          ? "bg-green-900/30 text-green-400"
                          : acc.onboardingComplete
                          ? "bg-amber-900/30 text-amber-400"
                          : "bg-gray-800 text-gray-500"
                      }`}>
                        {acc.payoutsEnabled ? "Actif" : acc.onboardingComplete ? "En vérif." : "Non connecté"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log des commissions */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Commissions</h2>
          <div className="flex gap-2">
            {["all", "pending", "paid", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  filterStatus === s
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}>
                {s === "all" ? "Toutes" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {["Date", "Affilié", "Montant", "Statut", "Actions"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 text-sm py-8">
                    Aucune commission
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((comm) => {
                  const account = accounts.find((a) => a.userId === comm.referrerId);
                  return (
                    <tr key={comm.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-3 text-xs text-gray-400">
                        {new Date(comm.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-300">
                        {account?.email ?? comm.referrerId.slice(0, 8) + "..."}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-white">{fmt(comm.amount)}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_BADGE[comm.status] ?? ""}`}>
                          {STATUS_LABEL[comm.status] ?? comm.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {comm.status !== "paid" && (
                            <button
                              onClick={() => updateCommissionStatus(comm.id, "paid")}
                              className="text-xs text-green-400 hover:text-green-300 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Marquer payée
                            </button>
                          )}
                          {comm.status !== "cancelled" && (
                            <button
                              onClick={() => updateCommissionStatus(comm.id, "cancelled")}
                              className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Annuler
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
