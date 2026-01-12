/**
 * Countries dataset for travel expense tracking
 * Includes common travel destinations with ISO codes, currencies, and localized names
 */

import { Locale } from '../i18n';

export interface CountryData {
  code: string;
  name_en: string;
  name_he: string;
  currency: string;
  flag: string; // Emoji flag
}

export const COUNTRIES_DATA: CountryData[] = [
  { code: 'IL', name_en: 'Israel', name_he: 'ישראל', currency: 'ILS', flag: '🇮🇱' },
  { code: 'US', name_en: 'United States', name_he: 'ארצות הברית', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name_en: 'United Kingdom', name_he: 'בריטניה', currency: 'GBP', flag: '🇬🇧' },
  { code: 'FR', name_en: 'France', name_he: 'צרפת', currency: 'EUR', flag: '🇫🇷' },
  { code: 'ES', name_en: 'Spain', name_he: 'ספרד', currency: 'EUR', flag: '🇪🇸' },
  { code: 'IT', name_en: 'Italy', name_he: 'איטליה', currency: 'EUR', flag: '🇮🇹' },
  { code: 'DE', name_en: 'Germany', name_he: 'גרמניה', currency: 'EUR', flag: '🇩🇪' },
  { code: 'NL', name_en: 'Netherlands', name_he: 'הולנד', currency: 'EUR', flag: '🇳🇱' },
  { code: 'GR', name_en: 'Greece', name_he: 'יוון', currency: 'EUR', flag: '🇬🇷' },
  { code: 'TH', name_en: 'Thailand', name_he: 'תאילנד', currency: 'THB', flag: '🇹🇭' },
  { code: 'VN', name_en: 'Vietnam', name_he: 'וייטנאם', currency: 'VND', flag: '🇻🇳' },
  { code: 'KH', name_en: 'Cambodia', name_he: 'קמבודיה', currency: 'KHR', flag: '🇰🇭' },
  { code: 'LA', name_en: 'Laos', name_he: 'לאוס', currency: 'LAK', flag: '🇱🇦' },
  { code: 'LK', name_en: 'Sri Lanka', name_he: 'סרי לנקה', currency: 'LKR', flag: '🇱🇰' },
  { code: 'IN', name_en: 'India', name_he: 'הודו', currency: 'INR', flag: '🇮🇳' },
  { code: 'AE', name_en: 'United Arab Emirates', name_he: 'איחוד האמירויות', currency: 'AED', flag: '🇦🇪' },
  { code: 'TR', name_en: 'Turkey', name_he: 'טורקיה', currency: 'TRY', flag: '🇹🇷' },
  { code: 'JP', name_en: 'Japan', name_he: 'יפן', currency: 'JPY', flag: '🇯🇵' },
  { code: 'AU', name_en: 'Australia', name_he: 'אוסטרליה', currency: 'AUD', flag: '🇦🇺' },
  { code: 'AT', name_en: 'Austria', name_he: 'אוסטריה', currency: 'EUR', flag: '🇦🇹' },
  { code: 'BE', name_en: 'Belgium', name_he: 'בלגיה', currency: 'EUR', flag: '🇧🇪' },
  { code: 'CA', name_en: 'Canada', name_he: 'קנדה', currency: 'CAD', flag: '🇨🇦' },
  { code: 'CN', name_en: 'China', name_he: 'סין', currency: 'CNY', flag: '🇨🇳' },
  { code: 'CZ', name_en: 'Czech Republic', name_he: 'צ׳כיה', currency: 'CZK', flag: '🇨🇿' },
  { code: 'DK', name_en: 'Denmark', name_he: 'דנמרק', currency: 'DKK', flag: '🇩🇰' },
  { code: 'EG', name_en: 'Egypt', name_he: 'מצרים', currency: 'EGP', flag: '🇪🇬' },
  { code: 'FI', name_en: 'Finland', name_he: 'פינלנד', currency: 'EUR', flag: '🇫🇮' },
  { code: 'HU', name_en: 'Hungary', name_he: 'הונגריה', currency: 'HUF', flag: '🇭🇺' },
  { code: 'ID', name_en: 'Indonesia', name_he: 'אינדונזיה', currency: 'IDR', flag: '🇮🇩' },
  { code: 'IE', name_en: 'Ireland', name_he: 'אירלנד', currency: 'EUR', flag: '🇮🇪' },
  { code: 'MX', name_en: 'Mexico', name_he: 'מקסיקו', currency: 'MXN', flag: '🇲🇽' },
  { code: 'MY', name_en: 'Malaysia', name_he: 'מלזיה', currency: 'MYR', flag: '🇲🇾' },
  { code: 'NO', name_en: 'Norway', name_he: 'נורווגיה', currency: 'NOK', flag: '🇳🇴' },
  { code: 'NZ', name_en: 'New Zealand', name_he: 'ניו זילנד', currency: 'NZD', flag: '🇳🇿' },
  { code: 'PH', name_en: 'Philippines', name_he: 'פיליפינים', currency: 'PHP', flag: '🇵🇭' },
  { code: 'PL', name_en: 'Poland', name_he: 'פולין', currency: 'PLN', flag: '🇵🇱' },
  { code: 'PT', name_en: 'Portugal', name_he: 'פורטוגל', currency: 'EUR', flag: '🇵🇹' },
  { code: 'RO', name_en: 'Romania', name_he: 'רומניה', currency: 'RON', flag: '🇷🇴' },
  { code: 'SE', name_en: 'Sweden', name_he: 'שבדיה', currency: 'SEK', flag: '🇸🇪' },
  { code: 'SG', name_en: 'Singapore', name_he: 'סינגפור', currency: 'SGD', flag: '🇸🇬' },
  { code: 'ZA', name_en: 'South Africa', name_he: 'דרום אפריקה', currency: 'ZAR', flag: '🇿🇦' },
];

// Helper functions
export function getCountryByCode(code: string): CountryData | undefined {
  return COUNTRIES_DATA.find(c => c.code === code);
}

export function getCountryName(code: string, locale: Locale = 'en'): string {
  const country = getCountryByCode(code);
  if (!country) return code;
  return locale === 'he' ? country.name_he : country.name_en;
}

export function getCountryFlag(code: string): string {
  return getCountryByCode(code)?.flag || '🌍';
}

export function getCountryOptionLabel(code: string, locale: Locale = 'en'): string {
  const country = getCountryByCode(code);
  if (!country) return code;
  const name = locale === 'he' ? country.name_he : country.name_en;
  return `${country.flag} ${name}`;
}

export function getCountryCurrency(code: string): string | undefined {
  return getCountryByCode(code)?.currency;
}

export function searchCountries(query: string, locale?: Locale): CountryData[] {
  if (!query) return COUNTRIES_DATA;
  const lowerQuery = query.toLowerCase();
  return COUNTRIES_DATA.filter(c => 
    c.name_en.toLowerCase().includes(lowerQuery) || 
    c.name_he.includes(query) || // Hebrew search (case-sensitive for Hebrew)
    c.code.toLowerCase().includes(lowerQuery)
  );
}

export function getCountriesByCodes(codes: string[]): CountryData[] {
  return codes.map(code => getCountryByCode(code)).filter(Boolean) as CountryData[];
}

export function getAllowedCurrencies(countryCodes: string[]): string[] {
  const currencies = new Set<string>();
  countryCodes.forEach(code => {
    const currency = getCountryCurrency(code);
    if (currency) currencies.add(currency);
  });
  return Array.from(currencies);
}

