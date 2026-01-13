import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaExpensesRepository } from '@/lib/data/prisma/expenses-prisma.repository'
import { logError } from '@/lib/utils/logger'

const expensesRepository = new PrismaExpensesRepository()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    const expenses = await expensesRepository.listExpenses(id)
    return NextResponse.json(expenses)
  } catch (error) {
    logError('API /trips/[id]/expenses GET', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    const body = await request.json()
    const expense = await expensesRepository.createExpense({ ...body, createdById: session.user.id })
    return NextResponse.json(expense)
  } catch (error) {
    logError('API /trips/[id]/expenses POST', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

