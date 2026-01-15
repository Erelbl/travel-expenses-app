"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, DollarSign, TrendingUp, Calendar, BarChart3, Zap, Coins, Users, Filter, MapPin, X, Lightbulb } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { FloatingAddButton } from "@/components/floating-add-button"
import { QuickAddExpense } from "@/components/quick-add-expense"
import { ExchangeRatesModal } from "@/components/exchange-rates-modal"
import { canAddExpense, canEditExpense, getCurrentUserMember } from "@/lib/utils/permissions"
import { ExpenseRow } from "@/components/expense-row"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCardSkeleton, ExpenseRowSkeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { tripsRepository, expensesRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { Expense } from "@/lib/schemas/expense.schema"
import { formatCurrency } from "@/lib/utils/currency"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { currencyForCountry } from "@/lib/utils/countryCurrency"
import { getCountryName } from "@/lib/utils/countries.data"
import { updateCurrentLocation } from "./actions"
import { toast } from "sonner"
import {
  calculateSummary,
  getTodayString,
  classifyExpenses,
} from "@/lib/utils/reports"
import { generateInsights } from "@/lib/server/insights"

const MAX_RECENT_EXPENSES = 15

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
  // Insight banner dismissal
  const [insightDismissed, setInsightDismissed] = useState(false)

  useEffect(() => {
    loadData()
    // Check if insight was dismissed
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(`tw_insight_dismissed_${tripId}`)
      setInsightDismissed(dismissed === 'true')
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
      <div className="min-h-screen pb-20 md:pb-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="sticky top-0 z-10 border-b bg-white">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-between p-4">
              <div className="space-y-2">
                <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
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
      <div className="min-h-screen pb-20 md:pb-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="sticky top-0 z-10 border-b bg-white">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-between p-4">
              <h1 className="text-xl font-bold text-slate-900">{t("trips.title")}</h1>
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
  
  // Generate insights
  const insights = generateInsights(trip, expenses)
  
  // Dismiss insight banner
  const dismissInsight = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`tw_insight_dismissed_${tripId}`, 'true')
      setInsightDismissed(true)
    }
  }
  
  // Get top insight for banner
  const topInsight = insights.length > 0 ? insights[0] : null

  // Calculate today's spend
  const today = getTodayString()
  const todayExpenses = realized.filter((e) => e.date === today)
  const todaySpend = todayExpenses.reduce((sum, e) => sum + (e.convertedAmount || 0), 0)

  // Get current user for filtering
  const currentUser = getCurrentUserMember(trip)
  const isSharedTrip = trip.members.length > 1

  // Filter expenses by current user if enabled
  const filteredExpenses = showOnlyMine && currentUser
    ? expenses.filter((e) => e.createdByMemberId === currentUser.id)
    : expenses

  // Sort expenses by date (most recent first) for recent list
  const recentExpenses = [...filteredExpenses]
    .sort((a, b) => {
      // Sort by date descending, then by createdAt descending
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return b.createdAt - a.createdAt
    })
    .slice(0, MAX_RECENT_EXPENSES)

  return (
    <div className="min-h-screen pb-20 md:pb-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{trip.name}</h1>
              <p className="text-sm text-slate-500">
                {trip.baseCurrency} • {summary.tripDays} {t("common.days")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Reports link - secondary */}
              <Link href={`/trips/${tripId}/reports`}>
                <Button variant="ghost" size="icon" className="text-slate-600">
                  <BarChart3 className="h-5 w-5" />
                </Button>
              </Link>
              {/* Desktop: Full add expense button */}
              <Link href={`/trips/${tripId}/add-expense`} className="hidden md:block">
                <Button size="default">
                  <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t("dashboard.addExpense")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-5 space-y-6">
        {/* Current Location Selector */}
        {canAddExpense(trip) && (
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
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
                    {getCountryName(country, locale)}
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
          </div>
        )}

        {/* Quick Add CTA - Primary Action (only for owners/editors) */}
        {canAddExpense(trip) && (
          <button
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
          </button>
        )}

        {/* Batch Add Link */}
        {canAddExpense(trip) && (
          <Link href={`/trips/${tripId}/batch-add`} className="block">
            <div className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors">
              <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                <Plus className="h-4 w-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm">{t("batchAdd.title")}</p>
                <p className="text-xs text-slate-500 truncate">{t("batchAdd.subtitle")}</p>
              </div>
            </div>
          </Link>
        )}

        {/* Compact Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Spent */}
          <Card className="border-slate-200 shadow-sm">
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
          <Card className="border-slate-200 shadow-sm">
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
          <Card className="border-slate-200 shadow-sm">
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
          <Card className={`border-slate-200 shadow-sm ${summary.totalFuture > 0 ? "border-amber-200 bg-amber-50/50" : ""}`}>
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
        </div>

        {/* Trip Insights Banner */}
        {topInsight && !insightDismissed && (
          <div className="relative bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 shadow-sm">
            <button
              onClick={dismissInsight}
              className="absolute top-3 right-3 text-amber-600 hover:text-amber-800 transition-colors"
              aria-label={t('common.close')}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3 pr-8">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-amber-900">
                    {t(topInsight.titleKey)}
                  </h3>
                  <span className="text-lg font-bold text-amber-800">
                    {topInsight.value}
                    {topInsight.type === 'daily_spend' && t('insights.perDay')}
                    {topInsight.type === 'category_skew' && topInsight.comparisonParams?.categoryRaw && 
                      ` ${t(`categories.${topInsight.comparisonParams.categoryRaw}`)}`}
                    {topInsight.type === 'expense_concentration' && ` ${t('insights.inTop20')}`}
                  </span>
                </div>
                <p className="text-sm text-amber-700">
                  {(() => {
                    const params = { ...topInsight.comparisonParams }
                    // Translate tripType if present
                    if (params?.tripType) {
                      params.tripType = t(`insights.${params.tripType}`)
                    }
                    // Translate category if present
                    if (params?.categoryRaw) {
                      params.category = t(`categories.${params.categoryRaw}`).replace(/[🍔🚕✈️🏨🎟️🛍️💊💳]\s*/, "").toLowerCase()
                    }
                    return t(topInsight.comparisonKey, params)
                  })()}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  {t('insights.updatedAsYouGo')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Secondary Links: Reports & Exchange Rates */}
        <div className="grid grid-cols-2 gap-4">
          {/* Reports Link */}
          <Link href={`/trips/${tripId}/reports`} className="block">
            <div className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors h-full">
              <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
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
            className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-start w-full"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Coins className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm">{t("rates.title")}</p>
              <p className="text-xs text-slate-500 truncate">{t("rates.subtitle")}</p>
            </div>
          </button>
        </div>

        {/* Recent Expenses */}
        <Card className="border-slate-200 overflow-hidden">
          <CardHeader className="py-4 px-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
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

