"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Calendar, TrendingUp, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/utils/format"

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
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/40 via-blue-50/20 to-white">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-visible bg-gradient-to-br from-sky-400/90 via-blue-500/90 to-indigo-500/90"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTAgMTJjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L2c+PC9zdmc+')] opacity-20" />
        
        {/* Gradient fade overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-sky-100/30 to-sky-50/40 pointer-events-none" />
        
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome back, {userName}
            </h1>
            <p className="text-sky-50/90 text-base md:text-lg mb-6">
              Your travel adventures at a glance
            </p>
            <Link href="/trips/new">
              <Button
                size="lg"
                className="bg-white text-sky-600 hover:bg-sky-50 shadow-lg hover:shadow-xl transition-all"
              >
                <Package className="mr-2 h-5 w-5" />
                Create New Trip
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
              title="No trips yet"
              message="Start planning your next adventure by creating your first trip"
              icon={
                <div className="rounded-full bg-sky-100 p-6">
                  <Package className="h-12 w-12 text-sky-600" />
                </div>
              }
              action={
                <Link href="/trips/new">
                  <Button size="lg">
                    <Package className="mr-2 h-5 w-5" />
                    Create Your First Trip
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
              Your Trips
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
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/60 rounded-xl p-6 shadow-sm shadow-slate-900/5 hover:shadow-md hover:shadow-slate-900/8 hover:border-slate-300/70 transition-all duration-200">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
              {trip.name}
            </h3>
            {trip.isClosed && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 shrink-0 ml-2">
                Closed
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
              <span className="text-slate-600">Total Spend</span>
              <span className="font-semibold text-slate-900">
                {trip.baseCurrency} {trip.totalSpend.toFixed(2)}
              </span>
            </div>

            {trip.targetBudget && budgetProgress !== null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Budget</span>
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
              <span>{trip.expenseCount} expenses</span>
              <span className="text-slate-400">{trip.baseCurrency}</span>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center justify-end text-sm font-medium text-sky-600 group-hover:text-sky-700">
            <span>Open trip</span>
            <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

