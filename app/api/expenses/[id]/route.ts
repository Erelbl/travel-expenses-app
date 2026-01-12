import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaExpensesRepository } from '@/lib/data/prisma/expenses-prisma.repository'

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
    const expense = await expensesRepository.getExpense(id)
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }
    return NextResponse.json(expense)
  } catch (error) {
    console.error('[API /expenses/[id] GET] Error:', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function PATCH(
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
    const expense = await expensesRepository.updateExpense(id, body)
    return NextResponse.json(expense)
  } catch (error) {
    console.error('[API /expenses/[id] PATCH] Error:', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function DELETE(
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
    await expensesRepository.deleteExpense(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API /expenses/[id] DELETE] Error:', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

