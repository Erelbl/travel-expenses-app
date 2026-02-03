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

    // Calculate qualified level based on current metric
    let qualifiedLevel = 0
    for (let i = 0; i < def.thresholds.length; i++) {
      if (currentCount >= def.thresholds[i]) {
        qualifiedLevel = i + 1
      } else {
        break
      }
    }

    // Find next threshold
    const nextThreshold = qualifiedLevel < def.thresholds.length 
      ? def.thresholds[qualifiedLevel] 
      : null

    progress.push({
      key: def.key,
      currentLevel: qualifiedLevel,
      currentCount,
      nextThreshold,
    })
  }

  return progress
}

