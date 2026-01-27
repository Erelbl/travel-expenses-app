import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaExpensesRepository } from '@/lib/data/prisma/expenses-prisma.repository'
import { logError } from '@/lib/utils/logger'
import { unlockNewAchievements } from '@/lib/achievements/achievements'

const expensesRepository = new PrismaExpensesRepository()

// Disable caching for this route - expense list changes frequently via mutations
export const dynamic = 'force-dynamic'

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
    
    // Check for newly unlocked achievements
    const { newlyUnlocked } = await unlockNewAchievements(session.user.id)
    
    return NextResponse.json({ ...expense, newlyUnlocked })
  } catch (error) {
    logError('API /trips/[id]/expenses POST', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

