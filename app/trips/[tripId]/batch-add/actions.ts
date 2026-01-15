"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { convertCurrency } from "@/lib/server/fx"
import { ExpenseCategory } from "@/lib/schemas/expense.schema"
import { auth } from "@/lib/auth"

export interface BatchExpenseInput {
  amount: number
  currency: string
  category: ExpenseCategory
  merchant: string
  note?: string
  date: string
}

export interface BatchAddResult {
  success: boolean
  created: number
  errors?: Array<{ index: number; message: string }>
}

export async function batchAddExpenses(
  tripId: string,
  country: string,
  expenses: BatchExpenseInput[]
): Promise<BatchAddResult> {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Get trip to determine base currency and verify access
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { 
        baseCurrency: true,
        ownerId: true,
        members: {
          where: { userId: session.user.id },
          select: { id: true, role: true }
        }
      },
    })

    if (!trip) {
      throw new Error("Trip not found")
    }

    // Check user is owner or has appropriate member role
    const isOwner = trip.ownerId === session.user.id
    const member = trip.members[0]
    
    if (!isOwner && (!member || member.role === "VIEWER")) {
      throw new Error("Insufficient permissions")
    }

    const createdById = session.user.id

    const baseCurrency = trip.baseCurrency
    const errors: Array<{ index: number; message: string }> = []

    // Build FX cache for this batch to avoid duplicate lookups
    const fxCache = new Map<string, { rate: number; date: string }>()

    // Prepare all expense data with conversion
    const expenseDataArray = []

    for (let i = 0; i < expenses.length; i++) {
      const expense = expenses[i]

      try {
        let convertedAmount: number
        let fxRate: number
        let fxDate: Date

        if (expense.currency === baseCurrency) {
          // Same currency: no conversion
          convertedAmount = expense.amount
          fxRate = 1
          fxDate = new Date(expense.date)
        } else {
          // Different currency: check cache first
          const cacheKey = `${expense.currency}-${baseCurrency}-${expense.date}`
          let fxData = fxCache.get(cacheKey)

          if (!fxData) {
            // Not in cache: fetch rate
            const fxResult = await convertCurrency(
              expense.currency,
              baseCurrency,
              expense.amount,
              expense.date
            )
            fxData = { rate: fxResult.rateToBase, date: fxResult.asOf }
            fxCache.set(cacheKey, fxData)
          }

          convertedAmount = expense.amount * fxData.rate
          fxRate = fxData.rate
          fxDate = new Date(fxData.date)
        }

        expenseDataArray.push({
          tripId,
          createdById,
          title: expense.merchant,
          category: expense.category,
          countryCode: country,
          currency: expense.currency,
          amount: expense.amount,
          convertedAmount,
          fxRate,
          fxDate,
          expenseDate: new Date(expense.date),
          usageDate: null,
          nights: null,
          note: expense.note || null,
        })
      } catch (error) {
        errors.push({
          index: i,
          message: error instanceof Error ? error.message : "Conversion failed",
        })
      }
    }

    // If any errors, fail the whole batch
    if (errors.length > 0) {
      return { success: false, created: 0, errors }
    }

    // Create all expenses in a transaction
    await prisma.$transaction(
      expenseDataArray.map((data) => prisma.expense.create({ data }))
    )

    revalidatePath(`/trips/${tripId}`)

    return { success: true, created: expenseDataArray.length }
  } catch (error) {
    console.error("Batch add failed:", error)
    return {
      success: false,
      created: 0,
      errors: [
        { index: -1, message: error instanceof Error ? error.message : "Unknown error" },
      ],
    }
  }
}

