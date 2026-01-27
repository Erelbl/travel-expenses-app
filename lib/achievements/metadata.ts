import { AchievementKey } from "@prisma/client"

export interface AchievementMetadata {
  key: AchievementKey
  titleKey: string
  descriptionKey: string
  unlockMessageKey: string
  icon: string
  color: string
}

export const ACHIEVEMENT_METADATA: Record<AchievementKey, AchievementMetadata> = {
  [AchievementKey.FIRST_EXPENSE_LOGGED]: {
    key: AchievementKey.FIRST_EXPENSE_LOGGED,
    titleKey: "achievements.firstExpense.title",
    descriptionKey: "achievements.firstExpense.description",
    unlockMessageKey: "achievements.firstExpense.unlockMessage",
    icon: "🎯",
    color: "from-blue-400 to-blue-600",
  },
  [AchievementKey.EXPENSES_ON_3_DAYS]: {
    key: AchievementKey.EXPENSES_ON_3_DAYS,
    titleKey: "achievements.threeDay.title",
    descriptionKey: "achievements.threeDay.description",
    unlockMessageKey: "achievements.threeDay.unlockMessage",
    icon: "📅",
    color: "from-green-400 to-green-600",
  },
  [AchievementKey.TEN_EXPENSES_LOGGED]: {
    key: AchievementKey.TEN_EXPENSES_LOGGED,
    titleKey: "achievements.tenExpenses.title",
    descriptionKey: "achievements.tenExpenses.description",
    unlockMessageKey: "achievements.tenExpenses.unlockMessage",
    icon: "📊",
    color: "from-purple-400 to-purple-600",
  },
  [AchievementKey.FIRST_TRIP_COMPLETED]: {
    key: AchievementKey.FIRST_TRIP_COMPLETED,
    titleKey: "achievements.firstTripCompleted.title",
    descriptionKey: "achievements.firstTripCompleted.description",
    unlockMessageKey: "achievements.firstTripCompleted.unlockMessage",
    icon: "✈️",
    color: "from-amber-400 to-amber-600",
  },
  [AchievementKey.THREE_TRIPS_LOGGED]: {
    key: AchievementKey.THREE_TRIPS_LOGGED,
    titleKey: "achievements.threeTrips.title",
    descriptionKey: "achievements.threeTrips.description",
    unlockMessageKey: "achievements.threeTrips.unlockMessage",
    icon: "🌍",
    color: "from-cyan-400 to-cyan-600",
  },
  [AchievementKey.EXPENSES_IN_2_COUNTRIES]: {
    key: AchievementKey.EXPENSES_IN_2_COUNTRIES,
    titleKey: "achievements.twoCountries.title",
    descriptionKey: "achievements.twoCountries.description",
    unlockMessageKey: "achievements.twoCountries.unlockMessage",
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

