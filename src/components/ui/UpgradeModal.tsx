"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { X, Check, Zap, Crown, Lock } from "lucide-react";
import { PLANS_CONFIG } from "@/lib/plans";
import { usePlan } from "@/hooks/usePlan";

interface UpgradeModalProps {
  onClose: () => void;
  /** Titre affiché au-dessus du pricing, ex: "L'import IA est réservé au plan Pro" */
  reason?: string;
}

export function UpgradeModal({ onClose, reason }: UpgradeModalProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const router = useRouter();
  const locale = useLocale();
  const { plan: currentPlan } = usePlan();

  const handleSelect = (planId: string) => {
    if (planId === "free") { onClose(); return; }
    router.push(`/${locale}/dashboard/settings?upgrade=${planId}&billing=${billing}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            {reason && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <p className="text-sm font-medium text-orange-600">{reason}</p>
              </div>
            )}
            <h2 className="text-xl font-bold text-gray-900">Choisissez votre plan</h2>
            <p className="text-sm text-gray-400 mt-0.5">Sans engagement · Annulez à tout moment</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center gap-3 px-6 pb-5">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setBilling("monthly")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${billing === "monthly" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"}`}>
              Mensuel
            </button>
            <button onClick={() => setBilling("yearly")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${billing === "yearly" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"}`}>
              Annuel
            </button>
          </div>
          {billing === "yearly" && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              2 mois offerts
            </span>
          )}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 pb-6">
          {PLANS_CONFIG.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const price = billing === "yearly" ? plan.price.yearly : plan.price.monthly;

            return (
              <div key={plan.id}
                className={`relative rounded-2xl border-2 p-5 flex flex-col transition-all ${
                  plan.popular
                    ? "border-orange-400 shadow-lg shadow-orange-100"
                    : "border-gray-100"
                }`}>

                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Populaire
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Actuel
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: plan.color + "20" }}>
                      <Crown className="w-3.5 h-3.5" style={{ color: plan.color }} />
                    </div>
                    <span className="font-bold text-gray-900">{plan.name}</span>
                  </div>
                  <p className="text-xs text-gray-400">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-gray-900">{price === 0 ? "0" : price.toFixed(2).replace(".", ",")}€</span>
                    {price > 0 && <span className="text-sm text-gray-400 mb-1">/mois</span>}
                  </div>
                  {billing === "yearly" && plan.yearlyTotal && (
                    <p className="text-xs text-gray-400">Facturé {plan.yearlyTotal}€/an</p>
                  )}
                  {price === 0 && <p className="text-xs text-gray-400">Pour toujours</p>}
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-center gap-2 text-xs">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${f.included ? "bg-green-100" : "bg-gray-100"}`}>
                        {f.included
                          ? <Check className="w-2.5 h-2.5 text-green-600" />
                          : <X className="w-2.5 h-2.5 text-gray-400" />
                        }
                      </div>
                      <span className={f.included ? "text-gray-700" : "text-gray-400"}>{f.label}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSelect(plan.id)}
                  disabled={isCurrent}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.popular
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : plan.id === "agency"
                        ? "text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  style={plan.id === "agency" ? { background: plan.color } : {}}>
                  {isCurrent ? "Plan actuel" : plan.id === "free" ? "Continuer gratuitement" : `Choisir ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 pb-5">
          Des questions ? <a href="mailto:hello@bunkly.co" className="text-orange-500 hover:underline">hello@bunkly.co</a>
        </p>
      </div>
    </div>
  );
}
