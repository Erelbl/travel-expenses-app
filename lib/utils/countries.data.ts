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
  // Popular destinations (sorted by popularity)
  { code: 'IL', name_en: 'Israel', name_he: 'ישראל', currency: 'ILS', flag: '🇮🇱' },
  { code: 'US', name_en: 'United States', name_he: 'ארצות הברית', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name_en: 'United Kingdom', name_he: 'בריטניה', currency: 'GBP', flag: '🇬🇧' },
  { code: 'FR', name_en: 'France', name_he: 'צרפת', currency: 'EUR', flag: '🇫🇷' },
  { code: 'ES', name_en: 'Spain', name_he: 'ספרד', currency: 'EUR', flag: '🇪🇸' },
  { code: 'IT', name_en: 'Italy', name_he: 'איטליה', currency: 'EUR', flag: '🇮🇹' },
  { code: 'DE', name_en: 'Germany', name_he: 'גרמניה', currency: 'EUR', flag: '🇩🇪' },
  { code: 'TH', name_en: 'Thailand', name_he: 'תאילנד', currency: 'THB', flag: '🇹🇭' },
  { code: 'JP', name_en: 'Japan', name_he: 'יפן', currency: 'JPY', flag: '🇯🇵' },
  { code: 'TR', name_en: 'Turkey', name_he: 'טורקיה', currency: 'TRY', flag: '🇹🇷' },
  { code: 'GR', name_en: 'Greece', name_he: 'יוון', currency: 'EUR', flag: '🇬🇷' },
  { code: 'AE', name_en: 'United Arab Emirates', name_he: 'איחוד האמירויות', currency: 'AED', flag: '🇦🇪' },
  { code: 'NL', name_en: 'Netherlands', name_he: 'הולנד', currency: 'EUR', flag: '🇳🇱' },
  { code: 'PT', name_en: 'Portugal', name_he: 'פורטוגל', currency: 'EUR', flag: '🇵🇹' },
  { code: 'AU', name_en: 'Australia', name_he: 'אוסטרליה', currency: 'AUD', flag: '🇦🇺' },
  { code: 'CA', name_en: 'Canada', name_he: 'קנדה', currency: 'CAD', flag: '🇨🇦' },
  { code: 'SG', name_en: 'Singapore', name_he: 'סינגפור', currency: 'SGD', flag: '🇸🇬' },
  { code: 'MX', name_en: 'Mexico', name_he: 'מקסיקו', currency: 'MXN', flag: '🇲🇽' },
  { code: 'IN', name_en: 'India', name_he: 'הודו', currency: 'INR', flag: '🇮🇳' },
  { code: 'VN', name_en: 'Vietnam', name_he: 'וייטנאם', currency: 'VND', flag: '🇻🇳' },
  
  // Europe (A-Z)
  { code: 'AL', name_en: 'Albania', name_he: 'אלבניה', currency: 'ALL', flag: '🇦🇱' },
  { code: 'AD', name_en: 'Andorra', name_he: 'אנדורה', currency: 'EUR', flag: '🇦🇩' },
  { code: 'AT', name_en: 'Austria', name_he: 'אוסטריה', currency: 'EUR', flag: '🇦🇹' },
  { code: 'BY', name_en: 'Belarus', name_he: 'בלארוס', currency: 'BYN', flag: '🇧🇾' },
  { code: 'BE', name_en: 'Belgium', name_he: 'בלגיה', currency: 'EUR', flag: '🇧🇪' },
  { code: 'BA', name_en: 'Bosnia and Herzegovina', name_he: 'בוסניה והרצגובינה', currency: 'BAM', flag: '🇧🇦' },
  { code: 'BG', name_en: 'Bulgaria', name_he: 'בולגריה', currency: 'BGN', flag: '🇧🇬' },
  { code: 'HR', name_en: 'Croatia', name_he: 'קרואטיה', currency: 'EUR', flag: '🇭🇷' },
  { code: 'CY', name_en: 'Cyprus', name_he: 'קפריסין', currency: 'EUR', flag: '🇨🇾' },
  { code: 'CZ', name_en: 'Czech Republic', name_he: 'צ׳כיה', currency: 'CZK', flag: '🇨🇿' },
  { code: 'DK', name_en: 'Denmark', name_he: 'דנמרק', currency: 'DKK', flag: '🇩🇰' },
  { code: 'EE', name_en: 'Estonia', name_he: 'אסטוניה', currency: 'EUR', flag: '🇪🇪' },
  { code: 'FI', name_en: 'Finland', name_he: 'פינלנד', currency: 'EUR', flag: '🇫🇮' },
  { code: 'GE', name_en: 'Georgia', name_he: 'גאורגיה', currency: 'GEL', flag: '🇬🇪' },
  { code: 'HU', name_en: 'Hungary', name_he: 'הונגריה', currency: 'HUF', flag: '🇭🇺' },
  { code: 'IS', name_en: 'Iceland', name_he: 'איסלנד', currency: 'ISK', flag: '🇮🇸' },
  { code: 'IE', name_en: 'Ireland', name_he: 'אירלנד', currency: 'EUR', flag: '🇮🇪' },
  { code: 'LV', name_en: 'Latvia', name_he: 'לטביה', currency: 'EUR', flag: '🇱🇻' },
  { code: 'LT', name_en: 'Lithuania', name_he: 'ליטא', currency: 'EUR', flag: '🇱🇹' },
  { code: 'LU', name_en: 'Luxembourg', name_he: 'לוקסמבורג', currency: 'EUR', flag: '🇱🇺' },
  { code: 'MT', name_en: 'Malta', name_he: 'מלטה', currency: 'EUR', flag: '🇲🇹' },
  { code: 'MD', name_en: 'Moldova', name_he: 'מולדובה', currency: 'MDL', flag: '🇲🇩' },
  { code: 'MC', name_en: 'Monaco', name_he: 'מונקו', currency: 'EUR', flag: '🇲🇨' },
  { code: 'ME', name_en: 'Montenegro', name_he: 'מונטנגרו', currency: 'EUR', flag: '🇲🇪' },
  { code: 'NO', name_en: 'Norway', name_he: 'נורווגיה', currency: 'NOK', flag: '🇳🇴' },
  { code: 'PL', name_en: 'Poland', name_he: 'פולין', currency: 'PLN', flag: '🇵🇱' },
  { code: 'RO', name_en: 'Romania', name_he: 'רומניה', currency: 'RON', flag: '🇷🇴' },
  { code: 'RU', name_en: 'Russia', name_he: 'רוסיה', currency: 'RUB', flag: '🇷🇺' },
  { code: 'RS', name_en: 'Serbia', name_he: 'סרביה', currency: 'RSD', flag: '🇷🇸' },
  { code: 'SK', name_en: 'Slovakia', name_he: 'סלובקיה', currency: 'EUR', flag: '🇸🇰' },
  { code: 'SI', name_en: 'Slovenia', name_he: 'סלובניה', currency: 'EUR', flag: '🇸🇮' },
  { code: 'SE', name_en: 'Sweden', name_he: 'שבדיה', currency: 'SEK', flag: '🇸🇪' },
  { code: 'CH', name_en: 'Switzerland', name_he: 'שווייץ', currency: 'CHF', flag: '🇨🇭' },
  { code: 'UA', name_en: 'Ukraine', name_he: 'אוקראינה', currency: 'UAH', flag: '🇺🇦' },
  
  // Asia (A-Z)
  { code: 'AF', name_en: 'Afghanistan', name_he: 'אפגניסטן', currency: 'AFN', flag: '🇦🇫' },
  { code: 'AM', name_en: 'Armenia', name_he: 'ארמניה', currency: 'AMD', flag: '🇦🇲' },
  { code: 'AZ', name_en: 'Azerbaijan', name_he: 'אזרבייג׳ן', currency: 'AZN', flag: '🇦🇿' },
  { code: 'BH', name_en: 'Bahrain', name_he: 'בחריין', currency: 'BHD', flag: '🇧🇭' },
  { code: 'BD', name_en: 'Bangladesh', name_he: 'בנגלדש', currency: 'BDT', flag: '🇧🇩' },
  { code: 'BT', name_en: 'Bhutan', name_he: 'בהוטן', currency: 'BTN', flag: '🇧🇹' },
  { code: 'BN', name_en: 'Brunei', name_he: 'ברוניי', currency: 'BND', flag: '🇧🇳' },
  { code: 'KH', name_en: 'Cambodia', name_he: 'קמבודיה', currency: 'KHR', flag: '🇰🇭' },
  { code: 'CN', name_en: 'China', name_he: 'סין', currency: 'CNY', flag: '🇨🇳' },
  { code: 'HK', name_en: 'Hong Kong', name_he: 'הונג קונג', currency: 'HKD', flag: '🇭🇰' },
  { code: 'ID', name_en: 'Indonesia', name_he: 'אינדונזיה', currency: 'IDR', flag: '🇮🇩' },
  { code: 'IR', name_en: 'Iran', name_he: 'איראן', currency: 'IRR', flag: '🇮🇷' },
  { code: 'IQ', name_en: 'Iraq', name_he: 'עיראק', currency: 'IQD', flag: '🇮🇶' },
  { code: 'JO', name_en: 'Jordan', name_he: 'ירדן', currency: 'JOD', flag: '🇯🇴' },
  { code: 'KZ', name_en: 'Kazakhstan', name_he: 'קזחסטן', currency: 'KZT', flag: '🇰🇿' },
  { code: 'KW', name_en: 'Kuwait', name_he: 'כווית', currency: 'KWD', flag: '🇰🇼' },
  { code: 'KG', name_en: 'Kyrgyzstan', name_he: 'קירגיזסטן', currency: 'KGS', flag: '🇰🇬' },
  { code: 'LA', name_en: 'Laos', name_he: 'לאוס', currency: 'LAK', flag: '🇱🇦' },
  { code: 'LB', name_en: 'Lebanon', name_he: 'לבנון', currency: 'LBP', flag: '🇱🇧' },
  { code: 'MO', name_en: 'Macau', name_he: 'מקאו', currency: 'MOP', flag: '🇲🇴' },
  { code: 'MY', name_en: 'Malaysia', name_he: 'מלזיה', currency: 'MYR', flag: '🇲🇾' },
  { code: 'MV', name_en: 'Maldives', name_he: 'מלדיביים', currency: 'MVR', flag: '🇲🇻' },
  { code: 'MN', name_en: 'Mongolia', name_he: 'מונגוליה', currency: 'MNT', flag: '🇲🇳' },
  { code: 'MM', name_en: 'Myanmar', name_he: 'מיאנמר', currency: 'MMK', flag: '🇲🇲' },
  { code: 'NP', name_en: 'Nepal', name_he: 'נפאל', currency: 'NPR', flag: '🇳🇵' },
  { code: 'KP', name_en: 'North Korea', name_he: 'צפון קוריאה', currency: 'KPW', flag: '🇰🇵' },
  { code: 'OM', name_en: 'Oman', name_he: 'עומאן', currency: 'OMR', flag: '🇴🇲' },
  { code: 'PK', name_en: 'Pakistan', name_he: 'פקיסטן', currency: 'PKR', flag: '🇵🇰' },
  { code: 'PS', name_en: 'Palestine', name_he: 'פלסטין', currency: 'ILS', flag: '🇵🇸' },
  { code: 'PH', name_en: 'Philippines', name_he: 'פיליפינים', currency: 'PHP', flag: '🇵🇭' },
  { code: 'QA', name_en: 'Qatar', name_he: 'קטאר', currency: 'QAR', flag: '🇶🇦' },
  { code: 'SA', name_en: 'Saudi Arabia', name_he: 'ערב הסעודית', currency: 'SAR', flag: '🇸🇦' },
  { code: 'KR', name_en: 'South Korea', name_he: 'דרום קוריאה', currency: 'KRW', flag: '🇰🇷' },
  { code: 'LK', name_en: 'Sri Lanka', name_he: 'סרי לנקה', currency: 'LKR', flag: '🇱🇰' },
  { code: 'SY', name_en: 'Syria', name_he: 'סוריה', currency: 'SYP', flag: '🇸🇾' },
  { code: 'TW', name_en: 'Taiwan', name_he: 'טייוואן', currency: 'TWD', flag: '🇹🇼' },
  { code: 'TJ', name_en: 'Tajikistan', name_he: 'טג׳יקיסטן', currency: 'TJS', flag: '🇹🇯' },
  { code: 'TM', name_en: 'Turkmenistan', name_he: 'טורקמניסטן', currency: 'TMT', flag: '🇹🇲' },
  { code: 'UZ', name_en: 'Uzbekistan', name_he: 'אוזבקיסטן', currency: 'UZS', flag: '🇺🇿' },
  
  // Americas (A-Z)
  { code: 'AR', name_en: 'Argentina', name_he: 'ארגנטינה', currency: 'ARS', flag: '🇦🇷' },
  { code: 'BS', name_en: 'Bahamas', name_he: 'בהאמה', currency: 'BSD', flag: '🇧🇸' },
  { code: 'BB', name_en: 'Barbados', name_he: 'ברבדוס', currency: 'BBD', flag: '🇧🇧' },
  { code: 'BZ', name_en: 'Belize', name_he: 'בליז', currency: 'BZD', flag: '🇧🇿' },
  { code: 'BO', name_en: 'Bolivia', name_he: 'בוליביה', currency: 'BOB', flag: '🇧🇴' },
  { code: 'BR', name_en: 'Brazil', name_he: 'ברזיל', currency: 'BRL', flag: '🇧🇷' },
  { code: 'CL', name_en: 'Chile', name_he: 'צ׳ילה', currency: 'CLP', flag: '🇨🇱' },
  { code: 'CO', name_en: 'Colombia', name_he: 'קולומביה', currency: 'COP', flag: '🇨🇴' },
  { code: 'CR', name_en: 'Costa Rica', name_he: 'קוסטה ריקה', currency: 'CRC', flag: '🇨🇷' },
  { code: 'CU', name_en: 'Cuba', name_he: 'קובה', currency: 'CUP', flag: '🇨🇺' },
  { code: 'DO', name_en: 'Dominican Republic', name_he: 'הרפובליקה הדומיניקנית', currency: 'DOP', flag: '🇩🇴' },
  { code: 'EC', name_en: 'Ecuador', name_he: 'אקוודור', currency: 'USD', flag: '🇪🇨' },
  { code: 'SV', name_en: 'El Salvador', name_he: 'אל סלבדור', currency: 'USD', flag: '🇸🇻' },
  { code: 'GT', name_en: 'Guatemala', name_he: 'גואטמלה', currency: 'GTQ', flag: '🇬🇹' },
  { code: 'HT', name_en: 'Haiti', name_he: 'האיטי', currency: 'HTG', flag: '🇭🇹' },
  { code: 'HN', name_en: 'Honduras', name_he: 'הונדורס', currency: 'HNL', flag: '🇭🇳' },
  { code: 'JM', name_en: 'Jamaica', name_he: 'ג׳מייקה', currency: 'JMD', flag: '🇯🇲' },
  { code: 'NI', name_en: 'Nicaragua', name_he: 'ניקרגואה', currency: 'NIO', flag: '🇳🇮' },
  { code: 'PA', name_en: 'Panama', name_he: 'פנמה', currency: 'PAB', flag: '🇵🇦' },
  { code: 'PY', name_en: 'Paraguay', name_he: 'פרגוואי', currency: 'PYG', flag: '🇵🇾' },
  { code: 'PE', name_en: 'Peru', name_he: 'פרו', currency: 'PEN', flag: '🇵🇪' },
  { code: 'TT', name_en: 'Trinidad and Tobago', name_he: 'טרינידד וטובגו', currency: 'TTD', flag: '🇹🇹' },
  { code: 'UY', name_en: 'Uruguay', name_he: 'אורוגוואי', currency: 'UYU', flag: '🇺🇾' },
  { code: 'VE', name_en: 'Venezuela', name_he: 'ונצואלה', currency: 'VES', flag: '🇻🇪' },
  
  // Africa (A-Z)
  { code: 'DZ', name_en: 'Algeria', name_he: 'אלג׳יריה', currency: 'DZD', flag: '🇩🇿' },
  { code: 'AO', name_en: 'Angola', name_he: 'אנגולה', currency: 'AOA', flag: '🇦🇴' },
  { code: 'BJ', name_en: 'Benin', name_he: 'בנין', currency: 'XOF', flag: '🇧🇯' },
  { code: 'BW', name_en: 'Botswana', name_he: 'בוצוואנה', currency: 'BWP', flag: '🇧🇼' },
  { code: 'CM', name_en: 'Cameroon', name_he: 'קמרון', currency: 'XAF', flag: '🇨🇲' },
  { code: 'EG', name_en: 'Egypt', name_he: 'מצרים', currency: 'EGP', flag: '🇪🇬' },
  { code: 'ET', name_en: 'Ethiopia', name_he: 'אתיופיה', currency: 'ETB', flag: '🇪🇹' },
  { code: 'GH', name_en: 'Ghana', name_he: 'גאנה', currency: 'GHS', flag: '🇬🇭' },
  { code: 'KE', name_en: 'Kenya', name_he: 'קניה', currency: 'KES', flag: '🇰🇪' },
  { code: 'LY', name_en: 'Libya', name_he: 'לוב', currency: 'LYD', flag: '🇱🇾' },
  { code: 'MA', name_en: 'Morocco', name_he: 'מרוקו', currency: 'MAD', flag: '🇲🇦' },
  { code: 'MZ', name_en: 'Mozambique', name_he: 'מוזמביק', currency: 'MZN', flag: '🇲🇿' },
  { code: 'NA', name_en: 'Namibia', name_he: 'נמיביה', currency: 'NAD', flag: '🇳🇦' },
  { code: 'NG', name_en: 'Nigeria', name_he: 'ניגריה', currency: 'NGN', flag: '🇳🇬' },
  { code: 'RW', name_en: 'Rwanda', name_he: 'רואנדה', currency: 'RWF', flag: '🇷🇼' },
  { code: 'SN', name_en: 'Senegal', name_he: 'סנגל', currency: 'XOF', flag: '🇸🇳' },
  { code: 'ZA', name_en: 'South Africa', name_he: 'דרום אפריקה', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'SD', name_en: 'Sudan', name_he: 'סודן', currency: 'SDG', flag: '🇸🇩' },
  { code: 'TZ', name_en: 'Tanzania', name_he: 'טנזניה', currency: 'TZS', flag: '🇹🇿' },
  { code: 'TN', name_en: 'Tunisia', name_he: 'תוניסיה', currency: 'TND', flag: '🇹🇳' },
  { code: 'UG', name_en: 'Uganda', name_he: 'אוגנדה', currency: 'UGX', flag: '🇺🇬' },
  { code: 'ZM', name_en: 'Zambia', name_he: 'זמביה', currency: 'ZMW', flag: '🇿🇲' },
  { code: 'ZW', name_en: 'Zimbabwe', name_he: 'זימבבואה', currency: 'ZWL', flag: '🇿🇼' },
  
  // Oceania (A-Z)
  { code: 'FJ', name_en: 'Fiji', name_he: 'פיג׳י', currency: 'FJD', flag: '🇫🇯' },
  { code: 'NZ', name_en: 'New Zealand', name_he: 'ניו זילנד', currency: 'NZD', flag: '🇳🇿' },
  { code: 'PG', name_en: 'Papua New Guinea', name_he: 'פפואה גינאה החדשה', currency: 'PGK', flag: '🇵🇬' },
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

