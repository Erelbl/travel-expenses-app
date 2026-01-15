import { Trip, CreateTrip } from "@/lib/schemas/trip.schema"
import { Expense, CreateExpense } from "@/lib/schemas/expense.schema"
import { ExchangeRate } from "@/lib/schemas/exchange-rate.schema"

export interface TripsRepository {
  listTrips(userId: string): Promise<Trip[]>
  getTrip(tripId: string): Promise<Trip | null>
  getTripForUser(tripId: string, userId: string): Promise<Trip | null>
  createTrip(trip: CreateTrip): Promise<Trip>
  updateTrip(tripId: string, data: Partial<Trip>): Promise<Trip>
  deleteTrip(id: string, userId: string): Promise<void>
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

