/**
 * Destination-aware banner insights
 * Shows contextual, single-insight banners on trip home page
 */

import { Trip } from "@/lib/schemas/trip.schema"
import { Expense } from "@/lib/schemas/expense.schema"
import { getDaysBetween } from "@/lib/utils/format"

export interface BannerInsight {
  id: string
  type: "budget_pacing" | "family_hint"
  textKey: string
  params?: Record<string, string>
  dismissalId: string // Unique ID for dismissal tracking
  priority: number // For rotation logic
}

type CostLevel = "low" | "medium" | "high"

/**
 * Map countries to cost levels (static, simplified)
 * Based on general travel cost reputation
 */
const COUNTRY_COST_LEVELS: Record<string, CostLevel> = {
  // High cost
  CH: "high", // Switzerland
  NO: "high", // Norway
  IS: "high", // Iceland
  DK: "high", // Denmark
  SE: "high", // Sweden
  GB: "high", // UK
  JP: "high", // Japan
  AU: "high", // Australia
  SG: "high", // Singapore
  
  // Medium cost
  US: "medium", // USA
  CA: "medium", // Canada
  FR: "medium", // France
  DE: "medium", // Germany
  IT: "medium", // Italy
  ES: "medium", // Spain
  NL: "medium", // Netherlands
  AT: "medium", // Austria
  BE: "medium", // Belgium
  IL: "medium", // Israel
  KR: "medium", // South Korea
  NZ: "medium", // New Zealand
  
  // Low cost
  TH: "low", // Thailand
  VN: "low", // Vietnam
  ID: "low", // Indonesia
  MY: "low", // Malaysia
  PH: "low", // Philippines
  IN: "low", // India
  EG: "low", // Egypt
  TR: "low", // Turkey
  GR: "low", // Greece
  PT: "low", // Portugal
  PL: "low", // Poland
  CZ: "low", // Czech Republic
  HU: "low", // Hungary
  MX: "low", // Mexico
  AR: "low", // Argentina
  BR: "low", // Brazil
  CO: "low", // Colombia
  PE: "low", // Peru
  RO: "low", // Romania
  BG: "low", // Bulgaria
}

/**
 * Get cost level for a country
 */
function getCostLevel(countryCode: string | null | undefined): CostLevel {
  if (!countryCode) return "medium"
  return COUNTRY_COST_LEVELS[countryCode] || "medium"
}

/**
 * Get destination country from trip
 */
function getDestinationCountry(trip: Trip): string | null {
  // Priority 1: current country
  if (trip.currentCountry) return trip.currentCountry
  
  // Priority 2: first country in list
  if (trip.countries && trip.countries.length > 0) {
    return trip.countries[0]
  }
  
  return null
}

/**
 * Calculate days passed since trip start
 */
function getDaysPassed(startDate: string): number {
  const start = new Date(startDate)
  const today = new Date()
  const diffTime = today.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays)
}

/**
 * Insight 1: Budget pacing (destination-aware)
 */
function getBudgetPacingInsight(
  trip: Trip,
  expenses: Expense[]
): BannerInsight | null {
  // Check conditions
  if (!trip.targetBudget || trip.targetBudget <= 0) return null
  if (!trip.startDate || !trip.endDate) return null
  if (expenses.length === 0) return null
  
  // Calculate metrics
  const totalDays = getDaysBetween(trip.startDate, trip.endDate)
  const daysPassed = getDaysPassed(trip.startDate)
  const totalSpent = expenses.reduce((sum, e) => sum + (e.convertedAmount || 0), 0)
  
  // Guard against invalid values
  if (totalDays <= 0 || daysPassed <= 0 || !isFinite(totalSpent)) return null
  
  const targetPerDay = trip.targetBudget / totalDays
  const actualPerDay = totalSpent / daysPassed
  
  // Guard against invalid division
  if (targetPerDay <= 0 || !isFinite(targetPerDay) || !isFinite(actualPerDay)) return null
  
  // Determine if on/above/below pace
  const ratio = actualPerDay / targetPerDay
  
  // Guard against absurd ratios
  if (!isFinite(ratio) || ratio > 10) return null
  
  // Get destination context
  const destination = getDestinationCountry(trip)
  const costLevel = getCostLevel(destination)
  
  // Determine message based on ratio, cost level, and trip type
  let textKey: string
  let priority: number
  
  if (ratio >= 1.3) {
    // Significantly above target
    if (costLevel === "high") {
      textKey = "bannerInsights.budgetHighPaceHighCost"
    } else if (costLevel === "low") {
      textKey = "bannerInsights.budgetHighPaceLowCost"
    } else {
      textKey = "bannerInsights.budgetHighPace"
    }
    priority = 95
  } else if (ratio >= 1.1) {
    // Slightly above target
    textKey = "bannerInsights.budgetSlightlyAbove"
    priority = 80
  } else if (ratio <= 0.7) {
    // Well below target
    if (trip.tripType === "family") {
      textKey = "bannerInsights.budgetWellBelowFamily"
    } else {
      textKey = "bannerInsights.budgetWellBelow"
    }
    priority = 70
  } else if (ratio <= 0.9) {
    // Slightly below target
    textKey = "bannerInsights.budgetSlightlyBelow"
    priority = 65
  } else {
    // On pace
    textKey = "bannerInsights.budgetOnPace"
    priority = 60
  }
  
  return {
    id: "budget_pacing",
    type: "budget_pacing",
    textKey,
    params: {
      actual: Math.round(actualPerDay).toString(),
      target: Math.round(targetPerDay).toString(),
      currency: trip.baseCurrency,
    },
    dismissalId: `${trip.id}_budget_pacing`,
    priority,
  }
}

/**
 * Insight 2: Family hint
 */
function getFamilyHintInsight(trip: Trip): BannerInsight | null {
  if (trip.tripType !== "family") return null
  if (!trip.children || trip.children === 0) return null
  
  return {
    id: "family_hint",
    type: "family_hint",
    textKey: "bannerInsights.familyHint",
    dismissalId: `${trip.id}_family_hint`,
    priority: 50,
  }
}

/**
 * Generate all banner insights (no filtering)
 * 
 * @param trip - The trip to analyze
 * @param expenses - All expenses for the trip
 * @returns All banner insights sorted by priority
 */
export function generateAllBannerInsights(
  trip: Trip,
  expenses: Expense[]
): BannerInsight[] {
  const insights: BannerInsight[] = []
  
  // Priority 1: Budget pacing
  const budgetInsight = getBudgetPacingInsight(trip, expenses)
  if (budgetInsight) insights.push(budgetInsight)
  
  // Priority 2: Family hint
  const familyInsight = getFamilyHintInsight(trip)
  if (familyInsight) insights.push(familyInsight)
  
  // Sort by priority
  insights.sort((a, b) => b.priority - a.priority)
  return insights
}

/**
 * Generate ONE banner insight (by priority)
 * @deprecated Use generateAllBannerInsights + selectInsightToDisplay instead
 */
export function generateBannerInsight(
  trip: Trip,
  expenses: Expense[]
): BannerInsight | null {
  const all = generateAllBannerInsights(trip, expenses)
  return all.length > 0 ? all[0] : null
}

