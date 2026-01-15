"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Settings } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { TripCard } from "@/components/trip-card"
import { Button } from "@/components/ui/button"
import { TripCardSkeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { tripsRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { useI18n } from "@/lib/i18n/I18nProvider"

export default function TripsPage() {
  const { t, locale } = useI18n()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadTrips()
  }, [])

  async function loadTrips() {
    try {
      setLoading(true)
      setError(false)
      const data = await tripsRepository.listTrips("")
      setTrips(data)
    } catch (error) {
      console.error("Failed to load trips:", error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const isRTL = locale === 'he';

  return (
    <div className="container mx-auto pb-6">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 border-b bg-white p-4 md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{t('trips.title')}</h1>
            <p className="text-sm text-slate-500">{t('trips.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/settings">
              <Button size="icon" variant="ghost">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/trips/new">
              <Button size="icon">
                <Plus className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <PageHeader
          title={t('trips.title')}
          description={t('trips.subtitle')}
          action={
            <div className="flex gap-2">
              <Link href="/settings">
                <Button variant="outline">
                  <Settings className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                  {t('appSettings.title')}
                </Button>
              </Link>
              <Link href="/trips/new">
                <Button>
                  <Plus className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                  {t('trips.newTrip')}
                </Button>
              </Link>
            </div>
          }
        />
      </div>

      <div className="mt-6 px-4 md:mt-8">
        {loading ? (
          // Loading state
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <TripCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          // Error state
          <ErrorState
            title={t('common.errorTitle')}
            message={t('common.errorMessage')}
            onRetry={loadTrips}
            retryLabel={t('common.retry')}
          />
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-sky-50 p-6">
              <Plus className="h-12 w-12 text-sky-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{t('trips.noTrips')}</h3>
            <p className="mt-2 text-sm text-slate-500">
              {t('trips.noTripsDesc')}
            </p>
            <Link href="/trips/new" className="mt-6">
              <Button size="lg">
                <Plus className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                {t('trips.createTrip')}
              </Button>
            </Link>
          </div>
        ) : (
          // Trips list
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      {trips.length > 0 && (
        <Link href="/trips/new" className="md:hidden">
          <Button
            size="icon"
            className={`fixed bottom-6 h-14 w-14 rounded-full shadow-lg ${isRTL ? 'left-6' : 'right-6'}`}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      )}
    </div>
  )
}

