"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react"
import { Trip } from "@/lib/schemas/trip.schema"
import { Expense } from "@/lib/schemas/expense.schema"
import { tripsRepository, expensesRepository } from "@/lib/data"

interface TripStoreState {
  trip: Trip | null
  expenses: Expense[]
  loading: boolean
  error: boolean
  refreshTrip: () => Promise<void>
}

const TripStoreContext = createContext<TripStoreState | null>(null)

interface TripStoreProviderProps {
  tripId: string
  initialTrip: Trip | null
  initialExpenses: Expense[]
  children: ReactNode
}

export function TripStoreProvider({
  tripId,
  initialTrip,
  initialExpenses,
  children,
}: TripStoreProviderProps) {
  const [trip, setTrip] = useState<Trip | null>(initialTrip)
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [lastTripId, setLastTripId] = useState(tripId)
  const refreshRequestedRef = useRef(false)

  // Reset state when tripId changes (e.g., navigating to different trip)
  if (tripId !== lastTripId) {
    setTrip(initialTrip)
    setExpenses(initialExpenses)
    setLastTripId(tripId)
    refreshRequestedRef.current = false
  }

  const refreshTrip = useCallback(async () => {
    try {
      setLoading(true)
      setError(false)
      refreshRequestedRef.current = true
      
      const [tripData, expensesData] = await Promise.all([
        tripsRepository.getTrip(tripId),
        expensesRepository.listExpenses(tripId),
      ])

      if (tripData) {
        setTrip(tripData)
      }
      setExpenses(expensesData)
    } catch (err) {
      console.error("Failed to refresh trip data:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [tripId])

  // Mark that refresh is needed when provider mounts after navigation
  useEffect(() => {
    // Store in sessionStorage that we need to refresh on next mount
    const needsRefresh = sessionStorage.getItem(`trip_${tripId}_needs_refresh`)
    if (needsRefresh === 'true' && !refreshRequestedRef.current) {
      refreshTrip()
      sessionStorage.removeItem(`trip_${tripId}_needs_refresh`)
    }
  }, [tripId, refreshTrip])

  return (
    <TripStoreContext.Provider
      value={{
        trip,
        expenses,
        loading,
        error,
        refreshTrip,
      }}
    >
      {children}
    </TripStoreContext.Provider>
  )
}

export function useTripStore() {
  const context = useContext(TripStoreContext)
  if (!context) {
    throw new Error("useTripStore must be used within TripStoreProvider")
  }
  return context
}

