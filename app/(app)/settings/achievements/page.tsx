import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserAchievementProgress } from "@/lib/achievements/progress"
import { evaluateAchievements } from "@/lib/achievements/evaluate"
import { AchievementsClient } from "./AchievementsClient"

export default async function AchievementsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/login")
  }
  
  // Sync achievements first (inserts missing levels)
  await evaluateAchievements(session.user.id)
  
  const progress = await getUserAchievementProgress(session.user.id)
  
  return <AchievementsClient progress={progress} />
}

