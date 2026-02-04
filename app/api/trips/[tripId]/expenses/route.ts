import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { PrismaExpensesRepository } from '@/lib/data/prisma/expenses-prisma.repository'
import { PrismaTripsRepository } from '@/lib/data/prisma/trips-prisma.repository'
import { logError } from '@/lib/utils/logger'
import { evaluateAchievements } from '@/lib/achievements/evaluate'

const expensesRepository = new PrismaExpensesRepository()
const tripsRepository = new PrismaTripsRepository()

// CRITICAL: No route-level caching - we rely on unstable_cache + revalidateTag for granular control
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId } = await params
    if (!tripId) {
      return NextResponse.json({ error: 'Missing tripId' }, { status: 400 })
    }
    
    // Verify user has access to this trip
    const trip = await tripsRepository.getTripForUser(tripId, session.user.id)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 })
    }
    
    const expenses = await expensesRepository.listExpenses(tripId)
    
    // CRITICAL: No HTTP cache - rely on unstable_cache inside repository for caching
    return NextResponse.json(expenses, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    })
  } catch (error) {
    logError('API /trips/[tripId]/expenses GET', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId } = await params
    if (!tripId) {
      return NextResponse.json({ error: 'Missing tripId' }, { status: 400 })
    }
    
    // Verify user has access to this trip
    const trip = await tripsRepository.getTripForUser(tripId, session.user.id)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 })
    }
    
    const body = await request.json()
    const expense = await expensesRepository.createExpense({ ...body, createdById: session.user.id })
    
    // Check for newly unlocked achievements
    const { newlyUnlocked } = await evaluateAchievements(session.user.id)
    
    // Revalidate all affected pages (no data cache since we removed unstable_cache)
    revalidatePath(`/trips/${tripId}`, 'page')
    revalidatePath(`/trips/${tripId}/reports`, 'page')
    
    return NextResponse.json({ ...expense, newlyUnlocked })
  } catch (error) {
    logError('API /trips/[tripId]/expenses POST', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

