import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UserProfile {
  name: string
  nickname: string
  email: string
  photoUrl?: string
}

interface AppPreferences {
  baseCurrency: string
  defaultCountry: string
}

interface PreferencesState {
  // User profile
  profile: UserProfile
  setProfile: (profile: Partial<UserProfile>) => void
  
  // App preferences
  preferences: AppPreferences
  setPreferences: (prefs: Partial<AppPreferences>) => void
  
  // Legacy support (for backward compatibility)
  lastUsedCurrency: string
  lastUsedCountry: string
  setLastUsedCurrency: (currency: string) => void
  setLastUsedCountry: (country: string) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      // Profile defaults
      profile: {
        name: "",
        nickname: "",
        email: "",
        photoUrl: undefined,
      },
      setProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),
      
      // Preferences defaults
      preferences: {
        baseCurrency: "USD",
        defaultCountry: "US",
      },
      setPreferences: (updates) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        })),
      
      // Legacy
      lastUsedCurrency: "USD",
      lastUsedCountry: "US",
      setLastUsedCurrency: (currency) => set({ lastUsedCurrency: currency }),
      setLastUsedCountry: (country) => set({ lastUsedCountry: country }),
    }),
    {
      name: "travel-expenses:preferences",
    }
  )
)

