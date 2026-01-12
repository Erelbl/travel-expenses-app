import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaTripsRepository } from '@/lib/data/prisma/trips-prisma.repository'

const tripsRepository = new PrismaTripsRepository()

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trips = await tripsRepository.listTrips(session.user.id)
    return NextResponse.json(trips)
  } catch (error) {
    console.error('[API /trips GET] Error:', error)
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
    return NextResponse.json(trip)
  } catch (error) {
    console.error('[API /trips POST] Error:', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

