import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SettingsClient } from "./SettingsClient"

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmailsEnv = process.env.ADMIN_EMAILS || ""
  const adminEmails = adminEmailsEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
  return adminEmails.includes(email.toLowerCase())
}

export default async function SettingsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/login")
  }
  
  const isAdmin = isAdminEmail(session.user.email)
  
  return <SettingsClient isAdmin={isAdmin} />
}
