import { NextRequest, NextResponse } from "next/server"
import { convertCurrency } from "@/lib/server/fx"
import { logError } from "@/lib/utils/logger"

/**
 * FX Conversion API Route
 * Query params: from, to, amount, date? (optional, default = latest)
 * Returns: { from, to, amount, rateToBase, amountBase, asOf }
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const amountStr = searchParams.get("amount")
  const date = searchParams.get("date") || undefined

  if (!from || !to || !amountStr) {
    return NextResponse.json(
      { error: "Missing required parameters: from, to, amount" },
      { status: 400 }
    )
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Invalid amount" },
      { status: 400 }
    )
  }

  try {
    const result = await convertCurrency(from, to, amount, date)
    return NextResponse.json(result)
  } catch (error) {
    logError("API /fx/convert", error)
    
    const message = error instanceof Error ? error.message : "Unknown error"
    const isUnsupported = message.includes("Unsupported") || message.includes("not available")
    
    return NextResponse.json(
      { error: message },
      { status: isUnsupported ? 400 : 502 }
    )
  }
}

