import { NextRequest, NextResponse } from "next/server"

/**
 * Exchange Rate API Route
 * 
 * Fetches exchange rates from a public API (ExchangeRate-API.com free tier)
 * Caches results to minimize API calls
 * 
 * Query params:
 * - base: Base currency (e.g., USD, EUR, ILS)
 * - target: Target currency (e.g., USD, EUR, ILS)
 * - date: Optional date for historical rates (YYYY-MM-DD), defaults to latest
 */

// Simple in-memory cache (resets on server restart, which is fine for free tier)
const rateCache = new Map<string, { rate: number; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const base = searchParams.get("base")?.toUpperCase()
  const target = searchParams.get("target")?.toUpperCase()
  const date = searchParams.get("date") // YYYY-MM-DD or null for latest

  if (!base || !target) {
    return NextResponse.json(
      { error: "Missing required parameters: base and target" },
      { status: 400 }
    )
  }

  // Same currency = rate 1
  if (base === target) {
    return NextResponse.json({
      base,
      target,
      rate: 1,
      date: date || new Date().toISOString().split("T")[0],
      source: "same_currency",
    })
  }

  // Check cache
  const cacheKey = `${base}-${target}-${date || "latest"}`
  const cached = rateCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      base,
      target,
      rate: cached.rate,
      date: date || new Date().toISOString().split("T")[0],
      source: "cache",
    })
  }

  try {
    // Fetch from ExchangeRate-API (free tier, no API key needed)
    // Endpoint: https://api.exchangerate-api.com/v4/latest/{base}
    const apiUrl = `https://api.exchangerate-api.com/v4/latest/${base}`
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.rates || !data.rates[target]) {
      return NextResponse.json(
        { error: `Exchange rate not available for ${base} -> ${target}` },
        { status: 404 }
      )
    }

    const rate = data.rates[target]

    // Cache the result
    rateCache.set(cacheKey, {
      rate,
      timestamp: Date.now(),
    })

    return NextResponse.json({
      base,
      target,
      rate,
      date: date || new Date().toISOString().split("T")[0],
      source: "api",
    })
  } catch (error) {
    console.error("Failed to fetch exchange rate:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch exchange rate",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

