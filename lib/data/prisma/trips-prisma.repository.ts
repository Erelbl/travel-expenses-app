import { Trip, CreateTrip } from "@/lib/schemas/trip.schema"
import { TripsRepository } from "@/lib/data/repositories"
import { prisma } from "@/lib/db"

const DEMO_USER_ID = "demo-user"

async function ensureDemoUser() {
  let user = await prisma.user.findUnique({ where: { id: DEMO_USER_ID } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: DEMO_USER_ID,
        name: "Demo User",
        baseCurrency: "USD",
        language: "en",
      },
    })
  }
  return user
}

export class PrismaTripsRepository implements TripsRepository {
  async listTrips(): Promise<Trip[]> {
    const user = await ensureDemoUser()
    const trips = await prisma.trip.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
    })
    
    return trips.map(t => ({
      id: t.id,
      name: t.name,
      startDate: t.startDate?.toISOString().split('T')[0] ?? null,
      endDate: t.endDate?.toISOString().split('T')[0] ?? null,
      baseCurrency: t.baseCurrency,
      countries: t.countries,
      plannedCountries: t.countries,
      itineraryLegs: [],
      members: [{ id: user.id, name: user.name ?? "Me", role: "owner" }],
      createdAt: t.createdAt.getTime(),
    }))
  }

  async getTrip(id: string): Promise<Trip | null> {
    const trip = await prisma.trip.findUnique({ where: { id } })
    if (!trip) return null
    
    const user = await ensureDemoUser()
    return {
      id: trip.id,
      name: trip.name,
      startDate: trip.startDate?.toISOString().split('T')[0] ?? null,
      endDate: trip.endDate?.toISOString().split('T')[0] ?? null,
      baseCurrency: trip.baseCurrency,
      countries: trip.countries,
      plannedCountries: trip.countries,
      itineraryLegs: [],
      members: [{ id: user.id, name: user.name ?? "Me", role: "owner" }],
      createdAt: trip.createdAt.getTime(),
    }
  }

  async createTrip(trip: CreateTrip): Promise<Trip> {
    console.log('[TRIP CREATE] Starting trip creation:', trip.name)
    const user = await ensureDemoUser()
    
    const created = await prisma.trip.create({
      data: {
        ownerId: user.id,
        name: trip.name,
        startDate: trip.startDate ? new Date(trip.startDate) : null,
        endDate: trip.endDate ? new Date(trip.endDate) : null,
        baseCurrency: trip.baseCurrency,
        countries: trip.plannedCountries || trip.countries || [],
      },
    })
    
    console.log('[TRIP CREATE] Trip created successfully:', created.id)
    
    return {
      id: created.id,
      name: created.name,
      startDate: created.startDate?.toISOString().split('T')[0] ?? null,
      endDate: created.endDate?.toISOString().split('T')[0] ?? null,
      baseCurrency: created.baseCurrency,
      countries: created.countries,
      plannedCountries: created.countries,
      itineraryLegs: [],
      members: trip.members || [{ id: user.id, name: user.name ?? "Me", role: "owner" }],
      createdAt: created.createdAt.getTime(),
    }
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
    const updated = await prisma.trip.update({
      where: { id },
      data: {
        name: updates.name,
        startDate: updates.startDate ? new Date(updates.startDate) : undefined,
        endDate: updates.endDate ? new Date(updates.endDate) : undefined,
        baseCurrency: updates.baseCurrency,
        countries: updates.plannedCountries || updates.countries,
      },
    })
    
    const user = await ensureDemoUser()
    return {
      id: updated.id,
      name: updated.name,
      startDate: updated.startDate?.toISOString().split('T')[0] ?? null,
      endDate: updated.endDate?.toISOString().split('T')[0] ?? null,
      baseCurrency: updated.baseCurrency,
      countries: updated.countries,
      plannedCountries: updated.countries,
      itineraryLegs: [],
      members: updates.members || [{ id: user.id, name: user.name ?? "Me", role: "owner" }],
      createdAt: updated.createdAt.getTime(),
    }
  }

  async deleteTrip(id: string): Promise<void> {
    await prisma.trip.delete({ where: { id } })
  }
}

