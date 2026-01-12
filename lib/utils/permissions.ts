import { Trip, TripMember, MemberRole } from "@/lib/schemas/trip.schema"
import { Expense } from "@/lib/schemas/expense.schema"

/**
 * Permission utilities for shared trips
 */

// Storage key for current user's member ID per trip
const CURRENT_USER_KEY = "travel-expenses:current-user"

interface CurrentUserStore {
  [tripId: string]: string // tripId -> memberId
}

/**
 * Get current user's member ID for a trip
 */
export function getCurrentUserMemberId(tripId: string): string | null {
  if (typeof window === "undefined") return null
  
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY)
    if (!data) return null
    const store: CurrentUserStore = JSON.parse(data)
    return store[tripId] || null
  } catch {
    return null
  }
}

/**
 * Set current user's member ID for a trip
 */
export function setCurrentUserMemberId(tripId: string, memberId: string): void {
  if (typeof window === "undefined") return
  
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY)
    const store: CurrentUserStore = data ? JSON.parse(data) : {}
    store[tripId] = memberId
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(store))
  } catch {
    // Ignore errors
  }
}

/**
 * Get current user's member object for a trip
 */
export function getCurrentUserMember(trip: Trip): TripMember | null {
  const memberId = getCurrentUserMemberId(trip.id)
  if (!memberId) {
    // If no current user set, default to first owner
    const owner = trip.members.find((m) => m.role === "owner")
    if (owner) {
      setCurrentUserMemberId(trip.id, owner.id)
      return owner
    }
    return trip.members[0] || null
  }
  return trip.members.find((m) => m.id === memberId) || null
}

/**
 * Check if current user can add expenses
 */
export function canAddExpense(trip: Trip): boolean {
  const member = getCurrentUserMember(trip)
  if (!member) return false
  return member.role === "owner" || member.role === "editor"
}

/**
 * Check if current user can edit a specific expense
 * - Owner can edit any expense
 * - Editor can only edit expenses they created
 * - Viewer cannot edit
 */
export function canEditExpense(trip: Trip, expense: Expense): boolean {
  const member = getCurrentUserMember(trip)
  if (!member) return false
  
  if (member.role === "owner") return true
  if (member.role === "viewer") return false
  
  // Editor: can only edit their own expenses
  if (member.role === "editor") {
    return expense.createdByMemberId === member.id
  }
  
  return false
}

/**
 * Check if current user can delete a specific expense
 * Same rules as edit
 */
export function canDeleteExpense(trip: Trip, expense: Expense): boolean {
  return canEditExpense(trip, expense)
}

/**
 * Check if current user can manage trip (invite others, edit settings)
 */
export function canManageTrip(trip: Trip): boolean {
  const member = getCurrentUserMember(trip)
  if (!member) return false
  return member.role === "owner"
}

/**
 * Check if current user can share trip (create invites)
 * Only owner can share
 */
export function canShareTrip(trip: Trip): boolean {
  return canManageTrip(trip)
}

/**
 * Get member name by ID
 */
export function getMemberName(trip: Trip, memberId: string | undefined): string | null {
  if (!memberId) return null
  const member = trip.members.find((m) => m.id === memberId)
  return member?.name || null
}

/**
 * Get role badge color
 */
export function getRoleBadgeVariant(role: MemberRole): "default" | "secondary" | "outline" {
  switch (role) {
    case "owner":
      return "default"
    case "editor":
      return "secondary"
    case "viewer":
      return "outline"
    default:
      return "outline"
  }
}

