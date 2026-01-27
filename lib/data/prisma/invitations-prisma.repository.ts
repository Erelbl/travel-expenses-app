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

export interface InvitationResult {
  invitation: TripInvitation
  emailSent: boolean
  emailError?: string
}

export class PrismaInvitationsRepository {
  async createInvitation(
    tripId: string,
    invitedEmail: string | null,
    role: MemberRole
  ): Promise<InvitationResult> {
    console.log("[INVITE_REPO] Step: normalize_email", { tripId, invitedEmail })
    const normalizedEmail = invitedEmail?.toLowerCase() || ""
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    let emailSent = false
    let emailError: string | undefined

    console.log("[INVITE_REPO] Step: check_existing_invite")
    try {
      // Check if pending invite already exists
      const existingInvite = await prisma.tripInvitation.findFirst({
        where: {
          tripId,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      })

      if (existingInvite) {
        console.log("[INVITE_REPO] Found existing invite, reusing:", existingInvite.id)
        
        // Try to send email if provided
        if (normalizedEmail) {
          const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          const acceptUrl = `${appUrl}/invites/${existingInvite.token}`
          
          const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            select: {
              name: true,
              owner: {
                select: { name: true, email: true },
              },
            },
          })
          
          if (trip) {
            console.log("[INVITE_REPO] Step: resend_email")
            try {
              await sendInviteEmail({
                to: normalizedEmail,
                tripName: trip.name,
                inviterName: trip.owner.name || trip.owner.email || "A friend",
                role: existingInvite.role.toLowerCase(),
                acceptUrl,
              })
              console.log("[INVITE_REPO] Email resent successfully")
              emailSent = true
            } catch (err) {
              console.error("[INVITE_REPO] Failed to resend email:", err)
              emailError = err instanceof Error ? err.message : "Email send failed"
            }
          }
        }
        
        return {
          invitation: {
            id: existingInvite.id,
            tripId: existingInvite.tripId,
            invitedEmail: existingInvite.invitedEmail,
            role: existingInvite.role.toLowerCase() as MemberRole,
            token: existingInvite.token,
            status: existingInvite.status,
            createdAt: existingInvite.createdAt.getTime(),
            expiresAt: existingInvite.expiresAt.getTime(),
            acceptedAt: existingInvite.acceptedAt?.getTime() ?? null,
          },
          emailSent,
          emailError,
        }
      }
    } catch (checkError) {
      console.error("[INVITE_REPO] Error checking existing invite:", checkError)
      // Continue to create new one
    }

    console.log("[INVITE_REPO] Step: check_user_exists")
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })
    console.log("[INVITE_REPO] User exists:", !!user)

    console.log("[INVITE_REPO] Step: create_db_record")
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
    console.log("[INVITE_REPO] DB record created, token:", invitation.token)

    // Verify env vars for email
    console.log("[INVITE_REPO] Step: check_env_vars")
    const resendApiKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.EMAIL_FROM
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
    
    if (!resendApiKey) {
      console.error("[INVITE_REPO] RESEND_API_KEY is not set!")
      throw new Error("RESEND_API_KEY environment variable is required")
    }
    if (!emailFrom) {
      console.warn("[INVITE_REPO] EMAIL_FROM is not set, will use default")
    }
    if (!appUrl) {
      console.warn("[INVITE_REPO] NEXTAUTH_URL/NEXT_PUBLIC_APP_URL not set, using localhost")
    }
    
    console.log("[INVITE_REPO] Env check:", {
      hasResendKey: !!resendApiKey,
      emailFrom: emailFrom || "default",
      appUrl: appUrl || "localhost:3000",
    })

    // Send invite email
    const acceptUrl = `${appUrl || "http://localhost:3000"}/invites/${invitation.token}`
    
    // Send email if provided
    if (normalizedEmail) {
      console.log("[INVITE_REPO] Step: send_email", { acceptUrl })
      try {
        await sendInviteEmail({
          to: normalizedEmail,
          tripName: invitation.trip.name,
          inviterName: invitation.trip.owner.name || invitation.trip.owner.email || "A friend",
          role: invitation.role.toLowerCase(),
          acceptUrl,
        })
        console.log("[INVITE_REPO] Email sent successfully")
        emailSent = true
      } catch (error) {
        console.error("[INVITE_REPO] Failed to send invite email:", {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : String(error),
          to: normalizedEmail,
          acceptUrl,
        })
        emailError = error instanceof Error ? error.message : "Email send failed"
      }
    }

    return {
      invitation: {
        id: invitation.id,
        tripId: invitation.tripId,
        invitedEmail: invitation.invitedEmail,
        role: invitation.role.toLowerCase() as MemberRole,
        token: invitation.token,
        status: invitation.status,
        createdAt: invitation.createdAt.getTime(),
        expiresAt: invitation.expiresAt.getTime(),
        acceptedAt: invitation.acceptedAt?.getTime() ?? null,
      },
      emailSent,
      emailError,
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

  async revokeInvitation(token: string): Promise<void> {
    await prisma.tripInvitation.update({
      where: { token },
      data: {
        status: "REVOKED",
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

