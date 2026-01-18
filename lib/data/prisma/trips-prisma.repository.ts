import { Trip, CreateTrip } from "@/lib/schemas/trip.schema"
import { TripsRepository } from "@/lib/data/repositories"
import { prisma } from "@/lib/db"
import { unstable_cache } from "next/cache"

export class PrismaTripsRepository implements TripsRepository {
  async listTrips(userId: string): Promise<Trip[]> {
    return unstable_cache(
      async () => {
        const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        baseCurrency: true,
        countries: true,
        tripType: true,
        adults: true,
        children: true,
        travelStyle: true,
        isClosed: true,
        closedAt: true,
        createdAt: true,
        owner: { select: { id: true, name: true } },
        members: {
          select: {
            role: true,
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
      tripType: t.tripType?.toLowerCase() as any ?? undefined,
      adults: t.adults,
      children: t.children,
      travelStyle: t.travelStyle?.toLowerCase() as any ?? undefined,
      isClosed: t.isClosed,
      closedAt: t.closedAt?.getTime() ?? null,
      itineraryLegs: [],
      members: [
        { id: t.owner.id, name: t.owner.name ?? "Owner", role: "owner" as const },
        ...t.members.map(m => ({
          id: m.user.id,
          name: m.user.name ?? "Member",
          role: m.role.toLowerCase() as "editor" | "viewer"
        }))
      ],
      createdAt: t.createdAt.getTime(),
        }))
      },
      [`trips-list-${userId}`],
      { revalidate: 15, tags: [`trips-${userId}`] }
    )()
  }

  async getTrip(tripId: string): Promise<Trip | null> {
    return unstable_cache(
      async () => {
        const trip = await prisma.trip.findUnique({
          where: { id: tripId },
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            baseCurrency: true,
            countries: true,
            currentCountry: true,
            currentCurrency: true,
            tripType: true,
            adults: true,
            children: true,
            travelStyle: true,
            isClosed: true,
            closedAt: true,
            createdAt: true,
            owner: { select: { id: true, name: true } },
            members: {
              select: {
                role: true,
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
          tripType: trip.tripType?.toLowerCase() as any ?? undefined,
          adults: trip.adults,
          children: trip.children,
          travelStyle: trip.travelStyle?.toLowerCase() as any ?? undefined,
          itineraryLegs: [],
          members: [
            { id: trip.owner.id, name: trip.owner.name ?? "Owner", role: "owner" as const },
            ...trip.members.map(m => ({
              id: m.user.id,
              name: m.user.name ?? "Member",
              role: m.role.toLowerCase() as "editor" | "viewer"
            }))
          ],
          createdAt: trip.createdAt.getTime(),
        }
      },
      [`trip-${tripId}`],
      { revalidate: 15, tags: [`trip-${tripId}`] }
    )()
  }

  async getTripForUser(tripId: string, userId: string): Promise<Trip | null> {
    return unstable_cache(
      async () => {
        const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        baseCurrency: true,
        countries: true,
        currentCountry: true,
        currentCurrency: true,
        tripType: true,
        adults: true,
        children: true,
        travelStyle: true,
        isClosed: true,
        closedAt: true,
        createdAt: true,
        owner: { select: { id: true, name: true } },
        members: {
          select: {
            role: true,
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
          tripType: trip.tripType?.toLowerCase() as any ?? undefined,
          adults: trip.adults,
          children: trip.children,
          travelStyle: trip.travelStyle?.toLowerCase() as any ?? undefined,
          isClosed: trip.isClosed,
          closedAt: trip.closedAt?.getTime() ?? null,
          itineraryLegs: [],
          members: [
            { id: trip.owner.id, name: trip.owner.name ?? "Owner", role: "owner" as const },
            ...trip.members.map(m => ({
              id: m.user.id,
              name: m.user.name ?? "Member",
              role: m.role.toLowerCase() as "editor" | "viewer"
            }))
          ],
          createdAt: trip.createdAt.getTime(),
        }
      },
      [`trip-user-${tripId}-${userId}`],
      { revalidate: 15, tags: [`trip-${tripId}`, `trips-${userId}`] }
    )()
  }

  async createTrip(input: CreateTrip & { ownerId: string }): Promise<Trip> {
    const created = await prisma.trip.create({
      data: {
        ownerId: input.ownerId,
        name: input.name,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        baseCurrency: input.baseCurrency,
        countries: input.plannedCountries || input.countries || [],
        tripType: input.tripType ? input.tripType.toUpperCase() as any : null,
        adults: input.adults ?? 1,
        children: input.children ?? 0,
        travelStyle: input.travelStyle ? input.travelStyle.toUpperCase() as any : null,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        baseCurrency: true,
        countries: true,
        tripType: true,
        adults: true,
        children: true,
        travelStyle: true,
        isClosed: true,
        closedAt: true,
        createdAt: true,
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
      tripType: created.tripType?.toLowerCase() as any ?? undefined,
      adults: created.adults,
      children: created.children,
      travelStyle: created.travelStyle?.toLowerCase() as any ?? undefined,
      isClosed: created.isClosed,
      closedAt: created.closedAt?.getTime() ?? null,
      itineraryLegs: [],
      members: [{ id: created.owner.id, name: created.owner.name ?? "Me", role: "owner" as const }],
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
        tripType: data.tripType ? data.tripType.toUpperCase() as any : undefined,
        adults: data.adults,
        children: data.children,
        travelStyle: data.travelStyle ? data.travelStyle.toUpperCase() as any : undefined,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        baseCurrency: true,
        countries: true,
        currentCountry: true,
        currentCurrency: true,
        tripType: true,
        adults: true,
        children: true,
        travelStyle: true,
        isClosed: true,
        closedAt: true,
        createdAt: true,
        owner: { select: { id: true, name: true } },
        members: {
          select: {
            role: true,
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
      tripType: updated.tripType?.toLowerCase() as any ?? undefined,
      adults: updated.adults,
      children: updated.children,
      travelStyle: updated.travelStyle?.toLowerCase() as any ?? undefined,
      isClosed: updated.isClosed,
      closedAt: updated.closedAt?.getTime() ?? null,
      itineraryLegs: [],
      members: [
        { id: updated.owner.id, name: updated.owner.name ?? "Owner", role: "owner" as const },
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
