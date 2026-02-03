import { prisma } from "@/lib/db"
import { AchievementKey } from "@prisma/client"

export interface AchievementLevel {
  key: AchievementKey
  level: number
}

// Define level thresholds for each achievement type
const ACHIEVEMENT_THRESHOLDS: Record<AchievementKey, number[]> = {
  [AchievementKey.FIRST_EXPENSE_LOGGED]: [1, 10, 25, 50, 100],
  [AchievementKey.TEN_EXPENSES_LOGGED]: [10, 25, 50, 100, 200],
  [AchievementKey.EXPENSES_ON_3_DAYS]: [3, 7, 15, 30, 60],
  [AchievementKey.EXPENSES_IN_2_COUNTRIES]: [2, 5, 10, 15, 25],
  [AchievementKey.THREE_TRIPS_LOGGED]: [3, 5, 10, 20, 30],
  [AchievementKey.FIRST_TRIP_COMPLETED]: [1, 3, 5, 10, 15],
}

export function getThresholdsForAchievement(key: AchievementKey): number[] {
  return ACHIEVEMENT_THRESHOLDS[key]
}

/**
 * Evaluates which achievement levels a user SHOULD have unlocked based on their current data.
 * Returns all achievement+level combinations that meet the criteria.
 */
export async function evaluateAchievementsForUser(userId: string): Promise<AchievementLevel[]> {
  const unlockedLevels: AchievementLevel[] = []

  // Get expense count for multiple achievement types
  const expenseCount = await prisma.expense.count({
    where: { createdById: userId },
  })

  // FIRST_EXPENSE_LOGGED - progressive expense milestones
  const expenseThresholds = ACHIEVEMENT_THRESHOLDS[AchievementKey.FIRST_EXPENSE_LOGGED]
  for (let i = 0; i < expenseThresholds.length; i++) {
    if (expenseCount >= expenseThresholds[i]) {
      unlockedLevels.push({
        key: AchievementKey.FIRST_EXPENSE_LOGGED,
        level: i + 1,
      })
    }
  }

  // TEN_EXPENSES_LOGGED - higher expense milestones
  const tenExpenseThresholds = ACHIEVEMENT_THRESHOLDS[AchievementKey.TEN_EXPENSES_LOGGED]
  for (let i = 0; i < tenExpenseThresholds.length; i++) {
    if (expenseCount >= tenExpenseThresholds[i]) {
      unlockedLevels.push({
        key: AchievementKey.TEN_EXPENSES_LOGGED,
        level: i + 1,
      })
    }
  }

  // EXPENSES_ON_3_DAYS - expenses on distinct calendar days
  if (expenseCount > 0) {
    const distinctDays = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT DATE(e."expenseDate")) as count
      FROM "Expense" e
      WHERE e."createdById" = ${userId}
    `
    const daysCount = Number(distinctDays[0]?.count ?? 0)
    const daysThresholds = ACHIEVEMENT_THRESHOLDS[AchievementKey.EXPENSES_ON_3_DAYS]
    for (let i = 0; i < daysThresholds.length; i++) {
      if (daysCount >= daysThresholds[i]) {
        unlockedLevels.push({
          key: AchievementKey.EXPENSES_ON_3_DAYS,
          level: i + 1,
        })
      }
    }
  }

  // EXPENSES_IN_2_COUNTRIES - expenses in distinct countries
  if (expenseCount > 0) {
    const distinctCountries = await prisma.expense.groupBy({
      by: ["countryCode"],
      where: { createdById: userId },
    })
    const countryCount = distinctCountries.length
    const countryThresholds = ACHIEVEMENT_THRESHOLDS[AchievementKey.EXPENSES_IN_2_COUNTRIES]
    for (let i = 0; i < countryThresholds.length; i++) {
      if (countryCount >= countryThresholds[i]) {
        unlockedLevels.push({
          key: AchievementKey.EXPENSES_IN_2_COUNTRIES,
          level: i + 1,
        })
      }
    }
  }

  // THREE_TRIPS_LOGGED - trips created
  const tripCount = await prisma.trip.count({
    where: { ownerId: userId },
  })
  const tripThresholds = ACHIEVEMENT_THRESHOLDS[AchievementKey.THREE_TRIPS_LOGGED]
  for (let i = 0; i < tripThresholds.length; i++) {
    if (tripCount >= tripThresholds[i]) {
      unlockedLevels.push({
        key: AchievementKey.THREE_TRIPS_LOGGED,
        level: i + 1,
      })
    }
  }

  // FIRST_TRIP_COMPLETED - closed trips
  const closedTripCount = await prisma.trip.count({
    where: {
      ownerId: userId,
      isClosed: true,
    },
  })
  const completedThresholds = ACHIEVEMENT_THRESHOLDS[AchievementKey.FIRST_TRIP_COMPLETED]
  for (let i = 0; i < completedThresholds.length; i++) {
    if (closedTripCount >= completedThresholds[i]) {
      unlockedLevels.push({
        key: AchievementKey.FIRST_TRIP_COMPLETED,
        level: i + 1,
      })
    }
  }

  return unlockedLevels
}

/**
 * Unlocks new achievement levels for a user.
 * Compares what should be unlocked vs what is already unlocked, and inserts missing rows.
 * Returns ONLY the newly unlocked achievement levels.
 */
export async function unlockNewAchievements(
  userId: string
): Promise<{ newlyUnlocked: AchievementLevel[] }> {
  // Get all achievement levels that SHOULD be unlocked
  const shouldHave = await evaluateAchievementsForUser(userId)

  // Get all achievement levels that ARE already unlocked
  const existing = await prisma.userAchievement.findMany({
    where: { userId },
    select: { key: true, level: true },
  })
  const existingSet = new Set(existing.map((a) => `${a.key}:${a.level}`))

  // Find the delta
  const newLevels = shouldHave.filter(
    ({ key, level }) => !existingSet.has(`${key}:${level}`)
  )

  // Insert new achievement levels
  if (newLevels.length > 0) {
    await prisma.userAchievement.createMany({
      data: newLevels.map(({ key, level }) => ({ userId, key, level })),
      skipDuplicates: true,
    })
  }

  return { newlyUnlocked: newLevels }
}

/**
 * Get all unlocked achievement levels for a user, grouped by achievement key.
 * Returns the maximum level unlocked for each achievement.
 */
export async function getUnlockedAchievements(userId: string): Promise<AchievementLevel[]> {
  const achievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { key: true, level: true },
    orderBy: [{ key: "asc" }, { level: "asc" }],
  })

  // Group by key and return max level for each
  const maxLevelMap = new Map<AchievementKey, number>()
  for (const { key, level } of achievements) {
    const current = maxLevelMap.get(key) ?? 0
    if (level > current) {
      maxLevelMap.set(key, level)
    }
  }

  return Array.from(maxLevelMap.entries()).map(([key, level]) => ({ key, level }))
}

/**
 * Get current progress for a user towards all achievements.
 * Returns current count and next threshold for each achievement.
 */
export async function getUserAchievementProgress(userId: string): Promise<
  Array<{
    key: AchievementKey
    currentLevel: number
    currentCount: number
    nextThreshold: number | null
  }>
> {
  const unlockedLevels = await getUnlockedAchievements(userId)
  const unlockedMap = new Map(unlockedLevels.map((a) => [a.key, a.level]))

  // Get current counts for all metrics
  const expenseCount = await prisma.expense.count({
    where: { createdById: userId },
  })

  const distinctDaysResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT DATE(e."expenseDate")) as count
    FROM "Expense" e
    WHERE e."createdById" = ${userId}
  `
  const daysCount = Number(distinctDaysResult[0]?.count ?? 0)

  const distinctCountries = await prisma.expense.groupBy({
    by: ["countryCode"],
    where: { createdById: userId },
  })
  const countryCount = distinctCountries.length

  const tripCount = await prisma.trip.count({
    where: { ownerId: userId },
  })

  const closedTripCount = await prisma.trip.count({
    where: {
      ownerId: userId,
      isClosed: true,
    },
  })

  // Map achievement keys to their current counts
  const countMap: Record<AchievementKey, number> = {
    [AchievementKey.FIRST_EXPENSE_LOGGED]: expenseCount,
    [AchievementKey.TEN_EXPENSES_LOGGED]: expenseCount,
    [AchievementKey.EXPENSES_ON_3_DAYS]: daysCount,
    [AchievementKey.EXPENSES_IN_2_COUNTRIES]: countryCount,
    [AchievementKey.THREE_TRIPS_LOGGED]: tripCount,
    [AchievementKey.FIRST_TRIP_COMPLETED]: closedTripCount,
  }

  // Build progress for each achievement
  const progress = Object.keys(ACHIEVEMENT_THRESHOLDS).map((key) => {
    const achievementKey = key as AchievementKey
    const currentLevel = unlockedMap.get(achievementKey) ?? 0
    const currentCount = countMap[achievementKey]
    const thresholds = ACHIEVEMENT_THRESHOLDS[achievementKey]
    const nextThreshold = currentLevel < thresholds.length ? thresholds[currentLevel] : null

    return {
      key: achievementKey,
      currentLevel,
      currentCount,
      nextThreshold,
    }
  })

  return progress
}

