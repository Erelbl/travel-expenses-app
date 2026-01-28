import { Expense, CreateExpense } from "@/lib/schemas/expense.schema"
import { ExpensesRepository } from "@/lib/data/repositories"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { convertCurrency } from "@/lib/server/fx"
import { unstable_cache } from "next/cache"

// Type for expense rows returned by Prisma
type ExpenseRow = Prisma.ExpenseGetPayload<{
  select: {
    id: true
    tripId: true
    createdById: true
    createdBy: {
      select: {
        name: true
        email: true
      }
    }
    title: true
    category: true
    countryCode: true
    currency: true
    amount: true
    convertedAmount: true
    expenseDate: true
    note: true
    createdAt: true
  }
}>

export class PrismaExpensesRepository implements ExpensesRepository {
  async listExpenses(tripId: string): Promise<Expense[]> {
    return unstable_cache(
      async () => {
        const expenses: ExpenseRow[] = await prisma.expense.findMany({
      where: { tripId },
      select: {
        id: true,
        tripId: true,
        createdById: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        title: true,
        category: true,
        countryCode: true,
        currency: true,
        amount: true,
        convertedAmount: true,
        expenseDate: true,
        note: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
        })
        
        return expenses.map((e: ExpenseRow) => ({
      id: e.id,
      tripId: e.tripId,
      amount: e.amount,
      currency: e.currency,
      baseCurrency: "",
      convertedAmount: e.convertedAmount ?? undefined,
      amountInBase: e.convertedAmount ?? undefined,
      category: e.category as any,
      country: e.countryCode,
      merchant: e.title,
      note: e.note ?? undefined,
      paidByMemberId: e.createdById,
      createdByMemberId: e.createdById,
      createdByUser: {
        name: e.createdBy.name,
        email: e.createdBy.email,
      },
      date: e.expenseDate.toISOString().split('T')[0],
      createdAt: e.createdAt.getTime(),
        }))
      },
      [`expenses-${tripId}`],
      { revalidate: 30, tags: [`expenses-${tripId}`] }
    )()
  }

  async getExpense(id: string): Promise<Expense | null> {
    const e = await prisma.expense.findUnique({
      where: { id },
      select: {
        id: true,
        tripId: true,
        createdById: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        title: true,
        category: true,
        countryCode: true,
        currency: true,
        amount: true,
        convertedAmount: true,
        fxRate: true,
        fxDate: true,
        manualRateToBase: true,
        expenseDate: true,
        usageDate: true,
        nights: true,
        note: true,
        createdAt: true,
        updatedAt: true,
      }
    })
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
      fxRateSource: e.manualRateToBase ? "manual" as const : (e.fxRate ? "auto" as const : undefined),
      manualRateToBase: e.manualRateToBase ?? undefined,
      amountInBase: e.convertedAmount ?? undefined,
      category: e.category as any,
      country: e.countryCode,
      merchant: e.title,
      note: e.note ?? undefined,
      paidByMemberId: e.createdById,
      createdByMemberId: e.createdById,
      createdByUser: {
        name: e.createdBy.name,
        email: e.createdBy.email,
      },
      date: e.expenseDate.toISOString().split('T')[0],
      createdAt: e.createdAt.getTime(),
      numberOfNights: e.nights ?? undefined,
      isFutureExpense: !!e.usageDate,
      usageDate: e.usageDate?.toISOString().split('T')[0],
      pricePerNight: e.nights && e.convertedAmount ? e.convertedAmount / e.nights : undefined,
    }
  }

  async createExpense(expense: CreateExpense & { createdById: string }): Promise<Expense> {
    // Get trip to determine base currency
    const trip = await prisma.trip.findUnique({
      where: { id: expense.tripId },
      select: { baseCurrency: true },
    })
    
    if (!trip) {
      throw new Error(`Trip not found: ${expense.tripId}`)
    }

    const baseCurrency = trip.baseCurrency
    let convertedAmount: number | null = null
    let fxRate: number | null = null
    let fxDate: Date | null = null
    let manualRateToBase: number | null = null

    // Calculate FX conversion
    if (expense.currency === baseCurrency) {
      // Same currency: no conversion needed
      convertedAmount = expense.amount
      fxRate = 1
      fxDate = new Date(expense.date)
    } else if (expense.manualRateToBase && expense.manualRateToBase > 0) {
      // Manual rate provided (highest priority)
      manualRateToBase = expense.manualRateToBase
      fxRate = expense.manualRateToBase
      convertedAmount = expense.amount * expense.manualRateToBase
      fxDate = new Date(expense.date)
    } else {
      // Different currency: fetch rate and convert
      try {
        const fxResult = await convertCurrency(
          expense.currency,
          baseCurrency,
          expense.amount,
          expense.date
        )
        convertedAmount = fxResult.amountBase
        fxRate = fxResult.rateToBase
        fxDate = new Date(fxResult.asOf)
      } catch (error) {
        // FX conversion failed - throw error to prevent partial save
        throw new Error(
          `Currency conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    const created = await prisma.expense.create({
      data: {
        tripId: expense.tripId,
        createdById: expense.createdById,
        title: expense.merchant || "Expense",
        category: expense.category,
        countryCode: expense.country,
        currency: expense.currency,
        amount: expense.amount,
        convertedAmount,
        fxRate,
        fxDate,
        manualRateToBase,
        expenseDate: new Date(expense.date),
        usageDate: expense.usageDate ? new Date(expense.usageDate) : null,
        nights: expense.numberOfNights ?? null,
        note: expense.note ?? null,
      },
    })
    
    // Fetch the created expense with user relation
    const createdWithUser = await prisma.expense.findUnique({
      where: { id: created.id },
      select: {
        id: true,
        tripId: true,
        createdById: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        title: true,
        category: true,
        countryCode: true,
        currency: true,
        amount: true,
        convertedAmount: true,
        fxRate: true,
        fxDate: true,
        manualRateToBase: true,
        expenseDate: true,
        usageDate: true,
        nights: true,
        note: true,
        createdAt: true,
      },
    })
    
    if (!createdWithUser) {
      throw new Error('Failed to fetch created expense')
    }
    
    return {
      id: createdWithUser.id,
      tripId: createdWithUser.tripId,
      amount: createdWithUser.amount,
      currency: createdWithUser.currency,
      baseCurrency: "",
      fxRateUsed: createdWithUser.fxRate ?? undefined,
      fxRateDate: createdWithUser.fxDate?.toISOString().split('T')[0],
      convertedAmount: createdWithUser.convertedAmount ?? undefined,
      fxRateSource: createdWithUser.manualRateToBase ? "manual" as const : (createdWithUser.fxRate ? "auto" as const : undefined),
      manualRateToBase: createdWithUser.manualRateToBase ?? undefined,
      amountInBase: createdWithUser.convertedAmount ?? undefined,
      category: createdWithUser.category as any,
      country: createdWithUser.countryCode,
      merchant: createdWithUser.title,
      note: createdWithUser.note ?? undefined,
      paidByMemberId: createdWithUser.createdById,
      createdByMemberId: createdWithUser.createdById,
      createdByUser: {
        name: createdWithUser.createdBy.name,
        email: createdWithUser.createdBy.email,
      },
      date: createdWithUser.expenseDate.toISOString().split('T')[0],
      createdAt: createdWithUser.createdAt.getTime(),
      numberOfNights: createdWithUser.nights ?? undefined,
      isFutureExpense: !!createdWithUser.usageDate,
      usageDate: createdWithUser.usageDate?.toISOString().split('T')[0],
      pricePerNight: createdWithUser.nights && createdWithUser.convertedAmount ? createdWithUser.convertedAmount / createdWithUser.nights : undefined,
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
        manualRateToBase: updates.manualRateToBase,
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
      fxRateSource: updated.manualRateToBase ? "manual" as const : (updated.fxRate ? "auto" as const : undefined),
      manualRateToBase: updated.manualRateToBase ?? undefined,
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

