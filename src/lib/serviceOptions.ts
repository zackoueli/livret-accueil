import { BookletService, ServiceChoiceItem } from "@/types";

// Garde-fou technique uniquement (débordement numérique/Stripe), pas une limite produit —
// le max réel est celui configuré par l'hôte (unitMax).
const HARD_MAX_QUANTITY = 9999;

export interface ServiceSelection {
  quantity?: number; // per_day / per_unit
  choiceId?: string; // choice
}

export interface PriceComputationResult {
  totalAmount: number;
  quantity: number; // 1 pour one_time/choice
  choice?: ServiceChoiceItem;
}

export function clampQuantity(min: number, max: number, raw: unknown, fallback: number): number {
  const parsed = Math.round(Number(raw));
  const value = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(Math.max(value, min), Math.min(max, HARD_MAX_QUANTITY));
}

export function resolveChoice(service: Pick<BookletService, "choices">, choiceId: unknown): ServiceChoiceItem | undefined {
  const choices = service.choices ?? [];
  return choices.find((c) => c.id === choiceId) ?? choices[0];
}

export function computeServiceTotal(
  service: Pick<BookletService, "priceType" | "amount" | "unitLabel" | "unitMin" | "unitMax" | "choices">,
  selection: ServiceSelection
): PriceComputationResult {
  if (service.priceType === "per_day" || service.priceType === "per_unit") {
    const min = service.priceType === "per_unit" ? (service.unitMin ?? 1) : 1;
    const max = service.priceType === "per_unit" ? (service.unitMax ?? HARD_MAX_QUANTITY) : HARD_MAX_QUANTITY;
    const quantity = clampQuantity(min, max, selection.quantity, min);
    return { totalAmount: service.amount * quantity, quantity };
  }

  if (service.priceType === "choice") {
    const choice = resolveChoice(service, selection.choiceId);
    return { totalAmount: choice?.amount ?? 0, quantity: 1, choice };
  }

  return { totalAmount: service.amount, quantity: 1 };
}
