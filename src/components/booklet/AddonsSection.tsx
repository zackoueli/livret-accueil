"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booklet, BookletService } from "@/types";
import { computeServiceTotal, ServiceSelection } from "@/lib/serviceOptions";

export { computeServiceTotal };
export type { ServiceSelection };

export function useAddonServices(booklet: Booklet) {
  const [services, setServices] = useState<BookletService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!booklet.addonsPurchasable) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const q = query(
          collection(db, "booklet_services"),
          where("bookletId", "==", booklet.id),
          where("enabled", "==", true),
          orderBy("order", "asc")
        );
        const snap = await getDocs(q);
        setServices(snap.docs.map((d) => d.data() as BookletService));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [booklet.id, booklet.addonsPurchasable]);

  return { services, loading, purchasable: Boolean(booklet.addonsPurchasable) };
}

export function useAddonPurchase(bookletId: string) {
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const buy = async (serviceId: string, selection: ServiceSelection = {}) => {
    setPurchasing(serviceId);
    try {
      const res = await fetch("/api/services/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookletId, serviceId, selection }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPurchasing(null);
      }
    } catch (e) {
      console.error(e);
      setPurchasing(null);
    }
  };

  return { buy, purchasing };
}

interface PurchaseStatus {
  status: "processing" | "paid" | "failed" | "refunded" | "pending";
  serviceName?: string;
  amountTotal?: number;
}

export function useAddonPurchaseConfirmation() {
  const searchParams = useSearchParams();
  const purchase = searchParams.get("purchase");
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<PurchaseStatus | null>(null);

  useEffect(() => {
    if (purchase !== "success" || !sessionId) return;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/services/purchase-status?session_id=${sessionId}`);
        const data = await res.json();
        setStatus(data);
        if (data.status === "processing" && attempts < 5) {
          setTimeout(poll, 1500);
        }
      } catch (e) {
        console.error(e);
      }
    };
    poll();
  }, [purchase, sessionId]);

  return { purchase: purchase as "success" | "cancel" | null, status };
}

export function fmtAddonPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(/\.00$/, "").replace(".", ",") + " €";
}
