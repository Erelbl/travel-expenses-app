import { ExchangeRate } from "@/lib/schemas/exchange-rate.schema"
import { RatesRepository } from "@/lib/data/repositories"

const STORAGE_KEY = "travel-expenses:rates"

// Default exchange rates (1 unit of currency = X USD)
const DEFAULT_RATES: Record<string, Record<string, number>> = {
  USD: {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    ILS: 3.65,
    JPY: 149.5,
    AUD: 1.52,
    CAD: 1.36,
    CHF: 0.88,
  },
  EUR: {
    USD: 1.09,
    EUR: 1,
    GBP: 0.86,
    ILS: 3.97,
    JPY: 162.5,
    AUD: 1.65,
    CAD: 1.48,
    CHF: 0.96,
  },
  ILS: {
    USD: 0.27,
    EUR: 0.25,
    GBP: 0.22,
    ILS: 1,
    JPY: 41,
    AUD: 0.42,
    CAD: 0.37,
    CHF: 0.24,
  },
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
    
    if (allRates[baseCurrency]) {
      return allRates[baseCurrency]
    }
    
    // Return default rates if available
    if (DEFAULT_RATES[baseCurrency]) {
      return {
        baseCurrency,
        rates: DEFAULT_RATES[baseCurrency],
        updatedAt: Date.now(),
      }
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

