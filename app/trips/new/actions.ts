"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { PrismaTripsRepository } from "@/lib/data/prisma/trips-prisma.repository"
import { CreateTrip } from "@/lib/schemas/trip.schema"

const tripsRepository = new PrismaTripsRepository()

export async function createTripAction(tripData: CreateTrip) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const trip = await tripsRepository.createTrip({
    ...tripData,
    ownerId: session.user.id,
  })

  revalidatePath("/trips")
  return trip
}

