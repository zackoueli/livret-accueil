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
  const setProfile = useAuthStore((s) => s.setProfile);
  const profile = useAuthStore((s) => s.profile);

  const handleSelect = async (source: ReferralSource) => {
    setSaving(true);
    try {
      await setDoc(doc(db, "users", uid), { referralSource: source }, { merge: true });
      if (profile) setProfile({ ...profile, referralSource: source });
    } finally {
      setSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Bienvenue sur Bunkly 👋</h2>
        <p className="text-sm text-gray-400 mb-6">Comment nous avez-vous connus ?</p>

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
      </div>
    </div>
  );
}
