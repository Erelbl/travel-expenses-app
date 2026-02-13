"use client"

import { useI18n } from "@/lib/i18n/I18nProvider"
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

interface AdminContentProps {
  stats: AdminStats
  usersData: { users: AdminUser[], total: number }
  signupTrend: SignupTrendDataPoint[]
  tripStats: TripStats
  topUsersByExpenses: TopUser[]
  topUsersBySpend: TopUser[]
  currentPage: number
  filters: UsersPageFilters
}

export function AdminContent({ stats, usersData, signupTrend, tripStats, topUsersByExpenses, topUsersBySpend, currentPage, filters }: AdminContentProps) {
  const { t } = useI18n()
  
  const secondsAgo = Math.floor((Date.now() - stats.timestamp) / 1000)
  const buildStamp = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "2026-02-13-01"
  
  return (
    <PageContainer>
      <PageHeader 
        title={t("admin.title")}
        description={`${t("admin.subtitle")} • ${t("admin.updatedAgo", { seconds: secondsAgo.toString() })}`}
      />
      
      {/* Build stamp and data freshness */}
      <div className="mb-4 flex gap-2 items-center flex-wrap">
        <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-xs font-mono text-blue-700">Build: {buildStamp}</span>
        </div>
        <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
          <span className="text-xs font-medium text-green-700">
            🟢 Live data · {stats.users.total} users · {stats.expenses.total} expenses
          </span>
        </div>
      </div>
      
      <div className="space-y-8">
        {/* KPI Cards - Compact Grid */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("admin.usageAnalytics")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              title={t("admin.activeUsers7d")}
              value={stats.users.active7d.toLocaleString()}
              icon={Activity}
            />
            <StatCard
              title={t("admin.activeUsers30d")}
              value={stats.users.active30d.toLocaleString()}
              icon={Activity}
            />
            <StatCard
              title={t("admin.payingUsers")}
              value={stats.users.paying.toLocaleString()}
              icon={CreditCard}
            />
            <StatCard
              title={t("admin.newUsers7d")}
              value={stats.users.createdLast7d.toLocaleString()}
              icon={TrendingUp}
            />
            <StatCard
              title={t("admin.totalTrips")}
              value={tripStats.total.toLocaleString()}
              icon={MapPin}
            />
            <StatCard
              title={t("admin.totalExpenses")}
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
                <h3 className="text-sm font-semibold text-slate-800">{t("admin.topUsersByExpenses")}</h3>
              </div>
              <div className="p-4">
                {topUsersByExpenses.length > 0 ? (
                  <div className="space-y-2">
                    {topUsersByExpenses.map((user, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 truncate">{user.email || "—"}</span>
                        <span className="font-medium text-slate-900 ml-2">{user.value}</span>
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
                <h3 className="text-sm font-semibold text-slate-800">{t("admin.topUsersBySpend")}</h3>
              </div>
              <div className="p-4">
                {topUsersBySpend.length > 0 ? (
                  <div className="space-y-2">
                    {topUsersBySpend.map((user, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 truncate">{user.email || "—"}</span>
                        <span className="font-medium text-slate-900 ml-2">${user.value.toLocaleString()}</span>
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
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("admin.users")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t("admin.totalUsers")}
              value={stats.users.total.toLocaleString()}
              icon={Users}
            />
            <StatCard
              title={t("admin.verified")}
              value={stats.users.verified.toLocaleString()}
              icon={UserCheck}
            />
            <StatCard
              title={t("admin.unverified")}
              value={stats.users.unverified.toLocaleString()}
              icon={UserX}
            />
            <StatCard
              title={t("admin.last7Days")}
              value={stats.users.createdLast7d.toLocaleString()}
              icon={Calendar}
              subtitle={t("admin.newUsers")}
            />
          </div>
        </section>

        {/* Signup Trend Chart */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("admin.userSignupTrend")}</h2>
          <AdminSignupChart data={signupTrend} />
        </section>
        
        {/* Trips Stats */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("admin.tripsStats")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t("admin.totalTrips")}
              value={tripStats.total.toLocaleString()}
              icon={MapPin}
            />
            <StatCard
              title={t("admin.activeTrips")}
              value={tripStats.active.toLocaleString()}
              icon={CheckCircle}
            />
            <StatCard
              title={t("admin.endedTrips")}
              value={tripStats.ended.toLocaleString()}
              icon={XCircle}
            />
            <StatCard
              title={t("admin.deletedTrips")}
              value={tripStats.deleted.toLocaleString()}
              icon={XCircle}
            />
          </div>
        </section>
        
        {/* Expenses Stats */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("admin.expenses")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title={t("admin.totalExpenses")}
              value={stats.expenses.total.toLocaleString()}
              icon={Receipt}
            />
            <StatCard
              title={t("admin.last7Days")}
              value={stats.expenses.createdLast7d.toLocaleString()}
              icon={Calendar}
              subtitle={t("admin.newExpenses")}
            />
          </div>
        </section>

        {/* Users Table */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("admin.allUsers")}</h2>
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
