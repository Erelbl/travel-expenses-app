import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUnlockedAchievements } from "@/lib/achievements/achievements"
import { AchievementsClient } from "./AchievementsClient"

export default async function AchievementsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/login")
  }
  
  const unlockedKeys = await getUnlockedAchievements(session.user.id)
  
  return <AchievementsClient unlockedKeys={unlockedKeys} />
}

