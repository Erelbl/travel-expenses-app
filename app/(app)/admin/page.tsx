import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getAdminStats, getAllUsers, getSignupTrend } from "@/lib/server/adminStats"
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

export default async function AdminPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/login")
  }
  
  if (!isAdminEmail(session.user.email)) {
    notFound()
  }
  
  const [stats, users, signupTrend] = await Promise.all([
    getAdminStats(),
    getAllUsers(),
    getSignupTrend(),
  ])
  
  return <AdminContent stats={stats} users={users} signupTrend={signupTrend} />
}
