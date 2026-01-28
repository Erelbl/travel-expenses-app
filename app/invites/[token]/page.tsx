import { redirect } from "next/navigation"
import { Users, AlertCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { t as translateFn, type Locale } from "@/lib/i18n"
import { headers } from "next/headers"

interface PageProps {
  params: Promise<{ token: string }>
}

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
    redirect(`/auth/login?callbackUrl=/invites/${token}`)
  }

  // Check email match if invitedEmail exists
  if (invitation.invitedEmail) {
    const invitedEmail = invitation.invitedEmail.toLowerCase()
    const currentEmail = session.user.email.toLowerCase()

    if (invitedEmail !== currentEmail) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {t("join.emailMismatch")}
              </h2>
              <div className="space-y-4 text-center">
                <p className="text-slate-600">
                  {t("join.inviteSentTo")}: <strong>{invitation.invitedEmail}</strong>
                </p>
                <p className="text-slate-600">
                  {t("join.signedInAs")}: <strong>{session.user.email}</strong>
                </p>
                <p className="text-sm text-slate-500">
                  {t("join.pleaseSignInCorrect")}
                </p>
              </div>
              <div className="flex flex-col gap-3 mt-6">
                <Link href="/auth/signout">
                  <Button variant="outline" className="w-full">
                    {t("join.signOutAndTryAgain")}
                  </Button>
                </Link>
                <Link href="/trips">
                  <Button variant="ghost" className="text-slate-500">
                    {t("join.goToDashboard")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  // Auto-accept: user is authenticated and email matches (or no email required)
  console.log(`[INVITE_ACCEPT] start token=${token} userId=${session.user.id} email=${session.user.email}`)

  try {
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

    // Mark invitation as accepted
    await prisma.tripInvitation.update({
      where: { token },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        invitedUserId: session.user.id,
      },
    })

    console.log(`[INVITE_ACCEPT] success tripId=${invitation.tripId} membershipUpserted=true userId=${session.user.id}`)

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
