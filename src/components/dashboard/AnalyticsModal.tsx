"use client";

import { useEffect, useState } from "react";
import { X, BarChart2, Eye, TrendingUp } from "lucide-react";
import { Booklet } from "@/types";

const SECTION_LABELS: Record<string, string> = {
  home:     "Accueil",
  stay:     "Le séjour",
  area:     "Le quartier",
  safety:   "Sécurité",
  checkout: "Départ",
  area_grid:     "Activités",
  checkout_grid: "Départ",
};

interface AnalyticsData {
  sections: Record<string, number>;
  updatedAt: number | null;
}

export function AnalyticsModal({ booklet, onClose }: { booklet: Booklet; onClose: () => void }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/booklets/analytics?bookletId=${booklet.id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ sections: {}, updatedAt: null }))
      .finally(() => setLoading(false));
  }, [booklet.id]);

  const totalSectionViews = data
    ? Object.values(data.sections).reduce((a, b) => a + b, 0)
    : 0;

  const sortedSections = data
    ? Object.entries(data.sections).sort(([, a], [, b]) => b - a)
    : [];

  const maxViews = sortedSections[0]?.[1] ?? 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Analytics</h2>
              <p className="text-xs text-gray-400 truncate max-w-[200px]">{booklet.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-orange-600 font-medium">Vues totales</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{booklet.viewCount ?? 0}</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">Sections visitées</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{totalSectionViews}</p>
                </div>
              </div>

              {/* Sections breakdown */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Sections les plus consultées</p>
                {sortedSections.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Pas encore de données</p>
                    <p className="text-xs mt-1">Les stats apparaissent dès que des voyageurs visitent votre livret</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sortedSections.map(([section, count]) => {
                      const label = SECTION_LABELS[section] ?? section;
                      const pct = Math.round((count / maxViews) * 100);
                      return (
                        <div key={section}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">{label}</span>
                            <span className="text-xs font-semibold text-gray-500">{count} visite{count > 1 ? "s" : ""}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: booklet.accentColor || "#f97316" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {data?.updatedAt && (
                <p className="text-xs text-gray-300 text-center">
                  Mis à jour le {new Date(data.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
