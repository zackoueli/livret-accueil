import {
  BookletService,
  ServiceChoiceItem,
  ServiceChoiceOption,
  ServiceMultiplierOption,
  ServiceOption,
} from "@/types";

// Garde-fou technique uniquement (débordement numérique/Stripe), pas une limite produit —
// le max réel est celui configuré par l'hôte sur chaque option.
const HARD_MAX_QUANTITY = 9999;

export type ServiceSelections = Record<string, string | number>;

export interface ResolvedOptionSelection {
  optionId: string;
  option: ServiceOption;
  quantity?: number;
  choice?: ServiceChoiceItem;
  amount: number; // centimes
}

export interface PriceComputationResult {
  baseAmount: number;
  optionsAmount: number;
  totalAmount: number;
  resolved: ResolvedOptionSelection[];
  legacyQuantity: number;
}

export function clampMultiplierQuantity(opt: ServiceMultiplierOption, raw: unknown): number {
  const parsed = Math.round(Number(raw));
  const fallback = opt.defaultQuantity ?? opt.min;
  const value = Number.isFinite(parsed) ? parsed : fallback;
  const max = Math.min(opt.max, HARD_MAX_QUANTITY);
  return Math.min(Math.max(value, opt.min), max);
}

export function resolveChoice(opt: ServiceChoiceOption, choiceId: unknown): ServiceChoiceItem {
  const found = opt.choices.find((c) => c.id === choiceId);
  if (found) return found;
  const byDefault = opt.choices.find((c) => c.id === opt.defaultChoiceId);
  return byDefault ?? opt.choices[0];
}

export function computeServiceTotal(
  service: Pick<BookletService, "priceType" | "amount" | "options">,
  selections: ServiceSelections
): PriceComputationResult {
  const options = service.options ?? [];

  if (options.length === 0) {
    const legacyQuantity =
      service.priceType === "per_day"
        ? Math.min(Math.max(Math.round(Number(selections["_legacy_qty"])) || 1, 1), HARD_MAX_QUANTITY)
        : 1;
    const totalAmount = service.amount * legacyQuantity;
    return {
      baseAmount: totalAmount,
      optionsAmount: 0,
      totalAmount,
      resolved: [],
      legacyQuantity,
    };
  }

  let optionsAmount = 0;
  const resolved: ResolvedOptionSelection[] = options.map((opt) => {
    if (opt.type === "multiplier") {
      const quantity = clampMultiplierQuantity(opt, selections[opt.id]);
      const amount = opt.pricePerUnit * quantity;
      optionsAmount += amount;
      return { optionId: opt.id, option: opt, quantity, amount };
    }
    const choice = resolveChoice(opt, selections[opt.id]);
    optionsAmount += choice.priceDelta;
    return { optionId: opt.id, option: opt, choice, amount: choice.priceDelta };
  });

  const baseAmount = service.amount;
  return {
    baseAmount,
    optionsAmount,
    totalAmount: baseAmount + optionsAmount,
    resolved,
    legacyQuantity: 1,
  };
}
