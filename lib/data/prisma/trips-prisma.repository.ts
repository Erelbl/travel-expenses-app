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

  async getTrip(id: string, userId: string): Promise<Trip | null> {
    const trip = await prisma.trip.findFirst({
      where: {
        id,
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

  async createTrip(data: CreateTrip & { ownerId: string }): Promise<Trip> {
    console.log('[TRIP CREATE] Starting trip creation:', data.name)
    
    const created = await prisma.trip.create({
      data: {
        ownerId: data.ownerId,
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
      members: [{ id: created.owner.id, name: created.owner.name ?? "Me", role: "owner" }],
      createdAt: created.createdAt.getTime(),
    }
  }

  async updateTrip(id: string, updates: Partial<Trip>, userId: string): Promise<Trip> {
    // Verify user has access
    const existing = await this.getTrip(id, userId)
    if (!existing) {
      throw new Error("Trip not found or unauthorized")
    }

    const updated = await prisma.trip.update({
      where: { id },
      data: {
        name: updates.name,
        startDate: updates.startDate ? new Date(updates.startDate) : undefined,
        endDate: updates.endDate ? new Date(updates.endDate) : undefined,
        baseCurrency: updates.baseCurrency,
        countries: updates.plannedCountries || updates.countries,
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
