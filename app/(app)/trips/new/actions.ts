"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { PrismaTripsRepository } from "@/lib/data/prisma/trips-prisma.repository"
import { CreateTrip } from "@/lib/schemas/trip.schema"
import { evaluateAchievements } from "@/lib/achievements/evaluate"
import { getEffectivePlanForUser } from "@/lib/billing/plan"

const tripsRepository = new PrismaTripsRepository()

export async function createTripAction(tripData: CreateTrip) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const effectivePlan = await getEffectivePlanForUser(session.user.id)
  if (effectivePlan === "free") {
    const activeCount = await prisma.trip.count({
      where: { ownerId: session.user.id, isClosed: false },
    })
    if (activeCount >= 1) {
      throw new Error("PLAN_LIMIT_ACTIVE_TRIPS")
    }
  }

  const trip = await tripsRepository.createTrip({
    ...tripData,
    ownerId: session.user.id,
  })

  // Check for newly unlocked achievements
  const { newlyUnlocked } = await evaluateAchievements(session.user.id)

  revalidatePath("/trips")
  return { ...trip, newlyUnlocked }
}

