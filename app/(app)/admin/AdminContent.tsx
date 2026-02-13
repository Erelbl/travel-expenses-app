"use client"

import { PageContainer } from "@/components/ui/page-container"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Users, UserCheck, UserX, Calendar, MapPin, Receipt, CheckCircle, XCircle, TrendingUp, CreditCard, Activity } from "lucide-react"
import { AdminUsersTable } from "./AdminUsersTable"
import { AdminSignupChart } from "./AdminSignupChart"
import { Card } from "@/components/ui/card"
import type { AdminUser, SignupTrendDataPoint, TripStats, TopUser, UsersPageFilters } from "@/lib/server/adminStats"

interface AdminStats {
  users: {
    total: number
    verified: number
    unverified: number
    createdLast7d: number
    active7d: number
    active30d: number
    paying: number
  }
  trips: {
    total: number
    createdLast7d: number
  }
  expenses: {
    total: number
    createdLast7d: number
  }
  timestamp: number
}

interface AdminLabels {
  title: string
  subtitle: string
  updatedAgo: string
  usageAnalytics: string
  activeUsers7d: string
  activeUsers30d: string
  payingUsers: string
  newUsers7d: string
  totalTrips: string
  totalExpenses: string
  topUsersByExpenses: string
  topUsersBySpend: string
  users: string
  totalUsers: string
  verified: string
  unverified: string
  last7Days: string
  newUsers: string
  userSignupTrend: string
  tripsStats: string
  activeTrips: string
  endedTrips: string
  deletedTrips: string
  expenses: string
  newExpenses: string
  allUsers: string
}

interface AdminContentProps {
  stats: AdminStats
  usersData: { users: AdminUser[], total: number }
  signupTrend: SignupTrendDataPoint[]
  tripStats: TripStats
  topUsersByExpenses: TopUser[]
  topUsersBySpend: TopUser[]
  currentPage: number
  filters: UsersPageFilters
  labels: AdminLabels
}

export function AdminContent({ stats, usersData, signupTrend, tripStats, topUsersByExpenses, topUsersBySpend, currentPage, filters, labels }: AdminContentProps) {
  // Helper to get display name with fallbacks
  const getDisplayName = (user: TopUser) => {
    return user.displayName || user.fullName || user.email || "—"
  }

  return (
    <PageContainer>
      <PageHeader 
        title={labels.title}
        description={`${labels.subtitle} • ${labels.updatedAgo}`}
      />
      
      <div className="space-y-8">
        {/* KPI Cards - Compact Grid */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{labels.usageAnalytics}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              title={labels.activeUsers7d}
              value={stats.users.active7d.toLocaleString()}
              icon={Activity}
            />
            <StatCard
              title={labels.activeUsers30d}
              value={stats.users.active30d.toLocaleString()}
              icon={Activity}
            />
            <StatCard
              title={labels.payingUsers}
              value={stats.users.paying.toLocaleString()}
              icon={CreditCard}
            />
            <StatCard
              title={labels.newUsers7d}
              value={stats.users.createdLast7d.toLocaleString()}
              icon={TrendingUp}
            />
            <StatCard
              title={labels.totalTrips}
              value={tripStats.total.toLocaleString()}
              icon={MapPin}
            />
            <StatCard
              title={labels.totalExpenses}
              value={stats.expenses.total.toLocaleString()}
              icon={Receipt}
            />
          </div>
        </section>

        {/* Top Users Mini Tables */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top by Expenses Count */}
            <Card>
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 break-words">{labels.topUsersByExpenses}</h3>
              </div>
              <div className="p-4">
                {topUsersByExpenses.length > 0 ? (
                  <div className="space-y-2">
                    {topUsersByExpenses.map((user, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm gap-2">
                        <span className="text-slate-700 truncate flex-1 min-w-0" title={getDisplayName(user)}>
                          {getDisplayName(user)}
                        </span>
                        <span className="font-medium text-slate-900 whitespace-nowrap">{user.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No data</p>
                )}
              </div>
            </Card>

            {/* Top by Total Spend */}
            <Card>
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 break-words">{labels.topUsersBySpend}</h3>
              </div>
              <div className="p-4">
                {topUsersBySpend.length > 0 ? (
                  <div className="space-y-2">
                    {topUsersBySpend.map((user, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm gap-2">
                        <span className="text-slate-700 truncate flex-1 min-w-0" title={getDisplayName(user)}>
                          {getDisplayName(user)}
                        </span>
                        <span className="font-medium text-slate-900 whitespace-nowrap">${user.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No data</p>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* Users Stats */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{labels.users}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={labels.totalUsers}
              value={stats.users.total.toLocaleString()}
              icon={Users}
            />
            <StatCard
              title={labels.verified}
              value={stats.users.verified.toLocaleString()}
              icon={UserCheck}
            />
            <StatCard
              title={labels.unverified}
              value={stats.users.unverified.toLocaleString()}
              icon={UserX}
            />
            <StatCard
              title={labels.last7Days}
              value={stats.users.createdLast7d.toLocaleString()}
              icon={Calendar}
              subtitle={labels.newUsers}
            />
          </div>
        </section>

        {/* Signup Trend Chart */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{labels.userSignupTrend}</h2>
          <AdminSignupChart data={signupTrend} />
        </section>
        
        {/* Trips Stats */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{labels.tripsStats}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={labels.totalTrips}
              value={tripStats.total.toLocaleString()}
              icon={MapPin}
            />
            <StatCard
              title={labels.activeTrips}
              value={tripStats.active.toLocaleString()}
              icon={CheckCircle}
            />
            <StatCard
              title={labels.endedTrips}
              value={tripStats.ended.toLocaleString()}
              icon={XCircle}
            />
            <StatCard
              title={labels.deletedTrips}
              value={tripStats.deleted.toLocaleString()}
              icon={XCircle}
            />
          </div>
        </section>
        
        {/* Expenses Stats */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{labels.expenses}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title={labels.totalExpenses}
              value={stats.expenses.total.toLocaleString()}
              icon={Receipt}
            />
            <StatCard
              title={labels.last7Days}
              value={stats.expenses.createdLast7d.toLocaleString()}
              icon={Calendar}
              subtitle={labels.newExpenses}
            />
          </div>
        </section>

        {/* Users Table */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{labels.allUsers}</h2>
          <AdminUsersTable
            users={usersData.users}
            total={usersData.total}
            currentPage={currentPage}
            filters={filters}
          />
        </section>
      </div>
    </PageContainer>
  )
}
