"use client";

import { useEffect, useState } from "react";
import { Search, Eye, Trash2, ExternalLink } from "lucide-react";
import { bookletUrl } from "@/lib/url";

interface BookletRow {
  id: string;
  title: string;
  propertyName: string;
  slug: string;
  userId: string;
  userEmail: string;
  templateId: string;
  viewCount: number;
  createdAt: number;
  published: boolean;
}

const TEMPLATE_LABELS: Record<string, string> = {
  nature: "🌿 Nature",
  magazine: "📰 Magazine",
  moderne: "🟠 Moderne",
};

export function AdminBooklets() {
  const [booklets, setBooklets] = useState<BookletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/booklets")
      .then((r) => r.json())
      .then((d) => { setBooklets(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = booklets.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.propertyName.toLowerCase().includes(q) ||
      b.userId.toLowerCase().includes(q) ||
      b.userEmail.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce livret définitivement ?")) return;
    setDeleting(id);
    await fetch("/api/admin/booklets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBooklets((prev) => prev.filter((b) => b.id !== id));
    setDeleting(null);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Livrets</h1>
          <p className="text-gray-500 text-sm mt-1">{booklets.length} livrets au total</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par titre, slug, email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
        />
      </div>

      {/* Table (desktop) */}
      <div className="hidden sm:block bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_80px_80px_80px_40px] gap-4 px-5 py-3 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>Livret</span>
          <span>Template</span>
          <span>Vues</span>
          <span>Publié</span>
          <span>Créé</span>
          <span />
        </div>

        {loading && (
          <div className="py-16 text-center text-gray-600 text-sm">Chargement…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-gray-600 text-sm">Aucun livret trouvé</div>
        )}

        {filtered.map((b) => (
          <div key={b.id}
            className="grid grid-cols-[1fr_120px_80px_80px_80px_40px] gap-4 items-center px-5 py-3.5 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{b.propertyName || b.title || "Sans titre"}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">/b/{b.slug} · {b.userEmail || `${b.userId.slice(0, 8)}…`}</p>
            </div>
            <span className="text-xs text-gray-400">{TEMPLATE_LABELS[b.templateId] ?? b.templateId}</span>
            <span className="text-sm font-semibold text-white flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-gray-500" /> {b.viewCount}
            </span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${b.published ? "bg-emerald-900/50 text-emerald-400" : "bg-gray-800 text-gray-500"}`}>
              {b.published ? "Oui" : "Non"}
            </span>
            <span className="text-xs text-gray-500">
              {b.createdAt ? new Date(b.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
            </span>
            <div className="flex items-center gap-1">
              {b.slug && (
                <a href={bookletUrl(b.slug)} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              )}
              <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-900/40 transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cards (mobile) */}
      <div className="sm:hidden space-y-3">
        {loading && (
          <div className="py-16 text-center text-gray-600 text-sm">Chargement…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-gray-600 text-sm">Aucun livret trouvé</div>
        )}

        {filtered.map((b) => (
          <div key={b.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate">{b.propertyName || b.title || "Sans titre"}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">/b/{b.slug}</p>
                <p className="text-xs text-gray-500 truncate">{b.userEmail || `${b.userId.slice(0, 8)}…`}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {b.slug && (
                  <a href={bookletUrl(b.slug)} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                )}
                <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-900/40 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-400 bg-gray-800 px-2 py-1 rounded-full">{TEMPLATE_LABELS[b.templateId] ?? b.templateId}</span>
              <span className="text-gray-300 bg-gray-800 px-2 py-1 rounded-full flex items-center gap-1">
                <Eye className="w-3 h-3 text-gray-500" /> {b.viewCount}
              </span>
              <span className={`font-bold px-2 py-1 rounded-full ${b.published ? "bg-emerald-900/50 text-emerald-400" : "bg-gray-800 text-gray-500"}`}>
                {b.published ? "Publié" : "Non publié"}
              </span>
              <span className="text-gray-500 ml-auto">
                {b.createdAt ? new Date(b.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
