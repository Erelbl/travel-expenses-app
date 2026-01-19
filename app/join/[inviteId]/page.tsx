"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Users, CheckCircle, XCircle, Loader2, Mail, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MemberRole } from "@/lib/schemas/trip.schema"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface InvitationData {
  id: string
  tripId: string
  tripName: string
  invitedEmail: string
  invitedBy: string
  role: string
  createdAt: number
  expiresAt: number
}

export default function JoinTripPage() {
  const { t, locale } = useI18n()
  const params = useParams()
  const router = useRouter()
  const inviteId = params.inviteId as string
  const isRTL = locale === "he"
  const { data: session, status: sessionStatus } = useSession()

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailMismatch, setEmailMismatch] = useState(false)

  useEffect(() => {
    loadInvitation()
  }, [inviteId])

  async function loadInvitation() {
    setLoading(true)
    try {
      const res = await fetch(`/api/invitations/${inviteId}`)
      
      if (!res.ok) {
        if (res.status === 404 || res.status === 410) {
          setError("expired")
        } else {
          setError("error")
        }
        return
      }

      const data = await res.json()
      setInvitation(data)
    } catch (err) {
      console.error("Failed to load invitation:", err)
      setError("error")
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!invitation) return

    setJoining(true)
    try {
      const res = await fetch(`/api/invitations/${inviteId}/accept`, {
        method: "POST",
      })

      if (!res.ok) {
        const errorData = await res.json()
        
        if (res.status === 403 && errorData.error === "Email mismatch") {
          setEmailMismatch(true)
          toast.error(errorData.message)
        } else {
          toast.error(t("join.error"))
        }
        return
      }

      const data = await res.json()
      
      if (data.alreadyMember) {
        toast.success(t("join.welcomeBack"))
      } else {
        toast.success(t("join.success"))
      }
      
      router.push(`/app/trips/${data.tripId}`)
    } catch (err) {
      console.error("Failed to join trip:", err)
      toast.error(t("join.error"))
    } finally {
      setJoining(false)
    }
  }

  function getRoleLabel(role: MemberRole): string {
    switch (role) {
      case "owner":
        return t("settings.roleOwner")
      case "editor":
        return t("settings.roleEditor")
      case "viewer":
        return t("settings.roleViewer")
      default:
        return role
    }
  }

  function getRoleDescription(role: MemberRole): string {
    switch (role) {
      case "editor":
        return t("join.editorDesc")
      case "viewer":
        return t("join.viewerDesc")
      default:
        return ""
    }
  }

  if (loading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir={isRTL ? "rtl" : "ltr"}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500 mx-auto mb-4" />
          <p className="text-slate-600">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {error === "expired" ? t("join.linkExpired") : t("join.linkInvalid")}
            </h2>
            <p className="text-slate-600 mb-6">
              {error === "expired" ? t("join.linkExpiredDesc") : t("join.linkInvalidDesc")}
            </p>
            <Button onClick={() => router.push("/app")} variant="outline">
              {t("join.goToTrips")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) return null

  // Not authenticated - show sign in prompt
  if (sessionStatus === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-7 w-7 text-sky-600" />
            </div>
            <CardTitle className="text-xl">{t("join.title")}</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">{t("join.invitedTo")}</p>
              <p className="text-xl font-bold text-slate-900">{invitation.tripName}</p>
              <p className="text-sm text-slate-500 mt-2">
                {t("join.invitedBy")} {invitation.invitedBy}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Mail className="h-5 w-5 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{invitation.invitedEmail}</span>
            </div>

            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-slate-700 text-center">
                You must sign in with <strong>{invitation.invitedEmail}</strong> to accept this invitation.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link href={`/auth/login?callbackUrl=/join/${inviteId}`}>
                <Button size="lg" className="w-full">
                  {t("auth.signIn")}
                </Button>
              </Link>
              
              <Button
                variant="ghost"
                onClick={() => router.push("/app")}
                className="text-slate-500"
              >
                {t("join.decline")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated but email doesn't match
  if (emailMismatch || (session?.user?.email && 
      session.user.email.toLowerCase() !== invitation.invitedEmail.toLowerCase())) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Email Address Mismatch
            </h2>
            <div className="space-y-4 text-left">
              <p className="text-slate-600">
                This invitation is for <strong>{invitation.invitedEmail}</strong>, but you are signed in as <strong>{session?.user?.email}</strong>.
              </p>
              <p className="text-slate-600">
                To accept this invitation, please sign out and sign in with the invited email address.
              </p>
            </div>
            <div className="flex flex-col gap-3 mt-6">
              <Link href="/auth/signout">
                <Button variant="outline" className="w-full">
                  Sign Out & Try Again
                </Button>
              </Link>
              <Button variant="ghost" onClick={() => router.push("/app")} className="text-slate-500">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated with correct email - show accept screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir={isRTL ? "rtl" : "ltr"}>
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-7 w-7 text-sky-600" />
          </div>
          <CardTitle className="text-xl">{t("join.title")}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Trip Info */}
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-500 mb-1">{t("join.invitedTo")}</p>
            <p className="text-xl font-bold text-slate-900">{invitation.tripName}</p>
            <p className="text-sm text-slate-500 mt-2">
              {t("join.invitedBy")} {invitation.invitedBy}
            </p>
          </div>

          {/* Role */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-slate-600">{t("join.yourRole")}:</span>
            <Badge variant="secondary" className="text-sm">
              {getRoleLabel(invitation.role as MemberRole)}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 text-center">
            {getRoleDescription(invitation.role as MemberRole)}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleJoin}
              disabled={joining}
              size="lg"
              className="w-full"
            >
              {joining ? (
                <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? "ml-2" : "mr-2"}`} />
              ) : (
                <CheckCircle className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              )}
              {t("join.joinTrip")}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => router.push("/app")}
              className="text-slate-500"
            >
              {t("join.decline")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

