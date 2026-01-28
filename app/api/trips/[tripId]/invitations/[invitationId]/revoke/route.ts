import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { invitationsRepository } from "@/lib/data/prisma/invitations-prisma.repository"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tripId: string; invitationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tripId, invitationId } = await context.params

    // Verify user is owner or editor of this trip
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
                role: { in: ["OWNER", "EDITOR"] }
              }
            }
          },
        ],
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Get the invitation to revoke (by token, which is the invitationId)
    const invitation = await prisma.tripInvitation.findUnique({
      where: { token: invitationId },
    })

    if (!invitation || invitation.tripId !== tripId) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    await invitationsRepository.revokeInvitation(invitationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to revoke invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

