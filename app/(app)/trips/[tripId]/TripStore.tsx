"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react"
import { Trip } from "@/lib/schemas/trip.schema"
import { Expense } from "@/lib/schemas/expense.schema"
import { tripsRepository, expensesRepository } from "@/lib/data"

interface TripStoreState {
  trip: Trip | null
  expenses: Expense[]
  loading: boolean
  error: boolean
  refreshTrip: () => Promise<void>
  addExpense: (expense: Expense) => void
  updateExpense: (expenseId: string, updates: Partial<Expense>) => void
  removeExpense: (expenseId: string) => void
  updateTrip: (updates: Partial<Trip>) => void
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

  // Reset state when tripId changes (e.g., navigating to different trip)
  if (tripId !== lastTripId) {
    setTrip(initialTrip)
    setExpenses(initialExpenses)
    setLastTripId(tripId)
  }

  const refreshTrip = useCallback(async () => {
    try {
      setLoading(true)
      setError(false)
      
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

  // Local state mutation methods
  const addExpense = useCallback((expense: Expense) => {
    setExpenses(prev => [expense, ...prev])
  }, [])

  const updateExpense = useCallback((expenseId: string, updates: Partial<Expense>) => {
    setExpenses(prev => 
      prev.map(exp => exp.id === expenseId ? { ...exp, ...updates } : exp)
    )
  }, [])

  const removeExpense = useCallback((expenseId: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== expenseId))
  }, [])

  const updateTrip = useCallback((updates: Partial<Trip>) => {
    setTrip(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  return (
    <TripStoreContext.Provider
      value={{
        trip,
        expenses,
        loading,
        error,
        refreshTrip,
        addExpense,
        updateExpense,
        removeExpense,
        updateTrip,
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

