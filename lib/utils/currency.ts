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
  // Major currencies
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  
  // Middle East & Africa
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  
  // Asia
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  
  // Europe (non-EUR)
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  
  // Americas
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  
  // Southeast Asia
  { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
  { code: 'LAK', symbol: '₭', name: 'Lao Kip' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
];

export function getCurrencyInfo(code: string): CurrencyInfo | undefined {
  return CURRENCIES_INFO.find(c => c.code === code);
}

export function formatCurrencyWithSymbol(code: string): string {
  const symbol = getCurrencySymbol(code);
  return symbol !== code ? `${symbol} ${code}` : code;
}

/**
 * Format currency for display with locale awareness
 * @param amount - The amount to format
 * @param currency - The currency code
 * @param locale - The locale for formatting (e.g., 'en', 'he')
 * @returns Formatted currency string
 */
export function formatCurrencyLocalized(amount: number, currency: string, locale: string = 'en'): string {
  try {
    const formatter = new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: ['JPY', 'KRW', 'VND'].includes(currency) ? 0 : 0,
      maximumFractionDigits: ['JPY', 'KRW', 'VND'].includes(currency) ? 0 : 0,
    });
    
    return formatter.format(amount);
  } catch (error) {
    // Fallback to manual formatting if Intl fails
    const symbol = getCurrencySymbol(currency);
    const formatted = Math.round(amount).toString();
    return locale === 'he' ? `${symbol}${formatted}` : `${symbol}${formatted}`;
  }
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
