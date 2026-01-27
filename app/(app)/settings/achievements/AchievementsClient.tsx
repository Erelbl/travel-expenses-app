"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Lock } from "lucide-react"
import { AchievementKey } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { getAllAchievements, getAchievementMetadata } from "@/lib/achievements/metadata"

interface AchievementsClientProps {
  unlockedKeys: AchievementKey[]
}

export function AchievementsClient({ unlockedKeys }: AchievementsClientProps) {
  const router = useRouter()
  const allAchievements = getAllAchievements()
  const unlockedSet = new Set(unlockedKeys)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4 p-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">Achievements</h1>
              <p className="text-sm text-slate-500">
                {unlockedKeys.length} of {allAchievements.length} unlocked
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-6 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {allAchievements.map((achievement) => {
            const isUnlocked = unlockedSet.has(achievement.key)

            return (
              <div
                key={achievement.key}
                className={`relative overflow-hidden rounded-xl border transition-all ${
                  isUnlocked
                    ? "border-slate-200 bg-white shadow-sm hover:shadow-md"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                {isUnlocked && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${achievement.color} opacity-5`}
                  />
                )}

                <div className="relative z-10 p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="relative shrink-0">
                      {isUnlocked ? (
                        <>
                          {/* Unlocked: colored ring */}
                          <div
                            className={`absolute -inset-2 rounded-full bg-gradient-to-br ${achievement.color} opacity-20 blur-sm`}
                          />
                          <div
                            className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${achievement.color} text-3xl shadow-md ring-4 ring-white`}
                          >
                            {achievement.icon}
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Locked: gray */}
                          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-3xl grayscale">
                            {achievement.icon}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-400 text-white shadow-sm">
                              <Lock className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`mb-1 text-lg font-semibold ${
                          isUnlocked ? "text-slate-900" : "text-slate-500"
                        }`}
                      >
                        {achievement.title}
                      </h3>
                      <p
                        className={`text-sm ${
                          isUnlocked ? "text-slate-600" : "text-slate-400"
                        }`}
                      >
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

