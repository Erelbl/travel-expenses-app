import { Expense, CreateExpense } from "@/lib/schemas/expense.schema"
import { ExpensesRepository } from "@/lib/data/repositories"
import { prisma } from "@/lib/db"
import { Expense as PrismaExpense } from "@prisma/client"

const DEMO_USER_ID = "demo-user"

export class PrismaExpensesRepository implements ExpensesRepository {
  async listExpenses(tripId: string): Promise<Expense[]> {
    const expenses: PrismaExpense[] = await prisma.expense.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
    })
    
    return expenses.map((e: PrismaExpense) => ({
      id: e.id,
      tripId: e.tripId,
      amount: e.amount,
      currency: e.currency,
      baseCurrency: "",
      fxRateUsed: e.fxRate ?? undefined,
      fxRateDate: e.fxDate?.toISOString().split('T')[0],
      convertedAmount: e.convertedAmount ?? undefined,
      fxRateSource: e.fxRate ? "manual" as const : undefined,
      amountInBase: e.convertedAmount ?? undefined,
      category: e.category as any,
      country: e.countryCode,
      merchant: e.title,
      note: e.note ?? undefined,
      paidByMemberId: e.createdById,
      createdByMemberId: e.createdById,
      date: e.expenseDate.toISOString().split('T')[0],
      createdAt: e.createdAt.getTime(),
      numberOfNights: e.nights ?? undefined,
      isFutureExpense: !!e.usageDate,
      usageDate: e.usageDate?.toISOString().split('T')[0],
      pricePerNight: e.nights && e.convertedAmount ? e.convertedAmount / e.nights : undefined,
    }))
  }

  async getExpense(id: string): Promise<Expense | null> {
    const e = await prisma.expense.findUnique({ where: { id } })
    if (!e) return null
    
    return {
      id: e.id,
      tripId: e.tripId,
      amount: e.amount,
      currency: e.currency,
      baseCurrency: "",
      fxRateUsed: e.fxRate ?? undefined,
      fxRateDate: e.fxDate?.toISOString().split('T')[0],
      convertedAmount: e.convertedAmount ?? undefined,
      fxRateSource: e.fxRate ? "manual" as const : undefined,
      amountInBase: e.convertedAmount ?? undefined,
      category: e.category as any,
      country: e.countryCode,
      merchant: e.title,
      note: e.note ?? undefined,
      paidByMemberId: e.createdById,
      createdByMemberId: e.createdById,
      date: e.expenseDate.toISOString().split('T')[0],
      createdAt: e.createdAt.getTime(),
      numberOfNights: e.nights ?? undefined,
      isFutureExpense: !!e.usageDate,
      usageDate: e.usageDate?.toISOString().split('T')[0],
      pricePerNight: e.nights && e.convertedAmount ? e.convertedAmount / e.nights : undefined,
    }
  }

  async createExpense(expense: CreateExpense): Promise<Expense> {
    console.log('[EXPENSE CREATE] Starting expense creation:', expense.merchant)
    
    const created = await prisma.expense.create({
      data: {
        tripId: expense.tripId,
        createdById: DEMO_USER_ID,
        title: expense.merchant || "Expense",
        category: expense.category,
        countryCode: expense.country,
        currency: expense.currency,
        amount: expense.amount,
        convertedAmount: null,
        fxRate: null,
        fxDate: null,
        expenseDate: new Date(expense.date),
        usageDate: expense.usageDate ? new Date(expense.usageDate) : null,
        nights: expense.numberOfNights ?? null,
        note: expense.note ?? null,
      },
    })
    
    console.log('[EXPENSE CREATE] Expense created successfully:', created.id)
    
    return {
      id: created.id,
      tripId: created.tripId,
      amount: created.amount,
      currency: created.currency,
      baseCurrency: "",
      fxRateUsed: created.fxRate ?? undefined,
      fxRateDate: created.fxDate?.toISOString().split('T')[0],
      convertedAmount: created.convertedAmount ?? undefined,
      fxRateSource: created.fxRate ? "manual" as const : undefined,
      amountInBase: created.convertedAmount ?? undefined,
      category: created.category as any,
      country: created.countryCode,
      merchant: created.title,
      note: created.note ?? undefined,
      paidByMemberId: created.createdById,
      createdByMemberId: created.createdById,
      date: created.expenseDate.toISOString().split('T')[0],
      createdAt: created.createdAt.getTime(),
      numberOfNights: created.nights ?? undefined,
      isFutureExpense: !!created.usageDate,
      usageDate: created.usageDate?.toISOString().split('T')[0],
      pricePerNight: created.nights && created.convertedAmount ? created.convertedAmount / created.nights : undefined,
    }
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const updated = await prisma.expense.update({
      where: { id },
      data: {
        title: updates.merchant,
        category: updates.category,
        countryCode: updates.country,
        currency: updates.currency,
        amount: updates.amount,
        convertedAmount: updates.convertedAmount,
        fxRate: updates.fxRateUsed,
        fxDate: updates.fxRateDate ? new Date(updates.fxRateDate) : undefined,
        expenseDate: updates.date ? new Date(updates.date) : undefined,
        usageDate: updates.usageDate ? new Date(updates.usageDate) : undefined,
        nights: updates.numberOfNights,
        note: updates.note,
      },
    })
    
    return {
      id: updated.id,
      tripId: updated.tripId,
      amount: updated.amount,
      currency: updated.currency,
      baseCurrency: "",
      fxRateUsed: updated.fxRate ?? undefined,
      fxRateDate: updated.fxDate?.toISOString().split('T')[0],
      convertedAmount: updated.convertedAmount ?? undefined,
      fxRateSource: updated.fxRate ? "manual" as const : undefined,
      amountInBase: updated.convertedAmount ?? undefined,
      category: updated.category as any,
      country: updated.countryCode,
      merchant: updated.title,
      note: updated.note ?? undefined,
      paidByMemberId: updated.createdById,
      createdByMemberId: updated.createdById,
      date: updated.expenseDate.toISOString().split('T')[0],
      createdAt: updated.createdAt.getTime(),
      numberOfNights: updated.nights ?? undefined,
      isFutureExpense: !!updated.usageDate,
      usageDate: updated.usageDate?.toISOString().split('T')[0],
      pricePerNight: updated.nights && updated.convertedAmount ? updated.convertedAmount / updated.nights : undefined,
    }
  }

  async deleteExpense(id: string): Promise<void> {
    await prisma.expense.delete({ where: { id } })
  }
}

