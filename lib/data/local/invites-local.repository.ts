import { MemberRole } from "@/lib/schemas/trip.schema"

const STORAGE_KEY = "travel-expenses:invites"

export interface TripInvite {
  id: string
  tripId: string
  tripName: string
  role: MemberRole
  createdAt: number
  createdByName: string
  expiresAt: number // 7 days from creation
}

export class LocalInvitesRepository {
  private getInvitesFromStorage(): TripInvite[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  private saveInvitesToStorage(invites: TripInvite[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invites))
  }

  /**
   * Create a new invite link for a trip
   */
  async createInvite(
    tripId: string,
    tripName: string,
    role: MemberRole,
    createdByName: string
  ): Promise<TripInvite> {
    const invite: TripInvite = {
      id: crypto.randomUUID(),
      tripId,
      tripName,
      role,
      createdByName,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    }

    const invites = this.getInvitesFromStorage()
    invites.push(invite)
    this.saveInvitesToStorage(invites)

    return invite
  }

  /**
   * Get an invite by ID
   */
  async getInvite(inviteId: string): Promise<TripInvite | null> {
    const invites = this.getInvitesFromStorage()
    const invite = invites.find((i) => i.id === inviteId)
    
    if (!invite) return null
    
    // Check if expired
    if (invite.expiresAt < Date.now()) {
      // Clean up expired invite
      await this.deleteInvite(inviteId)
      return null
    }
    
    return invite
  }

  /**
   * Get all invites for a trip
   */
  async getInvitesForTrip(tripId: string): Promise<TripInvite[]> {
    const invites = this.getInvitesFromStorage()
    const now = Date.now()
    
    // Filter by trip and not expired
    return invites.filter((i) => i.tripId === tripId && i.expiresAt > now)
  }

  /**
   * Delete an invite
   */
  async deleteInvite(inviteId: string): Promise<void> {
    const invites = this.getInvitesFromStorage()
    const filtered = invites.filter((i) => i.id !== inviteId)
    this.saveInvitesToStorage(filtered)
  }

  /**
   * Generate a shareable URL for an invite
   */
  getInviteUrl(token: string): string {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/invites/${token}`
  }
}

// Export singleton instance
export const invitesRepository = new LocalInvitesRepository()

