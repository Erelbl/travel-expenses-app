"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function updateCurrentLocation(
  tripId: string,
  currentCountry: string | null,
  currentCurrency: string | null
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify user is a member of the trip
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      ownerId: true,
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
  })

  if (!trip) {
    throw new Error("Trip not found")
  }

  const isOwner = trip.ownerId === session.user.id
  const member = trip.members[0]

  if (!isOwner && !member) {
    throw new Error("Not a member of this trip")
  }

  await prisma.trip.update({
    where: { id: tripId },
    data: {
      currentCountry,
      currentCurrency,
    },
  })

  revalidatePath(`/trips/${tripId}`)
}

export async function closeTrip(tripId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify user is owner or admin
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      ownerId: true,
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
  })

  if (!trip) {
    throw new Error("Trip not found")
  }

  const isOwner = trip.ownerId === session.user.id
  const member = trip.members[0]
  const isAdmin = member?.role === "OWNER"

  if (!isOwner && !isAdmin) {
    throw new Error("Only owner/admin can close trips")
  }

  await prisma.trip.update({
    where: { id: tripId },
    data: {
      isClosed: true,
      closedAt: new Date(),
    },
  })

  revalidatePath(`/trips/${tripId}`)
  revalidatePath(`/trips`)
}

