import { redirect } from "next/navigation"
import { Users, AlertCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { t as translateFn, type Locale } from "@/lib/i18n"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

interface PageProps {
  params: Promise<{ token: string }>
}

// Force dynamic rendering to ensure invite acceptance runs after login
export const dynamic = "force-dynamic"

export default async function AcceptInvitePage({ params }: PageProps) {
  const { token } = await params
  const session = await auth()
  
  // Detect locale from headers or default to English
  const headersList = await headers()
  const acceptLanguage = headersList.get("accept-language") || ""
  const locale: Locale = acceptLanguage.toLowerCase().includes("he") ? "he" : "en"
  
  const t = (key: string, params?: Record<string, string | number>) => translateFn(key, locale, params)

  // Get invitation
  const invitation = await prisma.tripInvitation.findUnique({
    where: { token },
    include: {
      trip: {
        select: {
          id: true,
          name: true,
          owner: { select: { name: true } },
        },
      },
    },
  })

  // Check if invitation exists and is valid
  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t("join.linkInvalid")}
            </h2>
            <p className="text-slate-600 mb-6">
              {t("join.linkInvalidDesc")}
            </p>
            <Link href="/trips">
              <Button variant="outline">{t("join.goToTrips")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if expired
  if (invitation.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t("join.linkExpired")}
            </h2>
            <p className="text-slate-600 mb-6">
              {t("join.linkExpiredDesc")}
            </p>
            <Link href="/trips">
              <Button variant="outline">{t("join.goToTrips")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if revoked
  if (invitation.status === "REVOKED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t("join.linkRevoked")}
            </h2>
            <p className="text-slate-600 mb-6">
              {t("join.linkRevokedDesc")}
            </p>
            <Link href="/trips">
              <Button variant="outline">{t("join.goToTrips")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if already accepted
  if (invitation.status === "ACCEPTED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t("join.alreadyAccepted")}
            </h2>
            <p className="text-slate-600 mb-6">
              {t("join.alreadyAcceptedDesc")}
            </p>
            <Link href={`/trips/${invitation.tripId}`}>
              <Button>{t("join.goToTrip")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not authenticated - redirect to login
  if (!session?.user?.id || !session?.user?.email) {
    console.log(`[INVITE] redirect_to_signin token=${token} callbackUrl=/invites/${token}`)
    redirect(`/auth/login?callbackUrl=/invites/${token}`)
  }
  
  console.log(`[INVITE] authenticated_return token=${token} userId=${session.user.id} email=${session.user.email}`)

  // Auto-accept: user is authenticated
  console.log(`[INVITE] starting_acceptance token=${token} userId=${session.user.id} email=${session.user.email} tripId=${invitation.tripId}`)

  try {
    console.log(`[INVITE] creating_tripmember tripId=${invitation.tripId} userId=${session.user.id} role=${invitation.role}`)
    
    // Upsert membership (single source of truth for shared access)
    const membership = await prisma.tripMember.upsert({
      where: {
        tripId_userId: {
          tripId: invitation.tripId,
          userId: session.user.id,
        },
      },
      update: {
        role: invitation.role, // Update role if already exists
      },
      create: {
        tripId: invitation.tripId,
        userId: session.user.id,
        role: invitation.role,
      },
    })

    const wasExisting = membership.createdAt < new Date(Date.now() - 1000)
    console.log(`[INVITE] tripmember_created id=${membership.id} wasExisting=${wasExisting}`)

    // Mark invitation as accepted
    await prisma.tripInvitation.update({
      where: { token },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        invitedUserId: session.user.id,
      },
    })

    // Invalidate caches so user sees the new trip immediately
    // revalidatePath invalidates both the route cache and data cache (including unstable_cache)
    revalidatePath('/trips', 'page')
    revalidatePath(`/trips/${invitation.tripId}`, 'page')
    revalidatePath('/app', 'layout') // Invalidate layout cache to refresh trip list
    
    console.log(`[INVITE] accepted token=${token} tripId=${invitation.tripId} userId=${session.user.id} membershipId=${membership.id} - redirecting`)

    // Redirect to trip
    redirect(`/trips/${invitation.tripId}`)
  } catch (error) {
    console.error("[INVITE_ACCEPT] error:", error)
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t("join.error")}
            </h2>
            <p className="text-slate-600 mb-6">
              {t("join.errorDesc")}
            </p>
            <Link href="/trips">
              <Button variant="outline">{t("join.goToTrips")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
}
