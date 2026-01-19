import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"

export interface TripAccessResult {
  hasAccess: boolean
  isOwner: boolean
  userRole: "owner" | "editor" | "viewer" | null
  userId: string
  userEmail: string
}

/**
 * Verify user has access to a trip based on email-based membership
 * Returns access info or redirects to error page
 */
export async function verifyTripAccess(tripId: string): Promise<TripAccessResult> {
  const session = await auth()
  
  if (!session?.user?.id || !session.user.email) {
    redirect("/auth/login")
  }

  const userId = session.user.id
  const userEmail = session.user.email

  // Check if user is owner
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { ownerId: true },
  })

  if (!trip) {
    redirect("/app")
  }

  if (trip.ownerId === userId) {
    return {
      hasAccess: true,
      isOwner: true,
      userRole: "owner",
      userId,
      userEmail,
    }
  }

  // Check if user is a member via TripMember table
  const member = await prisma.tripMember.findFirst({
    where: {
      tripId,
      userId,
    },
  })

  if (member) {
    return {
      hasAccess: true,
      isOwner: false,
      userRole: member.role.toLowerCase() as "editor" | "viewer",
      userId,
      userEmail,
    }
  }

  // No access - check if there's an invitation for this email
  const invitation = await prisma.tripInvitation.findFirst({
    where: {
      tripId,
      invitedEmail: userEmail.toLowerCase(),
      expiresAt: { gt: new Date() },
    },
  })

  if (invitation) {
    // Redirect to join page
    redirect(`/join/${invitation.id}`)
  }

  // No access at all
  return {
    hasAccess: false,
    isOwner: false,
    userRole: null,
    userId,
    userEmail,
  }
}

/**
 * Check if user has access without redirecting
 */
export async function checkTripAccess(tripId: string): Promise<TripAccessResult | null> {
  const session = await auth()
  
  if (!session?.user?.id || !session.user.email) {
    return null
  }

  const userId = session.user.id
  const userEmail = session.user.email

  // Check if user is owner
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { ownerId: true },
  })

  if (!trip) {
    return null
  }

  if (trip.ownerId === userId) {
    return {
      hasAccess: true,
      isOwner: true,
      userRole: "owner",
      userId,
      userEmail,
    }
  }

  // Check if user is a member
  const member = await prisma.tripMember.findFirst({
    where: {
      tripId,
      userId,
    },
  })

  if (member) {
    return {
      hasAccess: true,
      isOwner: false,
      userRole: member.role.toLowerCase() as "editor" | "viewer",
      userId,
      userEmail,
    }
  }

  return {
    hasAccess: false,
    isOwner: false,
    userRole: null,
    userId,
    userEmail,
  }
}

