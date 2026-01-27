import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { invitationsRepository } from "@/lib/data/prisma/invitations-prisma.repository"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ invitationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invitationId } = await context.params

    // Get invitation
    const invitation = await invitationsRepository.getInvitation(invitationId)
    
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found or expired" }, { status: 404 })
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
            message: `This invitation is for ${invitation.invitedEmail}. Please sign in with that email address.`
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

    if (existingMember) {
      // Already a member, just redirect
      return NextResponse.json({
        tripId: invitation.tripId,
        alreadyMember: true,
      })
    }

    // Add user as trip member
    await prisma.tripMember.create({
      data: {
        tripId: invitation.tripId,
        userId: session.user.id,
        role: invitation.role.toUpperCase() as any,
      },
    })

    // Delete the invitation after successful acceptance
    await invitationsRepository.deleteInvitation(invitationId)

    return NextResponse.json({
      tripId: invitation.tripId,
      alreadyMember: false,
    })
  } catch (error) {
    console.error("Failed to accept invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

