import { prisma } from "@/lib/db"
import { MemberRole } from "@/lib/schemas/trip.schema"
import { sendInviteEmail } from "@/lib/email/invite-email"

export interface TripInvitation {
  id: string
  tripId: string
  invitedEmail: string
  role: MemberRole
  token: string
  status: string
  createdAt: number
  expiresAt: number
  acceptedAt: number | null
}

export class PrismaInvitationsRepository {
  async createInvitation(
    tripId: string,
    invitedEmail: string,
    role: MemberRole
  ): Promise<TripInvitation> {
    const normalizedEmail = invitedEmail.toLowerCase()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Check if pending invite already exists
    const existingInvite = await prisma.tripInvitation.findFirst({
      where: {
        tripId,
        invitedEmail: normalizedEmail,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    })

    if (existingInvite) {
      // Reuse existing pending invite
      return {
        id: existingInvite.id,
        tripId: existingInvite.tripId,
        invitedEmail: existingInvite.invitedEmail,
        role: existingInvite.role.toLowerCase() as MemberRole,
        token: existingInvite.token,
        status: existingInvite.status,
        createdAt: existingInvite.createdAt.getTime(),
        expiresAt: existingInvite.expiresAt.getTime(),
        acceptedAt: existingInvite.acceptedAt?.getTime() ?? null,
      }
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    // Create new invitation
    const invitation = await prisma.tripInvitation.create({
      data: {
        tripId,
        invitedEmail: normalizedEmail,
        invitedUserId: user?.id,
        role: role.toUpperCase() as any,
        status: "PENDING",
        expiresAt,
      },
      include: {
        trip: {
          select: {
            name: true,
            owner: {
              select: { name: true, email: true },
            },
          },
        },
      },
    })

    // Send invite email
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const acceptUrl = `${appUrl}/invites/${invitation.token}`
    
    try {
      await sendInviteEmail({
        to: normalizedEmail,
        tripName: invitation.trip.name,
        inviterName: invitation.trip.owner.name || invitation.trip.owner.email || "A friend",
        role: invitation.role.toLowerCase(),
        acceptUrl,
      })
    } catch (error) {
      console.error("Failed to send invite email:", error)
      // Continue anyway - invitation is created
    }

    return {
      id: invitation.id,
      tripId: invitation.tripId,
      invitedEmail: invitation.invitedEmail,
      role: invitation.role.toLowerCase() as MemberRole,
      token: invitation.token,
      status: invitation.status,
      createdAt: invitation.createdAt.getTime(),
      expiresAt: invitation.expiresAt.getTime(),
      acceptedAt: invitation.acceptedAt?.getTime() ?? null,
    }
  }

  async getInvitation(invitationId: string): Promise<TripInvitation | null> {
    const invitation = await prisma.tripInvitation.findUnique({
      where: { id: invitationId },
      include: {
        trip: {
          select: {
            id: true,
            name: true,
            owner: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!invitation) return null

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      // Delete expired invitation
      await prisma.tripInvitation.delete({ where: { id: invitationId } })
      return null
    }

    return {
      id: invitation.id,
      tripId: invitation.tripId,
      invitedEmail: invitation.invitedEmail,
      role: invitation.role.toLowerCase() as MemberRole,
      token: invitation.token,
      status: invitation.status,
      createdAt: invitation.createdAt.getTime(),
      expiresAt: invitation.expiresAt.getTime(),
      acceptedAt: invitation.acceptedAt?.getTime() ?? null,
    }
  }

  async getInvitationByToken(token: string): Promise<TripInvitation | null> {
    const invitation = await prisma.tripInvitation.findUnique({
      where: { token },
    })

    if (!invitation) return null

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      return null
    }

    return {
      id: invitation.id,
      tripId: invitation.tripId,
      invitedEmail: invitation.invitedEmail,
      role: invitation.role.toLowerCase() as MemberRole,
      token: invitation.token,
      status: invitation.status,
      createdAt: invitation.createdAt.getTime(),
      expiresAt: invitation.expiresAt.getTime(),
      acceptedAt: invitation.acceptedAt?.getTime() ?? null,
    }
  }

  async getInvitationsForTrip(tripId: string): Promise<TripInvitation[]> {
    const invitations = await prisma.tripInvitation.findMany({
      where: {
        tripId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    return invitations.map((inv) => ({
      id: inv.id,
      tripId: inv.tripId,
      invitedEmail: inv.invitedEmail,
      role: inv.role.toLowerCase() as MemberRole,
      token: inv.token,
      status: inv.status,
      createdAt: inv.createdAt.getTime(),
      expiresAt: inv.expiresAt.getTime(),
      acceptedAt: inv.acceptedAt?.getTime() ?? null,
    }))
  }

  async deleteInvitation(invitationId: string): Promise<void> {
    await prisma.tripInvitation.delete({
      where: { id: invitationId },
    })
  }

  async hasInvitationForEmail(tripId: string, email: string): Promise<boolean> {
    const invitation = await prisma.tripInvitation.findFirst({
      where: {
        tripId,
        invitedEmail: email.toLowerCase(),
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    })

    return !!invitation
  }

  async acceptInvitation(token: string, userId: string): Promise<void> {
    await prisma.tripInvitation.update({
      where: { token },
      data: {
        status: "ACCEPTED",
        invitedUserId: userId,
        acceptedAt: new Date(),
      },
    })
  }

  getInviteUrl(token: string): string {
    if (typeof window === "undefined") {
      return `/invites/${token}`
    }
    return `${window.location.origin}/invites/${token}`
  }
}

export const invitationsRepository = new PrismaInvitationsRepository()

