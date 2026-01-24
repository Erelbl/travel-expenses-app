"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check } from "lucide-react"
import { LandingNav } from "@/components/landing-nav"
import { getPlanById, type PlanId } from "@/lib/plans"

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const planParam = searchParams.get("plan") || "plus"
  
  // Validate and get plan
  const validPlans: PlanId[] = ["free", "plus", "pro"]
  const selectedPlanId = validPlans.includes(planParam as PlanId) 
    ? (planParam as PlanId) 
    : "plus"
  
  const plan = getPlanById(selectedPlanId)

  if (!plan) {
    return null
  }

  const isPaidPlan = plan.priceYearly > 0

  // Define what's included for each plan
  const includedFeatures = {
    plus: [
      "Receipt scanning (10 total per subscription)",
      "Advanced insights",
      "Trip sharing",
    ],
    pro: [
      "Everything in Plus",
      "Unlimited receipt scanning",
      "Priority features (future)",
    ],
    free: [
      "3 active trips",
      "Basic currency support",
      "Simple insights",
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50" dir="ltr">
      <LandingNav variant="marketing" />
      
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
              Upgrade your plan
            </h1>
            <p className="text-lg text-slate-600">
              You selected the <span className="font-semibold">{plan.name}</span> plan
            </p>
          </div>

          {/* Selected Plan Card */}
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-8 shadow-xl mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-semibold">
                Selected Plan
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white text-center mb-4">
              {plan.name}
            </h2>

            <div className="text-center mb-6">
              {plan.isPromo && plan.priceYearlyRegular ? (
                <div>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-white">
                      ${plan.priceYearly}
                    </span>
                    <span className="text-2xl line-through text-sky-100">
                      ${plan.priceYearlyRegular}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="text-sky-100">/ year</span>
                    <span className="px-2 py-0.5 bg-yellow-400 text-slate-900 text-xs font-semibold rounded-full">
                      Early offer (regular price ${plan.priceYearlyRegular})
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-5xl font-bold text-white">
                    ${plan.priceYearly}
                  </span>
                  <div className="text-sky-100 mt-2">
                    {isPaidPlan ? "/ year" : "forever"}
                  </div>
                </div>
              )}
            </div>

            {/* What's included */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 text-center">
                What's included:
              </h3>
              <ul className="space-y-3">
                {includedFeatures[selectedPlanId]?.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-white">
                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-sky-200" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
            <button
              disabled
              className="w-full bg-slate-300 text-slate-500 px-8 py-4 rounded-xl font-semibold text-lg mb-3 cursor-not-allowed"
            >
              Payments coming soon
            </button>
            <p className="text-slate-600 text-sm mb-6">
              We're finalizing payments. You'll be able to upgrade very soon.
            </p>
            <Link
              href="/pricing"
              className="text-sky-600 hover:text-sky-700 font-medium text-sm underline"
            >
              ← Back to pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900 text-slate-300">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-white">
              <span className="font-bold text-lg">TravelWise</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-slate-500">
            © {new Date().getFullYear()} TravelWise. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

