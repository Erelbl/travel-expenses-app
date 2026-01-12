import { NextResponse } from 'next/server'
import { PrismaTripsRepository } from '@/lib/data/prisma/trips-prisma.repository'

const tripsRepository = new PrismaTripsRepository()

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const trips = await tripsRepository.listTrips()
    return NextResponse.json(trips)
  } catch (error) {
    console.error('[API /trips GET] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const body = await request.json()
    const trip = await tripsRepository.createTrip(body)
    return NextResponse.json(trip)
  } catch (error) {
    console.error('[API /trips POST] Error:', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

