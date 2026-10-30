"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  planHasFeature,
  PLAN_LIMITS,
  PLAN_TEMPLATE_COUNT,
  PLAN_TRANSLATION_LANGS,
  PLAN_ACTIVITY_LIMIT,
  PLAN_COMMISSION,
  PLAN_PHOTO_LIMIT,
  PlanFeature,
} from "@/lib/plans";
import { Plan } from "@/types";

export function usePlan() {
  const { profile } = useAuthStore();
  const [now] = useState(() => Date.now());
  // "actif" est l'ancien nom du plan pro — on le mappe vers "pro"
  const rawPlan = profile?.plan as string;
  // Essai admin expiré : free immédiatement, sans attendre le cron qui met à jour Firestore
  const proTrialExpired =
    !!profile?.proTrial && !!profile.subscriptionEndDate && profile.subscriptionEndDate * 1000 < now;
  const plan: Plan = proTrialExpired
    ? "free"
    : (rawPlan === "actif" ? "pro" : (rawPlan as Plan)) || "free";

  return {
    plan,
    can: (feature: PlanFeature) => planHasFeature(plan, feature),
    bookletLimit: PLAN_LIMITS[plan].booklets,
    templateCount: PLAN_TEMPLATE_COUNT[plan],
    translationLangLimit: PLAN_TRANSLATION_LANGS[plan],
    activityLimit: PLAN_ACTIVITY_LIMIT[plan],
    commissionRate: PLAN_COMMISSION[plan],
    photoLimit: PLAN_PHOTO_LIMIT[plan],
    isFree: plan === "free",
    isStarter: plan === "starter",
    isPro: plan === "pro",
    isAgency: plan === "agency",
    isPaid: plan === "starter" || plan === "pro" || plan === "agency",
  };
}
