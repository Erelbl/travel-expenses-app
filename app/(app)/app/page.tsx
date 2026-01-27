import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { DashboardClient } from "./DashboardClient"

async function getTripsWithStats(userId: string) {
  const trips = await prisma.trip.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      baseCurrency: true,
      targetBudget: true,
      isClosed: true,
      updatedAt: true,
      _count: {
        select: { expenses: true }
      }
    },
    orderBy: { updatedAt: "desc" }
  })

  // Fetch total spend for each trip
  const tripsWithStats = await Promise.all(
    trips.map(async (trip) => {
      const expenses = await prisma.expense.aggregate({
        where: { tripId: trip.id },
        _sum: { convertedAmount: true, amount: true }
      })

      const totalSpend = expenses._sum.convertedAmount || expenses._sum.amount || 0

      return {
        id: trip.id,
        name: trip.name,
        startDate: trip.startDate?.toISOString().split('T')[0] ?? null,
        endDate: trip.endDate?.toISOString().split('T')[0] ?? null,
        baseCurrency: trip.baseCurrency,
        targetBudget: trip.targetBudget ?? undefined,
        isClosed: trip.isClosed,
        totalSpend,
        expenseCount: trip._count.expenses
      }
    })
  )

  return tripsWithStats
}

export default async function AppDashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  // Parallelize independent data fetches
  const [user, trips] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nickname: true, gender: true }
    }),
    getTripsWithStats(session.user.id)
  ])

  return <DashboardClient 
    trips={trips} 
    userName={user?.nickname || null}
    userGender={(user?.gender as "male" | "female") || "male"}
  />
}

