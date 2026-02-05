"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function updateUserProfileAction(data: {
  displayName?: string
  fullName?: string
  baseCurrency?: string
  gender?: "male" | "female"
}) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    const { displayName, fullName, baseCurrency, gender } = data

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nickname: displayName || null,
        name: fullName || null,
        baseCurrency: baseCurrency || "USD",
        gender: gender || "male",
      },
    })

    return { success: true }
  } catch (error) {
    console.error("[SETTINGS] Failed to update profile:", error)
    return { error: "Failed to update profile" }
  }
}

export async function updateUserLanguageAction(language: "en" | "he") {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Not authenticated" }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { language },
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to update user language:", error)
    return { error: "Failed to update language" }
  }
}

