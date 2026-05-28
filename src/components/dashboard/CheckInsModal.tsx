"use client";

import { useEffect, useState } from "react";
import { X, ClipboardCheck, Loader2, Users, Calendar } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Booklet, CheckIn } from "@/types";

export function CheckInsModal({ booklet, onClose }: { booklet: Booklet; onClose: () => void }) {
  const { user } = useAuthStore();
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CheckIn | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/checkins?bookletId=${booklet.id}&userId=${user.uid}`)
      .then((r) => r.json())
      .then((d) => setCheckins(d.checkins ?? []))
      .finally(() => setLoading(false));
  }, [booklet.id, user]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-orange-500" />
              Check-ins
            </h2>
            <p className="text-sm text-gray-400 mt-0.5 truncate max-w-[260px]">{booklet.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
            </div>
          ) : checkins.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="w-8 h-8 text-orange-300" />
              </div>
              <p className="font-semibold text-gray-700 mb-1">Aucun check-in</p>
              <p className="text-sm text-gray-400">Les check-ins de vos voyageurs apparaîtront ici.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {checkins.map((c) => (
                <button key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                        <span className="text-lg">👤</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{c.guestName}</p>
                        {c.guestEmail && <p className="text-xs text-gray-400">{c.guestEmail}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</p>
                      <p className="text-xs font-medium text-gray-600 mt-0.5">
                        {c.guestCount} pers.
                      </p>
                    </div>
                  </div>

                  {selected?.id === c.id && (
                    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {c.checkInDate && (
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-0.5">Arrivée</p>
                            <p className="text-sm font-semibold text-gray-800">{c.checkInDate}</p>
                          </div>
                        )}
                        {c.checkOutDate && (
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-0.5">Départ</p>
                            <p className="text-sm font-semibold text-gray-800">{c.checkOutDate}</p>
                          </div>
                        )}
                      </div>
                      {c.signature && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1.5">Signature</p>
                          <div className="bg-white border border-gray-100 rounded-xl p-2">
                            <img src={c.signature} alt="signature" className="max-h-20 mx-auto" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
