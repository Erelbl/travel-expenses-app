import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'
import { logError } from '@/lib/utils/logger'
import { getCountryName } from '@/lib/utils/countries'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId } = await params
    if (!tripId) {
      return NextResponse.json({ error: 'Missing tripId' }, { status: 400 })
    }

    // Verify user has access to this trip
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        baseCurrency: true,
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 })
    }

    // Fetch all expenses for the trip
    const expenses = await prisma.expense.findMany({
      where: { tripId },
      select: {
        id: true,
        title: true,
        category: true,
        countryCode: true,
        currency: true,
        amount: true,
        convertedAmount: true,
        expenseDate: true,
        note: true,
        createdAt: true,
      },
      orderBy: { expenseDate: 'asc' },
    })

    // Transform data for Excel export with exact column order
    const excelData = expenses.map((expense) => ({
      'Date': expense.expenseDate.toISOString().split('T')[0],
      'Expense Title': expense.title,
      'Category': expense.category,
      'Amount (original)': expense.amount,
      'Currency (original)': expense.currency,
      'Amount (base currency if available; else empty)': expense.convertedAmount || '',
      'Base Currency (if available)': expense.convertedAmount ? trip.baseCurrency : '',
      'Country (derived/explicit; must not infer from currency)': getCountryName(expense.countryCode, 'en'),
      'Payment Method (if exists; else empty)': '',
      'Notes (if exists; else empty)': expense.note || '',
      'Created At (ISO)': expense.createdAt.toISOString(),
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths for better readability
    worksheet['!cols'] = [
      { wch: 12 },  // Date
      { wch: 25 },  // Expense Title
      { wch: 12 },  // Category
      { wch: 15 },  // Amount (original)
      { wch: 18 },  // Currency (original)
      { wch: 20 },  // Amount (base currency)
      { wch: 15 },  // Base Currency
      { wch: 20 },  // Country
      { wch: 15 },  // Payment Method
      { wch: 30 },  // Notes
      { wch: 20 },  // Created At
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses')

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Sanitize trip name for filename
    const safeTripName = trip.name.replace(/[^a-z0-9]/gi, '-').substring(0, 50)
    const filename = `TravelWise-${safeTripName}-expenses.xlsx`

    // Return file as download
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    logError('API /trips/[tripId]/reports/export GET', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

