import { Expense, CreateExpense, ExpenseSchema } from "@/lib/schemas/expense.schema"
import { Trip } from "@/lib/schemas/trip.schema"
import { ExpensesRepository } from "@/lib/data/repositories"
import { LocalTripsRepository } from "./trips-local.repository"
import { LocalRatesRepository } from "./rates-local.repository"

const STORAGE_KEY = "travel-expenses:expenses"

export class LocalExpensesRepository implements ExpensesRepository {
  private tripsRepo = new LocalTripsRepository()
  private ratesRepo = new LocalRatesRepository()

  private getExpensesFromStorage(): Expense[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  private saveExpensesToStorage(expenses: Expense[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
  }

  async listExpenses(tripId: string): Promise<Expense[]> {
    const expenses = this.getExpensesFromStorage()
    return expenses
      .filter((e) => e.tripId === tripId)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  async getExpense(id: string): Promise<Expense | null> {
    const expenses = this.getExpensesFromStorage()
    return expenses.find((e) => e.id === id) ?? null
  }

  async createExpense(expense: CreateExpense & { createdById: string }): Promise<Expense> {
    // Get trip to determine base currency
    const trip = await this.tripsRepo.getTrip(expense.tripId)
    if (!trip) {
      throw new Error(`Trip not found: ${expense.tripId}`)
    }

    const baseCurrency = trip.baseCurrency
    
    // Stable FX conversion logic
    let convertedAmount: number | undefined
    let fxRateUsed: number | undefined
    let fxRateDate: string | undefined
    let fxRateSource: "auto" | "manual" | undefined

    if (expense.currency === baseCurrency) {
      // Same currency: no conversion needed
      convertedAmount = expense.amount
      fxRateUsed = 1
      fxRateDate = expense.date
      fxRateSource = "auto"
    } else {
      // Different currency: attempt auto-fetch or use stored rates
      try {
        // Try to get rate from API or local storage
        const rates = await this.ratesRepo.getRates(baseCurrency)
        if (rates && rates.rates[expense.currency]) {
          // Use stored rate (rateToBase: base per 1 unit of expense currency)
          fxRateUsed = rates.rates[expense.currency]
          // Canonical conversion: amountBase = amountOriginal * rateToBase
          convertedAmount = expense.amount * fxRateUsed
          fxRateDate = expense.date
          fxRateSource = "auto"
        } else {
          convertedAmount = undefined
          fxRateUsed = undefined
          fxRateDate = undefined
          fxRateSource = undefined
        }
      } catch (error) {
        console.error("Failed to get exchange rate:", error)
        convertedAmount = undefined
        fxRateUsed = undefined
        fxRateDate = undefined
        fxRateSource = undefined
      }
    }

    const newExpense: Expense = {
      ...expense,
      baseCurrency,
      convertedAmount,
      fxRateUsed,
      fxRateDate,
      fxRateSource,
      amountInBase: convertedAmount, // Legacy field for backward compatibility
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    
    ExpenseSchema.parse(newExpense)
    
    const expenses = this.getExpensesFromStorage()
    expenses.push(newExpense)
    this.saveExpensesToStorage(expenses)
    
    return newExpense
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const expenses = this.getExpensesFromStorage()
    const index = expenses.findIndex((e) => e.id === id)
    
    if (index === -1) {
      throw new Error(`Expense not found: ${id}`)
    }
    
    const updatedExpense = { ...expenses[index], ...updates }
    ExpenseSchema.parse(updatedExpense)
    
    expenses[index] = updatedExpense
    this.saveExpensesToStorage(expenses)
    
    return updatedExpense
  }

  async deleteExpense(id: string): Promise<void> {
    const expenses = this.getExpensesFromStorage()
    const filtered = expenses.filter((e) => e.id !== id)
    this.saveExpensesToStorage(filtered)
  }
}

