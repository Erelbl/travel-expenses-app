import { Trip, CreateTrip } from "@/lib/schemas/trip.schema"
import { TripsRepository } from "@/lib/data/repositories"

export class ApiTripsRepository implements TripsRepository {
  async listTrips(userId: string): Promise<Trip[]> {
    const res = await fetch('/api/trips')
    if (!res.ok) {
      const error: any = new Error('Failed to fetch trips')
      error.status = res.status
      throw error
    }
    return res.json()
  }

  async getTrip(tripId: string): Promise<Trip | null> {
    // 🐛 ROOT CAUSE #4: fetch() without cache options uses default caching
    // ISSUE: This fetch call is cached by Next.js Data Cache
    // PROBLEM: After mutations (via server actions or POST/PATCH), this returns stale data
    //          until the cache is explicitly invalidated or a hard refresh occurs
    // FIX: Add { cache: 'no-store' } or { next: { revalidate: 0 } } to fetch options
    const res = await fetch(`/api/trips/${tripId}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to fetch trip')
    return res.json()
  }

  async getTripForUser(tripId: string, userId: string): Promise<Trip | null> {
    return this.getTrip(tripId)
  }

  async createTrip(input: CreateTrip & { ownerId: string }): Promise<Trip> {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error('Failed to create trip')
    return res.json()
  }

  async updateTrip(tripId: string, data: Partial<Trip>): Promise<Trip> {
    const res = await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update trip')
    return res.json()
  }

  async deleteTrip(id: string, userId: string): Promise<void> {
    const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete trip')
  }
}

