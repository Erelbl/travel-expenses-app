import { prisma } from "@/lib/db"
import { AchievementKey } from "@prisma/client"
import { getAllDefinitions, getDefinition } from "./config"

export interface UnlockedAchievement {
  key: AchievementKey
  level: number
  title: string
  message: string
  icon: string
}

/**
 * Evaluates achievements for a user based on current metrics.
 * Inserts missing achievement levels and removes invalid trip-based levels.
 * Returns ONLY newly unlocked achievements that haven't been notified yet.
 * 
 * IDEMPOTENCY GUARANTEE:
 * - Each achievement tier is returned ONLY ONCE
 * - If user already has max tier and it's been notified → returns empty
 * - Uses notifiedAt field to track which achievements user has already seen
 */
export async function evaluateAchievements(
  userId: string
): Promise<{ newlyUnlocked: UnlockedAchievement[] }> {
  const newlyUnlocked: UnlockedAchievement[] = []
  const definitions = getAllDefinitions()

  // Preload all existing achievements for this user ONCE
  const allExisting = await prisma.userAchievement.findMany({
    where: { userId },
    select: { key: true, level: true, notifiedAt: true },
  })
  
  // Build maps: key -> max level, and set of all existing achievements (notified or not)
  const existingMaxLevelByKey = new Map<AchievementKey, number>()
  const notifiedSet = new Set<string>()
  const allExistingSet = new Set<string>()
  
  for (const ach of allExisting) {
    const current = existingMaxLevelByKey.get(ach.key) || 0
    if (ach.level > current) {
      existingMaxLevelByKey.set(ach.key, ach.level)
    }
    
    const achKey = `${ach.key}:${ach.level}`
    allExistingSet.add(achKey)
    
    // Track which achievements were already notified
    if (ach.notifiedAt) {
      notifiedSet.add(achKey)
    }
  }

  // Parallelize metric computation for all achievement types
  const metricsPromises = definitions.map(async (def) => ({
    def,
    metric: await def.computeMetric(userId)
  }))
  
  const metricsResults = await Promise.all(metricsPromises)

  for (const { def, metric } of metricsResults) {
    // Find target level based on metric (capped at thresholds length)
    let targetLevel = 0
    for (let i = 0; i < def.thresholds.length; i++) {
      if (metric >= def.thresholds[i]) {
        targetLevel = i + 1
      } else {
        break
      }
    }

    const existingMax = existingMaxLevelByKey.get(def.key) || 0

    // CRITICAL: If user already reached or exceeded target level, skip entirely
    // This is the primary idempotency check - prevents re-evaluating achievements
    if (targetLevel <= existingMax) {
      // For trip-based achievements, handle level reductions (e.g., after trip deletion)
      if (def.isTripBased && existingMax > targetLevel) {
        await prisma.userAchievement.deleteMany({
          where: {
            userId,
            key: def.key,
            level: { gt: targetLevel },
          },
        })
        // Update map after deletion
        existingMaxLevelByKey.set(def.key, targetLevel)
      }
      continue
    }

    // Insert missing levels from existingMax+1 to targetLevel
    const levelsToInsert: number[] = []
    for (let level = existingMax + 1; level <= targetLevel; level++) {
      levelsToInsert.push(level)
    }

    if (levelsToInsert.length > 0) {
      // Use createMany with skipDuplicates for safety
      await prisma.userAchievement.createMany({
        data: levelsToInsert.map((level) => ({
          userId,
          key: def.key,
          level,
          notifiedAt: null, // Will be set when user is actually notified
        })),
        skipDuplicates: true,
      })

      // Update map after insertion
      existingMaxLevelByKey.set(def.key, targetLevel)

      // ONLY return the HIGHEST newly unlocked level for this achievement key
      // Check both: not in existing set AND not notified
      // This ensures we only show each tier ONCE
      const achievementKey = `${def.key}:${targetLevel}`
      if (!notifiedSet.has(achievementKey) && !allExistingSet.has(achievementKey)) {
        newlyUnlocked.push({
          key: def.key,
          level: targetLevel,
          title: def.title,
          message: def.message(targetLevel),
          icon: def.icon,
        })
      }
    }
  }

  // DEFENSIVE: Return ONLY unique achievements (should already be unique, but double-check)
  const seen = new Set<string>()
  const uniqueUnlocked = newlyUnlocked.filter(ach => {
    const key = `${ach.key}:${ach.level}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { newlyUnlocked: uniqueUnlocked }
}

/**
 * Mark achievement as notified (called after showing popup to user)
 */
export async function markAchievementNotified(
  userId: string,
  key: AchievementKey,
  level: number
): Promise<void> {
  await prisma.userAchievement.updateMany({
    where: {
      userId,
      key,
      level,
    },
    data: {
      notifiedAt: new Date(),
    },
  })
}

