"use client"
// Reports dashboard with BI-style filters

import { useEffect, useState, Suspense, lazy } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Calendar, DollarSign, BarChart3, Plus, Target, Tag, Download, TrendingDown, Zap, X, Filter, ChevronDown, Lock } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { OfflineBanner } from "@/components/OfflineBanner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { StatCardSkeleton, ReportCardSkeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { tripsRepository, expensesRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { Expense, ExpenseCategory } from "@/lib/schemas/expense.schema"
import { formatCurrency } from "@/lib/utils/currency"
import { getCategoryColors } from "@/lib/utils/categoryColors"
import { getCountryName, getCountryFlag } from "@/lib/utils/countries"
import { useI18n } from "@/lib/i18n/I18nProvider"
import {
  ReportFilters,
  filterExpenses,
  calculateSummary,
  calculateCategoryBreakdown,
  calculateCountryBreakdown,
  calculateDailySpend,
  getTopCategories,
  getTopDrains,
  getBiggestExpenses,
  calculateBurnRate,
} from "@/lib/utils/reports"
import { getTripDayInfo } from "@/lib/utils/date"

// PERFORMANCE: Dynamic import for TimeSeriesChart to avoid blocking initial load
// This chart is heavy and not needed for first meaningful paint
const TimeSeriesChart = lazy(() => import("@/components/charts/TimeSeriesChart").then(mod => ({ default: mod.TimeSeriesChart })))

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

function AdvancedInsightsLockedPanel() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <Lock className="h-8 w-8 text-slate-300" />
        <p className="font-semibold text-slate-900">Advanced insights</p>
        <p className="text-sm text-slate-500">Upgrade to Plus or Pro to unlock advanced insights.</p>
        <Link href="/pricing">
          <Button variant="outline" size="sm">Upgrade</Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const { t, locale } = useI18n()
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const isRTL = locale === "he"
  
  const [showReportsTip, setShowReportsTip] = useState(false)

  const [trip, setTrip] = useState<Trip | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<ExpenseCategory | null>(null)
  const [exporting, setExporting] = useState(false)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [userPlan, setUserPlan] = useState<"free" | "plus" | "pro" | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const isAdvancedAllowed = isAdmin || userPlan === "plus" || userPlan === "pro"
  const [includeFlightsInCountry, setIncludeFlightsInCountry] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem(`reports:countryIncludeFlights:${params.tripId}`)
    return stored === 'true'
  })
  
  const [excludeFlightsFromDailyAvg, setExcludeFlightsFromDailyAvg] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem(`reports:dailyAvgExcludeFlights:${params.tripId}`)
    return stored === 'true'
  })
  
  const [excludeFlightsFromTotal, setExcludeFlightsFromTotal] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem(`reports:totalExcludeFlights:${params.tripId}`)
    return stored === 'true'
  })

  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: "all",
    includeRealized: true,
    includeFuture: true,
    showOnlyUnconverted: false,
    countries: [],
    categories: [],
    amountMin: undefined,
    amountMax: undefined,
    sort: "date",
  })
  
  // Persist toggle states
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`reports:countryIncludeFlights:${tripId}`, String(includeFlightsInCountry))
    }
  }, [includeFlightsInCountry, tripId])
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`reports:dailyAvgExcludeFlights:${tripId}`, String(excludeFlightsFromDailyAvg))
    }
  }, [excludeFlightsFromDailyAvg, tripId])
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`reports:totalExcludeFlights:${tripId}`, String(excludeFlightsFromTotal))
    }
  }, [excludeFlightsFromTotal, tripId])

  useEffect(() => {
    loadData()
  }, [tripId])
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading && trip) {
      const hasSeenReportsTip = localStorage.getItem(`tw_hasSeenReportsTip_${tripId}`)
      if (!hasSeenReportsTip) {
        setShowReportsTip(true)
      }
    }
  }, [loading, trip, tripId])

  async function loadData() {
    try {
      setLoading(true)
      setError(false)
      const [tripData, expensesData, userResponse] = await Promise.all([
        tripsRepository.getTrip(tripId),
        expensesRepository.listExpenses(tripId),
        fetch('/api/me').then(r => r.json())
      ])

      if (!tripData) {
        router.push("/trips")
        return
      }

      setTrip(tripData)
      setExpenses(expensesData)
      setUserPlan(userResponse.plan || "free")
      setIsAdmin(userResponse.isAdmin || false)
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
  const filteredExpenses = filterExpenses(expenses, filters, trip)
  
  // Sort if needed
  const sortedExpenses = filters.sort === "amount" 
    ? [...filteredExpenses].sort((a, b) => (b.convertedAmount || 0) - (a.convertedAmount || 0))
    : filteredExpenses
  
  // Total spend - with optional flight exclusion
  const expensesForTotal = excludeFlightsFromTotal
    ? filteredExpenses.filter(e => e.category !== 'Flights')
    : filteredExpenses
  const summary = calculateSummary(expensesForTotal, trip)
  
  const categoryBreakdown = calculateCategoryBreakdown(sortedExpenses)
  
  // Country breakdown - exclude flights by default unless toggle is on
  const expensesForCountryBreakdown = includeFlightsInCountry 
    ? sortedExpenses 
    : sortedExpenses.filter(e => e.category !== 'Flights')
  const countryBreakdown = calculateCountryBreakdown(expensesForCountryBreakdown)
  
  // Daily average - with optional flight exclusion (independent of total)
  const expensesForDailyAvg = excludeFlightsFromDailyAvg
    ? sortedExpenses.filter(e => e.category !== 'Flights')
    : sortedExpenses
  const summaryForDailyAvg = calculateSummary(expensesForDailyAvg, trip)
  
  const topCategories = getTopCategories(categoryBreakdown, 5)
  
  // Exclude flights from timeline and burn rate (default behavior)
  const expensesForTimeline = sortedExpenses.filter(e => e.category !== 'Flights')
  const dailySpend = calculateDailySpend(expensesForTimeline)
  
  // New calculations for modules
  const topDrains = getTopDrains(sortedExpenses, 4)
  const biggestExpenses = getBiggestExpenses(sortedExpenses, 5)
  const burnRate = calculateBurnRate(expensesForTimeline, trip, filters)
  
  // Get trip countries for filter
  const tripCountries = trip.plannedCountries || trip.countries || []
  
  // Calculate trip day info for time context
  const tripDayInfo = getTripDayInfo(trip.startDate, trip.endDate)
  const todayDateString = new Date().toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
    month: "short",
    day: "numeric",
  })
  
  // Calculate budget status
  const hasBudget = trip.targetBudget && trip.targetBudget > 0
  const budgetUsed = hasBudget ? (summary.totalRealized / trip.targetBudget!) * 100 : 0
  const budgetRemaining = hasBudget ? trip.targetBudget! - summary.totalRealized : 0
  
  // Check if this is a multi-country trip (based on actual expenses only)
  const isMultiCountry = countryBreakdown.length > 1
  
  // Calculate daily average per country (for multi-country trips)
  const countryDailyAverages = isMultiCountry ? countryBreakdown.map(country => {
    const countryExpenses = expensesForCountryBreakdown.filter(e => e.country === country.country && e.convertedAmount)
    if (countryExpenses.length === 0) return null
    
    const dates = countryExpenses.map(e => e.usageDate || e.date).sort()
    const firstDate = new Date(dates[0])
    const lastDate = new Date(dates[dates.length - 1])
    const days = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    return {
      country: country.country,
      dailyAverage: days > 0 ? country.amount / days : 0,
      days
    }
  }).filter(Boolean) : []

  // Calculate dominant category per day for hover interaction
  const dominantCategoryByDate = new Map<string, ExpenseCategory>()
  filteredExpenses.forEach((expense) => {
    if (!expense.convertedAmount) return
    const date = expense.usageDate || expense.date
    const currentDominant = dominantCategoryByDate.get(date)
    if (!currentDominant) {
      dominantCategoryByDate.set(date, expense.category)
    }
  })
  
  // Calculate category spending by date for more accurate dominance
  const categoryByDate = new Map<string, Map<ExpenseCategory, number>>()
  filteredExpenses.forEach((expense) => {
    if (!expense.convertedAmount) return
    const date = expense.usageDate || expense.date
    if (!categoryByDate.has(date)) {
      categoryByDate.set(date, new Map())
    }
    const dateCategories = categoryByDate.get(date)!
    dateCategories.set(
      expense.category,
      (dateCategories.get(expense.category) || 0) + expense.convertedAmount
    )
  })
  
  categoryByDate.forEach((categories, date) => {
    let maxAmount = 0
    let dominant: ExpenseCategory = "Other"
    categories.forEach((amount, category) => {
      if (amount > maxAmount) {
        maxAmount = amount
        dominant = category
      }
    })
    dominantCategoryByDate.set(date, dominant)
  })

  const highlightDates = hoveredCategory
    ? Array.from(dominantCategoryByDate.entries())
        .filter(([_, cat]) => cat === hoveredCategory)
        .map(([date]) => date)
    : null

  // Generate spending pattern insight
  const getSpendingInsight = () => {
    const pastSpending = dailySpend.filter((d) => !d.isFuture)
    if (pastSpending.length < 3) return t("reports.insights.steadySpending")
    
    const midPoint = Math.floor(pastSpending.length / 2)
    const firstHalf = pastSpending.slice(0, midPoint)
    const secondHalf = pastSpending.slice(midPoint)
    
    const firstTotal = firstHalf.reduce((sum, d) => sum + d.amount, 0)
    const secondTotal = secondHalf.reduce((sum, d) => sum + d.amount, 0)
    const total = firstTotal + secondTotal
    
    if (total === 0) return t("reports.insights.steadySpending")
    
    const firstRatio = firstTotal / total
    
    if (firstRatio > 0.65) return t("reports.insights.earlySpending")
    if (firstRatio < 0.35) return t("reports.insights.lateSpending")
    return t("reports.insights.steadySpending")
  }
  
  const spendingInsight = getSpendingInsight()

  const hasActiveFilters =
    filters.dateRange !== "all" ||
    !filters.includeRealized ||
    !filters.includeFuture ||
    filters.showOnlyUnconverted ||
    (filters.countries && filters.countries.length > 0) ||
    (filters.categories && filters.categories.length > 0) ||
    filters.amountMin !== undefined ||
    filters.amountMax !== undefined

  function clearFilters() {
    setFilters({
      dateRange: "all",
      includeRealized: true,
      includeFuture: true,
      showOnlyUnconverted: false,
      countries: [],
      categories: [],
      amountMin: undefined,
      amountMax: undefined,
      sort: "date",
    })
  }
  
  // Helper to get active filter chips
  const getActiveFilterChips = () => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = []
    
    if (filters.dateRange !== "all") {
      const labels: Record<string, string> = {
        today: t("reports.today") || "Today",
        "7d": t("reports.last7Days") || "Last 7 days",
        "30d": t("reports.last30Days") || "Last 30 days",
        trip: t("reports.tripDates") || "Trip dates",
        custom: t("reports.customRange") || "Custom range",
      }
      chips.push({
        key: "dateRange",
        label: labels[filters.dateRange] || filters.dateRange,
        onRemove: () => setFilters({ ...filters, dateRange: "all" }),
      })
    }
    
    if (filters.categories && filters.categories.length > 0) {
      filters.categories.forEach((cat) => {
        chips.push({
          key: `category-${cat}`,
          label: t(`categories.${cat}`),
          onRemove: () => setFilters({ ...filters, categories: filters.categories?.filter(c => c !== cat) }),
        })
      })
    }
    
    if (filters.countries && filters.countries.length > 0) {
      filters.countries.forEach((country) => {
        chips.push({
          key: `country-${country}`,
          label: getCountryName(country, locale),
          onRemove: () => setFilters({ ...filters, countries: filters.countries?.filter(c => c !== country) }),
        })
      })
    }
    
    if (filters.amountMin !== undefined) {
      chips.push({
        key: "amountMin",
        label: `Min: ${formatCurrency(filters.amountMin, trip.baseCurrency)}`,
        onRemove: () => setFilters({ ...filters, amountMin: undefined }),
      })
    }
    
    if (filters.amountMax !== undefined) {
      chips.push({
        key: "amountMax",
        label: `Max: ${formatCurrency(filters.amountMax, trip.baseCurrency)}`,
        onRemove: () => setFilters({ ...filters, amountMax: undefined }),
      })
    }
    
    return chips
  }
  
  const activeFilterChips = getActiveFilterChips()

  async function handleExportToExcel() {
    // Check entitlement: Plus and above only
    const effectivePlan = isAdmin ? "pro" : userPlan
    if (effectivePlan === "free" || !effectivePlan) {
      // Show upgrade prompt
      alert(t("reports.exportUpgradeRequired") || "Export to Excel is available in Plus and above plans. Upgrade to access this feature.")
      return
    }

    try {
      setExporting(true)
      const response = await fetch(`/api/trips/${tripId}/reports/export`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `TravelWise-${trip?.name || 'Trip'}-expenses.xlsx`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert(t('reports.exportFailed') || 'Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen pb-20 md:pb-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* Reports Tip Tooltip */}
      {showReportsTip && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => {
              setShowReportsTip(false)
              if (typeof window !== 'undefined') {
                localStorage.setItem(`tw_hasSeenReportsTip_${tripId}`, 'true')
              }
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm mx-4"
          >
            <div className="bg-sky-600 text-white p-4 rounded-xl shadow-xl relative" dir={isRTL ? "rtl" : "ltr"}>
              <button
                onClick={() => {
                  setShowReportsTip(false)
                  if (typeof window !== 'undefined') {
                    localStorage.setItem(`tw_hasSeenReportsTip_${tripId}`, 'true')
                  }
                }}
                className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} text-white/80 hover:text-white`}
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-sm font-medium pr-6">
                {t('onboarding.reportsTip')}
              </p>
            </div>
          </motion.div>
        </>
      )}
      
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={handleExportToExcel}
                disabled={exporting || expenses.length === 0}
                className="gap-2 hidden sm:flex"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {exporting ? t('reports.exporting') || 'Exporting...' : t('reports.exportToExcel') || 'Export to Excel'}
                </span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleExportToExcel}
                disabled={exporting || expenses.length === 0}
                className="sm:hidden"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Compact Inline Filters */}
          <div className="px-4 py-3 border-t border-slate-200 bg-background">
            {!filtersExpanded ? (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setFiltersExpanded(true)}
                  className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-slate-900 cursor-pointer transition-colors group"
                  aria-label={t("reports.filters")}
                >
                  <Filter className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{t("reports.filter")}</span>
                  {(filters.countries && filters.countries.length > 0 || filters.categories && filters.categories.length > 0) && (
                    <>
                      <span className="text-slate-400">•</span>
                      {filters.countries && filters.countries.length > 0 && (
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">🌍 {filters.countries.length}</span>
                      )}
                      {filters.categories && filters.categories.length > 0 && (
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">🏷 {filters.categories.length}</span>
                      )}
                    </>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 ml-auto text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                  >
                    {t("reports.clearAll")}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{t("reports.filters")}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiltersExpanded(false)}
                    className="h-7 text-xs"
                  >
                    {t("common.close")}
                  </Button>
                </div>

                {/* Date Range */}
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5">{t("reports.dateRange")}</Label>
                  <Select
                    value={filters.dateRange}
                    onChange={(e) =>
                      setFilters({ ...filters, dateRange: e.target.value as ReportFilters["dateRange"] })
                    }
                    className="h-9 text-sm"
                  >
                    <option value="all">{t("reports.allTime")}</option>
                    <option value="today">{t("reports.today")}</option>
                    <option value="7d">{t("reports.last7Days")}</option>
                    <option value="30d">{t("reports.last30Days")}</option>
                    <option value="trip">{t("reports.tripDates")}</option>
                  </Select>
                </div>

                {/* Categories Multi-Select */}
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5">{t("reports.categories")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                      const isSelected = filters.categories?.includes(cat)
                      return (
                        <Badge
                          key={cat}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer h-7 text-xs"
                          onClick={() => {
                            const current = filters.categories || []
                            setFilters({
                              ...filters,
                              categories: isSelected
                                ? current.filter((c) => c !== cat)
                                : [...current, cat],
                            })
                          }}
                        >
                          {t(`categories.${cat}`)}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                {/* Countries Multi-Select */}
                {tripCountries.length > 0 && (
                  <div>
                    <Label className="text-xs text-slate-600 mb-1.5">{t("reports.countries")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {tripCountries.map((country) => {
                        const isSelected = filters.countries?.includes(country)
                        return (
                          <Badge
                            key={country}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer h-7 text-xs"
                            onClick={() => {
                              const current = filters.countries || []
                              setFilters({
                                ...filters,
                                countries: isSelected
                                  ? current.filter((c) => c !== country)
                                  : [...current, country],
                              })
                            }}
                          >
                            {getCountryName(country, locale)}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
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
        {/* Today Context Indicator */}
        <div className="pb-2">
          <p className="text-xs text-slate-500">
            {t("home.todayContext")}: {todayDateString}
            {tripDayInfo && (
              <span className="text-slate-400 mx-1.5">•</span>
            )}
            {tripDayInfo && t("home.dayOfTrip", { current: tripDayInfo.currentDay, total: tripDayInfo.totalDays })}
          </p>
        </div>

        {/* EXECUTIVE SUMMARY - Top Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{t("reports.travelSummary")}</h2>
            <p className="text-slate-600">{t("reports.travelSummaryDesc")}</p>
            <p className="text-xs text-slate-500 mt-2">{t("reports.calmNote")}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Spent */}
            <Card className="border-slate-200 shadow-sm h-full">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-medium uppercase tracking-wide">{t("reports.totalSpent")}</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excludeFlightsFromTotal}
                      onChange={(e) => setExcludeFlightsFromTotal(e.target.checked)}
                      className="w-3 h-3 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-[10px] text-slate-500">
                      {locale === "he" ? "ללא טיסות" : "No flights"}
                    </span>
                  </label>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-2xl font-bold text-slate-900 leading-tight mb-1">
                    {formatCurrency(summary.totalRealized, trip.baseCurrency)}
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-auto">
                  {summary.expenseCount} {t("reports.expenses")}
                  {excludeFlightsFromTotal && (
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {locale === "he" ? "משקף עלות בתוך היעד" : "In-destination cost"}
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Average Per Day */}
            <Card className="border-slate-200 shadow-sm h-full">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-medium uppercase tracking-wide">{t("reports.perDay")}</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excludeFlightsFromDailyAvg}
                      onChange={(e) => setExcludeFlightsFromDailyAvg(e.target.checked)}
                      className="w-3 h-3 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-[10px] text-slate-500">
                      {locale === "he" ? "ללא טיסות" : "No flights"}
                    </span>
                  </label>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-2xl font-bold text-slate-900 leading-tight mb-1">
                    {formatCurrency(summaryForDailyAvg.averagePerDay, trip.baseCurrency)}
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-auto">
                  {summaryForDailyAvg.tripDays} {t("reports.days")}
                  {excludeFlightsFromDailyAvg && (
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {locale === "he" ? "משקף עלות יומית בתוך היעד" : "In-destination daily cost"}
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Budget Status (only if budget exists) */}
            {hasBudget && (
              <Card className={`border-slate-200 shadow-sm h-full ${budgetUsed > 90 ? 'bg-rose-50/50' : budgetUsed > 70 ? 'bg-amber-50/50' : 'bg-emerald-50/50'}`}>
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Target className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-medium uppercase tracking-wide">{t("reports.budget")}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-2xl font-bold text-slate-900 leading-tight mb-1">
                      {budgetUsed.toFixed(0)}%
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mt-auto">
                    {formatCurrency(budgetRemaining, trip.baseCurrency)} {t("reports.remaining")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* BURN RATE / SPENDING PACE MODULE */}
        {isAdvancedAllowed ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Zap className="h-5 w-5 text-amber-500" />
              {t("reports.spendingPace") || "Spending Pace"}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              {t("reports.spendingPaceDesc") || "Track your daily spending rate"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                  {t("reports.totalSpent") || "Total Spent"}
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(burnRate.totalSpent, trip.baseCurrency)}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                  {t("reports.avgPerDay") || "Avg/Day"}
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(burnRate.averagePerDay, trip.baseCurrency)}
                </p>
              </div>
              
              {burnRate.totalDays && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    {t("reports.progress") || "Progress"}
                  </p>
                  <p className="text-xl font-bold text-slate-900">
                    {burnRate.daysElapsed}/{burnRate.totalDays} {t("reports.days") || "days"}
                  </p>
                </div>
              )}
              
              {burnRate.projectedTotal && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    {t("reports.projected") || "Projected"}
                  </p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(burnRate.projectedTotal, trip.baseCurrency)}
                  </p>
                </div>
              )}
            </div>
            
            {/* Budget Progress Bar */}
            {burnRate.budget && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {t("reports.budget") || "Budget"}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(burnRate.budget, trip.baseCurrency)}
                  </span>
                </div>
                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      burnRate.isOverBudget
                        ? 'bg-rose-500'
                        : burnRate.budgetUsedPercent && burnRate.budgetUsedPercent > 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(burnRate.budgetUsedPercent || 0, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">
                    {burnRate.budgetUsedPercent?.toFixed(0)}% {t("reports.used") || "used"}
                  </span>
                  <span className={`text-xs font-semibold ${burnRate.isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {burnRate.isOverBudget ? '-' : ''}
                    {formatCurrency(Math.abs(burnRate.budgetRemaining || 0), trip.baseCurrency)}
                    {' '}
                    {burnRate.isOverBudget ? (t("reports.over") || "over") : (t("reports.remaining") || "remaining")}
                  </span>
                </div>
              </div>
            )}
            
            {/* Note about flights exclusion */}
            <p className="text-xs text-slate-400 mt-4 border-t border-slate-100 pt-3">
              {t("reports.spendingPaceNote") || "Excludes flights for daily accuracy"}
            </p>
          </CardContent>
        </Card>
        ) : (
          <AdvancedInsightsLockedPanel />
        )}

        {/* TOP DRAINS MODULE */}
        {isAdvancedAllowed ? (
          topDrains.length > 0 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <TrendingDown className="h-5 w-5 text-rose-500" />
                {t("reports.topDrains") || "Top Drains"}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {t("reports.topDrainsDesc") || "Categories where you spent the most"}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {topDrains.map((drain) => (
                <div key={drain.category} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">
                        {t(`categories.${drain.category}`)}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({drain.count} {drain.count === 1 ? (t("reports.expense") || "expense") : (t("reports.expenses") || "expenses")})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(drain.amount, trip.baseCurrency)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 w-10 text-end">
                        {drain.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(drain.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Biggest Expenses */}
              {biggestExpenses.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    {t("reports.biggestExpenses") || "Biggest Expenses"}
                  </h4>
                  <div className="space-y-2">
                    {biggestExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between py-2 hover:bg-slate-50 rounded px-2 -mx-2 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {expense.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(expense.date).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {' • '}
                            {t(`categories.${expense.category}`)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-slate-900 ml-3">
                          {formatCurrency(expense.amount, trip.baseCurrency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          )
        ) : (
          <AdvancedInsightsLockedPanel />
        )}

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
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Pie Chart */}
                <div className="flex-shrink-0">
                  <DonutChart
                    data={categoryBreakdown
                      .sort((a, b) => b.amount - a.amount)
                      .map((item) => ({
                        category: item.category,
                        percentage: item.percentage,
                      }))}
                    size={200}
                    strokeWidth={40}
                  />
                </div>
                {/* Legend */}
                <div className="flex-1 w-full space-y-3">
                  {categoryBreakdown
                    .sort((a, b) => b.amount - a.amount)
                    .map((item) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between cursor-pointer transition-opacity hover:opacity-80"
                        onMouseEnter={() => setHoveredCategory(item.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                CATEGORY_CHART_COLORS[item.category as ExpenseCategory] ||
                                CATEGORY_CHART_COLORS.Other,
                            }}
                          />
                          <span className="font-medium text-sm text-slate-700">
                            {t(`categories.${item.category}`)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-900">
                            {formatCurrency(item.amount, trip.baseCurrency)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 w-10 text-end">
                            {item.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Country Breakdown (multi-country only) */}
        {isMultiCountry && countryBreakdown.length > 0 && (
          isAdvancedAllowed ? (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-900">
                  {t("reports.byCountry")}
                </CardTitle>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFlightsInCountry}
                    onChange={(e) => setIncludeFlightsInCountry(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-xs text-slate-600">
                    {locale === "he" ? "כלול טיסות" : "Include flights"}
                  </span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {locale === "he" 
                  ? "הפירוט לפי מדינה מוצג ללא טיסות כדי לשקף הוצאות בתוך היעד. לכן סכומי המדינות עשויים להיות שונים מהסה״כ הכללי."
                  : "Country breakdown excludes flights by default to reflect in-destination spending. Country totals may differ from overall totals."}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {countryBreakdown.map((item) => (
                  <div key={item.country} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getCountryFlag(item.country)}</span>
                        <span className="font-semibold text-base text-slate-700">
                          {getCountryName(item.country, locale)}
                        </span>
                      </div>
                      <span className="text-base text-slate-900 font-bold">
                        {formatCurrency(item.amount, trip.baseCurrency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percentage}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-600 w-12 text-end">
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Daily average per country */}
              {countryDailyAverages.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    {locale === "he" ? "ממוצע הוצאה ליום לפי מדינה" : "Daily average per country"}
                  </h4>
                  <div className="space-y-2">
                    {countryDailyAverages.map((item: any) => (
                      <div key={item.country} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{getCountryFlag(item.country)}</span>
                          <span className="text-slate-600">
                            {getCountryName(item.country, locale)}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({item.days} {item.days === 1 ? (locale === "he" ? "יום" : "day") : (locale === "he" ? "ימים" : "days")})
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(item.dailyAverage, trip.baseCurrency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          ) : (
            <AdvancedInsightsLockedPanel />
          )
        )}

        {/* MAIN HERO GRAPH - Time-based spending */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">{t("reports.spendingOverTime")}</CardTitle>
                <p className="text-sm text-slate-600 mt-1">{t("reports.experienceDateBased")}</p>
                {isAdvancedAllowed && (
                  <p className="text-sm text-slate-500 mt-2 italic">{spendingInsight}</p>
                )}
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
              <Suspense fallback={
                <div className="flex items-center justify-center h-[300px]">
                  <div className="space-y-3 w-full px-4">
                    <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
                    <div className="h-[250px] bg-slate-100 rounded-lg animate-pulse" />
                  </div>
                </div>
              }>
                <TimeSeriesChart
                  data={dailySpend.map((d) => ({
                    date: d.date,
                    amount: d.amount,
                    isFuture: d.isFuture,
                  }))}
                  height={300}
                  currency={trip.baseCurrency}
                  formatCurrency={formatCurrency}
                  highlightDates={highlightDates}
                />
              </Suspense>
            )}
          </CardContent>
        </Card>

      </>
        )}
      </div>

      <BottomNav tripId={tripId} />
    </div>
  )
}
