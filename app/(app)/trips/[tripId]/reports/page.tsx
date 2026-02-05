import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Trip } from "@/lib/schemas/trip.schema"
import { Expense } from "@/lib/schemas/expense.schema"
import ReportsPageContent from "./ReportsPageContent"

// Server-side data fetching with parallel queries
async function getTripDataForReports(tripId: string, userId: string) {
  const [trip, expenses] = await Promise.all([
    prisma.trip.findFirst({
      where: {
        id: tripId,
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
        countries: true,
        targetBudget: true,
        createdAt: true,
      }
    }),
    prisma.expense.findMany({
      where: { tripId },
      select: {
        id: true,
        tripId: true,
        createdById: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        title: true,
        category: true,
        countryCode: true,
        currency: true,
        amount: true,
        convertedAmount: true,
        expenseDate: true,
        usageDate: true,
        note: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
  ])

  if (!trip) return null

  // Transform to schema format
  const tripData: Trip = {
    id: trip.id,
    name: trip.name,
    startDate: trip.startDate?.toISOString().split('T')[0] ?? null,
    endDate: trip.endDate?.toISOString().split('T')[0] ?? null,
    baseCurrency: trip.baseCurrency,
    countries: trip.countries,
    plannedCountries: trip.countries,
    targetBudget: trip.targetBudget ?? undefined,
    isClosed: false,
    closedAt: null,
    itineraryLegs: [],
    members: [],
    createdAt: trip.createdAt.getTime(),
  }

  const expensesData: Expense[] = expenses.map(e => ({
    id: e.id,
    tripId: e.tripId,
    amount: e.amount,
    currency: e.currency,
    baseCurrency: "",
    convertedAmount: e.convertedAmount ?? undefined,
    amountInBase: e.convertedAmount ?? undefined,
    category: e.category as any,
    country: e.countryCode,
    merchant: e.title,
    note: e.note ?? undefined,
    paidByMemberId: e.createdById,
    createdByMemberId: e.createdById,
    createdByUser: {
      name: e.createdBy.name,
      email: e.createdBy.email,
    },
    date: e.expenseDate.toISOString().split('T')[0],
    usageDate: e.usageDate?.toISOString().split('T')[0],
    createdAt: e.createdAt.getTime(),
  }))

  return { trip: tripData, expenses: expensesData }
}

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const { tripId } = await params
  const data = await getTripDataForReports(tripId, session.user.id)

  if (!data) {
    notFound()
  }

  return (
    <ReportsPageContent
      trip={data.trip}
      expenses={data.expenses}
      tripId={tripId}
    />
  )
}
