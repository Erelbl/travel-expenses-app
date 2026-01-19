import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await context.params

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

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      await prisma.tripInvitation.delete({ where: { id: invitationId } })
      return NextResponse.json({ error: "Invitation expired" }, { status: 410 })
    }

    return NextResponse.json({
      id: invitation.id,
      tripId: invitation.tripId,
      tripName: invitation.trip.name,
      invitedEmail: invitation.invitedEmail,
      invitedBy: invitation.trip.owner.name || "Trip owner",
      role: invitation.role.toLowerCase(),
      createdAt: invitation.createdAt.getTime(),
      expiresAt: invitation.expiresAt.getTime(),
    })
  } catch (error) {
    console.error("Failed to get invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

