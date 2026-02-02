import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { invitationsRepository } from "@/lib/data/prisma/invitations-prisma.repository"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tripId } = await context.params

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
  context: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await context.params
  let invitedEmail = ""
  let userId = ""
  
  try {
    console.log("[INVITE] Step: auth_check, tripId:", tripId)
    const session = await auth()
    if (!session?.user?.id) {
      console.log("[INVITE] Error: unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    userId = session.user.id

    console.log("[INVITE] Step: parse_body, userId:", userId)
    const body = await req.json()
    const { invitedEmail: email, role } = body
    invitedEmail = email || ""

    if (!role) {
      console.log("[INVITE] Error: missing_role")
      return NextResponse.json(
        { error: "role is required" },
        { status: 400 }
      )
    }

    console.log("[INVITE] Step: verify_trip_access, invitedEmail:", invitedEmail)
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
      console.log("[INVITE] Error: not_authorized")
      return NextResponse.json({ error: "Not authorized to invite users" }, { status: 403 })
    }

    console.log("[INVITE] Step: before_create_invitation")
    const result = await invitationsRepository.createInvitation(
      tripId,
      invitedEmail || null,
      role
    )

    console.log("[INVITE] Step: success, token:", result.invitation.token, "emailSent:", result.emailSent)
    return NextResponse.json({
      ...result.invitation,
      emailSent: result.emailSent,
      emailError: result.emailError,
    })
  } catch (error) {
    console.error("[INVITE] Error: internal_error", {
      tripId,
      invitedEmail,
      userId,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : String(error),
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

