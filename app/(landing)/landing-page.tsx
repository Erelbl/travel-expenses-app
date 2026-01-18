"use client"

import Link from "next/link"
import { Zap, Globe2, Sparkles, TrendingUp, Check } from "lucide-react"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Track your trip spending.
              <br />
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                Stay in control.
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              A simple way to understand your travel expenses — without clutter or splitting.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/login"
                className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Start your first trip — it's free
              </Link>
              <Link
                href="/auth/login"
                className="w-full sm:w-auto text-slate-600 hover:text-slate-900 font-medium text-lg transition-colors"
              >
                Log in →
              </Link>
            </div>
          </div>

          {/* Phone Mockups */}
          <div className="relative max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl aspect-[9/16] shadow-2xl border border-slate-300 flex items-center justify-center">
                <div className="text-slate-400 text-center px-6">
                  <div className="w-16 h-16 bg-sky-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Globe2 className="w-8 h-8 text-sky-600" />
                  </div>
                  <p className="text-sm font-medium">Dashboard</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-sky-100 to-blue-200 rounded-3xl aspect-[9/16] shadow-2xl border border-sky-300 flex items-center justify-center transform md:scale-110">
                <div className="text-sky-600 text-center px-6">
                  <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-sky-600" />
                  </div>
                  <p className="text-sm font-semibold">Quick Add</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl aspect-[9/16] shadow-2xl border border-slate-300 flex items-center justify-center">
                <div className="text-slate-400 text-center px-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium">Insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why TravelWise */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            Why TravelWise
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-sky-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">
                No splitting. No debts.
              </h3>
              <p className="text-slate-600 text-sm">
                Track your own spending without the complexity of group payments.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Globe2 className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">
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
              <h3 className="font-semibold text-lg text-slate-900 mb-2">
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
              <h3 className="font-semibold text-lg text-slate-900 mb-2">
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
            <div className="order-2 md:order-1">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl aspect-[9/16] shadow-2xl border border-slate-300 flex items-center justify-center max-w-sm mx-auto">
                <div className="text-slate-400 text-center px-8">
                  <div className="w-20 h-20 bg-sky-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                    <Globe2 className="w-10 h-10 text-sky-600" />
                  </div>
                  <p className="font-medium">Trip Dashboard</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                Dashboard
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                See all your trips at a glance. Total spending, currency breakdowns, and quick access to details.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                Add expense
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                Quick capture when you're out exploring. Amount, category, done.
              </p>
            </div>
            <div>
              <div className="bg-gradient-to-br from-sky-100 to-blue-200 rounded-3xl aspect-[9/16] shadow-2xl border border-sky-300 flex items-center justify-center max-w-sm mx-auto">
                <div className="text-sky-700 text-center px-8">
                  <div className="w-20 h-20 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center">
                    <Zap className="w-10 h-10 text-sky-600" />
                  </div>
                  <p className="font-semibold">Quick Entry</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl aspect-[9/16] shadow-2xl border border-emerald-200 flex items-center justify-center max-w-sm mx-auto">
                <div className="text-emerald-700 text-center px-8">
                  <div className="w-20 h-20 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center">
                    <TrendingUp className="w-10 h-10 text-emerald-600" />
                  </div>
                  <p className="font-semibold">Smart Insights</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
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
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
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
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
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
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Accessibility</a>
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

