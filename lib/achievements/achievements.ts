import { prisma } from "@/lib/db"
import { AchievementKey } from "@prisma/client"

/**
 * Evaluates which achievements a user SHOULD have unlocked based on their current data.
 * Returns all keys that meet the criteria (does not check if already unlocked).
 */
export async function evaluateAchievementsForUser(userId: string): Promise<AchievementKey[]> {
  const unlockedKeys: AchievementKey[] = []

  // A1: FIRST_EXPENSE_LOGGED - user has at least 1 expense
  const expenseCount = await prisma.expense.count({
    where: { createdById: userId },
  })

  if (expenseCount >= 1) {
    unlockedKeys.push(AchievementKey.FIRST_EXPENSE_LOGGED)
  }

  // A3: TEN_EXPENSES_LOGGED - user has at least 10 expenses
  if (expenseCount >= 10) {
    unlockedKeys.push(AchievementKey.TEN_EXPENSES_LOGGED)
  }

  // A2: EXPENSES_ON_3_DAYS - expenses on >= 3 distinct calendar days
  if (expenseCount > 0) {
    const distinctDays = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT DATE(e."expenseDate")) as count
      FROM "Expense" e
      WHERE e."createdById" = ${userId}
    `
    const daysCount = Number(distinctDays[0]?.count ?? 0)
    if (daysCount >= 3) {
      unlockedKeys.push(AchievementKey.EXPENSES_ON_3_DAYS)
    }
  }

  // A6: EXPENSES_IN_2_COUNTRIES - expenses in >= 2 distinct countries
  if (expenseCount > 0) {
    const distinctCountries = await prisma.expense.groupBy({
      by: ["countryCode"],
      where: { createdById: userId },
    })
    if (distinctCountries.length >= 2) {
      unlockedKeys.push(AchievementKey.EXPENSES_IN_2_COUNTRIES)
    }
  }

  // A5: THREE_TRIPS_LOGGED - user has >= 3 trips (owned)
  const tripCount = await prisma.trip.count({
    where: { ownerId: userId },
  })
  if (tripCount >= 3) {
    unlockedKeys.push(AchievementKey.THREE_TRIPS_LOGGED)
  }

  // A4: FIRST_TRIP_COMPLETED - user has completed/closed at least 1 trip
  const closedTripCount = await prisma.trip.count({
    where: {
      ownerId: userId,
      isClosed: true,
    },
  })
  if (closedTripCount >= 1) {
    unlockedKeys.push(AchievementKey.FIRST_TRIP_COMPLETED)
  }

  return unlockedKeys
}

/**
 * Unlocks new achievements for a user.
 * Compares what should be unlocked vs what is already unlocked, and inserts missing rows.
 * Returns ONLY the newly unlocked achievement keys in deterministic order.
 */
export async function unlockNewAchievements(
  userId: string
): Promise<{ newlyUnlocked: AchievementKey[] }> {
  // Get all achievements that SHOULD be unlocked
  const shouldHave = await evaluateAchievementsForUser(userId)

  // Get all achievements that ARE already unlocked
  const existing = await prisma.userAchievement.findMany({
    where: { userId },
    select: { key: true },
  })
  const existingKeys = new Set(existing.map((a) => a.key))

  // Find the delta
  const newKeys = shouldHave.filter((key) => !existingKeys.has(key))

  // Insert new achievements
  if (newKeys.length > 0) {
    await prisma.userAchievement.createMany({
      data: newKeys.map((key) => ({ userId, key })),
      skipDuplicates: true,
    })
  }

  // Return in deterministic order (by enum order)
  return { newlyUnlocked: newKeys.sort() }
}

/**
 * Get all unlocked achievements for a user
 */
export async function getUnlockedAchievements(userId: string): Promise<AchievementKey[]> {
  const achievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { key: true },
    orderBy: { unlockedAt: "asc" },
  })
  return achievements.map((a) => a.key)
}

