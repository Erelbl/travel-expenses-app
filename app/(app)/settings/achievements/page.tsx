import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserAchievementProgress } from "@/lib/achievements/achievements"
import { AchievementsClient } from "./AchievementsClient"

export default async function AchievementsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/login")
  }
  
  const progress = await getUserAchievementProgress(session.user.id)
  
  return <AchievementsClient progress={progress} />
}

