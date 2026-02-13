/**
 * Centralized billing and plan management module
 * Single source of truth for plan logic across the application
 * 
 * This module provides:
 * - Plan type definitions and normalization
 * - Plan ranking and comparison
 * - User plan fetching from database
 * - Feature entitlement checks
 * - Plan metadata from hardcoded definitions (lib/plans.ts)
 * 
 * Usage:
 * - Server-side: Import and use directly
 * - Client-side: Use lightweight helpers that work with session data
 */

import { prisma } from "@/lib/db"
import { plans as HARDCODED_PLANS, PLAN_IDS, type PlanId as PlanIdFromPlans } from "@/lib/plans"

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Standardized plan tier enum
 * These are the ONLY valid plan values in the system
 * Re-export from lib/plans.ts for consistency
 */
export type UserPlan = PlanIdFromPlans

/**
 * Plan ranking for comparison (higher = more features)
 */
const PLAN_RANK: Record<UserPlan, number> = {
  free: 0,
  plus: 1,
  pro: 2,
}

/**
 * Plan metadata structure
 */
export interface PlanMetadata {
  key: UserPlan
  name: string
  priceMonthly: number | null
  priceYearly: number | null
  features: Record<string, boolean | string | number>
}

// ============================================================================
// Plan Normalization
// ============================================================================

/**
 * Normalize unknown input to a valid UserPlan
 * Handles case-insensitive matching, null, undefined, empty strings
 * IMPORTANT: This is a runtime guard that coerces invalid plans to "free"
 * 
 * @param input - Any input to normalize
 * @returns Valid UserPlan (defaults to "free" for unknown inputs)
 */
export function normalizePlan(input: unknown): UserPlan {
  if (!input) {
    return "free"
  }

  if (typeof input !== "string") {
    console.warn(`[Billing] Invalid plan type (${typeof input}), defaulting to "free"`)
    return "free"
  }

  const normalized = input.toLowerCase().trim()

  // Check against PLAN_IDS constant (single source of truth)
  if (PLAN_IDS.includes(normalized as UserPlan)) {
    return normalized as UserPlan
  }

  // Legacy "traveler" plan → migrate to "plus"
  if (normalized === "traveler") {
    console.warn(`[Billing] Legacy plan "traveler" detected, normalizing to "plus"`)
    return "plus"
  }

  // Unknown plan warning
  if (input.trim() !== "") {
    console.warn(`[Billing] Unknown plan string: "${input}", defaulting to "free"`)
  }

  return "free"
}

// ============================================================================
// Plan Comparison
// ============================================================================

/**
 * Check if a plan meets or exceeds the required tier
 * 
 * @example
 * hasAtLeast("pro", "plus") // true (pro >= plus)
 * hasAtLeast("plus", "pro") // false (plus < pro)
 * hasAtLeast("plus", "plus") // true (plus >= plus)
 */
export function hasAtLeast(userPlan: UserPlan, requiredPlan: UserPlan): boolean {
  return PLAN_RANK[userPlan] >= PLAN_RANK[requiredPlan]
}

/**
 * Check if user plan exactly matches target
 */
export function isPlan(userPlan: UserPlan, targetPlan: UserPlan): boolean {
  return userPlan === targetPlan
}

// ============================================================================
// Database Access
// ============================================================================

/**
 * Fetch user's plan from database by userId
 * Returns normalized plan (never null)
 * 
 * @param userId - User ID to fetch plan for
 * @returns Normalized UserPlan
 * @throws Error if user not found
 */
export async function getUserPlanByUserId(userId: string): Promise<UserPlan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })

  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }

  return normalizePlan(user.plan)
}

/**
 * Fetch user's effective plan (with admin override)
 * Admins are always treated as PRO
 * 
 * @param userId - User ID to fetch plan for
 * @returns Effective UserPlan (admins always get "pro")
 * @throws Error if user not found
 */
export async function getEffectivePlanForUser(userId: string): Promise<UserPlan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, isAdmin: true },
  })

  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }

  // Admins always get pro features
  if (user.isAdmin) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Billing] Admin bypass: user ${userId} → effective plan: PRO`)
    }
    return "pro"
  }

  return normalizePlan(user.plan)
}

// ============================================================================
// Plan Metadata
// ============================================================================

/**
 * Get all plans with their metadata from hardcoded definitions
 * This serves as the "plans table" until we migrate to a real DB table
 * 
 * @returns Array of plan metadata (always returns free/plus/pro)
 */
export async function getPlansFromDb(): Promise<PlanMetadata[]> {
  // Use hardcoded plans from lib/plans.ts as the source of truth
  const plansMetadata: PlanMetadata[] = HARDCODED_PLANS.map((plan) => ({
    key: plan.id as UserPlan,
    name: plan.name,
    priceMonthly: plan.priceYearly > 0 ? Math.round((plan.priceYearly / 12) * 100) / 100 : null,
    priceYearly: plan.priceYearly > 0 ? plan.priceYearly : null,
    features: {
      // Feature flags derived from hardcoded plan definitions
      exportReports: plan.id !== "free",
      scanReceipts: plan.id !== "free",
      receiptScanLimit: plan.id === "free" ? 0 : plan.id === "plus" ? 10 : Infinity,
      shareTrips: plan.id !== "free",
      unlimitedTrips: plan.id !== "free",
      advancedInsights: plan.id !== "free",
      prioritySupport: plan.id === "pro",
    },
  }))

  // Ensure we always have all three plans
  const requiredPlans: UserPlan[] = ["free", "plus", "pro"]
  const missingPlans = requiredPlans.filter(
    (p) => !plansMetadata.some((plan) => plan.key === p)
  )

  // Fallback for missing plans (should never happen with our hardcoded data)
  if (missingPlans.length > 0) {
    console.warn(`[Billing] Missing plan definitions: ${missingPlans.join(", ")}`)
    missingPlans.forEach((planKey) => {
      plansMetadata.push({
        key: planKey,
        name: planKey.charAt(0).toUpperCase() + planKey.slice(1),
        priceMonthly: null,
        priceYearly: null,
        features: {
          exportReports: planKey !== "free",
          scanReceipts: planKey !== "free",
          receiptScanLimit: planKey === "free" ? 0 : planKey === "plus" ? 10 : Infinity,
          shareTrips: planKey !== "free",
          unlimitedTrips: planKey !== "free",
          advancedInsights: planKey !== "free",
          prioritySupport: planKey === "pro",
        },
      })
    })
  }

  return plansMetadata
}

/**
 * Get metadata for a specific plan
 */
export async function getPlanMetadata(planKey: UserPlan): Promise<PlanMetadata | null> {
  const plans = await getPlansFromDb()
  return plans.find((p) => p.key === planKey) || null
}

// ============================================================================
// Feature Gating
// ============================================================================

/**
 * Known feature keys in the system
 */
export type FeatureKey = 
  | "exportReports"
  | "scanReceipts"
  | "shareTrips"
  | "unlimitedTrips"
  | "advancedInsights"
  | "prioritySupport"

/**
 * Check if a specific feature is enabled for a user
 * 
 * @param userId - User ID to check
 * @param featureKey - Feature to check (e.g., "exportReports")
 * @returns true if user's plan includes this feature
 */
export async function isFeatureEnabledForUser(
  userId: string,
  featureKey: FeatureKey
): Promise<boolean> {
  const effectivePlan = await getEffectivePlanForUser(userId)
  const planMetadata = await getPlanMetadata(effectivePlan)

  if (!planMetadata) {
    console.error(`[Billing] No metadata for plan: ${effectivePlan}`)
    return false
  }

  const featureValue = planMetadata.features[featureKey]

  // Treat truthy values as enabled (true, numbers > 0, non-empty strings)
  if (typeof featureValue === "boolean") {
    return featureValue
  }
  if (typeof featureValue === "number") {
    return featureValue > 0
  }
  if (typeof featureValue === "string") {
    return featureValue.length > 0
  }

  return false
}

/**
 * Check if user can access a feature that requires a minimum plan
 * 
 * @param userId - User ID to check
 * @param requiredPlan - Minimum plan required
 * @returns true if user's plan meets or exceeds required plan
 */
export async function hasMinimumPlan(
  userId: string,
  requiredPlan: UserPlan
): Promise<boolean> {
  const effectivePlan = await getEffectivePlanForUser(userId)
  return hasAtLeast(effectivePlan, requiredPlan)
}

// ============================================================================
// Client-safe Helpers (for use in server components that pass to client)
// ============================================================================

/**
 * Get plan display name
 */
export function getPlanDisplayName(plan: UserPlan): string {
  const names: Record<UserPlan, string> = {
    free: "Free",
    plus: "Plus",
    pro: "Pro",
  }
  return names[plan]
}

/**
 * Get plan badge variant for UI
 */
export function getPlanBadgeVariant(plan: UserPlan): "default" | "secondary" | "destructive" {
  const variants: Record<UserPlan, "default" | "secondary" | "destructive"> = {
    free: "secondary",
    plus: "default",
    pro: "destructive",
  }
  return variants[plan]
}

