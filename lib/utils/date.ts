import { Locale } from '@/lib/i18n';

export function formatDate(dateString: string, locale: Locale = 'en'): string {
  const date = new Date(dateString)
  const localeCode = locale === 'he' ? 'he-IL' : 'en-US'
  
  return date.toLocaleDateString(localeCode, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateShort(dateString: string, locale: Locale = 'en'): string {
  const date = new Date(dateString)
  const localeCode = locale === 'he' ? 'he-IL' : 'en-US'
  
  return date.toLocaleDateString(localeCode, {
    month: "short",
    day: "numeric",
  })
}

export function getTodayString(): string {
  const today = new Date()
  return today.toISOString().split("T")[0]
}

export function getDaysBetween(startDate: string, endDate?: string): number {
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date()
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end
}

