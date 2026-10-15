"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";

export const WELCOME_VIDEO_ID = "P36l1tfmRrM";

export function WelcomeVideoModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("dashboard");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t("welcomeVideoTitle")}</h2>
            <p className="text-sm text-gray-400 mt-1">{t("welcomeVideoSub")}</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 shrink-0 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6">
          <div className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              src={`https://www.youtube.com/embed/${WELCOME_VIDEO_ID}?rel=0`}
              title={t("welcomeVideoTitle")}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
        <div className="px-6 py-5 flex justify-end">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors">
            {t("welcomeVideoCta")}
          </button>
        </div>
      </div>
    </div>
  );
}
