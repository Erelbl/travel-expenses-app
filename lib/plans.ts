// ============================================================================
// SINGLE SOURCE OF TRUTH FOR PLAN IDS
// ============================================================================

/**
 * Valid plan IDs - the ONLY valid values in the system
 * Use these constants instead of hardcoded strings
 */
export const PLAN_IDS = ["free", "plus", "pro"] as const
export type PlanId = typeof PLAN_IDS[number]

/**
 * Plan display labels (i18n keys only - not hardcoded text)
 * Actual translations are in messages/en.json and messages/he.json
 */
export const PLAN_LABELS: Record<PlanId, { nameKey: string; descKey: string }> = {
  free: { nameKey: "plans.free.name", descKey: "plans.free.desc" },
  plus: { nameKey: "plans.plus.name", descKey: "plans.plus.desc" },
  pro: { nameKey: "plans.pro.name", descKey: "plans.pro.desc" },
}

export interface Plan {
  id: PlanId
  name: string
  priceYearly: number
  priceYearlyRegular?: number
  isPromo: boolean
  promoLabel?: string
  shortDescription: string
  features: string[]
  ctaLabel: string
  popular?: boolean
}

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceYearly: 0,
    isPromo: false,
    shortDescription: "Perfect for occasional travelers",
    features: [
      "3 active trips",
      "Basic currency support",
      "Simple insights",
      "Offline support",
    ],
    ctaLabel: "Get started",
  },
  {
    id: "plus",
    name: "Plus",
    priceYearly: 9,
    priceYearlyRegular: 19,
    isPromo: true,
    promoLabel: "Early deal",
    shortDescription: "For travelers who want more control",
    features: [
      "Unlimited trips",
      "Share trips with partners",
      "All currencies",
      "Export to Excel",
      "Scan up to 10 receipts per year",
      "Advanced insights",
    ],
    ctaLabel: "Get started",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    priceYearly: 29,
    isPromo: false,
    shortDescription: "For power users and teams",
    features: [
      "Everything in Plus",
      "Export to Excel",
      "Unlimited receipt scans",
      "Advanced trip sharing",
      "Priority support",
      "Team features",
    ],
    ctaLabel: "Get started",
  },
]

export function getPlanById(id: PlanId): Plan | undefined {
  return plans.find((plan) => plan.id === id)
}

