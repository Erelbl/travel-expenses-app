import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getAdminStats, getUsersPage, getSignupTrend, getTripStats } from "@/lib/server/adminStats"
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
  searchParams: { page?: string; plan?: string }
}) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/login")
  }
  
  if (!isAdminEmail(session.user.email)) {
    notFound()
  }
  
  const page = parseInt(searchParams.page || "1", 10)
  const plan = searchParams.plan || "All"
  
  const [stats, usersData, signupTrend, tripStats] = await Promise.all([
    getAdminStats(),
    getUsersPage(page, plan),
    getSignupTrend(),
    getTripStats(),
  ])
  
  return (
    <AdminContent
      stats={stats}
      usersData={usersData}
      signupTrend={signupTrend}
      tripStats={tripStats}
      currentPage={page}
      currentPlan={plan}
    />
  )
}
