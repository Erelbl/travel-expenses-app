"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, DollarSign, TrendingUp, Calendar, BarChart3, Zap, Coins, Users, Filter, MapPin, X, Lightbulb, Settings, ArrowUpDown } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { FloatingAddButton } from "@/components/floating-add-button"
import { QuickAddExpense } from "@/components/quick-add-expense"
import { ExchangeRatesModal } from "@/components/exchange-rates-modal"
import { OfflineBanner } from "@/components/OfflineBanner"
import { canAddExpense, canEditExpense, getCurrentUserMember } from "@/lib/utils/permissions"
import { ExpenseRow } from "@/components/expense-row"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCardSkeleton, ExpenseRowSkeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { Select } from "@/components/ui/select"
import { tripsRepository, expensesRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { Expense, ExpenseCategory } from "@/lib/schemas/expense.schema"
import { formatCurrency } from "@/lib/utils/currency"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { currencyForCountry } from "@/lib/utils/countryCurrency"
import { updateCurrentLocation, closeTrip } from "./actions"
import { toast } from "sonner"
import {
  calculateSummary,
  getTodayString,
  classifyExpenses,
} from "@/lib/utils/reports"
import { formatDateShort, getTripDayInfo } from "@/lib/utils/date"
import { generateInsights, selectInsightToDisplay } from "@/lib/server/insights"
import { generateAllBannerInsights } from "@/lib/server/banner-insights"
import { getCountryName as getCountryNameUtil } from "@/lib/utils/countries.data"
import { formatCurrencyLocalized } from "@/lib/utils/currency"

const MAX_RECENT_EXPENSES = 15

const CATEGORIES: ExpenseCategory[] = [
  "Food", "Transport", "Flights", "Lodging", "Activities", "Shopping", "Health", "Other",
]

export default function TripHomePage() {
  const { t, locale } = useI18n()
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const isRTL = locale === "he"

  const [trip, setTrip] = useState<Trip | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Quick Add
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  // Exchange Rates
  const [showRates, setShowRates] = useState(false)
  // Expense filter (for shared trips)
  const [showOnlyMine, setShowOnlyMine] = useState(false)
  // Single unified insight dismissal state
  const [dismissedInsights, setDismissedInsights] = useState<Map<string, number>>(new Map())
  // Close trip prompt dismissal
  const [closePromptDismissed, setClosePromptDismissed] = useState(false)
  
  // Filters and sorting
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "">("")
  const [filterCurrency, setFilterCurrency] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"newest" | "oldest">("newest")

  useEffect(() => {
    loadData()
    // Load dismissed insights from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`tw_insights_dismissed_${tripId}`)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setDismissedInsights(new Map(Object.entries(parsed)))
        } catch (e) {
          console.error('Failed to parse dismissed insights:', e)
        }
      }
      
      // Check if close prompt was dismissed
      const closePromptDismissedVal = localStorage.getItem(`tw_close_prompt_dismissed_${tripId}`)
      setClosePromptDismissed(closePromptDismissedVal === 'true')
    }
  }, [tripId])

  async function loadData() {
    try {
      setLoading(true)
      setError(false)
      const [tripData, expensesData] = await Promise.all([
        tripsRepository.getTrip(tripId),
        expensesRepository.listExpenses(tripId),
      ])

      if (!tripData) {
        router.push("/trips")
        return
      }

      setTrip(tripData)
      setExpenses(expensesData)
    } catch (error) {
      console.error("Failed to load data:", error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pb-20 md:pb-6 bg-gradient-to-b from-sky-100/60 via-blue-100/40 to-slate-50/60" dir={isRTL ? "rtl" : "ltr"}>
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-400/90 via-blue-500/90 to-indigo-500/90 border-b border-white/10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTAgMTJjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L2c+PC9zdmc+')] opacity-20" />
          <div className="container mx-auto max-w-4xl relative">
            <div className="flex items-center justify-between p-4">
              <div className="space-y-2">
                <div className="h-6 w-40 bg-white/20 rounded animate-pulse" />
                <div className="h-4 w-28 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto max-w-4xl px-4 py-6 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <ExpenseRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !trip) {
    return (
      <div className="min-h-screen pb-20 md:pb-6 bg-gradient-to-b from-sky-100/60 via-blue-100/40 to-slate-50/60" dir={isRTL ? "rtl" : "ltr"}>
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-400/90 via-blue-500/90 to-indigo-500/90 border-b border-white/10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTAgMTJjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L2c+PC9zdmc+')] opacity-20" />
          <div className="container mx-auto max-w-4xl relative">
            <div className="flex items-center justify-between p-4">
              <h1 className="text-xl font-bold text-white">{t("trips.title")}</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <ErrorState
            title={t('common.errorTitle')}
            message={t('common.errorMessage')}
            onRetry={loadData}
            retryLabel={t('common.retry')}
          />
        </div>
      </div>
    )
  }

  // Calculate summary using reports utilities (after checking trip exists)
  const summary = calculateSummary(expenses, trip)
  const { realized, future } = classifyExpenses(expenses)
  
  // Generate insights separately by type
  const allRegularInsights = generateInsights(trip, expenses)
  const allBannerInsights = generateAllBannerInsights(trip, expenses)
  
  // Select best regular insight (type-safe with Insight[])
  const selectedRegularInsight = selectInsightToDisplay(allRegularInsights, dismissedInsights)
  
  // Select best banner insight (similar logic, inline)
  const selectBannerInsight = () => {
    if (allBannerInsights.length === 0) return null
    
    const now = Date.now()
    const DISMISSAL_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
    
    // Filter out recently dismissed banner insights
    const eligibleBanners = allBannerInsights.filter(insight => {
      const dismissedAt = dismissedInsights.get(insight.dismissalId)
      if (!dismissedAt) return true
      return (now - dismissedAt) > DISMISSAL_DURATION
    })
    
    // Return highest priority eligible banner
    return eligibleBanners.length > 0 ? eligibleBanners[0] : null
  }
  const selectedBannerInsight = selectBannerInsight()
  
  // Decide which single insight to display (banner vs regular)
  // Choose the one with higher priority, or banner if tied
  let displayedBannerInsight = null
  let displayedRegularInsight = null
  
  if (selectedBannerInsight && selectedRegularInsight) {
    // Both available: pick higher priority
    if (selectedBannerInsight.priority >= selectedRegularInsight.priority) {
      displayedBannerInsight = selectedBannerInsight
    } else {
      displayedRegularInsight = selectedRegularInsight
    }
  } else if (selectedBannerInsight) {
    displayedBannerInsight = selectedBannerInsight
  } else if (selectedRegularInsight) {
    displayedRegularInsight = selectedRegularInsight
  }
  
  // Dismiss insight
  const dismissInsight = (dismissalId: string) => {
    if (typeof window !== 'undefined') {
      const newDismissed = new Map(dismissedInsights)
      newDismissed.set(dismissalId, Date.now())
      setDismissedInsights(newDismissed)
      
      // Persist to localStorage
      const obj = Object.fromEntries(newDismissed)
      localStorage.setItem(`tw_insights_dismissed_${tripId}`, JSON.stringify(obj))
    }
  }

  // Calculate today's spend
  const today = getTodayString()
  const todayExpenses = realized.filter((e) => e.date === today)
  const todaySpend = todayExpenses.reduce((sum, e) => sum + (e.convertedAmount || 0), 0)

  // Get current user for filtering
  const currentUser = getCurrentUserMember(trip)
  const isSharedTrip = trip.members.length > 1

  // Apply all filters
  let filteredExpenses = expenses

  // Filter by current user if enabled
  if (showOnlyMine && currentUser) {
    filteredExpenses = filteredExpenses.filter((e) => e.createdByMemberId === currentUser.id)
  }

  // Filter by category
  if (filterCategory) {
    filteredExpenses = filteredExpenses.filter((e) => e.category === filterCategory)
  }

  // Filter by currency
  if (filterCurrency) {
    filteredExpenses = filteredExpenses.filter((e) => e.currency === filterCurrency)
  }

  // Get unique currencies from all expenses for filter dropdown
  const availableCurrencies = Array.from(new Set(expenses.map((e) => e.currency))).sort()

  // Apply sorting and limit for recent list
  const recentExpenses = [...filteredExpenses]
    .sort((a, b) => {
      const dateCompare = sortDirection === "newest" 
        ? b.date.localeCompare(a.date) 
        : a.date.localeCompare(b.date)
      if (a.date !== b.date) return dateCompare
      return sortDirection === "newest" 
        ? b.createdAt - a.createdAt 
        : a.createdAt - b.createdAt
    })
    .slice(0, MAX_RECENT_EXPENSES)
  
  // Check if filters are active
  const hasActiveFilters = filterCategory !== "" || filterCurrency !== ""

  // Calculate trip day info for time context
  const tripDayInfo = getTripDayInfo(trip.startDate, trip.endDate)
  const todayDateString = new Date().toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
    month: "short",
    day: "numeric",
  })

  return (
    <div className="min-h-screen pb-20 md:pb-6 bg-gradient-to-b from-sky-100/60 via-blue-100/40 to-slate-50/60" dir={isRTL ? "rtl" : "ltr"}>
      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-sky-400/90 via-blue-500/90 to-indigo-500/90 border-b border-white/10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTAgMTJjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L2c+PC9zdmc+')] opacity-20" />
        <div className="container mx-auto max-w-4xl relative">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-xl font-bold text-white">{trip.name}</h1>
              <p className="text-sm text-sky-50/90">
                {trip.baseCurrency} • {summary.tripDays} {t("common.days")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Settings link */}
              <Link href={`/trips/${tripId}/settings`}>
                <Button variant="ghost" size="icon" className="text-white/90 hover:text-white hover:bg-white/10">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              {/* Reports link - secondary */}
              <Link href={`/trips/${tripId}/reports`}>
                <Button variant="ghost" size="icon" className="text-white/90 hover:text-white hover:bg-white/10">
                  <BarChart3 className="h-5 w-5" />
                </Button>
              </Link>
              {/* Desktop: Full add expense button */}
              <Link href={`/trips/${tripId}/add-expense`} className="hidden md:block">
                <Button size="default" className="bg-white text-sky-600 hover:bg-sky-50">
                  <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t("dashboard.addExpense")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Today Context Indicator */}
      <div className="container mx-auto max-w-4xl px-4 pt-3">
        <p className="text-xs text-slate-500">
          {t("home.todayContext")}: {todayDateString}
          {tripDayInfo && (
            <span className="text-slate-400 mx-1.5">•</span>
          )}
          {tripDayInfo && t("home.dayOfTrip", { current: tripDayInfo.currentDay, total: tripDayInfo.totalDays })}
        </p>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-5 space-y-6">
        {/* Close Trip Prompt */}
        {trip.endDate && !trip.isClosed && !closePromptDismissed && (() => {
          const endDate = new Date(trip.endDate)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          endDate.setHours(0, 0, 0, 0)
          return today > endDate
        })() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-sky-50 border border-sky-200 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-slate-700">
                  {t("home.tripEndedPrompt")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.setItem(`tw_close_prompt_dismissed_${tripId}`, 'true')
                    }
                    setClosePromptDismissed(true)
                  }}
                  className="text-slate-600 hover:text-slate-900"
                >
                  {t("home.notNowAction")}
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await closeTrip(tripId)
                      await loadData()
                      toast.success(t("home.tripClosedIndicator"))
                    } catch (error) {
                      toast.error(t("common.errorMessage"))
                    }
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white"
                >
                  {t("home.closeTripAction")}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Closed Trip Indicator */}
        {trip.isClosed && (
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center">
            <p className="text-sm text-slate-600 font-medium">
              {t("home.tripClosedIndicator")}
            </p>
          </div>
        )}

        {/* Current Location Selector */}
        {canAddExpense(trip) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide shrink-0">
                {t("home.currentLocation")}
              </span>
              <select
                value={trip.currentCountry || ""}
                onChange={async (e) => {
                  const country = e.target.value || null
                  const currency = country ? currencyForCountry(country) : null
                  try {
                    await updateCurrentLocation(tripId, country, currency)
                    await loadData()
                    toast.success(t("home.locationUpdated"))
                  } catch (error) {
                    toast.error(t("common.errorMessage"))
                  }
                }}
                className="flex-1 text-sm font-medium text-slate-900 bg-transparent border-none focus:outline-none"
              >
                <option value="">{t("home.selectLocation")}</option>
                {(trip.plannedCountries && trip.plannedCountries.length > 0
                  ? trip.plannedCountries
                  : trip.countries || []
                ).map((country) => (
                  <option key={country} value={country}>
                    {getCountryNameUtil(country, locale)}
                  </option>
                ))}
              </select>
              {trip.currentCurrency && (
                <span className="text-xs font-medium text-emerald-600 shrink-0">
                  {trip.currentCurrency}
                </span>
              )}
              {trip.currentCountry && (
                <button
                  onClick={async () => {
                    try {
                      await updateCurrentLocation(tripId, null, null)
                      await loadData()
                      toast.success(t("home.locationCleared"))
                    } catch (error) {
                      toast.error(t("common.errorMessage"))
                    }
                  }}
                  className="text-slate-400 hover:text-slate-600 shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Quick Add CTA - Primary Action (only for owners/editors) */}
        {canAddExpense(trip) && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setShowQuickAdd(true)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-2xl shadow-lg shadow-sky-500/25 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <div className={`text-${isRTL ? "right" : "left"}`}>
                <p className="font-semibold text-lg">{t("quickAdd.title")}</p>
                <p className="text-sm text-sky-100">{t("quickAdd.whatForPlaceholder")}</p>
              </div>
            </div>
            <Plus className="h-6 w-6" />
          </motion.button>
        )}

        {/* Batch Add Link */}
        {canAddExpense(trip) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href={`/trips/${tripId}/batch-add`} className="block group">
              <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl transition-all duration-300 shadow-[0_1px_3px_rgba(15,23,42,0.08)] group-hover:shadow-[0_8px_16px_rgba(15,23,42,0.08)] group-hover:-translate-y-0.5 group-hover:border-sky-200/80">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Plus className="h-4 w-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{t("batchAdd.title")}</p>
                  <p className="text-xs text-slate-500 truncate">{t("batchAdd.subtitle")}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Compact Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {/* Total Spent */}
          <Card className="border-slate-200/60 shadow-[0_1px_3px_rgba(15,23,42,0.08)] bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t("reports.totalSpent")}
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(summary.totalRealized, trip.baseCurrency)}
              </p>
            </CardContent>
          </Card>

          {/* Today's Spend */}
          <Card className="border-slate-200/60 shadow-[0_1px_3px_rgba(15,23,42,0.08)] bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t("home.today")}
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(todaySpend, trip.baseCurrency)}
              </p>
            </CardContent>
          </Card>

          {/* Average Per Day */}
          <Card className="border-slate-200/60 shadow-[0_1px_3px_rgba(15,23,42,0.08)] bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t("reports.perDay")}
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(summary.averagePerDay, trip.baseCurrency)}
              </p>
            </CardContent>
          </Card>

          {/* Future Commitments */}
          <Card className={`shadow-[0_1px_3px_rgba(15,23,42,0.08)] backdrop-blur-sm ${summary.totalFuture > 0 ? "border-amber-200/60 bg-amber-50/50" : "border-slate-200/60 bg-white/80"}`}>
            <CardContent className="p-4">
              <div className={`flex items-center gap-2 mb-1 ${summary.totalFuture > 0 ? "text-amber-600" : "text-slate-500"}`}>
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t("reports.future")}
                </span>
              </div>
              <p className={`text-xl font-bold ${summary.totalFuture > 0 ? "text-amber-700" : "text-slate-400"}`}>
                {summary.totalFuture > 0
                  ? formatCurrency(summary.totalFuture, trip.baseCurrency)
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Single Unified Insight Banner */}
        {(displayedBannerInsight || displayedRegularInsight) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-gradient-to-r from-amber-50/80 to-yellow-50/80 backdrop-blur-sm border border-amber-200/60 rounded-xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
          >
            <button
              onClick={() => dismissInsight((displayedBannerInsight || displayedRegularInsight)!.dismissalId)}
              className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-3 text-amber-600 hover:text-amber-800 transition-colors`}
              aria-label={t('common.close')}
            >
              <X className="h-4 w-4" />
            </button>
            <div className={`flex items-start gap-3 ${isRTL ? 'pl-8' : 'pr-8'}`}>
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                {displayedBannerInsight && (
                  <p className="text-sm text-amber-800 leading-relaxed">
                    {(() => {
                      // Build params safely - never assign undefined
                      const formattedParams: Record<string, string | number> = { 
                        ...(displayedBannerInsight.params ?? {}) 
                      }
                      
                      // Format currency amounts with locale if they exist
                      if (displayedBannerInsight.params?.actual != null && displayedBannerInsight.params?.currency) {
                        formattedParams.actual = formatCurrencyLocalized(
                          Number(displayedBannerInsight.params.actual), 
                          displayedBannerInsight.params.currency as string, 
                          locale
                        )
                      }
                      if (displayedBannerInsight.params?.target != null && displayedBannerInsight.params?.currency) {
                        formattedParams.target = formatCurrencyLocalized(
                          Number(displayedBannerInsight.params.target), 
                          displayedBannerInsight.params.currency as string, 
                          locale
                        )
                      }
                      
                      return t(displayedBannerInsight.textKey, formattedParams)
                    })()}
                  </p>
                )}
                {displayedRegularInsight && (
                  <>
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-amber-900">
                        {t(displayedRegularInsight.titleKey)}
                      </h3>
                      <span className="text-lg font-bold text-amber-800">
                        {displayedRegularInsight.type === 'daily_spend' || displayedRegularInsight.type === 'cost_per_adult'
                          ? `${formatCurrencyLocalized(Number(displayedRegularInsight.value), displayedRegularInsight.comparisonParams?.currency as string || trip.baseCurrency, locale)}${displayedRegularInsight.type === 'daily_spend' ? t('insights.perDay') : ''}`
                          : displayedRegularInsight.value}
                        {displayedRegularInsight.type === 'category_skew' && displayedRegularInsight.comparisonParams?.categoryRaw && 
                          ` ${t(`categories.${displayedRegularInsight.comparisonParams.categoryRaw}`)}`}
                        {displayedRegularInsight.type === 'expense_concentration' && ` ${t('insights.inTop20')}`}
                      </span>
                    </div>
                    <p className="text-sm text-amber-700">
                      {(() => {
                        const params = { ...displayedRegularInsight.comparisonParams }
                        // Translate tripType if present
                        if (params?.tripType) {
                          params.tripType = t(`insights.${params.tripType}`)
                        }
                        // Translate category if present
                        if (params?.categoryRaw) {
                          params.category = t(`categories.${params.categoryRaw}`).replace(/[🍔🚕✈️🏨🎟️🛍️💊💳]\s*/, "").toLowerCase()
                        }
                        // Translate country codes to names
                        if (params?.country1) {
                          params.country1 = getCountryNameUtil(params.country1 as string, locale)
                        }
                        if (params?.country2) {
                          params.country2 = getCountryNameUtil(params.country2 as string, locale)
                        }
                        return t(displayedRegularInsight.comparisonKey, params)
                      })()}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      {t('insights.updatedAsYouGo')}
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Secondary Links: Reports & Exchange Rates */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 gap-4"
        >
          {/* Reports Link */}
          <Link href={`/trips/${tripId}/reports`} className="block group">
            <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl transition-all duration-300 h-full shadow-[0_1px_3px_rgba(15,23,42,0.08)] group-hover:shadow-[0_8px_16px_rgba(15,23,42,0.08)] group-hover:-translate-y-0.5 group-hover:border-sky-200/80">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <BarChart3 className="h-4 w-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm">{t("nav.reports")}</p>
                <p className="text-xs text-slate-500 truncate">{t("home.viewReports")}</p>
              </div>
            </div>
          </Link>

          {/* Exchange Rates Link */}
          <button
            onClick={() => setShowRates(true)}
            className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl transition-all duration-300 text-start w-full shadow-[0_1px_3px_rgba(15,23,42,0.08)] hover:shadow-[0_8px_16px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-sky-200/80 group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Coins className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm">{t("rates.title")}</p>
              <p className="text-xs text-slate-500 truncate">{t("rates.subtitle")}</p>
            </div>
          </button>
        </motion.div>

        {/* Recent Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="border-slate-200/60 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.08)] bg-white/80 backdrop-blur-sm">
          <CardHeader className="py-4 px-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-lg font-semibold">
                {t("home.recentExpenses")}
              </CardTitle>
              <div className="flex items-center gap-2">
                {/* Filter toggle for shared trips */}
                {isSharedTrip && (
                  <button
                    onClick={() => setShowOnlyMine(!showOnlyMine)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      showOnlyMine
                        ? "bg-sky-100 text-sky-700"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Filter className="h-3 w-3" />
                    {showOnlyMine ? t("home.myExpenses") : t("home.allExpenses")}
                  </button>
                )}
                <span className="text-sm text-slate-500">
                  {filteredExpenses.length} {t("reports.expenses")}
                </span>
              </div>
            </div>
            
            {/* Filter and Sort Controls */}
            {expenses.length > 0 && (
              <div className="flex flex-col md:flex-row gap-2">
                {/* Category Filter */}
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | "")}
                  className="flex-1 text-sm"
                >
                  <option value="">{t("filters.allCategories")}</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {t(`categories.${cat}`)}
                    </option>
                  ))}
                </Select>

                {/* Currency Filter */}
                <Select
                  value={filterCurrency}
                  onChange={(e) => setFilterCurrency(e.target.value)}
                  className="flex-1 text-sm"
                >
                  <option value="">{t("filters.allCurrencies")}</option>
                  {availableCurrencies.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </Select>

                {/* Sort Direction */}
                <button
                  onClick={() => setSortDirection(sortDirection === "newest" ? "oldest" : "newest")}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors whitespace-nowrap"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="hidden md:inline">
                    {sortDirection === "newest" ? t("home.newestFirst") : t("home.oldestFirst")}
                  </span>
                  <span className="md:hidden">
                    {sortDirection === "newest" ? t("home.newest") : t("home.oldest")}
                  </span>
                </button>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setFilterCategory("")
                      setFilterCurrency("")
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-600 transition-colors whitespace-nowrap"
                  >
                    {t("filters.clear")}
                  </button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {expenses.length === 0 ? (
              <EmptyState
                title={t("home.noExpensesTitle")}
                message={t("home.noExpensesMessage")}
                icon={
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <DollarSign className="h-7 w-7 text-slate-400" />
                  </div>
                }
                action={
                  canAddExpense(trip) && (
                    <Button onClick={() => setShowQuickAdd(true)} size="lg">
                      <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {t("home.addYourFirst")}
                    </Button>
                  )
                }
              />
            ) : (
              <div>
                {recentExpenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    trip={trip}
                    onEdit={canEditExpense(trip, expense) ? () => router.push(`/trips/${tripId}/edit-expense/${expense.id}`) : undefined}
                  />
                ))}
                {filteredExpenses.length > MAX_RECENT_EXPENSES && (
                  <Link
                    href={`/trips/${tripId}/reports`}
                    className="block py-3 px-5 text-center text-sm font-medium text-sky-600 hover:text-sky-700 hover:bg-sky-50 border-t border-slate-100 transition-colors"
                  >
                    {t("home.viewAllExpenses")} ({filteredExpenses.length})
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </div>

      {/* Quick Add Modal */}
      {trip && (
        <QuickAddExpense
          open={showQuickAdd}
          onOpenChange={setShowQuickAdd}
          trip={trip}
          onExpenseAdded={loadData}
        />
      )}

      {/* Exchange Rates Modal */}
      {trip && (
        <ExchangeRatesModal
          open={showRates}
          onOpenChange={setShowRates}
          trip={trip}
        />
      )}

      {/* Floating Add Button - only for owners/editors */}
      {canAddExpense(trip) && (
        <FloatingAddButton onClick={() => setShowQuickAdd(true)} />
      )}

      <BottomNav tripId={tripId} />
    </div>
  )
}

