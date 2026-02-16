import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaTripsRepository } from '@/lib/data/prisma/trips-prisma.repository'
import { logError } from '@/lib/utils/logger'
import { evaluateAchievements } from '@/lib/achievements/evaluate'

const tripsRepository = new PrismaTripsRepository()

// PERFORMANCE: Enable short-term caching (60s) for trip GET requests
// This reduces DB load and improves perceived performance
// Cache is invalidated automatically on mutations (POST/PATCH/DELETE via revalidatePath)
export const revalidate = 60

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
    const trip = await tripsRepository.getTripForUser(tripId, session.user.id)
    if (!trip) {
      console.log(`[API_TRIP] GET tripId=${tripId} userId=${session.user.id} allow=false reason=deny`)
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }
    
    // Determine access reason
    const isOwner = trip.members.some(m => m.id === session.user.id && m.role === 'owner')
    const reason = isOwner ? 'owner' : 'member'
    console.log(`[API_TRIP] GET tripId=${tripId} userId=${session.user.id} allow=true reason=${reason}`)
    
    return NextResponse.json(trip)
  } catch (error) {
    logError('API /trips/[tripId] GET', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function PATCH(
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
    const existing = await tripsRepository.getTripForUser(tripId, session.user.id)
    if (!existing) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }
    
    const body = await request.json()
    const trip = await tripsRepository.updateTrip(tripId, body)
    
    // Check for newly unlocked achievements (e.g., if trip was closed)
    const { newlyUnlocked } = await evaluateAchievements(session.user.id)
    
    return NextResponse.json({ ...trip, newlyUnlocked })
  } catch (error) {
    logError('API /trips/[tripId] PATCH', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function DELETE(
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
    await tripsRepository.deleteTrip(tripId, session.user.id)
    
    // Re-evaluate achievements (will reduce trip-based levels)
    const { newlyUnlocked } = await evaluateAchievements(session.user.id)
    
    return NextResponse.json({ success: true, newlyUnlocked })
  } catch (error) {
    logError('API /trips/[tripId] DELETE', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

