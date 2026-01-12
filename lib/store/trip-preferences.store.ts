import { create } from "zustand"
import { persist } from "zustand/middleware"

interface TripPreferencesState {
  // Map of tripId -> last used currency
  lastUsedCurrencies: Record<string, string>
  setLastUsedCurrency: (tripId: string, currency: string) => void
  getLastUsedCurrency: (tripId: string) => string | null
}

export const useTripPreferencesStore = create<TripPreferencesState>()(
  persist(
    (set, get) => ({
      lastUsedCurrencies: {},
      setLastUsedCurrency: (tripId, currency) =>
        set((state) => ({
          lastUsedCurrencies: {
            ...state.lastUsedCurrencies,
            [tripId]: currency,
          },
        })),
      getLastUsedCurrency: (tripId) => {
        return get().lastUsedCurrencies[tripId] || null
      },
    }),
    {
      name: "travel-expenses:trip-preferences",
    }
  )
)

