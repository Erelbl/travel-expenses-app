import { AchievementKey } from "@prisma/client"
import { prisma } from "@/lib/db"

export interface AchievementDefinition {
  key: AchievementKey
  title: string
  icon: string
  thresholds: number[]
  message: (level: number) => string
  computeMetric: (userId: string) => Promise<number>
  isTripBased: boolean // If true, levels can decrease on deletion
}

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementKey, AchievementDefinition> = {
  [AchievementKey.FIRST_EXPENSE_LOGGED]: {
    key: AchievementKey.FIRST_EXPENSE_LOGGED,
    title: "First Steps",
    icon: "🎯",
    thresholds: [1, 5, 10, 25, 50],
    message: (level) => `Nice! You're building a solid travel log ✨`,
    computeMetric: async (userId) => {
      return await prisma.expense.count({ where: { createdById: userId } })
    },
    isTripBased: false,
  },
  [AchievementKey.TEN_EXPENSES_LOGGED]: {
    key: AchievementKey.TEN_EXPENSES_LOGGED,
    title: "Detailed Tracker",
    icon: "📊",
    thresholds: [10, 25, 50, 100, 250],
    message: (level) => `You're keeping detailed records 📊`,
    computeMetric: async (userId) => {
      return await prisma.expense.count({ where: { createdById: userId } })
    },
    isTripBased: false,
  },
  [AchievementKey.EXPENSES_ON_3_DAYS]: {
    key: AchievementKey.EXPENSES_ON_3_DAYS,
    title: "Tracking Habit",
    icon: "📅",
    thresholds: [3, 7, 14, 30, 60],
    message: (level) => `Great consistency! Keep it up 📅`,
    computeMetric: async (userId) => {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT DATE(e."expenseDate")) as count
        FROM "Expense" e
        WHERE e."createdById" = ${userId}
      `
      return Number(result[0]?.count ?? 0)
    },
    isTripBased: false,
  },
  [AchievementKey.EXPENSES_IN_2_COUNTRIES]: {
    key: AchievementKey.EXPENSES_IN_2_COUNTRIES,
    title: "Globe Trotter",
    icon: "🗺️",
    thresholds: [2, 3, 5, 8, 12],
    message: (level) => `You're exploring the world 🗺️`,
    computeMetric: async (userId) => {
      const result = await prisma.expense.groupBy({
        by: ["countryCode"],
        where: { createdById: userId, countryCode: { not: "" } },
      })
      return result.length
    },
    isTripBased: false,
  },
  [AchievementKey.THREE_TRIPS_LOGGED]: {
    key: AchievementKey.THREE_TRIPS_LOGGED,
    title: "Trip Creator",
    icon: "🌍",
    thresholds: [1, 3, 5, 10, 20],
    message: (level) => `You're becoming a frequent traveler 🌍`,
    computeMetric: async (userId) => {
      return await prisma.trip.count({ where: { ownerId: userId } })
    },
    isTripBased: true,
  },
  [AchievementKey.FIRST_TRIP_COMPLETED]: {
    key: AchievementKey.FIRST_TRIP_COMPLETED,
    title: "Journey Complete",
    icon: "✈️",
    thresholds: [1, 3, 5, 10, 20],
    message: (level) => `Your journey is complete ✈️`,
    computeMetric: async (userId) => {
      const now = new Date()
      return await prisma.trip.count({
        where: {
          ownerId: userId,
          OR: [
            { isClosed: true },
            { endDate: { lt: now } },
          ],
        },
      })
    },
    isTripBased: true,
  },
}

export function getDefinition(key: AchievementKey): AchievementDefinition {
  return ACHIEVEMENT_DEFINITIONS[key]
}

export function getAllDefinitions(): AchievementDefinition[] {
  return Object.values(ACHIEVEMENT_DEFINITIONS)
}

