import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { invitationsRepository } from "@/lib/data/prisma/invitations-prisma.repository"

export async function GET(
  req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tripId } = params

    // Verify user has access to this trip
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    const invitations = await invitationsRepository.getInvitationsForTrip(tripId)
    return NextResponse.json(invitations)
  } catch (error) {
    console.error("Failed to list invitations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tripId } = params
    const body = await req.json()
    const { invitedEmail, role } = body

    if (!invitedEmail || !role) {
      return NextResponse.json(
        { error: "invitedEmail and role are required" },
        { status: 400 }
      )
    }

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
      return NextResponse.json({ error: "Not authorized to invite users" }, { status: 403 })
    }

    const invitation = await invitationsRepository.createInvitation(
      tripId,
      invitedEmail,
      role
    )

    return NextResponse.json(invitation)
  } catch (error) {
    console.error("Failed to create invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

