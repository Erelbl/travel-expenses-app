import { checkTripAccess } from "@/lib/server/tripAccess"
import { redirect } from "next/navigation"

export async function requireTripAccess(tripId: string) {
  const access = await checkTripAccess(tripId)
  
  if (!access) {
    redirect("/auth/login")
  }
  
  if (!access.hasAccess) {
    redirect(`/app/trips/${tripId}/access-denied`)
  }
  
  return access
}

