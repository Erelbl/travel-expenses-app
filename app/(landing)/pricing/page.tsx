"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { LandingNav } from "@/components/landing-nav"
import { plans } from "@/lib/plans"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50" dir="ltr">
      <LandingNav variant="marketing" />
      
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
              Pricing
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Track your travel spending with clarity. Choose the plan that fits your style — and save money by staying in control.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const isPopular = plan.popular
              const isPaidPlan = plan.priceYearly > 0

              return (
                <div
                  key={plan.id}
                  className={`
                    rounded-2xl p-8 transition-all
                    ${
                      isPopular
                        ? "bg-gradient-to-br from-sky-500 to-blue-600 shadow-xl transform md:scale-105 relative"
                        : "bg-white shadow-sm border border-slate-200 hover:shadow-lg"
                    }
                  `}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-semibold">
                      Most popular
                    </div>
                  )}

                  <h3
                    className={`text-2xl font-bold mb-2 ${
                      isPopular ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {plan.name}
                  </h3>

                  <div className="mb-2">
                    {plan.isPromo && plan.priceYearlyRegular ? (
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-4xl font-bold ${
                            isPopular ? "text-white" : "text-slate-900"
                          }`}
                        >
                          ${plan.priceYearly}
                        </span>
                        <span
                          className={`text-xl line-through ${
                            isPopular ? "text-sky-100" : "text-slate-400"
                          }`}
                        >
                          ${plan.priceYearlyRegular}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`text-4xl font-bold ${
                          isPopular ? "text-white" : "text-slate-900"
                        }`}
                      >
                        ${plan.priceYearly}
                      </span>
                    )}
                  </div>

                  <div className="mb-6">
                    {plan.isPromo && plan.promoLabel ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm ${
                            isPopular ? "text-sky-100" : "text-slate-600"
                          }`}
                        >
                          / year
                        </span>
                        <span className="px-2 py-0.5 bg-yellow-400 text-slate-900 text-xs font-semibold rounded-full">
                          {plan.promoLabel}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`${
                          isPopular ? "text-sky-100" : "text-slate-600"
                        }`}
                      >
                        {isPaidPlan ? "/ year" : "forever"}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className={`flex items-start gap-2 ${
                          isPopular ? "text-white" : "text-slate-700"
                        }`}
                      >
                        <Check
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            isPopular ? "text-sky-200" : "text-emerald-500"
                          }`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/auth/login"
                    className={`
                      block w-full text-center px-6 py-3 rounded-xl font-semibold transition-colors
                      ${
                        isPopular
                          ? "bg-white text-sky-600 hover:bg-sky-50"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }
                    `}
                  >
                    {plan.ctaLabel}
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Simple Comparison */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">
              Compare plans
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-4 gap-4 p-6 border-b border-slate-200 bg-slate-50">
                <div className="font-semibold text-slate-900">Feature</div>
                <div className="font-semibold text-slate-900 text-center">Free</div>
                <div className="font-semibold text-slate-900 text-center">Plus</div>
                <div className="font-semibold text-slate-900 text-center">Pro</div>
              </div>
              
              <div className="divide-y divide-slate-200">
                <div className="grid grid-cols-4 gap-4 p-6">
                  <div className="text-slate-700">Active trips</div>
                  <div className="text-center text-slate-600">3</div>
                  <div className="text-center text-emerald-600 font-semibold">Unlimited</div>
                  <div className="text-center text-emerald-600 font-semibold">Unlimited</div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 p-6">
                  <div className="text-slate-700">Trip sharing</div>
                  <div className="text-center text-slate-400">—</div>
                  <div className="text-center text-emerald-600">✓</div>
                  <div className="text-center text-emerald-600">✓</div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 p-6">
                  <div className="text-slate-700">Receipt scan</div>
                  <div className="text-center text-slate-400">—</div>
                  <div className="text-center text-slate-600 text-sm">10/year</div>
                  <div className="text-center text-emerald-600 font-semibold">Unlimited</div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 p-6">
                  <div className="text-slate-700">Advanced insights</div>
                  <div className="text-center text-slate-400">—</div>
                  <div className="text-center text-emerald-600">✓</div>
                  <div className="text-center text-emerald-600">✓</div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 p-6">
                  <div className="text-slate-700">Priority support</div>
                  <div className="text-center text-slate-400">—</div>
                  <div className="text-center text-slate-400">—</div>
                  <div className="text-center text-emerald-600">✓</div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ or note section */}
          <div className="mt-16 text-center max-w-2xl mx-auto">
            <p className="text-slate-600">
              All plans include offline support, multi-currency tracking, and secure data storage.
              Payment processing coming soon.
            </p>
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

