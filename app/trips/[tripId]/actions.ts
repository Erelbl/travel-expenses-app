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

export async function updateTripBasics(
  tripId: string,
  data: {
    name?: string
    startDate?: string | null
    endDate?: string | null
    countries?: string[]
    currentCountry?: string | null
    currentCurrency?: string | null
  }
) {
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
    throw new Error("Only owner/admin can update trip settings")
  }

  await prisma.trip.update({
    where: { id: tripId },
    data: {
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      countries: data.countries,
      currentCountry: data.currentCountry,
      currentCurrency: data.currentCurrency,
    },
  })

  revalidatePath(`/trips/${tripId}`)
  revalidatePath(`/trips`)
}

export async function updateBudget(
  tripId: string,
  data: {
    targetBudget?: number | null
  }
) {
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
    throw new Error("Only owner/admin can update trip settings")
  }

  await prisma.trip.update({
    where: { id: tripId },
    data: {
      targetBudget: data.targetBudget,
    },
  })

  revalidatePath(`/trips/${tripId}`)
  revalidatePath(`/trips`)
}

export async function updateInsightsProfile(
  tripId: string,
  data: {
    tripType?: string | null
    adults?: number
    children?: number
  }
) {
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
    throw new Error("Only owner/admin can update trip settings")
  }

  await prisma.trip.update({
    where: { id: tripId },
    data: {
      tripType: data.tripType ? (data.tripType.toUpperCase() as any) : null,
      adults: data.adults,
      children: data.children,
    },
  })

  revalidatePath(`/trips/${tripId}`)
  revalidatePath(`/trips`)
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

export async function reopenTrip(tripId: string) {
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
    throw new Error("Only owner/admin can reopen trips")
  }

  await prisma.trip.update({
    where: { id: tripId },
    data: {
      isClosed: false,
      closedAt: null,
    },
  })

  revalidatePath(`/trips/${tripId}`)
  revalidatePath(`/trips`)
}

