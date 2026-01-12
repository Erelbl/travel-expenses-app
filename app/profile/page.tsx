import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { PageContainer } from "@/components/ui/page-container"
import { PageHeader } from "@/components/page-header"
import { ProfileForm } from "./ProfileForm"
import { StatsDisplay } from "./StatsDisplay"

async function getProfileData(userId: string) {
  try {
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
      },
    })

    if (!user) {
      return null
    }

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

    return {
      user,
      stats: {
        my: { ...myStats, totalTrips: tripIds.length },
        trips: { ...tripsStats, totalTrips: tripIds.length },
      },
    }
  } catch (error) {
    console.error("[Profile] Error loading data:", error)
    return null
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

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const profileData = await getProfileData(session.user.id)

  if (!profileData || !profileData.user) {
    return (
      <PageContainer>
        <PageHeader title="Profile" description="Manage your account and view statistics" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-slate-500">Failed to load profile</p>
        </div>
      </PageContainer>
    )
  }

  const { user, stats } = profileData

  return (
    <PageContainer>
      <PageHeader title="Profile" description="Manage your account and view statistics" />

      <div className="space-y-8">
        <ProfileForm user={user} />
        <StatsDisplay stats={stats} baseCurrency={user.baseCurrency} />
      </div>
    </PageContainer>
  )
}
