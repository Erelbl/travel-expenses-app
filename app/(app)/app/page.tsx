import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { DashboardClient } from "./DashboardClient"

async function getTripsWithStats(userId: string) {
  // Fetch trips and expense aggregates in a single optimized query using raw SQL
  const tripsWithAggregates = await prisma.$queryRaw<Array<{
    id: string
    name: string
    startDate: Date | null
    endDate: Date | null
    baseCurrency: string
    targetBudget: number | null
    isClosed: boolean
    updatedAt: Date
    expenseCount: bigint
    totalSpend: number | null
  }>>`
    SELECT 
      t.id,
      t.name,
      t."startDate",
      t."endDate",
      t."baseCurrency",
      t."targetBudget",
      t."isClosed",
      t."updatedAt",
      COALESCE(COUNT(e.id), 0) as "expenseCount",
      COALESCE(SUM(e."convertedAmount"), 0) as "totalSpend"
    FROM "Trip" t
    LEFT JOIN "Expense" e ON e."tripId" = t.id
    WHERE t."ownerId" = ${userId}
       OR EXISTS (
         SELECT 1 FROM "TripMember" tm 
         WHERE tm."tripId" = t.id AND tm."userId" = ${userId}
       )
    GROUP BY t.id, t.name, t."startDate", t."endDate", t."baseCurrency", 
             t."targetBudget", t."isClosed", t."updatedAt"
    ORDER BY t."updatedAt" DESC
  `

  return tripsWithAggregates.map(trip => ({
    id: trip.id,
    name: trip.name,
    startDate: trip.startDate?.toISOString().split('T')[0] ?? null,
    endDate: trip.endDate?.toISOString().split('T')[0] ?? null,
    baseCurrency: trip.baseCurrency,
    targetBudget: trip.targetBudget ?? undefined,
    isClosed: trip.isClosed,
    totalSpend: trip.totalSpend ?? 0,
    expenseCount: Number(trip.expenseCount)
  }))
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

