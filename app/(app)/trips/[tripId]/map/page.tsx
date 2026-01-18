"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MapPin } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/I18nProvider"

export default function TripMapPage() {
  const { t, locale } = useI18n()
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const isRTL = locale === 'he'

  return (
    <div className="container mx-auto max-w-2xl pb-20 md:pb-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/trips/${tripId}`)}
          className="md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{t('map.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('map.subtitle')}</p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-primary/10 p-6">
              <MapPin className="h-12 w-12 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{t('map.comingSoon')}</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {t('map.comingSoonDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomNav tripId={tripId} />
    </div>
  )
}

