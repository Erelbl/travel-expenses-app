import { AchievementKey } from "@prisma/client"

export interface AchievementMetadata {
  key: AchievementKey
  title: string
  description: string
  icon: string
  color: string
}

export const ACHIEVEMENT_METADATA: Record<AchievementKey, AchievementMetadata> = {
  [AchievementKey.FIRST_EXPENSE_LOGGED]: {
    key: AchievementKey.FIRST_EXPENSE_LOGGED,
    title: "First Steps",
    description: "Logged your first expense",
    icon: "🎯",
    color: "from-blue-400 to-blue-600",
  },
  [AchievementKey.EXPENSES_ON_3_DAYS]: {
    key: AchievementKey.EXPENSES_ON_3_DAYS,
    title: "Tracking Habit",
    description: "Logged expenses on 3 different days",
    icon: "📅",
    color: "from-green-400 to-green-600",
  },
  [AchievementKey.TEN_EXPENSES_LOGGED]: {
    key: AchievementKey.TEN_EXPENSES_LOGGED,
    title: "Detailed Tracker",
    description: "Logged 10 expenses",
    icon: "📊",
    color: "from-purple-400 to-purple-600",
  },
  [AchievementKey.FIRST_TRIP_COMPLETED]: {
    key: AchievementKey.FIRST_TRIP_COMPLETED,
    title: "Journey Complete",
    description: "Completed your first trip",
    icon: "✈️",
    color: "from-amber-400 to-amber-600",
  },
  [AchievementKey.THREE_TRIPS_LOGGED]: {
    key: AchievementKey.THREE_TRIPS_LOGGED,
    title: "Frequent Traveler",
    description: "Created 3 trips",
    icon: "🌍",
    color: "from-cyan-400 to-cyan-600",
  },
  [AchievementKey.EXPENSES_IN_2_COUNTRIES]: {
    key: AchievementKey.EXPENSES_IN_2_COUNTRIES,
    title: "Globe Trotter",
    description: "Logged expenses in 2 different countries",
    icon: "🗺️",
    color: "from-pink-400 to-pink-600",
  },
}

export function getAchievementMetadata(key: AchievementKey): AchievementMetadata {
  return ACHIEVEMENT_METADATA[key]
}

export function getAllAchievements(): AchievementMetadata[] {
  return Object.values(ACHIEVEMENT_METADATA)
}

