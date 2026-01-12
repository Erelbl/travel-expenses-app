/**
 * Currency utilities and symbols
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  // Major currencies
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  
  // Middle East & Africa
  ILS: '₪',
  AED: 'د.إ',
  EGP: 'E£',
  ZAR: 'R',
  
  // Asia
  THB: '฿',
  VND: '₫',
  INR: '₹',
  IDR: 'Rp',
  MYR: 'RM',
  SGD: 'S$',
  PHP: '₱',
  KRW: '₩',
  
  // Europe (non-EUR)
  CHF: 'Fr',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  CZK: 'Kč',
  PLN: 'zł',
  HUF: 'Ft',
  RON: 'lei',
  TRY: '₺',
  
  // Americas
  CAD: 'C$',
  AUD: 'A$',
  NZD: 'NZ$',
  MXN: 'Mex$',
  BRL: 'R$',
  
  // Southeast Asia
  KHR: '៛',
  LAK: '₭',
  LKR: 'Rs',
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES_INFO: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
];

export function getCurrencyInfo(code: string): CurrencyInfo | undefined {
  return CURRENCIES_INFO.find(c => c.code === code);
}

export function formatCurrencyWithSymbol(code: string): string {
  const symbol = getCurrencySymbol(code);
  return symbol !== code ? `${symbol} ${code}` : code;
}

/**
 * Format currency for display (backwards compatibility)
 * @param amount - The amount to format
 * @param currency - The currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  
  // Format with appropriate decimal places
  const decimals = ['JPY', 'KRW', 'VND'].includes(currency) ? 0 : 2;
  const formatted = amount.toFixed(decimals);
  
  // Add thousands separators
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${symbol}${parts.join('.')}`;
}

// Backwards compatibility - export CURRENCIES array
export const CURRENCIES = CURRENCIES_INFO;
