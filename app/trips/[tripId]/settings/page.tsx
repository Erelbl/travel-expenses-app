"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, XCircle } from "lucide-react"
import { toast } from "sonner"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { tripsRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { canManageTrip } from "@/lib/utils/permissions"
import { closeTrip } from "../actions"
import { Badge } from "@/components/ui/badge"

export default function TripSettingsPage() {
  const { t, locale } = useI18n()
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const isRTL = locale === 'he'

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [tripId])

  async function loadData() {
    try {
      setLoading(true)
      const tripData = await tripsRepository.getTrip(tripId)

      if (!tripData) {
        router.push("/trips")
        return
      }

      setTrip(tripData)
    } catch (error) {
      console.error("Failed to load trip:", error)
      toast.error(t('common.errorMessage'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCloseTrip() {
    if (!trip) return
    
    const confirmed = window.confirm(t('settings.closeTripConfirm'))
    if (!confirmed) return

    try {
      await closeTrip(tripId)
      toast.success(t('settings.closeTripSuccess'))
      router.refresh()
      router.push(`/trips/${tripId}`)
    } catch (error) {
      console.error("Failed to close trip:", error)
      toast.error(t('settings.closeTripError'))
    }
  }

  if (loading || !trip) {
    return (
      <div className="min-h-screen pb-20 md:pb-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="sticky top-0 z-10 border-b bg-white">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-4 p-4">
              <div className="h-6 w-6 bg-slate-200 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 md:pb-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/trips/${tripId}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{t('nav.settings')}</h1>
              <p className="text-sm text-slate-500">{trip.name}</p>
            </div>
            {trip.isClosed && (
              <Badge variant="outline" className="bg-slate-100 text-slate-700">
                {t('trips.finished')}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Trip Basics Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Trip Basics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Basic trip settings will be available here (name, dates, countries, etc.)
            </p>
          </CardContent>
        </Card>

        {/* Budget Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Budget planning and limits will be available here
            </p>
          </CardContent>
        </Card>

        {/* Insights Profile Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Insights Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Trip metadata for personalized insights (trip type, travel style, group size, etc.)
            </p>
          </CardContent>
        </Card>

        {/* FX & Conversions Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              FX & Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Exchange rate configuration will be available here
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone Section */}
        {canManageTrip(trip) && !trip.isClosed && (
          <Card className="border-red-200 bg-red-50/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-red-900">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    {t('settings.closeTrip')}
                  </h3>
                  <p className="text-sm text-red-700 mb-3">
                    Mark this trip as finished. You won't be able to add or edit expenses after closing.
                  </p>
                  <Button
                    onClick={handleCloseTrip}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
                  >
                    <XCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('settings.closeTrip')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Closed Trip Badge */}
        {trip.isClosed && (
          <Card className="border-slate-200 bg-slate-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-slate-100 text-slate-700">
                  {t('trips.finished')}
                </Badge>
                <p className="text-sm text-slate-600">
                  This trip has been closed and is read-only
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav tripId={tripId} />
    </div>
  )
}
