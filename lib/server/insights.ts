/**
 * Trip Insights Engine V1
 * 
 * Rule-based insights system that evaluates expenses and trip metadata
 * to generate personalized, actionable insights.
 */

import { Trip } from "@/lib/schemas/trip.schema"
import { Expense } from "@/lib/schemas/expense.schema"

export interface Insight {
  id: string
  type: "daily_spend" | "category_skew" | "cost_per_adult" | "country_comparison" | "expense_concentration"
  titleKey: string
  value: string
  comparisonKey: string
  comparisonParams?: Record<string, string | number>
  score: number // Higher = more interesting/actionable
  priority: number // For rotation logic
  dismissalId: string // Unique ID for dismissal tracking
}

interface InsightEvaluator {
  isEligible: (trip: Trip, expenses: Expense[]) => boolean
  calculate: (trip: Trip, expenses: Expense[]) => Insight | null
}

/**
 * Get unique expense dates
 */
function getExpenseDays(expenses: Expense[]): string[] {
  const dates = new Set(expenses.map(e => e.date))
  return Array.from(dates)
}

/**
 * Calculate daily average spending
 */
function calculateDailyAverage(expenses: Expense[]): number {
  const days = getExpenseDays(expenses)
  if (days.length === 0) return 0
  const total = expenses.reduce((sum, e) => sum + (e.convertedAmount || 0), 0)
  return total / days.length
}

/**
 * Get expense categories and their totals
 */
function getCategoryBreakdown(expenses: Expense[]): Record<string, number> {
  const breakdown: Record<string, number> = {}
  expenses.forEach(e => {
    breakdown[e.category] = (breakdown[e.category] || 0) + (e.convertedAmount || 0)
  })
  return breakdown
}

/**
 * Insight 1: Daily Spend vs Similar Trips
 */
const dailySpendInsight: InsightEvaluator = {
  isEligible: (trip, expenses) => {
    const days = getExpenseDays(expenses)
    return days.length >= 3 && trip.tripType !== undefined && trip.tripType !== null
  },
  calculate: (trip, expenses) => {
    const dailyAvg = calculateDailyAverage(expenses)
    
    // Benchmark values per trip type (in base currency)
    const benchmarks: Record<string, number> = {
      solo: 100,
      couple: 180,
      family: 250,
      friends: 120,
    }
    
    const benchmark = benchmarks[trip.tripType || "solo"] || 100
    
    // Guard against division by zero or invalid benchmark
    if (benchmark <= 0 || !isFinite(benchmark)) return null
    
    const deviation = ((dailyAvg - benchmark) / benchmark) * 100
    const deviationAbs = Math.abs(deviation)
    
    // Guard against absurd percentages
    if (deviationAbs > 300) return null
    
    // Score higher if deviation is significant
    const score = deviationAbs >= 20 ? 90 : deviationAbs >= 10 ? 70 : 50
    
    const comparisonKey = deviation > 0 ? "insights.aboveTypical" : "insights.belowTypical"
    
    return {
      id: "daily_spend",
      type: "daily_spend",
      titleKey: "insights.dailySpendTitle",
      value: `${Math.round(dailyAvg)}`,
      comparisonKey,
      comparisonParams: {
        percent: Math.round(deviationAbs).toString(),
        tripType: trip.tripType || "solo",
        currency: trip.baseCurrency,
      },
      score,
      priority: deviationAbs >= 20 ? 95 : 70,
      dismissalId: `${trip.id}_daily_spend`,
    }
  },
}

/**
 * Insight 2: Category Skew
 */
const categorySkewInsight: InsightEvaluator = {
  isEligible: (trip, expenses) => {
    const categories = Object.keys(getCategoryBreakdown(expenses))
    return expenses.length >= 3 && categories.length >= 2
  },
  calculate: (trip, expenses) => {
    const breakdown = getCategoryBreakdown(expenses)
    const total = expenses.reduce((sum, e) => sum + (e.convertedAmount || 0), 0)
    
    // Guard against zero or invalid total
    if (total <= 0 || !isFinite(total)) return null
    
    // Find dominant category
    let maxCategory = ""
    let maxAmount = 0
    
    Object.entries(breakdown).forEach(([category, amount]) => {
      if (amount > maxAmount) {
        maxCategory = category
        maxAmount = amount
      }
    })
    
    const percentage = (maxAmount / total) * 100
    
    // Guard against absurd percentages
    if (!isFinite(percentage) || percentage > 100) return null
    
    // Score higher if category is very dominant
    const score = percentage >= 50 ? 85 : percentage >= 40 ? 70 : 60
    
    // Only show if meaningful deviation
    if (percentage < 35) return null
    
    return {
      id: "category_skew",
      type: "category_skew",
      titleKey: "insights.categorySkewTitle",
      value: `${Math.round(percentage)}%`,
      comparisonKey: "insights.mostBudgetGoesTo",
      comparisonParams: {
        category: maxCategory,
        categoryRaw: maxCategory, // Keep raw category for UI translation
      },
      score,
      priority: percentage >= 50 ? 90 : 75,
      dismissalId: `${trip.id}_category_skew_${maxCategory}`,
    }
  },
}

/**
 * Insight 3: Cost per Adult per Day
 */
const costPerAdultInsight: InsightEvaluator = {
  isEligible: (trip, expenses) => {
    const days = getExpenseDays(expenses)
    return (trip.adults ?? 0) >= 1 && days.length >= 3
  },
  calculate: (trip, expenses) => {
    const dailyAvg = calculateDailyAverage(expenses)
    const adults = trip.adults ?? 1
    
    // Guard against invalid division
    if (adults <= 0 || !isFinite(adults)) return null
    
    const perAdult = dailyAvg / adults
    
    // Guard against invalid results
    if (!isFinite(perAdult)) return null
    
    // Medium-high score by default
    const score = 75
    
    const comparisonKey = adults > 1 ? "insights.basedOnAdultsPlural" : "insights.basedOnAdults"
    
    return {
      id: "cost_per_adult",
      type: "cost_per_adult",
      titleKey: "insights.costPerAdultTitle",
      value: `${Math.round(perAdult)}`,
      comparisonKey,
      comparisonParams: {
        adults: adults.toString(),
        currency: trip.baseCurrency,
      },
      score,
      priority: 80,
      dismissalId: `${trip.id}_cost_per_adult`,
    }
  },
}

/**
 * Insight 4: Country Comparison
 */
const countryComparisonInsight: InsightEvaluator = {
  isEligible: (trip, expenses) => {
    const countries = new Set(expenses.map(e => e.country))
    return countries.size >= 2
  },
  calculate: (trip, expenses) => {
    // Calculate daily average per country
    const countryData: Record<string, { total: number; days: Set<string> }> = {}
    
    expenses.forEach(e => {
      if (!countryData[e.country]) {
        countryData[e.country] = { total: 0, days: new Set() }
      }
      countryData[e.country].total += e.convertedAmount || 0
      countryData[e.country].days.add(e.date)
    })
    
    // Calculate daily averages
    const countryAverages = Object.entries(countryData).map(([country, data]) => ({
      country,
      dailyAvg: data.days.size > 0 ? data.total / data.days.size : 0,
    }))
    
    if (countryAverages.length < 2) return null
    
    // Sort by daily average
    countryAverages.sort((a, b) => b.dailyAvg - a.dailyAvg)
    
    const highest = countryAverages[0]
    const lowest = countryAverages[countryAverages.length - 1]
    
    // Guard against division by zero or invalid values
    if (lowest.dailyAvg <= 0 || !isFinite(lowest.dailyAvg) || !isFinite(highest.dailyAvg)) return null
    
    const difference = ((highest.dailyAvg - lowest.dailyAvg) / lowest.dailyAvg) * 100
    
    // Guard against absurd percentages
    if (!isFinite(difference) || difference > 300) return null
    
    // Score higher if there's a significant difference
    const score = difference >= 40 ? 95 : difference >= 20 ? 80 : 60
    
    // Only show if meaningful difference
    if (difference < 15) return null
    
    return {
      id: "country_comparison",
      type: "country_comparison",
      titleKey: "insights.countryComparisonTitle",
      value: `${Math.round(difference)}%`,
      comparisonKey: "insights.costsDifference",
      comparisonParams: {
        country1: highest.country,
        country2: lowest.country,
        percent: Math.round(difference).toString(),
      },
      score,
      priority: difference >= 40 ? 100 : 85,
      dismissalId: `${trip.id}_country_comparison_${highest.country}_${lowest.country}`,
    }
  },
}

/**
 * Insight 5: Expense Concentration
 */
const expenseConcentrationInsight: InsightEvaluator = {
  isEligible: (trip, expenses) => {
    return expenses.length >= 5
  },
  calculate: (trip, expenses) => {
    const sorted = [...expenses].sort((a, b) => (b.convertedAmount || 0) - (a.convertedAmount || 0))
    const total = expenses.reduce((sum, e) => sum + (e.convertedAmount || 0), 0)
    
    // Guard against invalid total
    if (total <= 0 || !isFinite(total)) return null
    
    const top20Count = Math.max(1, Math.ceil(expenses.length * 0.2))
    const top20Total = sorted.slice(0, top20Count).reduce((sum, e) => sum + (e.convertedAmount || 0), 0)
    
    const percentage = (top20Total / total) * 100
    
    // Guard against invalid percentage
    if (!isFinite(percentage) || percentage > 100) return null
    
    // Score higher if top expenses dominate
    const score = percentage >= 70 ? 88 : percentage >= 60 ? 75 : 55
    
    // Only show if meaningful concentration
    if (percentage < 55) return null
    
    return {
      id: "expense_concentration",
      type: "expense_concentration",
      titleKey: "insights.expenseConcentrationTitle",
      value: `${Math.round(percentage)}%`,
      comparisonKey: "insights.fewLargeExpenses",
      score,
      priority: percentage >= 70 ? 92 : 77,
      dismissalId: `${trip.id}_expense_concentration`,
    }
  },
}

/**
 * All available insight evaluators
 */
const allEvaluators: InsightEvaluator[] = [
  dailySpendInsight,
  categorySkewInsight,
  costPerAdultInsight,
  countryComparisonInsight,
  expenseConcentrationInsight,
]

/**
 * Generate insights for a trip
 * 
 * @param trip - The trip to analyze
 * @param expenses - All expenses for the trip
 * @returns All generated insights, sorted by priority
 */
export function generateInsights(trip: Trip, expenses: Expense[]): Insight[] {
  if (expenses.length === 0) {
    return []
  }
  
  const insights: Insight[] = []
  
  // Evaluate all eligible insights
  for (const evaluator of allEvaluators) {
    if (evaluator.isEligible(trip, expenses)) {
      const insight = evaluator.calculate(trip, expenses)
      if (insight) {
        insights.push(insight)
      }
    }
  }
  
  // Sort by priority (highest first)
  insights.sort((a, b) => b.priority - a.score)
  return insights
}

/**
 * Select the single best insight to display, considering dismissal state
 * 
 * @param insights - All available insights
 * @param dismissedInsights - Set of dismissed insight IDs with timestamps
 * @returns The best insight to display, or null if none available
 */
export function selectInsightToDisplay(
  insights: Insight[],
  dismissedInsights: Map<string, number>
): Insight | null {
  if (insights.length === 0) return null
  
  const now = Date.now()
  const DISMISSAL_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  
  // Filter out recently dismissed insights
  const eligibleInsights = insights.filter(insight => {
    const dismissedAt = dismissedInsights.get(insight.dismissalId)
    if (!dismissedAt) return true
    return (now - dismissedAt) > DISMISSAL_DURATION
  })
  
  // Return highest priority eligible insight
  return eligibleInsights.length > 0 ? eligibleInsights[0] : null
}

