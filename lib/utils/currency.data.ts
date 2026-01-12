/**
 * Currency dataset with localized names
 * Includes commonly used currencies for travel expense tracking
 */

import { Locale } from '../i18n';

export interface CurrencyData {
  code: string;
  symbol: string;
  name_en: string;
  name_he: string;
}

export const CURRENCIES_DATA: CurrencyData[] = [
  { code: 'USD', symbol: '$', name_en: 'US Dollar', name_he: 'דולר אמריקאי' },
  { code: 'EUR', symbol: '€', name_en: 'Euro', name_he: 'יורו' },
  { code: 'GBP', symbol: '£', name_en: 'British Pound', name_he: 'לירה שטרלינג' },
  { code: 'ILS', symbol: '₪', name_en: 'Israeli Shekel', name_he: 'שקל ישראלי' },
  { code: 'JPY', symbol: '¥', name_en: 'Japanese Yen', name_he: 'ין יפני' },
  { code: 'AUD', symbol: 'A$', name_en: 'Australian Dollar', name_he: 'דולר אוסטרלי' },
  { code: 'CAD', symbol: 'C$', name_en: 'Canadian Dollar', name_he: 'דולר קנדי' },
  { code: 'CHF', symbol: 'CHF', name_en: 'Swiss Franc', name_he: 'פרנק שוויצרי' },
  { code: 'CNY', symbol: '¥', name_en: 'Chinese Yuan', name_he: 'יואן סיני' },
  { code: 'THB', symbol: '฿', name_en: 'Thai Baht', name_he: 'באט תאילנדי' },
  { code: 'VND', symbol: '₫', name_en: 'Vietnamese Dong', name_he: 'דונג וייטנאמי' },
  { code: 'INR', symbol: '₹', name_en: 'Indian Rupee', name_he: 'רופי הודי' },
  { code: 'AED', symbol: 'د.إ', name_en: 'UAE Dirham', name_he: 'דירהם איחוד האמירויות' },
  { code: 'TRY', symbol: '₺', name_en: 'Turkish Lira', name_he: 'לירה טורקית' },
  { code: 'MXN', symbol: 'Mex$', name_en: 'Mexican Peso', name_he: 'פסו מקסיקני' },
  { code: 'SGD', symbol: 'S$', name_en: 'Singapore Dollar', name_he: 'דולר סינגפורי' },
  { code: 'NZD', symbol: 'NZ$', name_en: 'New Zealand Dollar', name_he: 'דולר ניו זילנדי' },
  { code: 'SEK', symbol: 'kr', name_en: 'Swedish Krona', name_he: 'כתר שוודי' },
  { code: 'NOK', symbol: 'kr', name_en: 'Norwegian Krone', name_he: 'כתר נורבגי' },
  { code: 'DKK', symbol: 'kr', name_en: 'Danish Krone', name_he: 'כתר דני' },
  { code: 'PLN', symbol: 'zł', name_en: 'Polish Zloty', name_he: 'זלוטי פולני' },
  { code: 'CZK', symbol: 'Kč', name_en: 'Czech Koruna', name_he: 'כתר צ\'כי' },
  { code: 'HUF', symbol: 'Ft', name_en: 'Hungarian Forint', name_he: 'פורינט הונגרי' },
  { code: 'RON', symbol: 'lei', name_en: 'Romanian Leu', name_he: 'לאו רומני' },
  { code: 'ZAR', symbol: 'R', name_en: 'South African Rand', name_he: 'ראנד דרום אפריקאי' },
  { code: 'KHR', symbol: '៛', name_en: 'Cambodian Riel', name_he: 'ריאל קמבודי' },
  { code: 'LAK', symbol: '₭', name_en: 'Lao Kip', name_he: 'קיפ לאוסי' },
  { code: 'LKR', symbol: 'Rs', name_en: 'Sri Lankan Rupee', name_he: 'רופי סרי לנקי' },
  { code: 'MYR', symbol: 'RM', name_en: 'Malaysian Ringgit', name_he: 'רינגיט מלזי' },
  { code: 'PHP', symbol: '₱', name_en: 'Philippine Peso', name_he: 'פסו פיליפיני' },
  { code: 'IDR', symbol: 'Rp', name_en: 'Indonesian Rupiah', name_he: 'רופיה אינדונזית' },
  { code: 'EGP', symbol: 'E£', name_en: 'Egyptian Pound', name_he: 'לירה מצרית' },
];

// Helper functions
export function getCurrencyByCode(code: string): CurrencyData | undefined {
  return CURRENCIES_DATA.find(c => c.code === code);
}

export function getCurrencyName(code: string, locale: Locale = 'en'): string {
  const currency = getCurrencyByCode(code);
  if (!currency) return code;
  return locale === 'he' ? currency.name_he : currency.name_en;
}

export function getCurrencySymbol(code: string): string {
  return getCurrencyByCode(code)?.symbol || code;
}

export function getCurrencyLabel(code: string, locale: Locale = 'en'): string {
  const currency = getCurrencyByCode(code);
  if (!currency) return code;
  const name = locale === 'he' ? currency.name_he : currency.name_en;
  return `${currency.symbol} ${code} • ${name}`;
}

export function getCurrencySelectLabel(code: string, locale: Locale = 'en'): string {
  const currency = getCurrencyByCode(code);
  if (!currency) return code;
  const name = locale === 'he' ? currency.name_he : currency.name_en;
  return `${code} - ${name}`;
}

