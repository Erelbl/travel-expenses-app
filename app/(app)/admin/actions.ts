"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmailsEnv = process.env.ADMIN_EMAILS || ""
  const adminEmails = adminEmailsEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
  return adminEmails.includes(email.toLowerCase())
}

export async function toggleUserDisabledAction(userId: string) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return { error: "Not authenticated" }
    }

    if (!isAdminEmail(session.user.email)) {
      return { error: "Unauthorized: admin access required" }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isDisabled: true },
    })

    if (!user) {
      return { error: "User not found" }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isDisabled: !user.isDisabled },
    })

    revalidatePath("/admin")

    return { success: true, newStatus: !user.isDisabled }
  } catch (error) {
    console.error("[ADMIN] Failed to toggle user disabled:", error)
    return { error: "Failed to update user status" }
  }
}
