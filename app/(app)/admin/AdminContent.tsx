"use client"

import { useI18n } from "@/lib/i18n/I18nProvider"
import { PageContainer } from "@/components/ui/page-container"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Users, UserCheck, UserX, Calendar, MapPin, Receipt, CheckCircle, XCircle } from "lucide-react"
import { AdminUsersTable } from "./AdminUsersTable"
import { AdminSignupChart } from "./AdminSignupChart"
import type { AdminUser, SignupTrendDataPoint, TripStats, TopUser, UsersPageFilters } from "@/lib/server/adminStats"

interface AdminStats {
  users: {
    total: number
    verified: number
    unverified: number
    createdLast7d: number
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
  
  return (
    <PageContainer>
      <PageHeader 
        title={t("admin.title")}
        description={`${t("admin.subtitle")} ג€¢ ${t("admin.updatedAgo", { seconds: secondsAgo.toString() })}`}
      />
      
      <div className="space-y-8">
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


