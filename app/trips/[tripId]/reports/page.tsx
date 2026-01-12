"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Filter, TrendingUp, Calendar, DollarSign, Globe, Tag, Lightbulb, BarChart3, Plus } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalClose } from "@/components/ui/modal"
import { StatCardSkeleton, ReportCardSkeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { tripsRepository, expensesRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { Expense, ExpenseCategory } from "@/lib/schemas/expense.schema"
import { formatCurrency } from "@/lib/utils/currency"
import { getCountryName } from "@/lib/utils/countries.data"
import { getCategoryColors } from "@/lib/utils/categoryColors"
import { useI18n } from "@/lib/i18n/I18nProvider"
import {
  ReportFilters,
  filterExpenses,
  calculateSummary,
  calculateCategoryBreakdown,
  calculateCountryBreakdown,
  calculateCurrencyBreakdown,
  generateInsights,
} from "@/lib/utils/reports"

const CATEGORIES: ExpenseCategory[] = [
  "Food", "Transport", "Flights", "Lodging", "Activities", "Shopping", "Health", "Other",
]

// Hex colors for chart segments (matching category colors)
const CATEGORY_CHART_COLORS: Record<ExpenseCategory, string> = {
  Food: "#f59e0b",       // amber-500
  Transport: "#3b82f6",  // blue-500
  Flights: "#0ea5e9",    // sky-500
  Lodging: "#8b5cf6",    // violet-500
  Activities: "#10b981", // emerald-500
  Shopping: "#ec4899",   // pink-500
  Health: "#f43f5e",     // rose-500
  Other: "#64748b",      // slate-500
}

// Simple Donut Chart Component
function DonutChart({
  data,
  size = 160,
  strokeWidth = 28,
}: {
  data: { category: string; percentage: number }[]
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  // Calculate stroke offsets for each segment
  let currentOffset = 0
  const segments = data.map((item) => {
    const strokeDasharray = (item.percentage / 100) * circumference
    const segment = {
      ...item,
      strokeDasharray,
      strokeDashoffset: -currentOffset,
      color: CATEGORY_CHART_COLORS[item.category as ExpenseCategory] || CATEGORY_CHART_COLORS.Other,
    }
    currentOffset += strokeDasharray
    return segment
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={strokeWidth}
      />
      {/* Data segments */}
      {segments.map((segment, index) => (
        <circle
          key={index}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={segment.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${segment.strokeDasharray} ${circumference}`}
          strokeDashoffset={segment.strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease",
          }}
        />
      ))}
    </svg>
  )
}

export default function ReportsPage() {
  const { t, locale } = useI18n()
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const isRTL = locale === "he"

  const [trip, setTrip] = useState<Trip | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: "all",
    includeRealized: true,
    includeFuture: true,
    showOnlyUnconverted: false,
    country: "",
    category: "",
  })

  useEffect(() => {
    loadData()
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
        <div className="sticky top-0 z-10 border-b bg-white p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" disabled>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-2">
              <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <ReportCardSkeleton key={i} />
            ))}
          </div>
        </div>
        <BottomNav tripId={tripId} />
      </div>
    )
  }

  // Error state
  if (error || !trip) {
    return (
      <div className="min-h-screen pb-20 md:pb-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="sticky top-0 z-10 border-b bg-white p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t("reports.title")}</h1>
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
        <BottomNav tripId={tripId} />
      </div>
    )
  }

  // Apply filters
  const filteredExpenses = filterExpenses(expenses, filters)
  
  // Calculate metrics
  const summary = calculateSummary(filteredExpenses, trip)
  const categoryBreakdown = calculateCategoryBreakdown(filteredExpenses)
  const countryBreakdown = calculateCountryBreakdown(filteredExpenses)
  const currencyBreakdown = calculateCurrencyBreakdown(filteredExpenses)
  const insights = generateInsights(
    filteredExpenses,
    summary,
    categoryBreakdown,
    trip,
    t,
    formatCurrency
  )

  // Get trip countries for filter
  const tripCountries = trip.plannedCountries || trip.countries || []

  const hasActiveFilters =
    filters.dateRange !== "all" ||
    !filters.includeRealized ||
    !filters.includeFuture ||
    filters.showOnlyUnconverted ||
    filters.country !== "" ||
    filters.category !== ""

  function clearFilters() {
    setFilters({
      dateRange: "all",
      includeRealized: true,
      includeFuture: true,
      showOnlyUnconverted: false,
      country: "",
      category: "",
    })
  }

  return (
    <div className="min-h-screen pb-20 md:pb-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/trips/${tripId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{t("reports.title")}</h1>
                <p className="text-sm text-slate-500">{trip.name}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowFilters(true)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">{t("reports.filters")}</span>
              {hasActiveFilters && (
                <Badge variant="default" className="h-5 w-5 rounded-full p-0 text-xs">
                  !
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-8">
        {/* Empty state */}
        {expenses.length === 0 ? (
          <EmptyState
            title={t("reports.noExpensesTitle")}
            message={t("reports.noExpensesMessage")}
            icon={
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <BarChart3 className="h-7 w-7 text-slate-400" />
              </div>
            }
            action={
              <Link href={`/trips/${tripId}/add-expense`}>
                <Button size="lg">
                  <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t("reports.addExpensesToSeeReports")}
                </Button>
              </Link>
            }
          />
        ) : (
          <>
        {/* Summary Cards - 3 cards, aligned grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Realized */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <DollarSign className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">{t("reports.totalSpent")}</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(summary.totalRealized, trip.baseCurrency)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {summary.expenseCount} {t("reports.expenses")}
              </p>
            </CardContent>
          </Card>

          {/* Average Per Day */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">{t("reports.perDay")}</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(summary.averagePerDay, trip.baseCurrency)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {summary.tripDays} {t("reports.days")}
              </p>
            </CardContent>
          </Card>

          {/* Future Commitments */}
          <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">{t("reports.future")}</span>
              </div>
              <p className="text-3xl font-bold text-amber-700">
                {formatCurrency(summary.totalFuture, trip.baseCurrency)}
              </p>
              <p className="text-sm text-amber-600/80 mt-1">
                {t("reports.futureLabel")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Unconverted Warning */}
        {summary.unconvertedExpenses.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">
                {t("reports.unconvertedWarning")}
              </p>
              <div className="flex flex-wrap gap-2">
                {summary.unconvertedExpenses.map((item) => (
                  <Badge key={item.currency} variant="outline" className="bg-white text-sm">
                    {formatCurrency(item.amount, item.currency)} ({item.count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Smart Insights */}
        {insights.length > 0 && (
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                {t("reports.insights.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-4 rounded-xl bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-base text-slate-900">{insight.title}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{insight.description}</p>
                  </div>
                  {insight.value && (
                    <Badge variant="secondary" className="shrink-0 text-sm font-semibold">
                      {insight.value}
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown with Donut Chart */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="h-5 w-5 text-sky-500" />
              {t("reports.byCategory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="text-base text-slate-500 text-center py-6">
                {t("reports.noData")}
              </p>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* Donut Chart */}
                <div className="relative shrink-0">
                  <DonutChart
                    data={categoryBreakdown.map((item) => ({
                      category: item.category,
                      percentage: item.percentage,
                    }))}
                    size={180}
                    strokeWidth={32}
                  />
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900">
                      {categoryBreakdown.length}
                    </span>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">
                      {t("reports.categoriesLabel")}
                    </span>
                  </div>
                </div>

                {/* Category List */}
                <div className="flex-1 w-full space-y-3">
                  {categoryBreakdown.map((item) => {
                    const colors = getCategoryColors(item.category)
                    return (
                      <div key={item.category} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  CATEGORY_CHART_COLORS[item.category as ExpenseCategory] ||
                                  CATEGORY_CHART_COLORS.Other,
                              }}
                            />
                            <span className={`font-semibold text-base ${colors.text}`}>
                              {t(`categories.${item.category}`)}
                            </span>
                          </div>
                          <span className="text-base text-slate-900 font-bold">
                            {formatCurrency(item.amount, trip.baseCurrency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${item.percentage}%`,
                                backgroundColor:
                                  CATEGORY_CHART_COLORS[item.category as ExpenseCategory] ||
                                  CATEGORY_CHART_COLORS.Other,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-500 w-12 text-end">
                            {item.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Country */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-emerald-500" />
              {t("reports.byCountry")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {countryBreakdown.length === 0 ? (
              <p className="text-base text-slate-500 text-center py-6">
                {t("reports.noData")}
              </p>
            ) : (
              countryBreakdown.map((item) => (
                <div key={item.country} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-base text-slate-700">
                      {getCountryName(item.country, locale)}
                    </span>
                    <span className="text-base text-slate-900 font-bold">
                      {formatCurrency(item.amount, trip.baseCurrency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-500 w-12 text-end">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* By Currency */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-violet-500" />
              {t("reports.byCurrency")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currencyBreakdown.length === 0 ? (
              <p className="text-base text-slate-500 text-center py-6">
                {t("reports.noData")}
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currencyBreakdown.map((item) => (
                  <div
                    key={item.currency}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <p className="text-xl font-bold text-slate-900">
                      {formatCurrency(item.amount, item.currency)}
                    </p>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      {item.count} {t("reports.expenses")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Filters Modal (Centered Popup) */}
      <Modal open={showFilters} onOpenChange={setShowFilters} size="lg">
        <ModalHeader>
          <ModalTitle className="text-lg">{t("reports.filtersTitle")}</ModalTitle>
          <ModalClose onClick={() => setShowFilters(false)} />
        </ModalHeader>
        <ModalContent className="space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("reports.dateRange")}</Label>
            <Select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters({ ...filters, dateRange: e.target.value as ReportFilters["dateRange"] })
              }
              className="text-base"
            >
              <option value="all">{t("reports.allTime")}</option>
              <option value="week">{t("reports.thisWeek")}</option>
              <option value="custom">{t("reports.custom")}</option>
            </Select>
          </div>

          {filters.dateRange === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t("reports.startDate")}</Label>
                <Input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t("reports.endDate")}</Label>
                <Input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="text-base"
                />
              </div>
            </div>
          )}

          {/* Include Toggles */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">{t("reports.include")}</Label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includeRealized}
                onChange={(e) => setFilters({ ...filters, includeRealized: e.target.checked })}
                className="h-5 w-5 rounded border-slate-300"
              />
              <span className="text-base">{t("reports.includeRealized")}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includeFuture}
                onChange={(e) => setFilters({ ...filters, includeFuture: e.target.checked })}
                className="h-5 w-5 rounded border-slate-300"
              />
              <span className="text-base">{t("reports.includeFuture")}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showOnlyUnconverted}
                onChange={(e) => setFilters({ ...filters, showOnlyUnconverted: e.target.checked })}
                className="h-5 w-5 rounded border-slate-300"
              />
              <span className="text-base">{t("reports.showUnconverted")}</span>
            </label>
          </div>

          {/* Country Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("reports.country")}</Label>
            <Select
              value={filters.country || ""}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              className="text-base"
            >
              <option value="">{t("reports.allCountries")}</option>
              {tripCountries.map((code) => (
                <option key={code} value={code}>
                  {getCountryName(code, locale)}
                </option>
              ))}
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("reports.category")}</Label>
            <Select
              value={filters.category || ""}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value as ExpenseCategory | "" })
              }
              className="text-base"
            >
              <option value="">{t("reports.allCategories")}</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`categories.${cat}`)}
                </option>
              ))}
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={clearFilters} className="flex-1 text-base py-2.5">
              {t("reports.clearFilters")}
            </Button>
            <Button onClick={() => setShowFilters(false)} className="flex-1 text-base py-2.5">
              {t("reports.apply")}
            </Button>
          </div>
        </ModalContent>
      </Modal>

      </>
        )}
      </div>

      <BottomNav tripId={tripId} />
    </div>
  )
}
