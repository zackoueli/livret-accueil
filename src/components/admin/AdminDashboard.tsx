"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, Eye, TrendingUp, UserCheck, UserX } from "lucide-react";

interface Stats {
  users: { free: number; actif: number; total: number };
  booklets: { total: number; thisMonth: number };
  views: number;
  mrr: number;
  referralSources: Record<string, number>;
}

const REFERRAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google: "Recherche Google",
  word_of_mouth: "Bouche à oreille",
  other: "Autre",
  unknown: "Non renseigné",
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const Card = ({
    label, value, sub, icon: Icon, color,
  }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) => (
    <div className="bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-800 min-w-0">
      <div className="flex items-start justify-between mb-3 gap-2">
        <p className="text-sm text-gray-400">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-black text-white mb-1 truncate">{loading ? "—" : value}</p>
      {sub && <p className="text-xs text-gray-500 truncate">{sub}</p>}
    </div>
  );

  const pctActif = stats ? Math.round((stats.users.actif / (stats.users.total || 1)) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl font-black text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de la plateforme</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 md:mb-8">
        <Card label="Utilisateurs totaux" value={stats?.users.total ?? 0} sub={`${stats?.users.free ?? 0} free · ${stats?.users.actif ?? 0} actifs`} icon={Users} color="bg-indigo-600" />
        <Card label="Plan Actif" value={stats?.users.actif ?? 0} sub={`${pctActif}% de conversion`} icon={UserCheck} color="bg-emerald-600" />
        <Card label="Livrets créés" value={stats?.booklets.total ?? 0} sub={`+${stats?.booklets.thisMonth ?? 0} ce mois`} icon={BookOpen} color="bg-violet-600" />
        <Card label="Vues totales" value={(stats?.views ?? 0).toLocaleString("fr-FR")} sub="Toutes pages confondues" icon={Eye} color="bg-sky-600" />
      </div>

      {/* MRR */}
      <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800 mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">MRR estimé</p>
            <p className="text-3xl sm:text-4xl font-black text-white">{loading ? "—" : `${stats?.mrr ?? 0} €`}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        <p className="text-xs text-gray-500">Basé sur les abonnements actifs en base (9,90 €/mois ou équivalent annuel)</p>
      </div>

      {/* Répartition plans */}
      <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800">
        <p className="text-sm font-semibold text-white mb-5">Répartition des plans</p>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-600 inline-block" /> Free</span>
              <span>{stats?.users.free ?? 0}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
              <div className="h-full bg-gray-600 rounded-full transition-all duration-700"
                style={{ width: stats ? `${(stats.users.free / (stats.users.total || 1)) * 100}%` : "0%" }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Actif</span>
              <span>{stats?.users.actif ?? 0}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: stats ? `${pctActif}%` : "0%" }} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 pt-5 border-t border-gray-800">
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-black text-white">{pctActif}%</p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Taux conversion</p>
          </div>
          <div className="text-center border-x border-gray-800">
            <p className="text-lg sm:text-2xl font-black text-white">
              {stats ? (stats.booklets.total / (stats.users.total || 1)).toFixed(1) : "—"}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Livrets / user</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-black text-white">
              {stats && stats.booklets.total > 0 ? Math.round(stats.views / stats.booklets.total) : "—"}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Vues / livret</p>
          </div>
        </div>
      </div>

      {/* Sources d'acquisition */}
      <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800 mt-6 md:mt-8">
        <p className="text-sm font-semibold text-white mb-5">D'où viennent nos utilisateurs</p>
        {Object.entries(stats?.referralSources ?? {})
          .sort((a, b) => b[1] - a[1])
          .map(([source, count]) => {
            const total = stats?.users.total || 1;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={source} className="mb-4 last:mb-0">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>{REFERRAL_LABELS[source] ?? source}</span>
                  <span>{count} · {pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        {loading && <p className="text-xs text-gray-500">Chargement...</p>}
      </div>
    </div>
  );
}
