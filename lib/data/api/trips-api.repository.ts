import { Trip, CreateTrip } from "@/lib/schemas/trip.schema"
import { TripsRepository } from "@/lib/data/repositories"

export class ApiTripsRepository implements TripsRepository {
  async listTrips(userId: string): Promise<Trip[]> {
    const res = await fetch('/api/trips')
    if (!res.ok) throw new Error('Failed to fetch trips')
    return res.json()
  }

  async getTrip(id: string, userId: string): Promise<Trip | null> {
    const res = await fetch(`/api/trips/${id}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to fetch trip')
    return res.json()
  }

  async createTrip(trip: CreateTrip & { ownerId: string }): Promise<Trip> {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trip),
    })
    if (!res.ok) throw new Error('Failed to create trip')
    return res.json()
  }

  async updateTrip(id: string, trip: Partial<Trip>, userId: string): Promise<Trip> {
    const res = await fetch(`/api/trips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trip),
    })
    if (!res.ok) throw new Error('Failed to update trip')
    return res.json()
  }

  async deleteTrip(id: string, userId: string): Promise<void> {
    const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete trip')
  }
}

