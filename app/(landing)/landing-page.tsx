"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { Zap, Globe2, TrendingUp, Check, CreditCard, BarChart3, Users } from "lucide-react"
import { PhoneFrame } from "@/components/phone-frame"
import { plans } from "@/lib/plans"

export function LandingPage() {
  const carouselRef = useRef<HTMLDivElement>(null)
  const pricingCarouselRef = useRef<HTMLDivElement>(null)
  const outcomeRef = useRef<HTMLParagraphElement>(null)
  const [isOutcomeVisible, setIsOutcomeVisible] = useState(false)
  const [activePricingCard, setActivePricingCard] = useState(0)

  useEffect(() => {
    // Scroll to center phone on mount for mobile carousel
    if (carouselRef.current) {
      const container = carouselRef.current
      const centerPosition = (container.scrollWidth - container.clientWidth) / 2
      container.scrollLeft = centerPosition
    }
  }, [])

  useEffect(() => {
    // Intersection Observer for outcome animation
    const outcomeElement = outcomeRef.current
    if (!outcomeElement) return

    // Fallback: show immediately if IntersectionObserver not supported
    if (typeof IntersectionObserver === 'undefined') {
      setIsOutcomeVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isOutcomeVisible) {
            setIsOutcomeVisible(true)
          }
        })
      },
      {
        threshold: 0.3,
        rootMargin: '0px'
      }
    )

    observer.observe(outcomeElement)

    return () => {
      if (outcomeElement) {
        observer.unobserve(outcomeElement)
      }
    }
  }, [isOutcomeVisible])

  useEffect(() => {
    // Track active pricing card on scroll (mobile only)
    const pricingContainer = pricingCarouselRef.current
    if (!pricingContainer) return

    const handleScroll = () => {
      const scrollLeft = pricingContainer.scrollLeft
      const cardWidth = pricingContainer.scrollWidth / plans.length
      const activeIndex = Math.round(scrollLeft / cardWidth)
      setActivePricingCard(Math.min(Math.max(activeIndex, 0), plans.length - 1))
    }

    pricingContainer.addEventListener('scroll', handleScroll)
    return () => pricingContainer.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <style jsx>{`
        .pricing-carousel::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
              A simple way to understand your travel spending and stay in control.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Start your first trip - it's free
            </Link>
          </div>

          {/* Phone Mockups */}
          <div className="relative max-w-5xl mx-auto">
            <div 
              ref={carouselRef}
              className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory md:overflow-visible pb-4 md:pb-0 -mx-6 px-6 md:mx-0 scroll-px-6"
            >
              <div className="flex-shrink-0 w-[240px] md:w-auto snap-center">
              <PhoneFrame>
                <Image
                  src="/landing/screens/home.png"
                  alt="TravelWise home screen showing trips overview"
                  fill
                  className="object-cover"
                />
              </PhoneFrame>
              </div>
              
              <div className="flex-shrink-0 w-[240px] md:w-auto snap-center">
              <PhoneFrame className="md:scale-110">
                <Image
                  src="/landing/screens/reports-summary.png"
                  alt="TravelWise reports summary showing spending breakdown"
                  fill
                  className="object-cover"
                />
              </PhoneFrame>
              </div>
              
              <div className="flex-shrink-0 w-[240px] md:w-auto snap-center">
              <PhoneFrame>
                <Image
                  src="/landing/screens/reports-insights.png"
                  alt="TravelWise insights showing detailed analytics"
                  fill
                  className="object-cover"
                />
              </PhoneFrame>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why TravelWise */}
      <section className="py-20 px-6 pb-12 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-extrabold text-center text-slate-900 mb-16">
            Why TravelWise
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Travel together, effortlessly
              </h3>
              <p className="text-slate-600 text-sm">
                Traveling with your partner or someone else? Share the trip and let everyone add expenses. No coordination, no calculations later.
              </p>
            </div>
            <div className="text-center">
              <Globe2 className="w-8 h-8 text-slate-600 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Multi-currency, handled right.
              </h3>
              <p className="text-slate-600 text-sm">
                Real exchange rates, automatic conversions, no guesswork.
              </p>
            </div>
            <div className="text-center">
              <Zap className="w-8 h-8 text-slate-600 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Simple while traveling.
              </h3>
              <p className="text-slate-600 text-sm">
                Add expenses in seconds, even offline. Review later.
              </p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-slate-600 mx-auto mb-4 stroke-[1.5]" />
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
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          {/* Outcome Statement */}
          <div className="text-center">
            <p 
              ref={outcomeRef}
              className={`text-3xl md:text-4xl lg:text-5xl text-slate-900 font-extrabold leading-tight transition-all duration-500 ease-out ${
                isOutcomeVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-3'
              }`}
            >
              Most travelers{" "}
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                spend less
              </span>
              {" "}once they see where their money goes.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-slate-50 scroll-mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              Simple pricing
            </h2>
            <p className="text-lg text-slate-600">
              Choose the plan that fits your travel style
            </p>
          </div>
          
          {/* Mobile carousel wrapper */}
          <div className="md:max-w-5xl md:mx-auto overflow-visible">
            {/* Pricing cards */}
            <div 
              ref={pricingCarouselRef}
              className="pricing-carousel md:grid md:grid-cols-3 md:gap-8 flex overflow-x-auto overflow-y-visible snap-x snap-mandatory md:overflow-visible gap-4 pb-6 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {plans.map((plan) => {
                const isPopular = plan.popular
                const isPaidPlan = plan.priceYearly > 0

                return (
                  <div
                    key={plan.id}
                    className={`
                      rounded-2xl p-8 transition-all flex-shrink-0 w-[85vw] max-w-[400px] md:w-auto snap-center
                      ${
                        isPopular
                          ? "bg-gradient-to-br from-sky-500 to-blue-600 shadow-xl transform md:scale-105"
                          : "bg-white shadow-sm border border-slate-200 hover:shadow-lg"
                      }
                    `}
                  >
                  {isPopular && (
                    <div className="inline-block bg-yellow-400 text-slate-900 px-3 py-1 rounded-full text-xs font-semibold mb-4">
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
                    href={isPaidPlan ? `/checkout?plan=${plan.id}` : "/auth/login"}
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
          
          {/* Pagination dots (mobile only) */}
          <div className="flex justify-center gap-2 mt-6 md:hidden">
            {plans.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (pricingCarouselRef.current) {
                    const cardWidth = pricingCarouselRef.current.scrollWidth / plans.length
                    pricingCarouselRef.current.scrollTo({
                      left: cardWidth * index,
                      behavior: 'smooth'
                    })
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  activePricingCard === index 
                    ? 'bg-sky-500 w-6' 
                    : 'bg-slate-300'
                }`}
                aria-label={`Go to plan ${index + 1}`}
              />
            ))}
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
              <Image src="/brand/Logo2-png-final.png" alt="TravelWise" width={32} height={32} className="h-8 w-8 rounded-lg" />
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
    </>
  )
}

