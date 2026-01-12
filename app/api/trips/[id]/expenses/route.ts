import { NextResponse } from 'next/server'
import { PrismaExpensesRepository } from '@/lib/data/prisma/expenses-prisma.repository'

const expensesRepository = new PrismaExpensesRepository()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    const expenses = await expensesRepository.listExpenses(id)
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('[API /trips/[id]/expenses GET] Error:', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    const body = await request.json()
    const expense = await expensesRepository.createExpense(body)
    return NextResponse.json(expense)
  } catch (error) {
    console.error('[API /trips/[id]/expenses POST] Error:', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

