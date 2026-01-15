"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  
  const adminEmailsEnv = process.env.ADMIN_EMAILS || ""
  const adminEmails = adminEmailsEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
  
  return adminEmails.includes(email.toLowerCase())
}

export async function setUserPasswordAction(data: {
  email: string
  newPassword: string
}) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return { error: "Not authenticated" }
    }

    if (!isAdminEmail(session.user.email)) {
      return { error: "Unauthorized: admin access required" }
    }

    const { email, newPassword } = data

    if (!email || !newPassword) {
      return { error: "Email and password are required" }
    }

    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters" }
    }

    const normalizedEmail = email.trim().toLowerCase()

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      },
      select: { id: true, email: true }
    })

    if (!user) {
      return { error: `User not found: ${normalizedEmail}` }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    })

    return { success: true, email: user.email }
  } catch (error) {
    console.error("[ADMIN][SET_PASSWORD] Error:", error)
    return { error: "Failed to set password. Please try again." }
  }
}

