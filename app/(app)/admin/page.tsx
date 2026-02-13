import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { 
  getAdminStats, 
  getUsersPage, 
  getSignupTrend, 
  getTripStats,
  getTopUsersByExpenses,
  getTopUsersBySpend,
  UsersPageFilters 
} from "@/lib/server/adminStats"
import { AdminContent } from "./AdminContent"
import { t, Locale } from "@/lib/i18n"
import { prisma } from "@/lib/db"

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  
  const adminEmailsEnv = process.env.ADMIN_EMAILS || ""
  const adminEmails = adminEmailsEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
  
  return adminEmails.includes(email.toLowerCase())
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { 
    page?: string
    plan?: string
    activity?: string
    minTrips?: string
    minExpenses?: string
    search?: string
  }
}) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/login")
  }
  
  if (!isAdminEmail(session.user.email)) {
    notFound()
  }
  
  // Get user's language preference
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { language: true }
  })
  const locale = (user?.language || 'en') as Locale
  
  const page = parseInt(searchParams.page || "1", 10)
  
  // Build filters object
  const filters: UsersPageFilters = {
    plan: searchParams.plan || "All",
    activity: searchParams.activity || "all",
    minTrips: searchParams.minTrips ? parseInt(searchParams.minTrips) : 0,
    minExpenses: searchParams.minExpenses ? parseInt(searchParams.minExpenses) : 0,
    search: searchParams.search || "",
  }
  
  const [stats, usersData, signupTrend, tripStats, topUsersByExpenses, topUsersBySpend] = await Promise.all([
    getAdminStats(),
    getUsersPage(page, filters),
    getSignupTrend(),
    getTripStats(),
    getTopUsersByExpenses(),
    getTopUsersBySpend(),
  ])
  
  // Translate all labels server-side
  const labels = {
    title: t('admin.title', locale),
    subtitle: t('admin.subtitle', locale),
    updatedAgo: t('admin.updatedAgo', locale, { seconds: Math.floor((Date.now() - stats.timestamp) / 1000).toString() }),
    usageAnalytics: t('admin.usageAnalytics', locale),
    activeUsers7d: t('admin.activeUsers7d', locale),
    activeUsers30d: t('admin.activeUsers30d', locale),
    payingUsers: t('admin.payingUsers', locale),
    newUsers7d: t('admin.newUsers7d', locale),
    totalTrips: t('admin.totalTrips', locale),
    totalExpenses: t('admin.totalExpenses', locale),
    topUsersByExpenses: t('admin.topUsersByExpenses', locale),
    topUsersBySpend: t('admin.topUsersBySpend', locale),
    users: t('admin.users', locale),
    totalUsers: t('admin.totalUsers', locale),
    verified: t('admin.verified', locale),
    unverified: t('admin.unverified', locale),
    last7Days: t('admin.last7Days', locale),
    newUsers: t('admin.newUsers', locale),
    userSignupTrend: t('admin.userSignupTrend', locale),
    tripsStats: t('admin.tripsStats', locale),
    activeTrips: t('admin.activeTrips', locale),
    endedTrips: t('admin.endedTrips', locale),
    deletedTrips: t('admin.deletedTrips', locale),
    expenses: t('admin.expenses', locale),
    newExpenses: t('admin.newExpenses', locale),
    allUsers: t('admin.allUsers', locale),
  }
  
  return (
    <AdminContent
      stats={stats}
      usersData={usersData}
      signupTrend={signupTrend}
      tripStats={tripStats}
      topUsersByExpenses={topUsersByExpenses}
      topUsersBySpend={topUsersBySpend}
      currentPage={page}
      filters={filters}
      labels={labels}
    />
  )
}
