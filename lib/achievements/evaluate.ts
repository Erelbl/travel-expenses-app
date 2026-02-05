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
 * Returns newly unlocked achievements.
 */
export async function evaluateAchievements(
  userId: string
): Promise<{ newlyUnlocked: UnlockedAchievement[] }> {
  const newlyUnlocked: UnlockedAchievement[] = []
  const definitions = getAllDefinitions()

  // Preload all existing achievements for this user ONCE
  const allExisting = await prisma.userAchievement.findMany({
    where: { userId },
    select: { key: true, level: true },
  })
  
  // Build map: key -> max level
  const existingMaxLevelByKey = new Map<AchievementKey, number>()
  for (const ach of allExisting) {
    const current = existingMaxLevelByKey.get(ach.key) || 0
    if (ach.level > current) {
      existingMaxLevelByKey.set(ach.key, ach.level)
    }
  }

  for (const def of definitions) {
    const metric = await def.computeMetric(userId)
    
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

    // If user already has max level >= target, no new unlocks
    if (targetLevel <= existingMax) {
      continue
    }

    // For trip-based achievements, remove levels that are no longer valid
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

    // Insert missing levels from existingMax+1 to targetLevel
    const levelsToInsert: number[] = []
    for (let level = existingMax + 1; level <= targetLevel; level++) {
      levelsToInsert.push(level)
    }

    if (levelsToInsert.length > 0) {
      await prisma.userAchievement.createMany({
        data: levelsToInsert.map((level) => ({
          userId,
          key: def.key,
          level,
        })),
        skipDuplicates: true,
      })

      // Update map after insertion
      existingMaxLevelByKey.set(def.key, targetLevel)

      // Add to newly unlocked (only the highest newly inserted level)
      newlyUnlocked.push({
        key: def.key,
        level: targetLevel,
        title: def.title,
        message: def.message(targetLevel),
        icon: def.icon,
      })
    }
  }

  return { newlyUnlocked }
}

