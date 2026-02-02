import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { invitationsRepository } from "@/lib/data/prisma/invitations-prisma.repository"
import { revalidatePath } from "next/cache"

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

    // Email validation logic
    const invitedEmail = invitation.invitedEmail?.toLowerCase() || null
    const currentEmail = session.user.email?.toLowerCase()
    
    if (!currentEmail) {
      return NextResponse.json(
        { error: "User email not available" },
        { status: 401 }
      )
    }
    
    // Log validation details
    console.log(`[INVITE_EMAIL_API] token=${token} invitedEmail=${invitedEmail} currentEmail=${currentEmail}`)

    // Verify email matches ONLY if this is an email-specific invite
    if (invitedEmail && invitedEmail !== currentEmail) {
      // This invite was sent to a specific email address and current user doesn't match
      console.log(`[INVITE_EMAIL_API] token=${token} allow=false reason=email_mismatch`)
      
      return NextResponse.json(
        {
          error: "Email mismatch",
          message: `This invitation was sent specifically to ${invitedEmail}. Please sign in with that email to accept.`,
        },
        { status: 403 }
      )
    }
    
    // If no invitedEmail (link-based invite) OR email matches, allow acceptance
    const allowReason = invitedEmail ? "email_match" : "link_based_no_restriction"
    console.log(`[INVITE_EMAIL_API] token=${token} invitedEmail=${invitedEmail} currentEmail=${currentEmail} allow=true reason=${allowReason}`)

    console.log(`[INVITE_ACCEPT_API] Creating TripMember: tripId=${invitation.tripId} userId=${session.user.id} role=${invitation.role}`)
    
    // Upsert membership (single source of truth for shared access)
    const membership = await prisma.tripMember.upsert({
      where: {
        tripId_userId: {
          tripId: invitation.tripId,
          userId: session.user.id,
        },
      },
      update: {
        role: invitation.role,
      },
      create: {
        tripId: invitation.tripId,
        userId: session.user.id,
        role: invitation.role,
      },
    })

    const wasExisting = membership.createdAt < new Date(Date.now() - 1000) // Created more than 1 sec ago
    console.log(`[INVITE_ACCEPT_API] TripMember created/updated: id=${membership.id} wasExisting=${wasExisting}`)

    // Mark invitation as accepted
    await invitationsRepository.acceptInvitation(token, session.user.id)

    // Invalidate caches so user sees the new trip immediately
    // revalidatePath invalidates both the route cache and data cache (including unstable_cache)
    revalidatePath('/trips', 'page')
    revalidatePath(`/trips/${invitation.tripId}`, 'page')
    revalidatePath('/app', 'layout') // Invalidate layout cache to refresh trip list
    
    console.log(`[INVITE_ACCEPT_API] Success: tripId=${invitation.tripId} userId=${session.user.id} membershipId=${membership.id} alreadyMember=${wasExisting} - Cache invalidated`)

    return NextResponse.json({
      tripId: invitation.tripId,
      alreadyMember: wasExisting,
    })
  } catch (error) {
    console.error("Failed to accept invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

