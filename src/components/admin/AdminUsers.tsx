"use client";

import { useEffect, useState } from "react";
import { Search, Gift, X } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";

interface UserRow {
  uid: string;
  email: string;
  displayName: string;
  plan: string;
  subscriptionStatus: string | null;
  subscriptionEndDate: number | null;
  hasStripeSubscription: boolean;
  proTrial: boolean;
  createdAt: number;
}

const PLAN_STYLES: Record<string, string> = {
  free: "bg-gray-800 text-gray-400",
  starter: "bg-orange-900/50 text-orange-400",
  pro: "bg-indigo-900/50 text-indigo-300",
  agency: "bg-gray-100 text-gray-900",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  starter: "Starter",
  pro: "Pro",
  agency: "Agence",
};

const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });

const isStripeActive = (u: UserRow) =>
  u.hasStripeSubscription && !u.proTrial &&
  ["active", "trialing", "past_due"].includes(u.subscriptionStatus ?? "");

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { setUsers(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q)
    );
  });

  const act = async (u: UserRow, action: "grant_trial" | "revoke_trial") => {
    const message = action === "grant_trial"
      ? `Activer 14 jours de Pro pour ${u.email || u.uid} ?`
      : `Retirer l'essai Pro de ${u.email || u.uid} ? Le compte repasse en gratuit.`;
    if (!confirm(message)) return;
    setBusy(u.uid);
    const res = await adminFetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: u.uid, action }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      alert(data.error ?? "Erreur");
      return;
    }
    setUsers((prev) => prev.map((x) => x.uid !== u.uid ? x : action === "grant_trial"
      ? { ...x, plan: "pro", subscriptionStatus: "trialing", subscriptionEndDate: data.subscriptionEndDate, proTrial: true }
      : { ...x, plan: "free", subscriptionStatus: "canceled", proTrial: false }));
  };

  const renderStatus = (u: UserRow) => {
    if (u.proTrial && u.subscriptionEndDate) {
      return <span className="text-xs text-amber-400">Essai offert → {formatDate(u.subscriptionEndDate * 1000)}</span>;
    }
    if (isStripeActive(u)) return <span className="text-xs text-emerald-400">Stripe · {u.subscriptionStatus}</span>;
    return <span className="text-xs text-gray-600">—</span>;
  };

  const renderAction = (u: UserRow) => {
    if (u.proTrial) {
      return (
        <button onClick={() => act(u, "revoke_trial")} disabled={busy === u.uid}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-900/40 transition-colors disabled:opacity-50">
          <X className="w-3.5 h-3.5" /> Retirer
        </button>
      );
    }
    if (isStripeActive(u)) return null;
    return (
      <button onClick={() => act(u, "grant_trial")} disabled={busy === u.uid}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50">
        <Gift className="w-3.5 h-3.5" /> Pro 14 j
      </button>
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Utilisateurs</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} comptes au total</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par email, nom, uid..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
        />
      </div>

      {/* Table (desktop) */}
      <div className="hidden sm:block bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="grid grid-cols-[1fr_90px_180px_80px_110px] gap-4 px-5 py-3 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>Compte</span>
          <span>Plan</span>
          <span>Abonnement</span>
          <span>Inscrit</span>
          <span />
        </div>

        {loading && (
          <div className="py-16 text-center text-gray-600 text-sm">Chargement…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-gray-600 text-sm">Aucun utilisateur trouvé</div>
        )}

        {filtered.map((u) => (
          <div key={u.uid}
            className="grid grid-cols-[1fr_90px_180px_80px_110px] gap-4 items-center px-5 py-3.5 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{u.email || `${u.uid.slice(0, 8)}…`}</p>
              {u.displayName && <p className="text-xs text-gray-500 truncate mt-0.5">{u.displayName}</p>}
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${PLAN_STYLES[u.plan] ?? PLAN_STYLES.free}`}>
              {PLAN_LABELS[u.plan] ?? u.plan}
            </span>
            {renderStatus(u)}
            <span className="text-xs text-gray-500">{u.createdAt ? formatDate(u.createdAt) : "—"}</span>
            <div className="flex justify-end">{renderAction(u)}</div>
          </div>
        ))}
      </div>

      {/* Cards (mobile) */}
      <div className="sm:hidden space-y-3">
        {loading && (
          <div className="py-16 text-center text-gray-600 text-sm">Chargement…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-gray-600 text-sm">Aucun utilisateur trouvé</div>
        )}

        {filtered.map((u) => (
          <div key={u.uid} className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate">{u.email || `${u.uid.slice(0, 8)}…`}</p>
                {u.displayName && <p className="text-xs text-gray-500 truncate mt-0.5">{u.displayName}</p>}
              </div>
              <div className="shrink-0">{renderAction(u)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`font-bold px-2 py-1 rounded-full ${PLAN_STYLES[u.plan] ?? PLAN_STYLES.free}`}>
                {PLAN_LABELS[u.plan] ?? u.plan}
              </span>
              {renderStatus(u)}
              <span className="text-gray-500 ml-auto">{u.createdAt ? formatDate(u.createdAt) : "—"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
