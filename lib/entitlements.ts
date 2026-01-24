/**
 * Centralized entitlements and plan capabilities
 * Single source of truth for feature gating
 */

export type PlanTier = "free" | "plus" | "pro"

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
 */
export function getUserPlan(user: EntitlementUser): PlanTier {
  return user.plan || "free"
}

/**
 * Get receipt scan limit for a plan
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
 * Admins always bypass limits
 */
export function canScanReceipts(user: EntitlementUser): boolean {
  // Admin bypass
  if (user.isAdmin) {
    return true
  }

  const plan = getUserPlan(user)
  const limit = getReceiptScanLimit(plan)

  // Free plan has no access
  if (limit === 0) {
    return false
  }

  // Pro has unlimited
  if (limit === Infinity) {
    return true
  }

  // Plus plan: check usage
  const used = user.receiptScansUsed || 0
  return used < limit
}

/**
 * Get remaining receipt scans for the user
 * Returns Infinity for unlimited plans or admins
 */
export function getRemainingReceiptScans(user: EntitlementUser): number {
  // Admin bypass
  if (user.isAdmin) {
    return Infinity
  }

  const plan = getUserPlan(user)
  const limit = getReceiptScanLimit(plan)

  // Free plan
  if (limit === 0) {
    return 0
  }

  // Pro or unlimited
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
 * Does NOT increment for admins
 */
export function incrementReceiptScanUsage(user: EntitlementUser): number {
  // Don't track for admins
  if (user.isAdmin) {
    return user.receiptScansUsed || 0
  }

  const plan = getUserPlan(user)
  
  // Don't track for pro (unlimited) or free (no access)
  if (plan === "pro" || plan === "free") {
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
  // Admin bypass
  if (user.isAdmin) {
    return {
      allowed: true,
      reason: "allowed",
      remaining: Infinity,
      limit: Infinity,
    }
  }

  const plan = getUserPlan(user)
  const limit = getReceiptScanLimit(plan)
  const used = user.receiptScansUsed || 0
  const remaining = getRemainingReceiptScans(user)

  // Free plan - no access
  if (limit === 0) {
    return {
      allowed: false,
      reason: "no_access",
      remaining: 0,
      limit: 0,
    }
  }

  // Pro plan - unlimited
  if (limit === Infinity) {
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

