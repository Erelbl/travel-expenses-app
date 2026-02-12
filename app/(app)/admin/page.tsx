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
    />
  )
}
