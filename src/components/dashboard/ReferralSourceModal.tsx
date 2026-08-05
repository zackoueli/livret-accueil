"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { ReferralSource } from "@/types";
import { Camera, ThumbsUp, Search, Users, MessageCircle, Sparkles } from "lucide-react";

interface ReferralSourceModalProps {
  uid: string;
  onClose: () => void;
}

const OPTIONS: { value: ReferralSource; label: string; icon: React.ElementType }[] = [
  { value: "instagram", label: "Instagram", icon: Camera },
  { value: "facebook", label: "Facebook", icon: ThumbsUp },
  { value: "tiktok", label: "TikTok", icon: Sparkles },
  { value: "google", label: "Recherche Google", icon: Search },
  { value: "word_of_mouth", label: "Bouche à oreille", icon: MessageCircle },
  { value: "other", label: "Autre", icon: Users },
];

export function ReferralSourceModal({ uid, onClose }: ReferralSourceModalProps) {
  const [saving, setSaving] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherDetail, setOtherDetail] = useState("");
  const setProfile = useAuthStore((s) => s.setProfile);
  const profile = useAuthStore((s) => s.profile);

  const save = async (source: ReferralSource, detail?: string) => {
    setSaving(true);
    try {
      const data: { referralSource: ReferralSource; referralSourceDetail?: string } = { referralSource: source };
      if (detail) data.referralSourceDetail = detail;
      await setDoc(doc(db, "users", uid), data, { merge: true });
      if (profile) setProfile({ ...profile, ...data });
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const handleSelect = (source: ReferralSource) => {
    if (source === "other") {
      setShowOtherInput(true);
      return;
    }
    save(source);
  };

  const handleSubmitOther = () => {
    save("other", otherDetail.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Bienvenue sur Bunkly 👋</h2>
        <p className="text-sm text-gray-400 mb-6">Comment nous avez-vous connus ?</p>

        {showOtherInput ? (
          <div>
            <input
              type="text"
              autoFocus
              value={otherDetail}
              onChange={(e) => setOtherDetail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitOther()}
              placeholder="Précisez..."
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowOtherInput(false)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
                Retour
              </button>
              <button
                onClick={handleSubmitOther}
                disabled={saving}
                className="flex-1 py-2.5 rounded-2xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50">
                Valider
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleSelect(value)}
                  disabled={saving}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all disabled:opacity-50 text-center">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              disabled={saving}
              className="w-full mt-5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Passer cette question
            </button>
          </>
        )}
      </div>
    </div>
  );
}
