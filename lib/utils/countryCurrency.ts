// Map of country code to primary currency code
export const countryToCurrency: Record<string, string> = {
  // Europe
  IL: "ILS", // Israel
  GB: "GBP", // United Kingdom
  FR: "EUR", // France
  ES: "EUR", // Spain
  IT: "EUR", // Italy
  DE: "EUR", // Germany
  NL: "EUR", // Netherlands
  GR: "EUR", // Greece
  PT: "EUR", // Portugal
  CH: "CHF", // Switzerland
  SE: "SEK", // Sweden (not in main list but useful)
  NO: "NOK", // Norway (not in main list but useful)
  DK: "DKK", // Denmark (not in main list but useful)
  TR: "TRY", // Turkey
  
  // Americas
  US: "USD", // United States
  CA: "CAD", // Canada
  
  // Asia
  TH: "THB", // Thailand
  VN: "VND", // Vietnam
  KH: "KHR", // Cambodia
  LA: "LAK", // Laos
  LK: "LKR", // Sri Lanka
  IN: "INR", // India
  AE: "AED", // UAE
  JP: "JPY", // Japan
  SG: "SGD", // Singapore
  
  // Oceania
  AU: "AUD", // Australia
  NZ: "NZD", // New Zealand
}

/**
 * Get the primary currency for a country
 */
export function currencyForCountry(countryCode: string): string | null {
  return countryToCurrency[countryCode] || null
}

/**
 * Get unique list of currencies for an array of countries
 * Returns unique currencies in alphabetical order
 */
export function allowedCurrenciesForCountries(countries: string[]): string[] {
  const currencies = new Set<string>()
  
  for (const country of countries) {
    const currency = currencyForCountry(country)
    if (currency) {
      currencies.add(currency)
    }
  }
  
  return Array.from(currencies).sort()
}

// Core currencies that are always available regardless of trip countries
export const CORE_CURRENCIES = ["EUR", "USD", "ILS"]

/**
 * Get all allowed currencies for a trip based on planned countries
 * Always includes core currencies (EUR, USD, ILS) plus trip-specific currencies
 */
export function getTripAllowedCurrencies(plannedCountries?: string[]): string[] {
  // Start with core currencies (always available)
  const currencies = new Set<string>(CORE_CURRENCIES)
  
  // Add trip-specific currencies from planned countries
  if (plannedCountries && plannedCountries.length > 0) {
    const tripCurrencies = allowedCurrenciesForCountries(plannedCountries)
    tripCurrencies.forEach(c => currencies.add(c))
  }
  
  // Sort alphabetically with core currencies first
  return Array.from(currencies).sort((a, b) => {
    const aIsCore = CORE_CURRENCIES.includes(a)
    const bIsCore = CORE_CURRENCIES.includes(b)
    if (aIsCore && !bIsCore) return -1
    if (!aIsCore && bIsCore) return 1
    return a.localeCompare(b)
  })
}

/**
 * Free-plan base currency allowlist (always included for free users)
 */
export const FREE_PLAN_BASE_CURRENCIES = ["EUR", "USD"] as const

/**
 * Get allowed expense currencies based on plan.
 * Free users: USD + EUR + trip baseCurrency (if provided).
 * Plus/Pro users: full set from getTripAllowedCurrencies (trip-country currencies + core).
 */
export function getAllowedCurrenciesForPlan(
  plan: string,
  baseCurrency?: string,
  plannedCountries?: string[]
): string[] {
  if (plan === "free") {
    const currencies = new Set<string>(FREE_PLAN_BASE_CURRENCIES)
    if (baseCurrency) currencies.add(baseCurrency)
    return Array.from(currencies).sort()
  }
  return getTripAllowedCurrencies(plannedCountries)
}

/**
 * Get default currency for an expense based on country
 * Falls back to trip base currency if no mapping exists
 */
export function getDefaultCurrencyForExpense(
  expenseCountry: string,
  tripBaseCurrency: string,
  tripPlannedCountries?: string[]
): string {
  // Priority 1: If expense country has a currency mapping, use it
  const countryCurrency = currencyForCountry(expenseCountry)
  if (countryCurrency) {
    return countryCurrency
  }
  
  // Priority 2: If trip has exactly one planned country, use that currency
  if (tripPlannedCountries && tripPlannedCountries.length === 1) {
    const singleCountryCurrency = currencyForCountry(tripPlannedCountries[0])
    if (singleCountryCurrency) {
      return singleCountryCurrency
    }
  }
  
  // Priority 3: Fall back to trip base currency
  return tripBaseCurrency
}

