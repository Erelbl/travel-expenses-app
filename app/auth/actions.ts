"use server"

import { prisma } from "@/lib/db"
import { signIn } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function signUpAction(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return { error: "Email and password are required" }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: "User with this email already exists" }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
      },
    })

    // Sign in the user
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    redirect("/trips")
  } catch (error) {
    // Re-throw redirect errors (not actual errors)
    if (error && typeof error === "object" && "digest" in error && 
        typeof error.digest === "string" && error.digest.startsWith("NEXT_REDIRECT")) {
      throw error
    }
    
    console.error("[AUTH][SIGNUP] Error:", error)
    // If passwordHash column doesn't exist (P2022), return friendly error
    if (error && typeof error === "object" && "code" in error && error.code === "P2022") {
      return { error: "Database schema mismatch. Please contact support." }
    }
    return { error: "Failed to create account. Please try again." }
  }
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    
    if (result?.error) {
      return { error: "Invalid email or password" }
    }
  } catch (error) {
    console.error("[AUTH][LOGIN] Error:", error)
    return { error: "Invalid email or password" }
  }
  
  // Redirect outside try-catch
  redirect("/trips")
}

export async function sendVerificationEmail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user || !user.email) {
    return { error: "User not found" }
  }

  if (user.emailVerified) {
    return { error: "Email already verified" }
  }

  // Generate token
  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Delete any existing tokens for this user
  await prisma.emailVerificationToken.deleteMany({
    where: { userId },
  })

  // Create new token
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expires,
    },
  })

  // Send email
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: user.email,
      subject: "Verify your email",
      html: `
        <h1>Verify your email</h1>
        <p>Click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `,
    })

    return { success: true }
  } catch (error) {
    return { error: "Failed to send verification email" }
  }
}

export async function verifyEmailAction(token: string) {
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!verificationToken) {
    return { error: "Invalid token" }
  }

  if (verificationToken.expires < new Date()) {
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    })
    return { error: "Token expired" }
  }

  // Update user
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { emailVerified: new Date() },
  })

  // Delete token
  await prisma.emailVerificationToken.delete({
    where: { id: verificationToken.id },
  })

  return { success: true }
}

export async function changePasswordAction(data: {
  currentPassword: string
  newPassword: string
}) {
  try {
    const { auth } = await import("@/lib/auth")
    const session = await auth()

    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    const { currentPassword, newPassword } = data

    if (!currentPassword || !newPassword) {
      return { error: "All fields are required" }
    }

    if (newPassword.length < 8) {
      return { error: "New password must be at least 8 characters" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    })

    if (!user || !user.passwordHash) {
      return { error: "Password not enabled for this account" }
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash)

    if (!isCurrentValid) {
      return { error: "Invalid current password" }
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.passwordHash)
    if (isSameAsOld) {
      return { error: "New password must be different from current password" }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    })

    return { success: true }
  } catch (error) {
    console.error("[AUTH][CHANGE_PASSWORD] Error:", error)
    return { error: "Failed to change password. Please try again." }
  }
}

