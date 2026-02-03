import { AchievementKey } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getAllDefinitions } from "./config"

export async function getUserAchievementProgress(userId: string): Promise<
  Array<{
    key: AchievementKey
    currentLevel: number
    currentCount: number
    nextThreshold: number | null
  }>
> {
  const definitions = getAllDefinitions()
  const progress = []

  for (const def of definitions) {
    // Get current metric
    const currentCount = await def.computeMetric(userId)

    // Get max unlocked level for this key
    const unlocked = await prisma.userAchievement.findMany({
      where: { userId, key: def.key },
      select: { level: true },
    })
    const currentLevel = unlocked.length > 0 ? Math.max(...unlocked.map((a) => a.level)) : 0

    // Find next threshold
    const nextThreshold = currentLevel < def.thresholds.length 
      ? def.thresholds[currentLevel] 
      : null

    progress.push({
      key: def.key,
      currentLevel,
      currentCount,
      nextThreshold,
    })
  }

  return progress
}

