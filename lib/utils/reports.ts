import { Expense, ExpenseCategory } from "@/lib/schemas/expense.schema"
import { Trip } from "@/lib/schemas/trip.schema"
import { Locale } from "@/lib/i18n"

/**
 * Report calculation utilities
 */

export interface ReportFilters {
  dateRange: "all" | "week" | "custom"
  startDate?: string
  endDate?: string
  includeRealized: boolean
  includeFuture: boolean
  showOnlyUnconverted: boolean
  country?: string
  category?: ExpenseCategory | ""
}

export interface ExpenseClassification {
  realized: Expense[]
  future: Expense[]
  unconverted: Expense[]
}

export interface CategoryBreakdown {
  category: ExpenseCategory
  amount: number
  count: number
  percentage: number
}

export interface CountryBreakdown {
  country: string
  amount: number
  count: number
  percentage: number
}

export interface CurrencyBreakdown {
  currency: string
  amount: number
  count: number
}

export interface DailySpend {
  date: string
  amount: number
  count: number
  isFuture?: boolean
}

export interface AccommodationStats {
  totalNights: number
  totalSpent: number
  averagePerNight: number
  expenses: Array<{
    id: string
    merchant?: string
    nights: number
    pricePerNight: number
    isAboveAverage: boolean
  }>
}

export interface ReportSummary {
  totalRealized: number
  totalFuture: number
  unconvertedExpenses: Array<{ currency: string; amount: number; count: number }>
  averagePerDay: number
  tripDays: number
  expenseCount: number
}

export interface ReportInsight {
  type: "expensive_day" | "top_category" | "trend" | "accommodation" | "future_impact"
  title: string
  description: string
  value?: string
}

/**
 * Get today's date string in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return new Date().toISOString().split("T")[0]
}

/**
 * Check if an expense is a future commitment
 */
export function isFutureExpense(expense: Expense): boolean {
  const today = getTodayString()
  
  // If explicitly marked as future expense
  if (expense.isFutureExpense) {
    // Check if usage date is in the future
    if (expense.usageDate && expense.usageDate > today) {
      return true
    }
  }
  
  return false
}

/**
 * Check if an expense has a valid converted amount
 */
export function hasConvertedAmount(expense: Expense): boolean {
  return expense.convertedAmount !== undefined && expense.convertedAmount > 0
}

/**
 * Classify expenses into realized, future, and unconverted
 */
export function classifyExpenses(expenses: Expense[]): ExpenseClassification {
  const realized: Expense[] = []
  const future: Expense[] = []
  const unconverted: Expense[] = []

  for (const expense of expenses) {
    if (!hasConvertedAmount(expense)) {
      unconverted.push(expense)
    } else if (isFutureExpense(expense)) {
      future.push(expense)
    } else {
      realized.push(expense)
    }
  }

  return { realized, future, unconverted }
}

/**
 * Filter expenses based on report filters
 */
export function filterExpenses(expenses: Expense[], filters: ReportFilters): Expense[] {
  return expenses.filter((expense) => {
    // Date range filter
    if (filters.dateRange === "week") {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoStr = weekAgo.toISOString().split("T")[0]
      if (expense.date < weekAgoStr) return false
    } else if (filters.dateRange === "custom" && filters.startDate && filters.endDate) {
      if (expense.date < filters.startDate || expense.date > filters.endDate) return false
    }

    // Country filter
    if (filters.country && expense.country !== filters.country) return false

    // Category filter
    if (filters.category && expense.category !== filters.category) return false

    // Classification filters
    const isFuture = isFutureExpense(expense)
    const hasConverted = hasConvertedAmount(expense)

    if (filters.showOnlyUnconverted) {
      return !hasConverted
    }

    if (!filters.includeRealized && !isFuture && hasConverted) return false
    if (!filters.includeFuture && isFuture) return false

    return true
  })
}

/**
 * Calculate trip days
 */
export function calculateTripDays(trip: Trip, expenses: Expense[]): number {
  if (trip.startDate && trip.endDate) {
    const start = new Date(trip.startDate)
    const end = new Date(trip.endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  // Fallback: calculate from expense dates
  if (expenses.length === 0) return 1

  const dates = expenses.map((e) => e.date).sort()
  const start = new Date(dates[0])
  const end = new Date(dates[dates.length - 1])
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

/**
 * Calculate report summary
 */
export function calculateSummary(
  expenses: Expense[],
  trip: Trip
): ReportSummary {
  const { realized, future, unconverted } = classifyExpenses(expenses)

  const totalRealized = realized.reduce((sum, e) => sum + (e.convertedAmount || 0), 0)
  const totalFuture = future.reduce((sum, e) => sum + (e.convertedAmount || 0), 0)

  // Group unconverted by currency
  const unconvertedByCurrency = new Map<string, { amount: number; count: number }>()
  for (const expense of unconverted) {
    const existing = unconvertedByCurrency.get(expense.currency) || { amount: 0, count: 0 }
    unconvertedByCurrency.set(expense.currency, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1,
    })
  }

  const unconvertedExpenses = Array.from(unconvertedByCurrency.entries()).map(
    ([currency, data]) => ({
      currency,
      amount: data.amount,
      count: data.count,
    })
  )

  const tripDays = calculateTripDays(trip, realized)
  const averagePerDay = tripDays > 0 ? totalRealized / tripDays : 0

  return {
    totalRealized,
    totalFuture,
    unconvertedExpenses,
    averagePerDay,
    tripDays,
    expenseCount: expenses.length,
  }
}

/**
 * Calculate category breakdown
 */
export function calculateCategoryBreakdown(expenses: Expense[]): CategoryBreakdown[] {
  const byCategory = new Map<ExpenseCategory, { amount: number; count: number }>()

  for (const expense of expenses) {
    if (!hasConvertedAmount(expense)) continue
    const existing = byCategory.get(expense.category) || { amount: 0, count: 0 }
    byCategory.set(expense.category, {
      amount: existing.amount + (expense.convertedAmount || 0),
      count: existing.count + 1,
    })
  }

  const total = Array.from(byCategory.values()).reduce((sum, v) => sum + v.amount, 0)

  return Array.from(byCategory.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

/**
 * Calculate country breakdown
 */
export function calculateCountryBreakdown(expenses: Expense[]): CountryBreakdown[] {
  const byCountry = new Map<string, { amount: number; count: number }>()

  for (const expense of expenses) {
    if (!hasConvertedAmount(expense)) continue
    const existing = byCountry.get(expense.country) || { amount: 0, count: 0 }
    byCountry.set(expense.country, {
      amount: existing.amount + (expense.convertedAmount || 0),
      count: existing.count + 1,
    })
  }

  const total = Array.from(byCountry.values()).reduce((sum, v) => sum + v.amount, 0)

  return Array.from(byCountry.entries())
    .map(([country, data]) => ({
      country,
      amount: data.amount,
      count: data.count,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

/**
 * Calculate currency breakdown (original amounts)
 */
export function calculateCurrencyBreakdown(expenses: Expense[]): CurrencyBreakdown[] {
  const byCurrency = new Map<string, { amount: number; count: number }>()

  for (const expense of expenses) {
    const existing = byCurrency.get(expense.currency) || { amount: 0, count: 0 }
    byCurrency.set(expense.currency, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1,
    })
  }

  return Array.from(byCurrency.entries())
    .map(([currency, data]) => ({
      currency,
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Calculate daily spending by EXPERIENCE DATE (usageDate or date)
 */
export function calculateDailySpend(expenses: Expense[]): DailySpend[] {
  const byDate = new Map<string, { amount: number; count: number; isFuture: boolean }>()
  const today = getTodayString()

  for (const expense of expenses) {
    if (!hasConvertedAmount(expense)) continue
    // Use experience date (usageDate) if available, otherwise payment date
    const experienceDate = expense.usageDate || expense.date
    const existing = byDate.get(experienceDate) || { amount: 0, count: 0, isFuture: experienceDate > today }
    byDate.set(experienceDate, {
      amount: existing.amount + (expense.convertedAmount || 0),
      count: existing.count + 1,
      isFuture: experienceDate > today,
    })
  }

  return Array.from(byDate.entries())
    .map(([date, data]) => ({
      date,
      amount: data.amount,
      count: data.count,
      isFuture: data.isFuture,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get top N categories (with "Other" for remaining)
 */
export function getTopCategories(
  breakdown: CategoryBreakdown[],
  topN: number = 5
): CategoryBreakdown[] {
  if (breakdown.length <= topN) return breakdown

  const top = breakdown.slice(0, topN)
  const rest = breakdown.slice(topN)
  
  if (rest.length === 0) return top

  const otherAmount = rest.reduce((sum, item) => sum + item.amount, 0)
  const otherCount = rest.reduce((sum, item) => sum + item.count, 0)
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0)

  return [
    ...top,
    {
      category: "Other" as ExpenseCategory,
      amount: otherAmount,
      count: otherCount,
      percentage: total > 0 ? (otherAmount / total) * 100 : 0,
    },
  ]
}

/**
 * Calculate accommodation statistics
 */
export function calculateAccommodationStats(expenses: Expense[]): AccommodationStats | null {
  const lodgingExpenses = expenses.filter(
    (e) => e.category === "Lodging" && e.numberOfNights && e.numberOfNights > 0 && hasConvertedAmount(e)
  )

  if (lodgingExpenses.length === 0) return null

  const totalNights = lodgingExpenses.reduce((sum, e) => sum + (e.numberOfNights || 0), 0)
  const totalSpent = lodgingExpenses.reduce((sum, e) => sum + (e.convertedAmount || 0), 0)
  const averagePerNight = totalNights > 0 ? totalSpent / totalNights : 0

  const expenseStats = lodgingExpenses.map((e) => {
    const pricePerNight = (e.convertedAmount || 0) / (e.numberOfNights || 1)
    return {
      id: e.id,
      merchant: e.merchant,
      nights: e.numberOfNights || 0,
      pricePerNight,
      isAboveAverage: pricePerNight > averagePerNight * 1.2, // 20% above average
    }
  })

  return {
    totalNights,
    totalSpent,
    averagePerNight,
    expenses: expenseStats,
  }
}

/**
 * Generate smart insights
 */
export function generateInsights(
  expenses: Expense[],
  summary: ReportSummary,
  categoryBreakdown: CategoryBreakdown[],
  trip: Trip,
  t: (key: string) => string,
  formatCurrency: (amount: number, currency: string) => string
): ReportInsight[] {
  const insights: ReportInsight[] = []
  const { realized, future } = classifyExpenses(expenses)

  // 1. Most expensive day
  const dailySpend = calculateDailySpend(realized)
  if (dailySpend.length > 0) {
    const mostExpensiveDay = dailySpend.reduce((max, day) =>
      day.amount > max.amount ? day : max
    )
    if (mostExpensiveDay.amount > summary.averagePerDay * 1.5) {
      insights.push({
        type: "expensive_day",
        title: t("reports.insights.expensiveDay"),
        description: t("reports.insights.expensiveDayDesc"),
        value: formatCurrency(mostExpensiveDay.amount, trip.baseCurrency),
      })
    }
  }

  // 2. Top category share
  if (categoryBreakdown.length > 0) {
    const topCategory = categoryBreakdown[0]
    if (topCategory.percentage > 30) {
      insights.push({
        type: "top_category",
        title: t("reports.insights.topCategory"),
        description: `${t(`categories.${topCategory.category}`)} - ${topCategory.percentage.toFixed(0)}%`,
        value: formatCurrency(topCategory.amount, trip.baseCurrency),
      })
    }
  }

  // 3. Spending trend (early vs late trip)
  if (dailySpend.length >= 4) {
    const midPoint = Math.floor(dailySpend.length / 2)
    const earlyTotal = dailySpend.slice(0, midPoint).reduce((sum, d) => sum + d.amount, 0)
    const lateTotal = dailySpend.slice(midPoint).reduce((sum, d) => sum + d.amount, 0)
    
    if (Math.abs(earlyTotal - lateTotal) / Math.max(earlyTotal, lateTotal) > 0.3) {
      const trend = lateTotal > earlyTotal ? "increasing" : "decreasing"
      insights.push({
        type: "trend",
        title: t("reports.insights.trend"),
        description: t(`reports.insights.trend${trend === "increasing" ? "Up" : "Down"}`),
      })
    }
  }

  // 4. Accommodation stats
  const accommodationStats = calculateAccommodationStats(realized)
  if (accommodationStats && accommodationStats.totalNights >= 2) {
    insights.push({
      type: "accommodation",
      title: t("reports.insights.accommodation"),
      description: `${accommodationStats.totalNights} ${t("reports.nights")}`,
      value: `${formatCurrency(accommodationStats.averagePerNight, trip.baseCurrency)}/${t("reports.night")}`,
    })
  }

  // 5. Future impact
  if (summary.totalFuture > 0 && future.length > 0) {
    insights.push({
      type: "future_impact",
      title: t("reports.insights.futureImpact"),
      description: `${future.length} ${t("reports.commitments")}`,
      value: `+${formatCurrency(summary.totalFuture, trip.baseCurrency)}`,
    })
  }

  return insights.slice(0, 5) // Max 5 insights
}

