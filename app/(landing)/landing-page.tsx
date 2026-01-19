"use client"

import Link from "next/link"
import { Zap, Globe2, TrendingUp, Check, Plane, CreditCard, BarChart3, Users } from "lucide-react"
import { PhoneFrame } from "@/components/phone-frame"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50" dir="ltr">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
              Track your trip spending.
              <br />
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                Stay in control.
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              A simple way to understand your travel expenses — without clutter or splitting.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Start your first trip — it's free
            </Link>
          </div>

          {/* Phone Mockups */}
          <div className="relative max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <PhoneFrame>
                <div className="h-full bg-gradient-to-b from-sky-100/60 via-blue-100/40 to-slate-50/60 p-4 overflow-hidden">
                  <div className="bg-gradient-to-br from-sky-400/90 via-blue-500/90 to-indigo-500/90 rounded-2xl p-4 mb-3">
                    <h3 className="text-white text-sm font-bold mb-1">Welcome back</h3>
                    <p className="text-sky-50/80 text-xs">Your trips at a glance</p>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <div className="font-semibold text-xs mb-1">Tokyo Adventure</div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>¥45,230</span>
                        <span className="text-emerald-600">On budget</span>
                      </div>
                      <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-sky-500 rounded-full" />
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <div className="font-semibold text-xs mb-1">Europe Trip</div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>€1,420</span>
                        <span>12 expenses</span>
                      </div>
                    </div>
                  </div>
                </div>
              </PhoneFrame>
              
              <PhoneFrame className="md:scale-110">
                <div className="h-full bg-white p-4 flex flex-col">
                  <div className="mb-4">
                    <h3 className="font-bold text-sm mb-1">Add Expense</h3>
                    <p className="text-xs text-slate-500">Quick capture</p>
                  </div>
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-slate-900 mb-1">$127.50</div>
                    <div className="text-xs text-slate-500">USD</div>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-4">
                    <div className="px-3 py-1.5 bg-sky-100 text-sky-700 rounded-lg text-xs font-medium">
                      🍽️ Food
                    </div>
                    <div className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs">
                      🚕 Transport
                    </div>
                    <div className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs">
                      🏨 Hotel
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-xs text-slate-500 mb-1">Merchant</div>
                      <div className="text-sm">Restaurant ABC</div>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="bg-sky-600 text-white text-center py-3 rounded-xl font-semibold text-sm">
                      Save Expense
                    </div>
                  </div>
                </div>
              </PhoneFrame>
              
              <PhoneFrame>
                <div className="h-full bg-gradient-to-b from-emerald-50 to-white p-4">
                  <div className="mb-4">
                    <h3 className="font-bold text-sm mb-1">Insights</h3>
                    <p className="text-xs text-slate-500">Your spending breakdown</p>
                  </div>
                  <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                    <div className="text-xs text-slate-500 mb-1">Total Spend</div>
                    <div className="text-2xl font-bold text-slate-900">$2,845</div>
                    <div className="text-xs text-emerald-600 mt-1">↓ 15% vs last trip</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-sky-500" />
                        <span>Food & Dining</span>
                      </div>
                      <span className="font-semibold">$890</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                        <span>Accommodation</span>
                      </div>
                      <span className="font-semibold">$1,120</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Transport</span>
                      </div>
                      <span className="font-semibold">$560</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-emerald-50 rounded-xl">
                    <div className="text-xs font-semibold text-emerald-700 mb-1">💡 Smart Tip</div>
                    <div className="text-xs text-emerald-600">You're spending less on transport this trip!</div>
                  </div>
                </div>
              </PhoneFrame>
            </div>
          </div>
        </div>
      </section>

      {/* Why TravelWise */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-extrabold text-center text-slate-900 mb-16">
            Why TravelWise
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Users className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Travel together, effortlessly
              </h3>
              <p className="text-slate-600 text-sm">
                Traveling with your partner or someone else? Share the trip and let everyone add expenses — no coordination, no calculations later.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Globe2 className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Multi-currency, handled right.
              </h3>
              <p className="text-slate-600 text-sm">
                Real exchange rates, automatic conversions, no guesswork.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Simple while traveling.
              </h3>
              <p className="text-slate-600 text-sm">
                Add expenses in seconds, even offline. Review later.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-violet-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-violet-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Insights that actually help.
              </h3>
              <p className="text-slate-600 text-sm">
                Understand where your money goes with clear breakdowns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Screens Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl space-y-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 max-w-xs mx-auto">
              <PhoneFrame>
                <div className="h-full bg-gradient-to-b from-sky-50 to-slate-50 p-4 overflow-auto">
                  <div className="mb-4">
                    <h4 className="font-bold text-sm mb-2">Your Trips</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                      <div className="font-bold text-sm mb-2">Paris 2024</div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-slate-500">Total</span>
                        <span className="font-semibold">€2,340</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full w-4/5 bg-sky-500 rounded-full" />
                      </div>
                      <div className="text-xs text-slate-500 mt-2">24 expenses • €3,000 budget</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                      <div className="font-bold text-sm mb-2">Tokyo Adventure</div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-slate-500">Total</span>
                        <span className="font-semibold">¥145,200</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-2">18 expenses</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 opacity-60">
                      <div className="font-bold text-sm mb-2">Barcelona Summer</div>
                      <div className="text-xs text-slate-500">Closed • €890</div>
                    </div>
                  </div>
                </div>
              </PhoneFrame>
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4">
                Dashboard
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                See all your trips at a glance. Total spending, currency breakdowns, and quick access to details.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4">
                Add expense
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                Quick capture when you're out exploring. Amount, category, done.
              </p>
            </div>
            <div className="max-w-xs mx-auto">
              <PhoneFrame>
                <div className="h-full bg-white p-4 flex flex-col">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm">Add Expense</h4>
                      <span className="text-xs text-slate-500">Paris 2024</span>
                    </div>
                    <div className="bg-sky-50 rounded-2xl p-4 mb-4">
                      <div className="text-4xl font-bold text-slate-900 mb-1">€48.50</div>
                      <div className="text-xs text-slate-500">EUR</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-xs text-slate-500 mb-2">Category</div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      <div className="px-3 py-2 bg-sky-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap">
                        🍽️ Food
                      </div>
                      <div className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium whitespace-nowrap">
                        🚕 Transport
                      </div>
                      <div className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium whitespace-nowrap">
                        🏨 Hotel
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 flex-1">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Merchant</div>
                      <div className="bg-slate-50 rounded-xl px-3 py-2 text-sm">Le Café</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Note</div>
                      <div className="bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-400">Optional</div>
                    </div>
                  </div>

                  <button className="w-full bg-sky-600 text-white py-3.5 rounded-xl font-bold text-sm">
                    Save Expense
                  </button>
                </div>
              </PhoneFrame>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 max-w-xs mx-auto">
              <PhoneFrame>
                <div className="h-full bg-gradient-to-b from-violet-50 via-sky-50 to-white p-4">
                  <div className="mb-4">
                    <h4 className="font-bold text-sm mb-1">Trip Insights</h4>
                    <p className="text-xs text-slate-500">Paris 2024</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-4 text-white mb-4">
                    <div className="text-xs opacity-90 mb-1">Total Spent</div>
                    <div className="text-3xl font-bold mb-1">€2,340</div>
                    <div className="text-xs opacity-90">of €3,000 budget</div>
                    <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full w-4/5 bg-white rounded-full" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-3 mb-3 shadow-sm">
                    <div className="text-xs font-semibold text-slate-700 mb-3">By Category</div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-xs">Food & Dining</span>
                        </div>
                        <span className="text-xs font-bold">€980</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-violet-500" />
                          <span className="text-xs">Hotels</span>
                        </div>
                        <span className="text-xs font-bold">€850</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-sky-500" />
                          <span className="text-xs">Transport</span>
                        </div>
                        <span className="text-xs font-bold">€510</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <div>
                        <div className="text-xs font-bold text-emerald-700 mb-1">On track!</div>
                        <div className="text-xs text-emerald-600">You're 22% under budget.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </PhoneFrame>
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4">
                FX & insights
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                Automatic currency conversion and spending patterns. Know what you spent without doing math.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              Simple pricing
            </h2>
            <p className="text-lg text-slate-600">
              Choose the plan that fits your travel style
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$0</span>
                <span className="text-slate-600 ml-2">forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-slate-700">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>3 active trips</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Basic currency support</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Simple insights</span>
                </li>
              </ul>
              <Link
                href="/auth/login"
                className="block w-full bg-slate-900 text-white text-center px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
              >
                Get started
              </Link>
            </div>

            {/* Traveler - Most Popular */}
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-8 shadow-xl transform md:scale-105 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-semibold">
                Most popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Traveler</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$9</span>
                <span className="text-sky-100 ml-2">/ year</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-white">
                  <Check className="w-5 h-5 text-sky-200 flex-shrink-0 mt-0.5" />
                  <span>Unlimited trips</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <Check className="w-5 h-5 text-sky-200 flex-shrink-0 mt-0.5" />
                  <span>Share trips with partners</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <Check className="w-5 h-5 text-sky-200 flex-shrink-0 mt-0.5" />
                  <span>All currencies</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <Check className="w-5 h-5 text-sky-200 flex-shrink-0 mt-0.5" />
                  <span>Advanced insights</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <Check className="w-5 h-5 text-sky-200 flex-shrink-0 mt-0.5" />
                  <span>Export data</span>
                </li>
              </ul>
              <Link
                href="/auth/login"
                className="block w-full bg-white text-sky-600 text-center px-6 py-3 rounded-xl font-semibold hover:bg-sky-50 transition-colors"
              >
                Get started
              </Link>
            </div>

            {/* PRO */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">PRO</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$19</span>
                <span className="text-slate-600 ml-2">/ year</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-slate-700">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Everything in Traveler</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Advanced trip sharing</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Custom categories</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Team features</span>
                </li>
              </ul>
              <Link
                href="/auth/login"
                className="block w-full bg-slate-900 text-white text-center px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
            Start your first trip today
          </h2>
          <p className="text-xl text-slate-600 mb-10">
            It's free, and takes less than a minute.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-gradient-to-r from-sky-500 to-blue-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Get started for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900 text-slate-300">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-white">
              <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-2 rounded-lg">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">TravelWise</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
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

