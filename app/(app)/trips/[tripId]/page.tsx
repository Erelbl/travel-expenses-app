import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Trip } from "@/lib/schemas/trip.schema"
import { Expense } from "@/lib/schemas/expense.schema"
import { TripStoreProvider } from "./TripStore"
import TripPageContent from "./TripPageContent"

// Server-side data fetching with parallel queries
async function getTripData(tripId: string, userId: string) {
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
        currentCountry: true,
        currentCurrency: true,
        tripType: true,
        adults: true,
        children: true,
        travelStyle: true,
        ageRange: true,
        targetBudget: true,
        isClosed: true,
        closedAt: true,
        createdAt: true,
        owner: { select: { id: true, name: true } },
        members: {
          select: {
            role: true,
            user: { select: { id: true, name: true } }
          }
        }
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
    currentCountry: trip.currentCountry ?? undefined,
    currentCurrency: trip.currentCurrency ?? undefined,
    tripType: trip.tripType?.toLowerCase() as any ?? undefined,
    adults: trip.adults,
    children: trip.children,
    travelStyle: trip.travelStyle?.toLowerCase() as any ?? undefined,
    ageRange: trip.ageRange ? trip.ageRange.replace('AGE_', '').toLowerCase() as any : undefined,
    targetBudget: trip.targetBudget ?? undefined,
    isClosed: trip.isClosed,
    closedAt: trip.closedAt?.getTime() ?? null,
    itineraryLegs: [],
    members: [
      { id: trip.owner.id, name: trip.owner.name ?? "Owner", role: "owner" as const },
      ...trip.members.map(m => ({
        id: m.user.id,
        name: m.user.name ?? "Member",
        role: m.role.toLowerCase() as "editor" | "viewer"
      }))
    ],
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

export default async function TripHomePage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const { tripId } = await params
  const data = await getTripData(tripId, session.user.id)

  if (!data) {
    notFound()
  }

  return (
    <TripStoreProvider
      tripId={tripId}
      initialTrip={data.trip}
      initialExpenses={data.expenses}
    >
      <TripPageContent tripId={tripId} />
    </TripStoreProvider>
  )
}
