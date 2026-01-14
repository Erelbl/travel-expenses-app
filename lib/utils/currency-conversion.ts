/**
 * Canonical currency conversion utilities
 * 
 * Convention: rateToBase = base per 1 unit of original currency
 * Conversion formula: amountBase = amountOriginal * rateToBase
 * 
 * Example: 10 EUR -> USD with rateToBase=1.1 => 11 USD
 */

/**
 * Convert an amount from original currency to base currency
 * @param amountOriginal - Amount in the original currency
 * @param rateToBase - Exchange rate (base per 1 unit of original currency)
 * @returns Amount in base currency (not rounded)
 */
export function convertToBase(amountOriginal: number, rateToBase: number): number {
  return amountOriginal * rateToBase
}

/**
 * Format amount for display (2 decimals, except for JPY/KRW/VND which use 0)
 * @param amount - Raw amount
 * @param currency - Currency code
 * @returns Formatted string (for display only)
 */
export function formatAmountForDisplay(amount: number, currency: string): string {
  const decimals = ['JPY', 'KRW', 'VND'].includes(currency) ? 0 : 2
  return amount.toFixed(decimals)
}

/**
 * Calculate exchange rate from base to foreign currency
 * @param basePerForeign - Rate: base per 1 unit of foreign currency
 * @returns Reciprocal rate: foreign per 1 unit of base currency
 */
export function getInverseRate(basePerForeign: number): number {
  return 1 / basePerForeign
}

