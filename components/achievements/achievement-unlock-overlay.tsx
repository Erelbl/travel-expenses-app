"use client"

import { useState, useEffect } from "react"
import { AchievementKey } from "@prisma/client"
import { getAchievementMetadata } from "@/lib/achievements/metadata"
import { useI18n } from "@/lib/i18n/I18nProvider"

interface AchievementLevel {
  key: AchievementKey
  level: number
}

interface AchievementUnlockOverlayProps {
  achievements: AchievementLevel[]
  onClose: () => void
}

export function AchievementUnlockOverlay({
  achievements,
  onClose,
}: AchievementUnlockOverlayProps) {
  const { t } = useI18n()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    setIsVisible(true)
  }, [])

  useEffect(() => {
    // Auto-dismiss after 4 seconds
    if (achievements.length > 0) {
      const timer = setTimeout(() => {
        handleContinue()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, achievements.length])

  if (achievements.length === 0) {
    return null
  }

  const current = achievements[currentIndex]
  const currentAchievement = getAchievementMetadata(current.key)

  const handleContinue = async () => {
    // Mark current achievement as notified
    try {
      await fetch('/api/achievements/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: current.key,
          level: current.level,
        }),
      })
    } catch (error) {
      console.error('Failed to mark achievement as notified:', error)
      // Continue anyway - don't block user
    }

    if (currentIndex < achievements.length - 1) {
      // Show next achievement
      setIsVisible(false)
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
        setIsVisible(true)
      }, 300)
    } else {
      // All done
      setIsVisible(false)
      setTimeout(onClose, 300)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`relative mx-4 w-full max-w-md transform transition-all duration-500 ${
          isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
      >
        <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-2xl">
          {/* Animated background gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${currentAchievement.color} opacity-10`}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Icon with ring animation */}
            <div className="relative mb-6">
              <div
                className={`absolute inset-0 animate-ping rounded-full bg-gradient-to-br ${currentAchievement.color} opacity-20`}
                style={{ animationDuration: "1.5s" }}
              />
              <div
                className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${currentAchievement.color} text-4xl shadow-lg`}
              >
                {currentAchievement.icon}
              </div>
            </div>

            {/* Title */}
            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              {t("achievements.unlocked")}
            </h2>

            {/* Achievement name with level */}
            <h3 className="mb-2 text-xl font-semibold text-slate-800">
              {t(currentAchievement.titleKey)}
            </h3>
            <div className="mb-4">
              <span
                className={`inline-block text-lg font-bold px-3 py-1 rounded-full bg-gradient-to-r ${currentAchievement.color} text-white`}
              >
                {t("achievements.levelLabel")} {current.level}
              </span>
            </div>

            {/* Description */}
            <p className="mb-6 text-slate-600">{t(currentAchievement.unlockMessageKey)}</p>

            {/* Continue button */}
            <button
              onClick={handleContinue}
              className={`rounded-lg bg-gradient-to-r ${currentAchievement.color} px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95`}
            >
              {t("achievements.continue")}
            </button>

            {/* Progress indicator */}
            {achievements.length > 1 && (
              <div className="mt-6 flex gap-2">
                {achievements.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === currentIndex ? "bg-slate-800" : "bg-slate-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

