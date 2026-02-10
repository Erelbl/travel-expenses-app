import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Resend from "next-auth/providers/resend"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { EMAIL_FROM } from "@/lib/email/config"

// Ensure AUTH_SECRET is set (required for JWT strategy)
if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
  console.error("[AUTH] AUTH_SECRET is not set in production!")
  // Note: If you changed AUTH_SECRET, users need to clear cookies or re-login
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
      async profile(profile, tokens) {
        // Check if this is first sign-in by looking up user
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
          select: { id: true, name: true, nickname: true },
        })

        // Only prefill names on first sign-in
        if (!existingUser) {
          return {
            id: profile.sub,
            email: profile.email,
            emailVerified: profile.email_verified ? new Date() : null,
            image: profile.picture,
            name: profile.name || null,
            nickname: profile.given_name || null,
          }
        }

        // Existing user - don't override names
        return {
          id: existingUser.id,
          email: profile.email,
          emailVerified: profile.email_verified ? new Date() : null,
          image: profile.picture,
        }
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              passwordHash: true,
            },
          })

          if (!user || !user.passwordHash) {
            console.error("[AUTH][CRED] User not found or no password hash:", credentials.email)
            return null
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          )

          if (!isValid) {
            console.error("[AUTH][CRED] Invalid password for:", credentials.email)
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error("[AUTH][CRED] Authorization error:", error)
          // If passwordHash column doesn't exist (P2022), this will catch it
          // Return null instead of crashing
          return null
        }
      },
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/auth/login",
    verifyRequest: "/auth/login?verify=true",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (user?.id) {
        try {
          // Update last login timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
          
          // Check if user is disabled
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { isDisabled: true },
          })
          
          // Only block if explicitly disabled (true)
          if (dbUser?.isDisabled === true) {
            return false
          }
        } catch (error) {
          console.error("[AUTH] Sign-in callback error:", error)
          // Allow sign-in to proceed on error (fail-safe)
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        
        try {
          // Fetch user's display name and disabled status
          const user = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { nickname: true, isDisabled: true },
          })
          
          if (user) {
            // Block disabled users (only if explicitly true)
            if (user.isDisabled === true) {
              throw new Error("Account disabled")
            }
            session.user.name = user.nickname || null
          }
        } catch (error) {
          console.error("[AUTH] Session callback error:", error)
          // If it's the "Account disabled" error, re-throw
          if (error instanceof Error && error.message === "Account disabled") {
            throw error
          }
          // Otherwise, continue with session (fail-safe)
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Handle relative callback URLs (e.g., /invites/abc123)
      if (url.startsWith("/")) {
        const finalUrl = `${baseUrl}${url}`
        console.log(`[AUTH_REDIRECT] using_callbackUrl url=${url} finalUrl=${finalUrl}`)
        return finalUrl
      }
      
      // Handle full URLs on the same domain
      if (url.startsWith(baseUrl)) {
        console.log(`[AUTH_REDIRECT] using_callbackUrl url=${url}`)
        return url
      }
      
      // No callback URL or base URL only - default to /app
      if (url === baseUrl) {
        console.log(`[AUTH_REDIRECT] fallback=/app reason=no_callback`)
        return `${baseUrl}/app`
      }
      
      // External URL or unexpected - fallback to /app for security
      console.log(`[AUTH_REDIRECT] fallback=/app reason=external_or_invalid url=${url}`)
      return `${baseUrl}/app`
    },
  },
})
