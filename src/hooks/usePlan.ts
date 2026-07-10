"use client";

import { useAuthStore } from "@/store/authStore";
import {
  planHasFeature,
  PLAN_LIMITS,
  PLAN_TEMPLATE_COUNT,
  PLAN_TRANSLATION_LANGS,
  PLAN_ACTIVITY_LIMIT,
  PlanFeature,
} from "@/lib/plans";
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
    templateCount: PLAN_TEMPLATE_COUNT[plan],
    translationLangLimit: PLAN_TRANSLATION_LANGS[plan],
    activityLimit: PLAN_ACTIVITY_LIMIT[plan],
    isFree: plan === "free",
    isStarter: plan === "starter",
    isPro: plan === "pro",
    isAgency: plan === "agency",
    isPaid: plan === "starter" || plan === "pro" || plan === "agency",
  };
}
