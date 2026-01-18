"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Calendar, TrendingUp, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/utils/format"
import { useI18n } from "@/lib/i18n/I18nProvider"

interface TripWithStats {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
  baseCurrency: string
  targetBudget?: number
  isClosed: boolean
  totalSpend: number
  expenseCount: number
}

interface DashboardClientProps {
  trips: TripWithStats[]
  userName: string
}

export function DashboardClient({ trips, userName }: DashboardClientProps) {
  const { t, locale } = useI18n()
  const isRTL = locale === 'he'

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-blue-50/30 to-slate-50/20">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden bg-gradient-to-br from-sky-400/90 via-blue-500/90 to-indigo-500/90"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTAgMTJjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L2c+PC9zdmc+')] opacity-20" />
        
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {t('appDashboard.welcomeBack', { name: userName })}
            </h1>
            <p className="text-sky-50/90 text-base md:text-lg mb-6">
              {t('appDashboard.subtitle')}
            </p>
            <Link href="/trips/new">
              <Button
                size="lg"
                className="bg-white text-sky-600 hover:bg-sky-50 shadow-lg hover:shadow-xl transition-all"
              >
                <Package className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
                {t('appDashboard.createTrip')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {trips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.25 }}
          >
            <EmptyState
              title={t('appDashboard.noTripsYet')}
              message={t('appDashboard.noTripsMessage')}
              icon={
                <div className="rounded-full bg-sky-100 p-6">
                  <Package className="h-12 w-12 text-sky-600" />
                </div>
              }
              action={
                <Link href="/trips/new">
                  <Button size="lg">
                    <Package className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
                    {t('appDashboard.createFirstTrip')}
                  </Button>
                </Link>
              }
            />
          </motion.div>
        ) : (
          <>
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.2 }}
              className="text-2xl font-bold text-slate-900 mb-6"
            >
              {t('appDashboard.yourTrips')}
            </motion.h2>
            
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip, index) => (
                <TripDashboardCard key={trip.id} trip={trip} index={index} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TripDashboardCard({ trip, index }: { trip: TripWithStats; index: number }) {
  const { t, locale } = useI18n()
  const isRTL = locale === 'he'
  const budgetProgress = trip.targetBudget
    ? Math.min((trip.totalSpend / trip.targetBudget) * 100, 100)
    : null

  const isOverBudget = trip.targetBudget && trip.totalSpend > trip.targetBudget

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.05, duration: 0.25 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Link href={`/trips/${trip.id}`} className="block group">
        <div className="bg-white/98 backdrop-blur-sm border border-slate-200/60 rounded-xl p-6 shadow-sm shadow-slate-900/4 hover:shadow-md hover:shadow-slate-900/8 hover:border-slate-300/70 transition-all duration-200">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
              {trip.name}
            </h3>
            {trip.isClosed && (
              <Badge variant="secondary" className={`bg-slate-100 text-slate-600 shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                {t('appDashboard.closed')}
              </Badge>
            )}
          </div>

          {/* Date Range */}
          {trip.startDate && (
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <span>
                {formatDate(trip.startDate)}
                {trip.endDate && ` - ${formatDate(trip.endDate)}`}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{t('appDashboard.totalSpend')}</span>
              <span className="font-semibold text-slate-900">
                {trip.baseCurrency} {trip.totalSpend.toFixed(2)}
              </span>
            </div>

            {trip.targetBudget && budgetProgress !== null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{t('appDashboard.budget')}</span>
                  <span className={isOverBudget ? "text-amber-600 font-medium" : ""}>
                    {trip.totalSpend.toFixed(0)} of {trip.targetBudget.toFixed(0)}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${budgetProgress}%` }}
                    transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                    className={`h-full rounded-full ${
                      isOverBudget
                        ? "bg-amber-500"
                        : budgetProgress > 80
                        ? "bg-orange-500"
                        : "bg-sky-500"
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{trip.expenseCount} {t('appDashboard.expenses')}</span>
              <span className="text-slate-400">{trip.baseCurrency}</span>
            </div>
          </div>

          {/* Action */}
          <div className={`flex items-center ${isRTL ? 'justify-start' : 'justify-end'} text-sm font-medium text-sky-600 group-hover:text-sky-700`}>
            <span>{t('appDashboard.openTrip')}</span>
            <ArrowRight className={`${isRTL ? 'mr-1 group-hover:-translate-x-1' : 'ml-1 group-hover:translate-x-1'} h-4 w-4 transition-transform`} />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

