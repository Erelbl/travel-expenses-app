import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaTripsRepository } from '@/lib/data/prisma/trips-prisma.repository'
import { logError } from '@/lib/utils/logger'

const tripsRepository = new PrismaTripsRepository()

// 🐛 ROOT CAUSE #1: Missing cache configuration
// ISSUE: GET route handlers are cached by default in Next.js 15
// PROBLEM: When client components fetch this endpoint, responses are cached
//          and don't update after mutations until manual refresh
// FIX: Add one of the following:
//      - export const dynamic = 'force-dynamic'  (disable caching)
//      - export const revalidate = 0  (disable caching)
//      - Add cache: 'no-store' to fetch() calls in ApiTripsRepository
//      - Use cache tags and revalidate by tag instead of path

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
    const trip = await tripsRepository.getTripForUser(id, session.user.id)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }
    return NextResponse.json(trip)
  } catch (error) {
    logError('API /trips/[id] GET', error)
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
    
    // Verify user has access to this trip
    const existing = await tripsRepository.getTripForUser(id, session.user.id)
    if (!existing) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }
    
    const body = await request.json()
    const trip = await tripsRepository.updateTrip(id, body)
    return NextResponse.json(trip)
  } catch (error) {
    logError('API /trips/[id] PATCH', error)
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
    await tripsRepository.deleteTrip(id, session.user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    logError('API /trips/[id] DELETE', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

