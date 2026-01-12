"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Users, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TripInvite, invitesRepository } from "@/lib/data/local/invites-local.repository"
import { tripsRepository } from "@/lib/data"
import { Trip, MemberRole } from "@/lib/schemas/trip.schema"
import { setCurrentUserMemberId } from "@/lib/utils/permissions"
import { useI18n } from "@/lib/i18n/I18nProvider"

export default function JoinTripPage() {
  const { t, locale } = useI18n()
  const params = useParams()
  const router = useRouter()
  const inviteId = params.inviteId as string
  const isRTL = locale === "he"

  const [invite, setInvite] = useState<TripInvite | null>(null)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")

  useEffect(() => {
    loadInvite()
  }, [inviteId])

  async function loadInvite() {
    setLoading(true)
    try {
      const inviteData = await invitesRepository.getInvite(inviteId)
      
      if (!inviteData) {
        setError("expired")
        return
      }

      setInvite(inviteData)

      // Load the trip
      const tripData = await tripsRepository.getTrip(inviteData.tripId)
      if (!tripData) {
        setError("tripNotFound")
        return
      }

      setTrip(tripData)
    } catch (err) {
      console.error("Failed to load invite:", err)
      setError("error")
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!invite || !trip || !name.trim()) {
      toast.error(t("join.nameRequired"))
      return
    }

    setJoining(true)
    try {
      // Check if already a member
      const existingMember = trip.members.find(
        (m) => m.name.toLowerCase() === name.trim().toLowerCase()
      )

      if (existingMember) {
        // Already a member, just set as current user and redirect
        setCurrentUserMemberId(trip.id, existingMember.id)
        toast.success(t("join.welcomeBack"))
        router.push(`/trips/${trip.id}`)
        return
      }

      // Add as new member
      const newMemberId = crypto.randomUUID()
      const updatedMembers = [
        ...trip.members,
        {
          id: newMemberId,
          name: name.trim(),
          role: invite.role,
        },
      ]

      await tripsRepository.updateTrip(trip.id, { members: updatedMembers })
      
      // Set as current user
      setCurrentUserMemberId(trip.id, newMemberId)
      
      toast.success(t("join.success"))
      router.push(`/trips/${trip.id}`)
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

  if (loading) {
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
            <Button onClick={() => router.push("/trips")} variant="outline">
              {t("join.goToTrips")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invite || !trip) return null

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
            <p className="text-xl font-bold text-slate-900">{trip.name}</p>
            <p className="text-sm text-slate-500 mt-2">
              {t("join.invitedBy")} {invite.createdByName}
            </p>
          </div>

          {/* Role */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-slate-600">{t("join.yourRole")}:</span>
            <Badge variant="secondary" className="text-sm">
              {getRoleLabel(invite.role)}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 text-center">
            {getRoleDescription(invite.role)}
          </p>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="join-name" className="font-semibold">
              {t("join.yourName")}
            </Label>
            <Input
              id="join-name"
              placeholder={t("join.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleJoin}
              disabled={joining || !name.trim()}
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
              onClick={() => router.push("/trips")}
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

