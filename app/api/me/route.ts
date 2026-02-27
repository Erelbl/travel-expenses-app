import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logError } from "@/lib/utils/logger"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        image: true,
        baseCurrency: true,
        language: true,
        gender: true,
        plan: true,
        isAdmin: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Count active (non-closed) trips owned by user
    const activeTripsCount = await prisma.trip.count({
      where: { ownerId: userId, isClosed: false },
    })

    // Get trips where user is owner or member
    const myTrips = await prisma.trip.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      select: { id: true },
    })

    const tripIds = myTrips.map((t) => t.id)

    // Get expenses created by me
    const myExpenses = await prisma.expense.findMany({
      where: { createdById: userId },
      select: {
        tripId: true,
        countryCode: true,
        amount: true,
        convertedAmount: true,
        currency: true,
      },
    })

    // Get all expenses in my trips
    const tripsExpenses = await prisma.expense.findMany({
      where: { tripId: { in: tripIds } },
      select: {
        tripId: true,
        countryCode: true,
        amount: true,
        convertedAmount: true,
        currency: true,
      },
    })

    // Calculate stats for "my expenses"
    const myStats = calculateStats(myExpenses, user.baseCurrency)

    // Calculate stats for "all trip expenses"
    const tripsStats = calculateStats(tripsExpenses, user.baseCurrency)

    // Derive effective plan (admins get pro)
    const effectivePlan = user.isAdmin ? "pro" : (user.plan || "free")

    return NextResponse.json({
      user,
      plan: effectivePlan,
      isAdmin: user.isAdmin,
      activeTripsCount,
      stats: {
        my: { ...myStats, totalTrips: tripIds.length },
        trips: { ...tripsStats, totalTrips: tripIds.length },
      },
    })
  } catch (error) {
    logError("API /me GET", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, nickname, image, baseCurrency, language, gender } = body

    // Validate
    const updates: any = {}

    if (name !== undefined) {
      updates.name = typeof name === "string" ? name.trim().slice(0, 100) : null
    }
    if (nickname !== undefined) {
      updates.nickname = typeof nickname === "string" ? nickname.trim().slice(0, 50) : null
    }
    if (image !== undefined) {
      updates.image = typeof image === "string" ? image.trim().slice(0, 500) : null
    }
    if (baseCurrency !== undefined) {
      const curr = String(baseCurrency).trim().toUpperCase()
      if (curr.length !== 3) {
        return NextResponse.json({ error: "baseCurrency must be 3 letters" }, { status: 400 })
      }
      updates.baseCurrency = curr
    }
    if (language !== undefined) {
      if (!["en", "he"].includes(language)) {
        return NextResponse.json({ error: "language must be en or he" }, { status: 400 })
      }
      updates.language = language
    }
    if (gender !== undefined) {
      if (!["male", "female"].includes(gender)) {
        return NextResponse.json({ error: "gender must be male or female" }, { status: 400 })
      }
      updates.gender = gender
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        image: true,
        baseCurrency: true,
        language: true,
        gender: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    logError("API /me PATCH", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

function calculateStats(
  expenses: Array<{
    countryCode: string
    amount: number
    convertedAmount: number | null
    currency: string
  }>,
  baseCurrency: string
) {
  const totalExpenses = expenses.length

  let totalSpentBase = 0
  const countriesMap = new Map<string, { count: number; total: number }>()

  for (const exp of expenses) {
    let baseAmount = 0
    if (exp.convertedAmount !== null) {
      baseAmount = exp.convertedAmount
    } else if (exp.currency === baseCurrency) {
      baseAmount = exp.amount
    }

    totalSpentBase += baseAmount

    const current = countriesMap.get(exp.countryCode) || { count: 0, total: 0 }
    countriesMap.set(exp.countryCode, {
      count: current.count + 1,
      total: current.total + baseAmount,
    })
  }

  const uniqueCountries = countriesMap.size

  const topCountries = Array.from(countriesMap.entries())
    .map(([countryCode, { count, total }]) => ({
      countryCode,
      expensesCount: count,
      totalSpentBase: total,
    }))
    .sort((a, b) => b.totalSpentBase - a.totalSpentBase)
    .slice(0, 5)

  return {
    totalExpenses,
    totalSpentBase,
    uniqueCountries,
    topCountries,
  }
}

