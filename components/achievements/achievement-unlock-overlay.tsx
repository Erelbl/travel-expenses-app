"use client"

import { useState, useEffect } from "react"
import { AchievementKey } from "@prisma/client"
import { getAchievementMetadata } from "@/lib/achievements/metadata"

interface AchievementUnlockOverlayProps {
  achievements: AchievementKey[]
  onClose: () => void
}

export function AchievementUnlockOverlay({
  achievements,
  onClose,
}: AchievementUnlockOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    setIsVisible(true)
  }, [])

  if (achievements.length === 0) {
    return null
  }

  const currentAchievement = getAchievementMetadata(achievements[currentIndex])

  const handleContinue = () => {
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
              Achievement Unlocked!
            </h2>

            {/* Achievement name */}
            <h3 className="mb-2 text-xl font-semibold text-slate-800">
              {currentAchievement.title}
            </h3>

            {/* Description */}
            <p className="mb-6 text-slate-600">{currentAchievement.description}</p>

            {/* Continue button */}
            <button
              onClick={handleContinue}
              className={`rounded-lg bg-gradient-to-r ${currentAchievement.color} px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95`}
            >
              Continue
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

