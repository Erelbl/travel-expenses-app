import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { invitationsRepository } from "@/lib/data/prisma/invitations-prisma.repository"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await context.params

    const invitation = await prisma.tripInvitation.findUnique({
      where: { token },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation expired" }, { status: 410 })
    }

    // Check if revoked
    if (invitation.status === "REVOKED") {
      return NextResponse.json({ error: "Invitation revoked" }, { status: 410 })
    }

    // Check if already accepted
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json({ error: "Invitation already used" }, { status: 410 })
    }

    // Verify email matches (only if invitedEmail was specified)
    if (invitation.invitedEmail) {
      const invitedEmail = invitation.invitedEmail.toLowerCase()
      const currentEmail = session.user.email?.toLowerCase()
      
      if (!currentEmail) {
        return NextResponse.json(
          { error: "User email not available" },
          { status: 401 }
        )
      }

      if (invitedEmail !== currentEmail) {
        return NextResponse.json(
          {
            error: "Email mismatch",
            message: `This invitation is for ${invitedEmail}, but you are signed in as ${currentEmail}`,
          },
          { status: 403 }
        )
      }
    }

    // Check if user is already a member
    const existingMember = await prisma.tripMember.findFirst({
      where: {
        tripId: invitation.tripId,
        userId: session.user.id,
      },
    })

    let alreadyMember = false
    let createdMembership = false
    if (existingMember) {
      alreadyMember = true
    } else {
      // Add user as member
      await prisma.tripMember.create({
        data: {
          tripId: invitation.tripId,
          userId: session.user.id,
          role: invitation.role,
        },
      })
      createdMembership = true
      console.log(`[INVITE_ACCEPT] Created TripMember for user ${session.user.id} on trip ${invitation.tripId}`)
    }

    // Mark invitation as accepted
    await invitationsRepository.acceptInvitation(token, session.user.id)

    console.log(`[INVITE_ACCEPT] Accepted invite ${token}, tripId: ${invitation.tripId}, userId: ${session.user.id}, alreadyMember: ${alreadyMember}, createdMembership: ${createdMembership}`)

    return NextResponse.json({
      tripId: invitation.tripId,
      alreadyMember,
    })
  } catch (error) {
    console.error("Failed to accept invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

