import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaTripsRepository } from '@/lib/data/prisma/trips-prisma.repository'

const tripsRepository = new PrismaTripsRepository()

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
    const trip = await tripsRepository.getTrip(id, session.user.id)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }
    return NextResponse.json(trip)
  } catch (error) {
    console.error('[API /trips/[id] GET] Error:', error)
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
    const trip = await tripsRepository.updateTrip(id, body, session.user.id)
    return NextResponse.json(trip)
  } catch (error) {
    console.error('[API /trips/[id] PATCH] Error:', error)
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
    console.error('[API /trips/[id] DELETE] Error:', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

