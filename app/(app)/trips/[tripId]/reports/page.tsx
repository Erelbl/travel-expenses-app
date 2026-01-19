"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Filter, TrendingUp, Calendar, DollarSign, Tag, BarChart3, Plus, Target } from "lucide-react"
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
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart"
import { tripsRepository, expensesRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { Expense, ExpenseCategory } from "@/lib/schemas/expense.schema"
import { formatCurrency } from "@/lib/utils/currency"
import { getCategoryColors } from "@/lib/utils/categoryColors"
import { useI18n } from "@/lib/i18n/I18nProvider"
import {
  ReportFilters,
  filterExpenses,
  calculateSummary,
  calculateCategoryBreakdown,
  calculateDailySpend,
  getTopCategories,
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
  const topCategories = getTopCategories(categoryBreakdown, 5)
  const dailySpend = calculateDailySpend(filteredExpenses)
  
  // Get top category
  const topCategory = categoryBreakdown[0]
  
  // Get trip countries for filter
  const tripCountries = trip.plannedCountries || trip.countries || []
  
  // Calculate budget status
  const hasBudget = trip.targetBudget && trip.targetBudget > 0
  const budgetUsed = hasBudget ? (summary.totalRealized / trip.targetBudget!) * 100 : 0
  const budgetRemaining = hasBudget ? trip.targetBudget! - summary.totalRealized : 0

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

      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-10">
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
        {/* EXECUTIVE SUMMARY - Top Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{t("reports.travelSummary")}</h2>
            <p className="text-slate-600">{t("reports.travelSummaryDesc")}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Spent */}
            <Card className="border-slate-200 shadow-sm h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-2 text-slate-500 mb-3">
                  <DollarSign className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium uppercase tracking-wide">{t("reports.totalSpent")}</span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-3xl font-bold text-slate-900 leading-tight mb-2">
                    {formatCurrency(summary.totalRealized, trip.baseCurrency)}
                  </p>
                </div>
                <p className="text-sm text-slate-500 mt-auto">
                  {summary.expenseCount} {t("reports.expenses")}
                </p>
              </CardContent>
            </Card>

            {/* Average Per Day */}
            <Card className="border-slate-200 shadow-sm h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-2 text-slate-500 mb-3">
                  <Calendar className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium uppercase tracking-wide">{t("reports.perDay")}</span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-3xl font-bold text-slate-900 leading-tight mb-2">
                    {formatCurrency(summary.averagePerDay, trip.baseCurrency)}
                  </p>
                </div>
                <p className="text-sm text-slate-500 mt-auto">
                  {summary.tripDays} {t("reports.days")}
                </p>
              </CardContent>
            </Card>

            {/* Top Category */}
            {topCategory && (
              <Card className="border-slate-200 shadow-sm h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 text-slate-500 mb-3">
                    <Tag className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium uppercase tracking-wide">{t("reports.topCategory")}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-3xl font-bold text-slate-900 leading-tight mb-2">
                      {t(`categories.${topCategory.category}`)}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500 mt-auto">
                    {formatCurrency(topCategory.amount, trip.baseCurrency)} ({topCategory.percentage.toFixed(0)}%)
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Budget Status (only if budget exists) */}
            {hasBudget && (
              <Card className={`border-slate-200 shadow-sm h-full ${budgetUsed > 90 ? 'bg-rose-50/50' : budgetUsed > 70 ? 'bg-amber-50/50' : 'bg-emerald-50/50'}`}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 text-slate-500 mb-3">
                    <Target className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium uppercase tracking-wide">{t("reports.budget")}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-3xl font-bold text-slate-900 leading-tight mb-2">
                      {budgetUsed.toFixed(0)}%
                    </p>
                  </div>
                  <p className="text-sm text-slate-500 mt-auto">
                    {formatCurrency(budgetRemaining, trip.baseCurrency)} {t("reports.remaining")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* MAIN HERO GRAPH - Time-based spending */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">{t("reports.spendingOverTime")}</CardTitle>
                <p className="text-sm text-slate-600 mt-1">{t("reports.experienceDateBased")}</p>
              </div>
              {summary.totalFuture > 0 && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-sky-500" />
                    <span className="text-slate-600">{t("reports.past")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 border-t-2 border-dashed border-slate-400" />
                    <span className="text-slate-600">{t("reports.planned")}</span>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {dailySpend.length === 0 ? (
              <p className="text-base text-slate-500 text-center py-12">
                {t("reports.noData")}
              </p>
            ) : (
              <TimeSeriesChart
                data={dailySpend.map((d) => ({
                  date: d.date,
                  amount: d.amount,
                  isFuture: d.isFuture,
                }))}
                height={280}
                currency={trip.baseCurrency}
                formatCurrency={formatCurrency}
              />
            )}
          </CardContent>
        </Card>

        {/* VISUAL BREAKDOWNS - Supporting charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Tag className="h-5 w-5 text-sky-500" />
                {t("reports.byCategory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topCategories.length === 0 ? (
                <p className="text-base text-slate-500 text-center py-8">
                  {t("reports.noData")}
                </p>
              ) : (
                <div className="space-y-4">
                  {topCategories.map((item) => {
                    const colors = getCategoryColors(item.category)
                    return (
                      <div key={item.category} className="space-y-2">
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
                            <span className="font-semibold text-base text-slate-700">
                              {t(`categories.${item.category}`)}
                            </span>
                          </div>
                          <span className="text-base text-slate-900 font-bold">
                            {formatCurrency(item.amount, trip.baseCurrency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
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
                          <span className="text-sm font-semibold text-slate-600 w-12 text-end">
                            {item.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Days */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                {t("reports.topDays")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailySpend.length === 0 ? (
                <p className="text-base text-slate-500 text-center py-8">
                  {t("reports.noData")}
                </p>
              ) : (
                <div className="space-y-4">
                  {dailySpend
                    .filter((d) => !d.isFuture)
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 5)
                    .map((day, index) => (
                      <div key={day.date} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <span className="text-sm font-bold text-emerald-700">#{index + 1}</span>
                            </div>
                            <span className="font-semibold text-base text-slate-700">
                              {new Date(day.date).toLocaleDateString(locale, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <span className="text-base text-slate-900 font-bold">
                            {formatCurrency(day.amount, trip.baseCurrency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                              style={{
                                width: `${(day.amount / dailySpend[0].amount) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-slate-500 w-12 text-end">
                            {day.count} {day.count === 1 ? t("reports.expense") : t("reports.expenses")}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
