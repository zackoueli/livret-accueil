"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, XCircle, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { ServicePurchase } from "@/types";

function fmt(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

const STATUS_STYLE: Record<ServicePurchase["status"], { icon: typeof CheckCircle2; className: string }> = {
  paid: { icon: CheckCircle2, className: "bg-green-50 text-green-600" },
  pending: { icon: Clock, className: "bg-amber-50 text-amber-600" },
  failed: { icon: XCircle, className: "bg-red-50 text-red-600" },
  refunded: { icon: RotateCcw, className: "bg-gray-100 text-gray-500" },
};

export function OrdersPage() {
  const t = useTranslations("editor");
  const tD = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<ServicePurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const q = query(
          collection(db, "service_purchases"),
          where("hostUid", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => d.data() as ServicePurchase));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour au dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">{tD("orders")}</h1>
          <p className="text-sm text-gray-400 mt-1">{tD("ordersTitle")}</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm text-gray-400">{t("ordersEmpty")}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {orders.map((order) => {
                const status = STATUS_STYLE[order.status];
                const StatusIcon = status.icon;
                return (
                  <div key={order.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{order.serviceName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString(locale)}
                        {order.quantity > 1 ? ` · ×${order.quantity}` : ""}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{fmt(order.amountTotal)}</p>
                      <p className="text-xs text-gray-400">
                        {t("ordersCommission")}: {fmt(order.commissionAmount)} · {t("ordersPayout")}: {fmt(order.hostPayoutAmount)}
                      </p>
                    </div>

                    <span className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${status.className}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {t(`ordersStatus${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}` as any)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
