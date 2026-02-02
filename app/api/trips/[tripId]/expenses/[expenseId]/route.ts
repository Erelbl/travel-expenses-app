import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaExpensesRepository } from '@/lib/data/prisma/expenses-prisma.repository'
import { PrismaTripsRepository } from '@/lib/data/prisma/trips-prisma.repository'
import { logError } from '@/lib/utils/logger'

const expensesRepository = new PrismaExpensesRepository()
const tripsRepository = new PrismaTripsRepository()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string; expenseId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId, expenseId } = await params
    
    // Verify user has access to this trip
    const trip = await tripsRepository.getTripForUser(tripId, session.user.id)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 })
    }

    const expense = await expensesRepository.getExpense(expenseId)
    if (!expense || expense.tripId !== tripId) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }
    
    return NextResponse.json(expense)
  } catch (error) {
    logError('API /trips/[tripId]/expenses/[expenseId] GET', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tripId: string; expenseId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId, expenseId } = await params
    
    // Verify user has access to this trip
    const trip = await tripsRepository.getTripForUser(tripId, session.user.id)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 })
    }

    // Verify expense belongs to this trip
    const existingExpense = await expensesRepository.getExpense(expenseId)
    if (!existingExpense || existingExpense.tripId !== tripId) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const body = await request.json()
    const expense = await expensesRepository.updateExpense(expenseId, body)
    
    return NextResponse.json(expense)
  } catch (error) {
    logError('API /trips/[tripId]/expenses/[expenseId] PATCH', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tripId: string; expenseId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId, expenseId } = await params
    
    // Verify user has access to this trip
    const trip = await tripsRepository.getTripForUser(tripId, session.user.id)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 })
    }

    // Verify expense belongs to this trip
    const existingExpense = await expensesRepository.getExpense(expenseId)
    if (!existingExpense || existingExpense.tripId !== tripId) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await expensesRepository.deleteExpense(expenseId)
    return NextResponse.json({ success: true })
  } catch (error) {
    logError('API /trips/[tripId]/expenses/[expenseId] DELETE', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
