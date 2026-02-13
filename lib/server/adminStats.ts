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
  tripsCount: number
  expensesCount: number
  activeDays: number
  lastActivity: Date
  totalSpend: number
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

export interface TopUser {
  name: string | null
  email: string | null
  value: number
}

interface AdminStats {
  users: {
    total: number
    verified: number
    unverified: number
    createdLast7d: number
    active7d: number
    active30d: number
    paying: number
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
  
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    totalUsers,
    verifiedUsers,
    recentUsers,
    totalTrips,
    recentTrips,
    totalExpenses,
    recentExpenses,
    activeUsers7d,
    activeUsers30d,
    payingUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: { not: null } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.trip.count(),
    prisma.trip.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.expense.count(),
    prisma.expense.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    // Active users (7d): users who created at least 1 expense in last 7 days
    prisma.user.count({
      where: {
        expenses: {
          some: {
            createdAt: { gte: sevenDaysAgo },
          },
        },
      },
    }),
    // Active users (30d): users who created at least 1 expense in last 30 days
    prisma.user.count({
      where: {
        expenses: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
    }),
    // Paying users: users with plan in ['plus', 'pro']
    prisma.user.count({
      where: {
        plan: {
          in: ["plus", "pro"],
        },
      },
    }),
  ])

  return {
    users: {
      total: totalUsers,
      verified: verifiedUsers,
      unverified: totalUsers - verifiedUsers,
      createdLast7d: recentUsers,
      active7d: activeUsers7d,
      active30d: activeUsers30d,
      paying: payingUsers,
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

export interface UsersPageFilters {
  plan?: string
  activity?: string
  minTrips?: number
  minExpenses?: number
  search?: string
}

async function getUsersPageUncached(
  page: number,
  filters: UsersPageFilters
): Promise<{ users: AdminUser[]; total: number }> {
  const pageSize = 25
  const skip = (page - 1) * pageSize

  // Build where clause based on filters
  const where: any = {}

  // Plan filter
  if (filters.plan && filters.plan !== "All") {
    where.plan = filters.plan.toLowerCase()
  }

  // Activity filter
  if (filters.activity && filters.activity !== "all") {
    const now = new Date()
    let activityDate = new Date()
    
    if (filters.activity === "last7d") {
      activityDate.setDate(now.getDate() - 7)
    } else if (filters.activity === "last30d") {
      activityDate.setDate(now.getDate() - 30)
    } else if (filters.activity === "last90d") {
      activityDate.setDate(now.getDate() - 90)
    }

    if (filters.activity !== "all") {
      where.expenses = {
        some: {
          createdAt: { gte: activityDate },
        },
      }
    }
  }

  // Search filter (email or name)
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.trim()
    where.OR = [
      { email: { contains: searchTerm, mode: "insensitive" } },
      { name: { contains: searchTerm, mode: "insensitive" } },
      { nickname: { contains: searchTerm, mode: "insensitive" } },
    ]
  }

  // Get users with basic info
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        createdAt: true,
        lastLoginAt: true,
        isDisabled: true,
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ])

  // Get user stats in batch (efficient aggregation)
  const userIds = users.map((u) => u.id)

  const [tripCounts, expenseCounts, expenseStats] = await Promise.all([
    // Trips count per user
    prisma.trip.groupBy({
      by: ["ownerId"],
      where: { ownerId: { in: userIds } },
      _count: { id: true },
    }),
    // Expenses count per user
    prisma.expense.groupBy({
      by: ["createdById"],
      where: { createdById: { in: userIds } },
      _count: { id: true },
    }),
    // Active days and last activity per user (get all expenses to calculate)
    prisma.expense.findMany({
      where: { createdById: { in: userIds } },
      select: {
        createdById: true,
        createdAt: true,
        convertedAmount: true,
      },
    }),
  ])

  // Build lookup maps
  const tripCountMap = new Map(
    tripCounts.map((t) => [t.ownerId, t._count.id])
  )
  const expenseCountMap = new Map(
    expenseCounts.map((e) => [e.createdById, e._count.id])
  )

  // Calculate active days, last activity, and total spend per user
  const userStatsMap = new Map<
    string,
    { activeDays: number; lastActivity: Date; totalSpend: number }
  >()

  for (const expense of expenseStats) {
    const userId = expense.createdById
    if (!userStatsMap.has(userId)) {
      userStatsMap.set(userId, {
        activeDays: 0,
        lastActivity: expense.createdAt,
        totalSpend: 0,
      })
    }

    const stats = userStatsMap.get(userId)!
    if (expense.createdAt > stats.lastActivity) {
      stats.lastActivity = expense.createdAt
    }
    if (expense.convertedAmount) {
      stats.totalSpend += expense.convertedAmount
    }
  }

  // Calculate distinct active days
  for (const userId of userIds) {
    const userExpenses = expenseStats.filter((e) => e.createdById === userId)
    const uniqueDays = new Set(
      userExpenses.map((e) => e.createdAt.toISOString().split("T")[0])
    )
    
    if (userStatsMap.has(userId)) {
      userStatsMap.get(userId)!.activeDays = uniqueDays.size
    }
  }

  // Map to AdminUser format
  const enrichedUsers = users.map((user) => {
    const stats = userStatsMap.get(user.id) || {
      activeDays: 0,
      lastActivity: user.createdAt,
      totalSpend: 0,
    }

    return {
      id: user.id,
      name: user.name || null,
      email: user.email,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      isDisabled: user.isDisabled,
      plan: (user.plan === "plus"
        ? "Traveler"
        : user.plan === "pro"
        ? "PRO"
        : "Free") as "Free" | "Traveler" | "PRO",
      tripsCount: tripCountMap.get(user.id) || 0,
      expensesCount: expenseCountMap.get(user.id) || 0,
      activeDays: stats.activeDays,
      lastActivity: stats.lastActivity,
      totalSpend: stats.totalSpend,
    }
  })

  // Apply min trips/expenses filters (post-processing since these are computed)
  let filteredUsers = enrichedUsers
  if (filters.minTrips !== undefined && filters.minTrips > 0) {
    filteredUsers = filteredUsers.filter((u) => u.tripsCount >= filters.minTrips!)
  }
  if (filters.minExpenses !== undefined && filters.minExpenses > 0) {
    filteredUsers = filteredUsers.filter(
      (u) => u.expensesCount >= filters.minExpenses!
    )
  }

  return {
    users: filteredUsers,
    total: filteredUsers.length, // Note: this is an approximation when using post-filters
  }
}

export async function getUsersPage(page: number, filters: UsersPageFilters) {
  return getUsersPageUncached(page, filters)
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

async function getTopUsersByExpensesUncached(): Promise<TopUser[]> {
  const topUsers = await prisma.expense.groupBy({
    by: ["createdById"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  })

  const userIds = topUsers.map((u) => u.createdById)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  })

  const userMap = new Map(users.map((u) => [u.id, u]))

  return topUsers.map((u) => {
    const user = userMap.get(u.createdById)
    return {
      name: user?.name || null,
      email: user?.email || null,
      value: u._count.id,
    }
  })
}

export const getTopUsersByExpenses = () =>
  unstable_cache(
    async () => getTopUsersByExpensesUncached(),
    ["admin-top-users-expenses"],
    {
      revalidate: 60,
      tags: ["admin-top-users-expenses"],
    }
  )()

async function getTopUsersBySpendUncached(): Promise<TopUser[]> {
  // Get all expenses with converted amounts grouped by user
  const expenses = await prisma.expense.findMany({
    where: {
      convertedAmount: { not: null },
    },
    select: {
      createdById: true,
      convertedAmount: true,
    },
  })

  // Sum by user
  const userSpendMap = new Map<string, number>()
  for (const expense of expenses) {
    const userId = expense.createdById
    const current = userSpendMap.get(userId) || 0
    userSpendMap.set(userId, current + (expense.convertedAmount || 0))
  }

  // Sort and take top 5
  const topUserIds = Array.from(userSpendMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const userIds = topUserIds.map(([id]) => id)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  })

  const userMap = new Map(users.map((u) => [u.id, u]))

  return topUserIds.map(([userId, spend]) => {
    const user = userMap.get(userId)
    return {
      name: user?.name || null,
      email: user?.email || null,
      value: Math.round(spend * 100) / 100, // Round to 2 decimals
    }
  })
}

export const getTopUsersBySpend = () =>
  unstable_cache(
    async () => getTopUsersBySpendUncached(),
    ["admin-top-users-spend"],
    {
      revalidate: 60,
      tags: ["admin-top-users-spend"],
    }
  )()

