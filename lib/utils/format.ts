/**
 * Formatting utilities for display
 */

import { CURRENCY_SYMBOLS } from './currency';

/**
 * Format money with currency symbol
 */
export function formatMoney(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  
  // Format with appropriate decimal places
  const decimals = ['JPY', 'KRW', 'VND'].includes(currency) ? 0 : 2;
  const formatted = amount.toFixed(decimals);
  
  // Add thousands separators
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${symbol}${parts.join('.')}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | null, locale: string = 'en'): string {
  if (!dateString) return locale === 'he' ? 'לא נקבע' : 'Not set';
  
  const date = new Date(dateString);
  
  if (locale === 'he') {
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date range
 */
export function formatDateRange(
  startDate: string | null, 
  endDate: string | null, 
  locale: string = 'en'
): string {
  if (!startDate && !endDate) return locale === 'he' ? 'תאריכים לא נקבעו' : 'Dates not set';
  if (startDate && !endDate) return `${formatDate(startDate, locale)} - ${locale === 'he' ? 'פתוח' : 'Open'}`;
  if (startDate && endDate) return `${formatDate(startDate, locale)} - ${formatDate(endDate, locale)}`;
  return locale === 'he' ? 'תאריכים לא נקבעו' : 'Dates not set';
}

/**
 * Get days between dates
 */
export function getDaysBetween(startDate: string | null, endDate: string | null): number {
  if (!startDate) return 1; // Return 1 for trips without dates to avoid division by zero
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(1, diffDays + 1); // Include both start and end days, minimum 1
}

/**
 * Format number with compact notation for large numbers
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

