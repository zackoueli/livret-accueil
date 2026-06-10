"use client";

import { useAuthStore } from "@/store/authStore";
import { planHasFeature, PLAN_LIMITS, PlanFeature } from "@/lib/plans";
import { Plan } from "@/types";

export function usePlan() {
  const { profile } = useAuthStore();
  // "actif" est l'ancien nom du plan pro — on le mappe vers "pro"
  const rawPlan = profile?.plan as string;
  const plan: Plan = (rawPlan === "actif" ? "pro" : (rawPlan as Plan)) || "free";

  return {
    plan,
    can: (feature: PlanFeature) => planHasFeature(plan, feature),
    bookletLimit: PLAN_LIMITS[plan].booklets,
    isFree: plan === "free",
    isPro: plan === "pro",
    isAgency: plan === "agency",
    isPaid: plan === "pro" || plan === "agency",
  };
}
