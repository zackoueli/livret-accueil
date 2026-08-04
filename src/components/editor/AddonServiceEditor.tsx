"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { BookletService, ServicePriceType } from "@/types";
import {
  getBookletServices,
  createBookletService,
  updateBookletService,
  deleteBookletService,
} from "@/lib/services";
import { usePlan } from "@/hooks/usePlan";
import { useAuthStore } from "@/store/authStore";
import { PhotoUploader } from "./EditorForm";
import { ServiceOptionsEditor } from "./ServiceOptionsEditor";

const input = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300";

function fmtAmount(cents: number) {
  // input type="number" exige un point comme séparateur décimal, jamais une virgule
  return String(cents / 100);
}

export function AddonServiceEditor({ bookletId }: { bookletId: string }) {
  const t = useTranslations("editor");
  const locale = useLocale();
  const { commissionRate } = usePlan();
  const { user } = useAuthStore();

  const [services, setServices] = useState<BookletService[]>([]);
  const [connectReady, setConnectReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    load();
  }, [bookletId, user]);

  useEffect(() => {
    if (!user) return;
    checkConnectStatus();
  }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const list = await getBookletServices(bookletId, user.uid);
      setServices(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function checkConnectStatus() {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/host/connect/status?userId=${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConnectReady(Boolean(data.chargesEnabled));
    } catch {
      setConnectReady(false);
    }
  }

  const toggle = async (service: BookletService) => {
    const enabled = !service.enabled;
    setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, enabled } : s)));
    await updateBookletService(service.id, { enabled });
  };

  const patch = async (service: BookletService, data: Partial<BookletService>) => {
    setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, ...data } : s)));
    await updateBookletService(service.id, data);
  };

  const add = async () => {
    if (!user) return;
    const id = await createBookletService(bookletId, user.uid, {
      name: "",
      description: "",
      emoji: "💳",
      priceType: "one_time",
      amount: 0,
    });
    await load();
    void id;
  };

  const remove = async (service: BookletService) => {
    setServices((prev) => prev.filter((s) => s.id !== service.id));
    await deleteBookletService(service.id);
  };

  if (loading) {
    return <p className="text-sm text-gray-400">{t("loading")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 rounded-xl border border-orange-100 p-4">
        <p className="text-sm font-semibold text-gray-900">
          {t("addonsCommissionRate", { rate: commissionRate })}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{t("addonsCommissionHint")}</p>
      </div>

      {connectReady === false && (
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">{t("addonsConnectRequired")}</p>
            <Link
              href={`/${locale}/dashboard/payments`}
              className="text-xs text-orange-500 hover:text-orange-600 font-semibold underline">
              {t("addonsConnectCta")}
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {services.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-2xl mb-1">💳</p>
            <p className="text-sm text-gray-400">{t("addonsEmpty")}</p>
          </div>
        )}

        {services.map((service) => (
          <div key={service.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2">
            <div className="flex items-center gap-3">
              <input type="text" value={service.emoji ?? ""} onChange={(e) => patch(service, { emoji: e.target.value })}
                className="w-12 text-center text-xl bg-white border border-gray-200 rounded-lg py-1.5" maxLength={2} />
              <input type="text" value={service.name} onChange={(e) => patch(service, { name: e.target.value })}
                placeholder={t("addonName")} className={`${input} flex-1 text-sm font-semibold`} />
              <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                <input type="checkbox" checked={service.enabled} onChange={() => toggle(service)} className="w-4 h-4 accent-orange-500" />
                <span className="text-xs font-semibold text-gray-500">{t("addonEnabled")}</span>
              </label>
              <button onClick={() => remove(service)} className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <input type="text" value={service.description ?? ""} onChange={(e) => patch(service, { description: e.target.value })}
              placeholder={t("addonDescription")} className={`${input} text-sm`} />

            <PhotoUploader
              bookletId={bookletId}
              storagePath="addons"
              value={service.image ?? ""}
              onChange={(url) => patch(service, { image: url })}
              aspectRatio="16/9"
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select value={service.priceType} onChange={(e) => patch(service, { priceType: e.target.value as ServicePriceType })}
                className={`${input} text-sm cursor-pointer sm:w-40`}>
                <option value="one_time">{t("addonPriceOneTime")}</option>
                <option value="per_day">{t("addonPricePerDay")}</option>
              </select>
              <div className="relative flex-1 min-w-0">
                <input type="number" min={0} step={0.5} value={fmtAmount(service.amount)}
                  onChange={(e) => patch(service, { amount: Math.round(parseFloat(e.target.value || "0") * 100) })}
                  className={`${input} text-sm pr-10 text-gray-900`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">€</span>
              </div>
            </div>

            <ServiceOptionsEditor
              options={service.options ?? []}
              onChange={(options) => patch(service, { options })}
            />
          </div>
        ))}
      </div>

      <button onClick={add}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-orange-200 text-orange-500 font-semibold text-sm hover:bg-orange-50 transition-colors">
        <Plus className="w-4 h-4" /> {t("addAddon")}
      </button>
    </div>
  );
}
