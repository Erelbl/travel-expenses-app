import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params

    const invitation = await prisma.tripInvitation.findUnique({
      where: { token },
      include: {
        trip: {
          select: {
            id: true,
            name: true,
            owner: {
              select: { name: true, email: true },
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
      return NextResponse.json({ error: "Invitation expired" }, { status: 410 })
    }

    // Check if already accepted
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 410 })
    }

    return NextResponse.json({
      tripId: invitation.tripId,
      tripName: invitation.trip.name,
      invitedEmail: invitation.invitedEmail,
      invitedBy: invitation.trip.owner.name || invitation.trip.owner.email || "Trip owner",
      role: invitation.role.toLowerCase(),
    })
  } catch (error) {
    console.error("Failed to get invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

