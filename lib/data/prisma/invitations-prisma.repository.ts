import { prisma } from "@/lib/db"
import { MemberRole } from "@/lib/schemas/trip.schema"

export interface TripInvitation {
  id: string
  tripId: string
  invitedEmail: string
  role: MemberRole
  createdAt: number
  expiresAt: number
}

export class PrismaInvitationsRepository {
  async createInvitation(
    tripId: string,
    invitedEmail: string,
    role: MemberRole
  ): Promise<TripInvitation> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const invitation = await prisma.tripInvitation.create({
      data: {
        tripId,
        invitedEmail: invitedEmail.toLowerCase(),
        role: role.toUpperCase() as any,
        expiresAt,
      },
    })

    return {
      id: invitation.id,
      tripId: invitation.tripId,
      invitedEmail: invitation.invitedEmail,
      role: invitation.role.toLowerCase() as MemberRole,
      createdAt: invitation.createdAt.getTime(),
      expiresAt: invitation.expiresAt.getTime(),
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
      createdAt: invitation.createdAt.getTime(),
      expiresAt: invitation.expiresAt.getTime(),
    }
  }

  async getInvitationsForTrip(tripId: string): Promise<TripInvitation[]> {
    const invitations = await prisma.tripInvitation.findMany({
      where: {
        tripId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    return invitations.map((inv) => ({
      id: inv.id,
      tripId: inv.tripId,
      invitedEmail: inv.invitedEmail,
      role: inv.role.toLowerCase() as MemberRole,
      createdAt: inv.createdAt.getTime(),
      expiresAt: inv.expiresAt.getTime(),
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
        expiresAt: { gt: new Date() },
      },
    })

    return !!invitation
  }

  getInviteUrl(invitationId: string): string {
    if (typeof window === "undefined") {
      return `/join/${invitationId}`
    }
    return `${window.location.origin}/join/${invitationId}`
  }
}

export const invitationsRepository = new PrismaInvitationsRepository()

