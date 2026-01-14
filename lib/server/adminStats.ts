import { prisma } from "@/lib/db"
import { unstable_cache } from "next/cache"

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

