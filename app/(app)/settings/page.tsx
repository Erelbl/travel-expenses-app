import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
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
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      nickname: true,
      email: true,
      baseCurrency: true,
      plan: true,
      receiptScansUsed: true,
      receiptScansResetAt: true,
    },
  })
  
  const isAdmin = isAdminEmail(session.user.email)
  
  return (
    <SettingsClient 
      isAdmin={isAdmin}
      initialFullName={user?.name || ""}
      initialDisplayName={user?.nickname || ""}
      initialEmail={user?.email || ""}
      initialBaseCurrency={user?.baseCurrency || "USD"}
      userPlan={(user?.plan as "free" | "plus" | "pro") || "free"}
      receiptScansUsed={user?.receiptScansUsed || 0}
      receiptScansResetAt={user?.receiptScansResetAt ?? null}
    />
  )
}
