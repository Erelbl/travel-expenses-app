/**
 * Centralized entitlements and plan capabilities
 * Single source of truth for feature gating
 * 
 * NOTE: This module is being replaced by lib/billing/plan.ts
 * This file is kept for backward compatibility with existing receipt scan logic
 * New feature gates should use lib/billing/plan.ts
 */

import { normalizePlan, type UserPlan } from "@/lib/billing/plan"

// Export UserPlan as PlanTier for backward compatibility
export type PlanTier = UserPlan

/**
 * Minimal user interface for entitlement checks
 * Use this to normalize Prisma User objects before passing to entitlement functions
 */
export interface EntitlementUser {
  id: string
  isAdmin: boolean
  plan?: PlanTier
  receiptScansUsed?: number
  receiptScansResetAt?: Date | null
}

/**
 * Get user's plan tier
 * Defaults to 'free' if not set
 * NOTE: This returns the actual subscription plan, not the effective plan.
 * For feature gating, use getEffectivePlan() instead.
 */
export function getUserPlan(user: EntitlementUser): PlanTier {
  return normalizePlan(user.plan)
}

/**
 * Get effective plan tier for feature gating
 * Admin users are always treated as PRO
 * This is the SINGLE SOURCE OF TRUTH for plan-based feature access
 */
export function getEffectivePlan(user: EntitlementUser): PlanTier {
  if (user.isAdmin) {
    // Debug logging in non-production environments
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Entitlements] Admin bypass: user ${user.id} → effective plan: PRO (actual: ${normalizePlan(user.plan)})`)
    }
    return "pro"
  }
  const effectivePlan = normalizePlan(user.plan)
  
  // Debug logging in non-production environments
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Entitlements] Regular user: ${user.id} → effective plan: ${effectivePlan}`)
  }
  
  return effectivePlan
}

/**
 * Get receipt scan limit for a plan
 * NOTE: This operates on plan tier, not user. For user-aware limits, use checkReceiptScanEntitlement
 */
export function getReceiptScanLimit(plan: PlanTier): number {
  switch (plan) {
    case "free":
      return 0
    case "plus":
      return 10
    case "pro":
      return Infinity
    default:
      return 0
  }
}

/**
 * Check if user can scan receipts
 * Uses effective plan (admins are treated as PRO)
 */
export function canScanReceipts(user: EntitlementUser): boolean {
  const effectivePlan = getEffectivePlan(user)
  const limit = getReceiptScanLimit(effectivePlan)

  // Free plan has no access
  if (limit === 0) {
    return false
  }

  // Pro has unlimited (includes admins)
  if (limit === Infinity) {
    return true
  }

  // Plus plan: check usage
  const used = user.receiptScansUsed || 0
  return used < limit
}

/**
 * Get remaining receipt scans for the user
 * Returns Infinity for unlimited plans (PRO) and admins
 */
export function getRemainingReceiptScans(user: EntitlementUser): number {
  const effectivePlan = getEffectivePlan(user)
  const limit = getReceiptScanLimit(effectivePlan)

  // Free plan
  if (limit === 0) {
    return 0
  }

  // Pro or unlimited (includes admins)
  if (limit === Infinity) {
    return Infinity
  }

  // Plus plan: calculate remaining
  const used = user.receiptScansUsed || 0
  return Math.max(0, limit - used)
}

/**
 * Increment receipt scan usage
 * Returns new usage count
 * Does NOT increment for PRO users (includes admins) or FREE users
 */
export function incrementReceiptScanUsage(user: EntitlementUser): number {
  const effectivePlan = getEffectivePlan(user)
  
  // Don't track for pro (unlimited, includes admins) or free (no access)
  if (effectivePlan === "pro" || effectivePlan === "free") {
    return user.receiptScansUsed || 0
  }

  // Increment for plus
  return (user.receiptScansUsed || 0) + 1
}

/**
 * Check if user needs a reset (new subscription year)
 * Placeholder logic - returns true if resetAt is more than 365 days ago
 * TODO: Integrate with actual subscription billing cycle
 */
export function needsReceiptScanReset(user: EntitlementUser): boolean {
  if (!user.receiptScansResetAt) {
    return true
  }

  const daysSinceReset = Math.floor(
    (Date.now() - user.receiptScansResetAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  return daysSinceReset >= 365
}

/**
 * Get entitlement check result with helpful message
 */
export interface EntitlementCheckResult {
  allowed: boolean
  reason?: "no_access" | "limit_reached" | "allowed"
  remaining?: number
  limit?: number
}

export function checkReceiptScanEntitlement(user: EntitlementUser): EntitlementCheckResult {
  const effectivePlan = getEffectivePlan(user)
  const limit = getReceiptScanLimit(effectivePlan)
  const used = user.receiptScansUsed || 0
  const remaining = getRemainingReceiptScans(user)

  // Debug logging in non-production environments
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Entitlements] Receipt scan check: user=${user.id}, isAdmin=${user.isAdmin}, effectivePlan=${effectivePlan}, limit=${limit}, used=${used}, remaining=${remaining}`)
  }

  // Free plan - no access
  if (limit === 0) {
    return {
      allowed: false,
      reason: "no_access",
      remaining: 0,
      limit: 0,
    }
  }

  // Pro plan - unlimited (includes admins via getEffectivePlan)
  if (limit === Infinity) {
    if (process.env.NODE_ENV !== "production" && user.isAdmin) {
      console.log(`[Entitlements] ✓ Admin bypass active: unlimited receipt scans`)
    }
    return {
      allowed: true,
      reason: "allowed",
      remaining: Infinity,
      limit: Infinity,
    }
  }

  // Plus plan - check limit
  if (used >= limit) {
    return {
      allowed: false,
      reason: "limit_reached",
      remaining: 0,
      limit,
    }
  }

  return {
    allowed: true,
    reason: "allowed",
    remaining,
    limit,
  }
}

