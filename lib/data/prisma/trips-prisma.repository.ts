import { Trip, CreateTrip } from "@/lib/schemas/trip.schema"
import { TripsRepository } from "@/lib/data/repositories"
import { prisma } from "@/lib/db"

export class PrismaTripsRepository implements TripsRepository {
  async listTrips(userId: string): Promise<Trip[]> {
    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      },
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
      members: [
        { id: t.owner.id, name: t.owner.name ?? "Owner", role: "owner" },
        ...t.members.map(m => ({
          id: m.user.id,
          name: m.user.name ?? "Member",
          role: m.role.toLowerCase() as "editor" | "viewer"
        }))
      ],
      createdAt: t.createdAt.getTime(),
    }))
  }

  async getTrip(tripId: string): Promise<Trip | null> {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        owner: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    })
    
    if (!trip) return null
    
    return {
      id: trip.id,
      name: trip.name,
      startDate: trip.startDate?.toISOString().split('T')[0] ?? null,
      endDate: trip.endDate?.toISOString().split('T')[0] ?? null,
      baseCurrency: trip.baseCurrency,
      countries: trip.countries,
      plannedCountries: trip.countries,
      currentCountry: trip.currentCountry ?? undefined,
      currentCurrency: trip.currentCurrency ?? undefined,
      itineraryLegs: [],
      members: [
        { id: trip.owner.id, name: trip.owner.name ?? "Owner", role: "owner" },
        ...trip.members.map(m => ({
          id: m.user.id,
          name: m.user.name ?? "Member",
          role: m.role.toLowerCase() as "editor" | "viewer"
        }))
      ],
      createdAt: trip.createdAt.getTime(),
    }
  }

  async getTripForUser(tripId: string, userId: string): Promise<Trip | null> {
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    })
    
    if (!trip) return null
    
    return {
      id: trip.id,
      name: trip.name,
      startDate: trip.startDate?.toISOString().split('T')[0] ?? null,
      endDate: trip.endDate?.toISOString().split('T')[0] ?? null,
      baseCurrency: trip.baseCurrency,
      countries: trip.countries,
      plannedCountries: trip.countries,
      currentCountry: trip.currentCountry ?? undefined,
      currentCurrency: trip.currentCurrency ?? undefined,
      itineraryLegs: [],
      members: [
        { id: trip.owner.id, name: trip.owner.name ?? "Owner", role: "owner" },
        ...trip.members.map(m => ({
          id: m.user.id,
          name: m.user.name ?? "Member",
          role: m.role.toLowerCase() as "editor" | "viewer"
        }))
      ],
      createdAt: trip.createdAt.getTime(),
    }
  }

  async createTrip(data: CreateTrip, ownerId: string): Promise<Trip> {
    const created = await prisma.trip.create({
      data: {
        ownerId,
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        baseCurrency: data.baseCurrency,
        countries: data.plannedCountries || data.countries || [],
      },
      include: {
        owner: { select: { id: true, name: true } }
      }
    })
    
    return {
      id: created.id,
      name: created.name,
      startDate: created.startDate?.toISOString().split('T')[0] ?? null,
      endDate: created.endDate?.toISOString().split('T')[0] ?? null,
      baseCurrency: created.baseCurrency,
      countries: created.countries,
      plannedCountries: created.countries,
      itineraryLegs: [],
      members: [{ id: created.owner.id, name: created.owner.name ?? "Me", role: "owner" }],
      createdAt: created.createdAt.getTime(),
    }
  }

  async updateTrip(tripId: string, data: Partial<Trip>): Promise<Trip> {
    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: {
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        baseCurrency: data.baseCurrency,
        countries: data.plannedCountries || data.countries,
        currentCountry: data.currentCountry,
        currentCurrency: data.currentCurrency,
      },
      include: {
        owner: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    })
    
    return {
      id: updated.id,
      name: updated.name,
      startDate: updated.startDate?.toISOString().split('T')[0] ?? null,
      endDate: updated.endDate?.toISOString().split('T')[0] ?? null,
      baseCurrency: updated.baseCurrency,
      countries: updated.countries,
      plannedCountries: updated.countries,
      currentCountry: updated.currentCountry ?? undefined,
      currentCurrency: updated.currentCurrency ?? undefined,
      itineraryLegs: [],
      members: [
        { id: updated.owner.id, name: updated.owner.name ?? "Owner", role: "owner" },
        ...updated.members.map(m => ({
          id: m.user.id,
          name: m.user.name ?? "Member",
          role: m.role.toLowerCase() as "editor" | "viewer"
        }))
      ],
      createdAt: updated.createdAt.getTime(),
    }
  }

  async deleteTrip(id: string, userId: string): Promise<void> {
    // Verify user is owner
    const trip = await prisma.trip.findFirst({
      where: { id, ownerId: userId }
    })
    
    if (!trip) {
      throw new Error("Trip not found or unauthorized")
    }

    await prisma.trip.delete({ where: { id } })
  }
}
