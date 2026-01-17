import { ExchangeRate } from "@/lib/schemas/exchange-rate.schema"
import { RatesRepository } from "@/lib/data/repositories"

const STORAGE_KEY = "travel-expenses:rates"

/**
 * Fetch rates from API for a given base currency
 * This is a client-side safe implementation that fetches on-demand
 */
async function fetchRatesFromAPI(baseCurrency: string): Promise<Record<string, number> | null> {
  try {
    const response = await fetch(`/api/exchange-rates?base=${baseCurrency}&target=USD`)
    
    if (!response.ok) {
      console.warn(`Failed to fetch rates for ${baseCurrency}:`, response.statusText)
      return null
    }

    // The API returns a single rate, but we can fetch the full rate set
    // by making a request and then using the base currency endpoint
    const fullRatesResponse = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    )
    
    if (!fullRatesResponse.ok) {
      return null
    }

    const data = await fullRatesResponse.json()
    return data.rates || null
  } catch (error) {
    console.error(`Error fetching rates for ${baseCurrency}:`, error)
    return null
  }
}

export class LocalRatesRepository implements RatesRepository {
  private getRatesFromStorage(): Record<string, ExchangeRate> {
    if (typeof window === "undefined") return {}
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return {}
    try {
      return JSON.parse(data)
    } catch {
      return {}
    }
  }

  private saveRatesToStorage(rates: Record<string, ExchangeRate>): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rates))
  }

  async getRates(baseCurrency: string): Promise<ExchangeRate | null> {
    const allRates = this.getRatesFromStorage()
    
    // Check if we have recent cached rates (< 24 hours old)
    if (allRates[baseCurrency]) {
      const age = Date.now() - allRates[baseCurrency].updatedAt
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      
      if (age < maxAge) {
        return allRates[baseCurrency]
      }
    }
    
    // Fetch fresh rates from API
    const freshRates = await fetchRatesFromAPI(baseCurrency)
    
    if (freshRates) {
      // Cache the fresh rates
      await this.setRates(baseCurrency, freshRates)
      return {
        baseCurrency,
        rates: freshRates,
        updatedAt: Date.now(),
      }
    }
    
    // If API fails, return stale cache if available
    if (allRates[baseCurrency]) {
      console.warn(`Using stale rates for ${baseCurrency}`)
      return allRates[baseCurrency]
    }
    
    return null
  }

  async setRates(baseCurrency: string, rates: Record<string, number>): Promise<void> {
    const allRates = this.getRatesFromStorage()
    
    allRates[baseCurrency] = {
      baseCurrency,
      rates,
      updatedAt: Date.now(),
    }
    
    this.saveRatesToStorage(allRates)
  }
}

