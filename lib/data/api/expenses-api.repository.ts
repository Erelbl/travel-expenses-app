import { Expense, CreateExpense } from "@/lib/schemas/expense.schema"
import { ExpensesRepository } from "@/lib/data/repositories"

export class ApiExpensesRepository implements ExpensesRepository {
  async listExpenses(tripId: string): Promise<Expense[]> {
    // 🐛 ROOT CAUSE #5: fetch() without cache options uses default caching
    // ISSUE: This fetch call is cached by Next.js Data Cache
    // PROBLEM: After creating/updating/deleting expenses, the list shows stale data
    //          until manual refresh because the cache is not invalidated
    // FIX: Add { cache: 'no-store' } or { next: { revalidate: 0 } } to fetch options
    const res = await fetch(`/api/trips/${tripId}/expenses`)
    if (!res.ok) throw new Error('Failed to fetch expenses')
    return res.json()
  }

  async getExpense(id: string): Promise<Expense | null> {
    const res = await fetch(`/api/expenses/${id}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to fetch expense')
    return res.json()
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
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    })
    if (!res.ok) throw new Error('Failed to update expense')
    return res.json()
  }

  async deleteExpense(id: string): Promise<void> {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete expense')
  }
}

