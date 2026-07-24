"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, CheckCircle2, XCircle } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";

interface PromoCode {
  id: string;
  code: string;
  active: boolean;
  percentOff: number | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  expiresAt: number | null;
  createdAt: number;
}

export function AdminPromoCodes() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("10");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");

  const fetchCodes = async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/promo-codes");
    const data = await res.json();
    setCodes(data.codes ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await adminFetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          percentOff: Number(percentOff),
          expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      setCode("");
      setPercentOff("10");
      setExpiresAt("");
      setMaxRedemptions("");
      await fetchCodes();
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await adminFetch("/api/admin/promo-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl font-black text-white">Codes promo</h1>
        <p className="text-gray-500 text-sm mt-1">Réductions applicables au checkout Stripe</p>
      </div>

      {/* Création */}
      <form onSubmit={handleCreate}
        className="bg-gray-900 rounded-2xl border border-gray-800 p-4 sm:p-6 mb-6 md:mb-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Code</label>
            <input
              value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="BIENVENUE10" required
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Réduction (%)</label>
            <input
              type="number" min={1} max={100} value={percentOff}
              onChange={(e) => setPercentOff(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Expiration (optionnel)</label>
            <input
              type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Utilisations max (optionnel)</label>
            <input
              type="number" min={1} value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="Illimité"
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={creating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-50">
          <Plus className="w-4 h-4" /> Créer le code
        </button>
      </form>

      {/* Liste */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-bold text-white">Codes existants</h2>
        </div>

        {loading && <div className="py-16 text-center text-gray-600 text-sm">Chargement…</div>}
        {!loading && codes.length === 0 && (
          <div className="py-16 text-center text-gray-600 text-sm">Aucun code promo</div>
        )}

        <div className="divide-y divide-gray-800">
          {codes.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{c.code}</p>
                  <p className="text-xs text-gray-500 truncate">
                    -{c.percentOff}% · {c.timesRedeemed} utilisé{c.timesRedeemed > 1 ? "s" : ""}
                    {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}
                    {c.expiresAt ? ` · expire le ${new Date(c.expiresAt).toLocaleDateString("fr-FR")}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  c.active ? "bg-emerald-900/50 text-emerald-400" : "bg-gray-800 text-gray-500"
                }`}>
                  {c.active ? "Actif" : "Inactif"}
                </span>
                <button onClick={() => toggleActive(c.id, !c.active)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors">
                  {c.active
                    ? <XCircle className="w-4 h-4 text-red-500" />
                    : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
