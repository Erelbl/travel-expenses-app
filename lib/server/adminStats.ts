import { prisma } from "@/lib/db"
import { unstable_cache } from "next/cache"

export interface AdminUser {
  id: string
  name: string | null
  email: string | null
  createdAt: Date
  lastLoginAt: Date | null
  isDisabled: boolean
  plan: "Free" | "Traveler" | "PRO"
}

export interface SignupTrendDataPoint {
  date: string
  count: number
}

export interface TripStats {
  total: number
  active: number
  ended: number
  deleted: number
}

interface AdminStats {
  users: {
    total: number
    verified: number
    unverified: number
    createdLast7d: number
  }
  trips: {
    total: number
    createdLast7d: number
  }
  expenses: {
    total: number
    createdLast7d: number
  }
  timestamp: number
}

async function getAdminStatsUncached(): Promise<AdminStats> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    totalUsers,
    verifiedUsers,
    recentUsers,
    totalTrips,
    recentTrips,
    totalExpenses,
    recentExpenses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: { not: null } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.trip.count(),
    prisma.trip.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.expense.count(),
    prisma.expense.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ])

  return {
    users: {
      total: totalUsers,
      verified: verifiedUsers,
      unverified: totalUsers - verifiedUsers,
      createdLast7d: recentUsers,
    },
    trips: {
      total: totalTrips,
      createdLast7d: recentTrips,
    },
    expenses: {
      total: totalExpenses,
      createdLast7d: recentExpenses,
    },
    timestamp: Date.now(),
  }
}

export const getAdminStats = () =>
  unstable_cache(
    async () => getAdminStatsUncached(),
    ["admin-stats"],
    {
      revalidate: 60,
      tags: ["admin-stats"],
    }
  )()

async function getUsersPageUncached(page: number, plan: string): Promise<{ users: AdminUser[], total: number }> {
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const where = plan !== "All" ? {} : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        nickname: true,
        email: true,
        createdAt: true,
        lastLoginAt: true,
        isDisabled: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ])

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.nickname || null,
      email: user.email,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      isDisabled: user.isDisabled,
      plan: "Free" as const, // For MVP, all users are Free plan
    })),
    total,
  }
}

export async function getUsersPage(page: number, plan: string) {
  return getUsersPageUncached(page, plan)
}

async function getSignupTrendUncached(): Promise<SignupTrendDataPoint[]> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      createdAt: true,
    },
  })

  // Group by date
  const signupsByDate = new Map<string, number>()
  
  // Initialize all dates with 0
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split("T")[0]
    signupsByDate.set(dateStr, 0)
  }

  // Count signups per day
  users.forEach((user) => {
    const dateStr = user.createdAt.toISOString().split("T")[0]
    const current = signupsByDate.get(dateStr) || 0
    signupsByDate.set(dateStr, current + 1)
  })

  // Convert to array and sort
  const result: SignupTrendDataPoint[] = Array.from(signupsByDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return result
}

export const getSignupTrend = () =>
  unstable_cache(
    async () => getSignupTrendUncached(),
    ["admin-signup-trend"],
    {
      revalidate: 60,
      tags: ["admin-signup-trend"],
    }
  )()

async function getTripStatsUncached(): Promise<TripStats> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [total, ended] = await Promise.all([
    prisma.trip.count(),
    prisma.trip.count({
      where: {
        endDate: {
          lt: today,
        },
      },
    }),
  ])

  return {
    total,
    active: total - ended,
    ended,
    deleted: 0, // No soft delete implemented
  }
}

export const getTripStats = () =>
  unstable_cache(
    async () => getTripStatsUncached(),
    ["admin-trip-stats"],
    {
      revalidate: 60,
      tags: ["admin-trip-stats"],
    }
  )()

