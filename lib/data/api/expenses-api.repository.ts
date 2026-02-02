import { Expense, CreateExpense } from "@/lib/schemas/expense.schema"
import { ExpensesRepository } from "@/lib/data/repositories"

export class ApiExpensesRepository implements ExpensesRepository {
  async listExpenses(tripId: string): Promise<Expense[]> {
    const res = await fetch(`/api/trips/${tripId}/expenses`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch expenses')
    return res.json()
  }

  async getExpense(id: string): Promise<Expense | null> {
    // First, we need to get the expense to know which trip it belongs to
    // For now, we'll need to list all expenses across trips (not ideal)
    // In practice, callers should use the trip-scoped endpoint directly
    // This is a temporary shim - ideally, this method should take tripId as parameter
    throw new Error('getExpense by ID alone is deprecated - use trip-scoped endpoint instead')
  }

  async createExpense(expense: CreateExpense): Promise<Expense> {
    const res = await fetch(`/api/trips/${expense.tripId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    })
    if (!res.ok) throw new Error('Failed to create expense')
    return res.json()
  }

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    // updateExpense requires tripId - the expense partial should include it
    if (!expense.tripId) {
      throw new Error('updateExpense requires expense.tripId to be set')
    }
    const res = await fetch(`/api/trips/${expense.tripId}/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    })
    if (!res.ok) throw new Error('Failed to update expense')
    return res.json()
  }

  async deleteExpense(id: string): Promise<void> {
    // deleteExpense by ID alone is deprecated - callers should use direct fetch with tripId
    throw new Error('deleteExpense by ID alone is deprecated - use trip-scoped endpoint instead')
  }
}

