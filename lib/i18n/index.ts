import enMessages from '@/messages/en.json';
import heMessages from '@/messages/he.json';

export type Locale = 'en' | 'he';

const messages: Record<Locale, Record<string, any>> = {
  en: enMessages,
  he: heMessages,
};

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('he') ? 'he' : 'en';
}

export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('locale');
  return (stored === 'en' || stored === 'he') ? stored : null;
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('locale', locale);
}

export function t(key: string, locale: Locale): string {
  const keys = key.split('.');
  let value: any = messages[locale];
  
  // Try to get value from current locale
  for (const k of keys) {
    value = value?.[k];
  }
  
  // If found, return it
  if (typeof value === 'string') return value;
  
  // Fallback to English
  if (locale !== 'en') {
    value = messages.en;
    for (const k of keys) {
      value = value?.[k];
    }
    if (typeof value === 'string') return value;
  }
  
  // If still not found, return the key itself
  return key;
}

