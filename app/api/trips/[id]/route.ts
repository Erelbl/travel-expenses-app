import { NextResponse } from 'next/server'
import { PrismaTripsRepository } from '@/lib/data/prisma/trips-prisma.repository'

const tripsRepository = new PrismaTripsRepository()

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
    const trip = await tripsRepository.getTrip(id)
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
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    const body = await request.json()
    const trip = await tripsRepository.updateTrip(id, body)
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
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    await tripsRepository.deleteTrip(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API /trips/[id] DELETE] Error:', error)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

