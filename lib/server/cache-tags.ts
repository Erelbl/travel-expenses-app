/**
 * Canonical cache tags for Next.js unstable_cache
 * 
 * CRITICAL: All expense-related cached functions MUST use expenseCacheTag()
 * and all mutation routes MUST invalidate with the same tag.
 */

export function expenseCacheTag(tripId: string): string {
  return `expenses:${tripId}`
}

export function tripCacheTag(tripId: string): string {
  return `trip:${tripId}`
}

export function userTripsCacheTag(userId: string): string {
  return `trips:${userId}`
}

