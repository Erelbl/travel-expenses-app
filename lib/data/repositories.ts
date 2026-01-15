import { Trip, CreateTrip } from "@/lib/schemas/trip.schema"
import { Expense, CreateExpense } from "@/lib/schemas/expense.schema"
import { ExchangeRate } from "@/lib/schemas/exchange-rate.schema"

export interface TripsRepository {
  listTrips(): Promise<Trip[]>
  getTrip(id: string): Promise<Trip | null>
  createTrip(trip: CreateTrip): Promise<Trip>
  updateTrip(id: string, trip: Partial<Trip>): Promise<Trip>
  deleteTrip(id: string): Promise<void>
}

export interface ExpensesRepository {
  listExpenses(tripId: string): Promise<Expense[]>
  getExpense(id: string): Promise<Expense | null>
  createExpense(expense: CreateExpense & { createdById: string }): Promise<Expense>
  updateExpense(id: string, expense: Partial<Expense>): Promise<Expense>
  deleteExpense(id: string): Promise<void>
}

export interface RatesRepository {
  getRates(baseCurrency: string): Promise<ExchangeRate | null>
  setRates(baseCurrency: string, rates: Record<string, number>): Promise<void>
}

