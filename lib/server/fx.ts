/**
 * Server-side FX conversion service using Frankfurter API (ECB-based, free, no API key)
 * https://www.frankfurter.app/docs/
 */

// Simple in-memory cache for rates
const fxCache = new Map<string, { rateToBase: number; asOf: string; timestamp: number }>()
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

export interface FxConversionResult {
  from: string
  to: string
  amount: number
  rateToBase: number
  amountBase: number
  asOf: string
}

/**
 * Convert amount from one currency to another using Frankfurter API
 * Convention: rateToBase = how much baseCurrency equals 1 unit of fromCurrency
 * amountBase = amount * rateToBase
 */
export async function convertCurrency(
  from: string,
  to: string,
  amount: number,
  date?: string
): Promise<FxConversionResult> {
  const fromUpper = from.toUpperCase()
  const toUpper = to.toUpperCase()

  // Same currency
  if (fromUpper === toUpper) {
    return {
      from: fromUpper,
      to: toUpper,
      amount,
      rateToBase: 1,
      amountBase: amount,
      asOf: date || new Date().toISOString().split('T')[0],
    }
  }

  // Check cache
  const cacheKey = `${fromUpper}-${toUpper}-${date || 'latest'}`
  const cached = fxCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      from: fromUpper,
      to: toUpper,
      amount,
      rateToBase: cached.rateToBase,
      amountBase: amount * cached.rateToBase,
      asOf: cached.asOf,
    }
  }

  try {
    // Frankfurter endpoint: https://api.frankfurter.app/latest?from=USD&to=EUR
    // Or historical: https://api.frankfurter.app/2024-01-15?from=USD&to=EUR
    const endpoint = date 
      ? `https://api.frankfurter.app/${date}?from=${fromUpper}&to=${toUpper}`
      : `https://api.frankfurter.app/latest?from=${fromUpper}&to=${toUpper}`

    const response = await fetch(endpoint, {
      next: { revalidate: 43200 }, // 12 hours
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Unsupported currency pair: ${fromUpper}/${toUpper}`)
      }
      throw new Error(`Frankfurter API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.rates || !data.rates[toUpper]) {
      throw new Error(`Rate not available for ${fromUpper} -> ${toUpper}`)
    }

    const rateToBase = data.rates[toUpper]
    const asOf = data.date

    // Cache result
    fxCache.set(cacheKey, {
      rateToBase,
      asOf,
      timestamp: Date.now(),
    })

    return {
      from: fromUpper,
      to: toUpper,
      amount,
      rateToBase,
      amountBase: amount * rateToBase,
      asOf,
    }
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch exchange rate'
    )
  }
}

