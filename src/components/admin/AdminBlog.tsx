"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Save, Globe } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDesc: string;
  published: boolean;
  createdAt: number;
  updatedAt: number;
}

const EMPTY: Omit<Article, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  metaTitle: "",
  metaDesc: "",
  published: false,
};

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function AdminBlog() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/articles")
      .then((r) => r.json())
      .then((d) => { setArticles(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openNew = () => { setEditing({ ...EMPTY }); setIsNew(true); };
  const openEdit = (a: Article) => { setEditing({ ...a }); setIsNew(false); };
  const closeEditor = () => { setEditing(null); setIsNew(false); };

  const handleSave = async () => {
    if (!editing?.title || !editing?.slug) return;
    setSaving(true);
    if (isNew) {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const { id } = await res.json();
      const newArticle = { ...editing, id, createdAt: Date.now(), updatedAt: Date.now() } as Article;
      setArticles((prev) => [newArticle, ...prev]);
    } else {
      await fetch("/api/admin/articles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      setArticles((prev) => prev.map((a) => (a.id === editing.id ? { ...a, ...editing } as Article : a)));
    }
    setSaving(false);
    closeEditor();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return;
    await fetch("/api/admin/articles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const togglePublished = async (a: Article) => {
    const updated = { ...a, published: !a.published };
    await fetch("/api/admin/articles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setArticles((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
  };

  const set = (key: keyof typeof EMPTY, val: string | boolean) =>
    setEditing((prev) => ({ ...prev, [key]: val }));

  // ── EDITOR MODAL ───────────────────────────────────────────────────────────
  if (editing !== null) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black text-white">{isNew ? "Nouvel article" : "Modifier l'article"}</h1>
          <button onClick={closeEditor} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* Left — contenu */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Titre *</label>
              <input value={editing.title ?? ""} onChange={(e) => {
                set("title", e.target.value);
                if (isNew) set("slug", slugify(e.target.value));
                if (isNew) set("metaTitle", e.target.value);
              }}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Titre de l'article" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Slug *</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm">
                <span className="text-gray-600">/blog/</span>
                <input value={editing.slug ?? ""} onChange={(e) => set("slug", slugify(e.target.value))}
                  className="flex-1 bg-transparent text-white focus:outline-none"
                  placeholder="mon-article" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Extrait (affiché dans les listes)</label>
              <textarea value={editing.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Résumé court de l'article…" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Contenu (Markdown)</label>
              <textarea value={editing.content ?? ""} onChange={(e) => set("content", e.target.value)}
                rows={18}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500 resize-y font-mono"
                placeholder="# Titre&#10;&#10;Votre contenu en markdown…" />
            </div>
          </div>

          {/* Right — SEO + options */}
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> SEO
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Meta title</label>
                  <input value={editing.metaTitle ?? ""} onChange={(e) => set("metaTitle", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    placeholder={editing.title ?? "Meta title"} />
                  <p className="text-xs text-gray-600 mt-1">{(editing.metaTitle ?? "").length}/60 chars</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Meta description</label>
                  <textarea value={editing.metaDesc ?? ""} onChange={(e) => set("metaDesc", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder="Description pour Google…" />
                  <p className="text-xs text-gray-600 mt-1">{(editing.metaDesc ?? "").length}/160 chars</p>
                </div>
              </div>

              {/* Aperçu Google */}
              {(editing.metaTitle || editing.title) && (
                <div className="mt-4 p-3 rounded-lg bg-gray-950 border border-gray-800">
                  <p className="text-xs text-gray-600 mb-2">Aperçu Google</p>
                  <p className="text-blue-400 text-sm font-medium truncate">{editing.metaTitle || editing.title}</p>
                  <p className="text-green-700 text-xs">livret.app/blog/{editing.slug || "slug"}</p>
                  <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{editing.metaDesc || editing.excerpt || "Description…"}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Publication</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => set("published", !editing.published)}
                  className={`w-10 h-6 rounded-full transition-colors ${editing.published ? "bg-emerald-600" : "bg-gray-700"} relative`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${editing.published ? "translate-x-5" : "translate-x-1"}`} />
                </div>
                <span className="text-sm text-gray-300">{editing.published ? "Publié" : "Brouillon"}</span>
              </label>
            </div>

            <button onClick={handleSave} disabled={saving || !editing.title || !editing.slug}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Blog / SEO</h1>
          <p className="text-gray-500 text-sm mt-1">{articles.length} articles</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" /> Nouvel article
        </button>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_80px_100px] gap-4 px-5 py-3 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>Article</span>
          <span>Slug</span>
          <span>Statut</span>
          <span>Actions</span>
        </div>

        {loading && <div className="py-16 text-center text-gray-600 text-sm">Chargement…</div>}
        {!loading && articles.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-gray-600 text-sm mb-3">Aucun article pour l'instant</p>
            <button onClick={openNew} className="text-indigo-400 text-sm font-semibold hover:underline">
              Créer le premier article →
            </button>
          </div>
        )}

        {articles.map((a) => (
          <div key={a.id} className="grid grid-cols-[1fr_120px_80px_100px] gap-4 items-center px-5 py-4 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{a.title}</p>
              {a.excerpt && <p className="text-xs text-gray-500 truncate mt-0.5">{a.excerpt}</p>}
              <p className="text-xs text-gray-600 mt-1">
                {a.updatedAt ? new Date(a.updatedAt).toLocaleDateString("fr-FR") : "—"}
              </p>
            </div>
            <span className="text-xs text-gray-500 truncate">{a.slug}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${a.published ? "bg-emerald-900/50 text-emerald-400" : "bg-gray-800 text-gray-500"}`}>
              {a.published ? "Publié" : "Brouillon"}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => togglePublished(a)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors"
                title={a.published ? "Dépublier" : "Publier"}>
                {a.published ? <EyeOff className="w-3.5 h-3.5 text-gray-400" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}
              </button>
              <button onClick={() => openEdit(a)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors">
                <Pencil className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button onClick={() => handleDelete(a.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-900/40 transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
