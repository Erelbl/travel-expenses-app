import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaTripsRepository } from '@/lib/data/prisma/trips-prisma.repository'
import { logError } from '@/lib/utils/logger'
import { evaluateAchievements } from '@/lib/achievements/evaluate'

const tripsRepository = new PrismaTripsRepository()

export const revalidate = 30

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trips = await tripsRepository.listTrips(session.user.id)
    
    return NextResponse.json(trips, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    logError('API /trips GET', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const trip = await tripsRepository.createTrip({ ...body, ownerId: session.user.id })
    
    // Check for newly unlocked achievements
    const { newlyUnlocked } = await evaluateAchievements(session.user.id)
    
    return NextResponse.json({ ...trip, newlyUnlocked })
  } catch (error) {
    logError('API /trips POST', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

