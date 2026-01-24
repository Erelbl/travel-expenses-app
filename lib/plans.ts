export type PlanId = "free" | "plus" | "pro"

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
      "Receipt scan",
      "Advanced insights",
      "Export data",
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
      "Receipt scan",
      "Advanced trip sharing",
      "Priority support",
      "Custom categories",
      "Team features",
    ],
    ctaLabel: "Get started",
  },
]

export function getPlanById(id: PlanId): Plan | undefined {
  return plans.find((plan) => plan.id === id)
}

