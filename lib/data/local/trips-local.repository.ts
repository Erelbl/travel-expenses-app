import { Trip, CreateTrip, TripSchema } from "@/lib/schemas/trip.schema"
import { TripsRepository } from "@/lib/data/repositories"

const STORAGE_KEY = "travel-expenses:trips"

export class LocalTripsRepository implements TripsRepository {
  private getTripsFromStorage(): Trip[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  private saveTripsToStorage(trips: Trip[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
  }

  async listTrips(userId: string): Promise<Trip[]> {
    return this.getTripsFromStorage().sort((a, b) => b.createdAt - a.createdAt)
  }

  async getTrip(id: string, userId: string): Promise<Trip | null> {
    const trips = this.getTripsFromStorage()
    return trips.find((t) => t.id === id) ?? null
  }

  async createTrip(trip: CreateTrip & { ownerId: string }): Promise<Trip> {
    const newTrip: Trip = {
      ...trip,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    
    TripSchema.parse(newTrip)
    
    const trips = this.getTripsFromStorage()
    trips.push(newTrip)
    this.saveTripsToStorage(trips)
    
    return newTrip
  }

  async updateTrip(id: string, updates: Partial<Trip>, userId: string): Promise<Trip> {
    const trips = this.getTripsFromStorage()
    const index = trips.findIndex((t) => t.id === id)
    
    if (index === -1) {
      throw new Error(`Trip not found: ${id}`)
    }
    
    const updatedTrip = { ...trips[index], ...updates }
    TripSchema.parse(updatedTrip)
    
    trips[index] = updatedTrip
    this.saveTripsToStorage(trips)
    
    return updatedTrip
  }

  async deleteTrip(id: string, userId: string): Promise<void> {
    const trips = this.getTripsFromStorage()
    const filtered = trips.filter((t) => t.id !== id)
    this.saveTripsToStorage(filtered)
  }
}

