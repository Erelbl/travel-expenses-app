/**
 * Country utilities (backward compatibility layer)
 * Re-exports from countries.data.ts for existing code
 */

import { COUNTRIES_DATA } from './countries.data';

// For backward compatibility with existing code
export const COUNTRIES = COUNTRIES_DATA.map(c => ({
  code: c.code,
  name: c.name_en, // Default to English for backward compatibility
  flag: c.flag
}));

// Re-export all functions from countries.data.ts
export {
  type CountryData,
  COUNTRIES_DATA,
  getCountryByCode,
  getCountryName,
  getCountryFlag,
  getCountryOptionLabel,
  getCountryCurrency,
  searchCountries,
  getCountriesByCodes,
  getAllowedCurrencies,
} from './countries.data';

