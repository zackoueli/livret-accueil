"use client";

import { useEffect, useState } from "react";
import { Link2, Plus, Copy, Check, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";
import type { MarketingLink } from "@/types";

export function AdminMarketingLinks() {
  const [links, setLinks] = useState<MarketingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/marketing-links");
    const data = await res.json();
    setLinks(data.links ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await adminFetch("/api/admin/marketing-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      setName("");
      await fetchLinks();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await adminFetch("/api/admin/marketing-links", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(`https://app.bunkly.co/r/${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl font-black text-white">Liens tracking</h1>
        <p className="text-gray-500 text-sm mt-1">
          Liens internes pour suivre les clics et inscriptions générés par vos posts (Insta, YouTube…)
        </p>
      </div>

      {/* Création */}
      <form onSubmit={handleCreate}
        className="bg-gray-900 rounded-2xl border border-gray-800 p-4 sm:p-6 mb-6 md:mb-8 flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nom du lien</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Vidéo YouTube titre, Post insta 10 août" required
            className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button type="submit" disabled={creating}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 shrink-0">
          <Plus className="w-4 h-4" /> Créer le lien
        </button>
      </form>
      {error && <p className="text-red-400 text-sm -mt-4 mb-6">{error}</p>}

      {/* Liste */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-bold text-white">Liens existants</h2>
        </div>

        {loading && <div className="py-16 text-center text-gray-600 text-sm">Chargement…</div>}
        {!loading && links.length === 0 && (
          <div className="py-16 text-center text-gray-600 text-sm">Aucun lien de tracking</div>
        )}

        <div className="divide-y divide-gray-800">
          {links.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center shrink-0">
                  <Link2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{l.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {l.clickCount} clic{l.clickCount !== 1 ? "s" : ""} · {l.signupCount} compte{l.signupCount !== 1 ? "s" : ""} créé{l.signupCount !== 1 ? "s" : ""}
                    {" · "}
                    <span className="font-mono">app.bunkly.co/r/{l.code}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleCopy(l.id, l.code)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors">
                  {copiedId === l.id ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <button onClick={() => handleDelete(l.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
