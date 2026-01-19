import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { invitationsRepository } from "@/lib/data/prisma/invitations-prisma.repository"

export async function DELETE(
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

    await invitationsRepository.deleteInvitation(invitationId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

