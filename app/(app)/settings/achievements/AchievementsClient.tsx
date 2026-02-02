"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { AchievementKey } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { getAllAchievements, getMaxLevel } from "@/lib/achievements/metadata"
import { useI18n } from "@/lib/i18n/I18nProvider"

interface AchievementsClientProps {
  progress: Array<{
    key: AchievementKey
    currentLevel: number
    currentCount: number
    nextThreshold: number | null
  }>
}

export function AchievementsClient({ progress }: AchievementsClientProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const allAchievements = getAllAchievements()
  const progressMap = new Map(progress.map((p) => [p.key, p]))
  const isRTL = locale === "he"

  const totalUnlocked = progress.filter((p) => p.currentLevel > 0).length
  const totalLevels = progress.reduce((sum, p) => sum + getMaxLevel(p.key), 0)
  const unlockedLevels = progress.reduce((sum, p) => sum + p.currentLevel, 0)

  return (
    <div className="min-h-screen bg-slate-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4 p-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{t("achievements.title")}</h1>
              <p className="text-sm text-slate-500">
                {totalUnlocked} / {allAchievements.length} {t("achievements.achievementsUnlocked")} • {unlockedLevels} / {totalLevels} {t("achievements.levelsUnlocked")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-6 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {allAchievements.map((achievement) => {
            const prog = progressMap.get(achievement.key)
            const currentLevel = prog?.currentLevel ?? 0
            const currentCount = prog?.currentCount ?? 0
            const nextThreshold = prog?.nextThreshold ?? null
            const maxLevel = getMaxLevel(achievement.key)
            const isUnlocked = currentLevel > 0
            const isMaxLevel = currentLevel >= maxLevel
            
            const progressPercent = nextThreshold
              ? Math.min(100, (currentCount / nextThreshold) * 100)
              : 100

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
                          {/* Not unlocked: grayscale only */}
                          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-3xl grayscale opacity-40">
                            {achievement.icon}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`text-lg font-semibold ${
                            isUnlocked ? "text-slate-900" : "text-slate-500"
                          }`}
                        >
                          {t(achievement.titleKey)}
                        </h3>
                        {isUnlocked && (
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${achievement.color} text-white`}
                          >
                            {t("achievements.levelLabel")} {currentLevel}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm mb-3 ${
                          isUnlocked ? "text-slate-600" : "text-slate-400"
                        }`}
                      >
                        {t(achievement.descriptionKey)}
                      </p>

                      {/* Progress bar */}
                      {isUnlocked && !isMaxLevel && nextThreshold && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>{currentCount} / {nextThreshold}</span>
                            <span>{Math.round(progressPercent)}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${achievement.color} transition-all duration-500`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500">
                            {t("achievements.progressToNext")}
                          </p>
                        </div>
                      )}
                      {isMaxLevel && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                          <span>✨</span>
                          <span>{t("achievements.maxLevelReached")}</span>
                        </div>
                      )}
                      {!isUnlocked && (
                        <p className="text-xs text-slate-400">
                          {t("achievements.locked")}
                        </p>
                      )}
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

