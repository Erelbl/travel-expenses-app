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

  for (const def of definitions) {
    const metric = await def.computeMetric(userId)
    
    // Find target level based on metric
    let targetLevel = 0
    for (let i = 0; i < def.thresholds.length; i++) {
      if (metric >= def.thresholds[i]) {
        targetLevel = i + 1
      } else {
        break
      }
    }

    // Get existing unlocked levels for this key
    const existing = await prisma.userAchievement.findMany({
      where: { userId, key: def.key },
      select: { level: true },
      orderBy: { level: "asc" },
    })
    const existingLevels = new Set(existing.map((a) => a.level))
    const currentMaxLevel = existing.length > 0 ? Math.max(...existing.map((a) => a.level)) : 0

    // For trip-based achievements, remove levels that are no longer valid
    if (def.isTripBased && currentMaxLevel > targetLevel) {
      await prisma.userAchievement.deleteMany({
        where: {
          userId,
          key: def.key,
          level: { gt: targetLevel },
        },
      })
    }

    // Add missing levels from current to target
    const levelsToAdd: number[] = []
    for (let level = 1; level <= targetLevel; level++) {
      if (!existingLevels.has(level)) {
        levelsToAdd.push(level)
      }
    }

    if (levelsToAdd.length > 0) {
      await prisma.userAchievement.createMany({
        data: levelsToAdd.map((level) => ({
          userId,
          key: def.key,
          level,
        })),
        skipDuplicates: true,
      })

      // Add to newly unlocked (only the highest new level)
      const highestNewLevel = Math.max(...levelsToAdd)
      newlyUnlocked.push({
        key: def.key,
        level: highestNewLevel,
        title: def.title,
        message: def.message(highestNewLevel),
        icon: def.icon,
      })
    }
  }

  return { newlyUnlocked }
}

