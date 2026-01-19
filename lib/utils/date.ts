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

export function getTripDayInfo(startDate: string | null, endDate: string | null): { currentDay: number; totalDays: number } | null {
  if (!startDate || !endDate) return null
  
  const today = getTodayString()
  const start = new Date(startDate)
  const end = new Date(endDate)
  const now = new Date(today)
  
  // If today is before trip start or after trip end, return null
  if (now < start || now > end) return null
  
  const currentDay = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  return { currentDay, totalDays }
}

