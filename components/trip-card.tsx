"use client"

import Link from "next/link"
import { Trip } from "@/lib/schemas/trip.schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PassportCard } from "@/components/ui/passport-card"
import { formatDate, getDaysBetween } from "@/lib/utils/format"
import { getCountryFlag } from "@/lib/utils/countries.data"
import { Calendar, Users } from "lucide-react"
import { useI18n } from "@/lib/i18n/I18nProvider"

interface TripCardProps {
  trip: Trip
}

export function TripCard({ trip }: TripCardProps) {
  const { t, locale } = useI18n()
  const days = getDaysBetween(trip.startDate || '', trip.endDate || '')
  const isRTL = locale === 'he'
  
  return (
    <Link href={`/trips/${trip.id}`} className="block group">
      <div className="bg-white border border-slate-200 rounded-lg p-6 transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:bg-slate-50/50 active:scale-[0.99]">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{trip.name}</h3>
        </div>
        <div className="space-y-2.5 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              {formatDate(trip.startDate)}
              {trip.endDate && ` - ${formatDate(trip.endDate)}`}
              <span className={`${isRTL ? 'me-1' : 'ms-1'} text-slate-500`}>({days} {t('common.days')})</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span>{trip.members.length} {t('tripCard.members')}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

