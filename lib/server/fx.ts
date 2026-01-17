/**
 * Server-side FX conversion service using ExchangeRate-API (supports 160+ currencies)
 * https://www.exchangerate-api.com/docs/free
 */

// Simple in-memory cache for rates
const fxCache = new Map<string, { rateToBase: number; asOf: string; timestamp: number }>()
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

// Get API URL from env or use default free endpoint
const FX_API_BASE_URL = process.env.FX_API_BASE_URL || 'https://api.exchangerate-api.com/v4/latest'

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
    // ExchangeRate-API endpoint: https://api.exchangerate-api.com/v4/latest/{base}
    // This API supports 160+ currencies including LKR, and doesn't require an API key
    // Note: Historical rates not supported on free tier, so we use latest for all requests
    const endpoint = `${FX_API_BASE_URL}/${fromUpper}`

    const response = await fetch(endpoint, {
      next: { revalidate: 43200 }, // 12 hours
    })

    if (!response.ok) {
      throw new Error(`FX API error: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error(`Invalid response format from FX API`)
    }

    if (!data.rates[toUpper]) {
      throw new Error(`Rate not available for ${fromUpper} -> ${toUpper}. Supported currencies: ${Object.keys(data.rates).join(', ')}`)
    }

    const rateToBase = data.rates[toUpper]
    const asOf = data.date || new Date().toISOString().split('T')[0]

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
    // Log error but don't expose internal details
    console.error(`[FX] Conversion failed for ${fromUpper} -> ${toUpper}:`, error)
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch exchange rate'
    )
  }
}

