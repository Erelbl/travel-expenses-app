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

export function t(key: string, locale: Locale, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = messages[locale];
  
  // Try to get value from current locale
  for (const k of keys) {
    value = value?.[k];
  }
  
  // If found, apply params and return
  if (typeof value === 'string') {
    return applyParams(value, params);
  }
  
  // Fallback to English
  if (locale !== 'en') {
    value = messages.en;
    for (const k of keys) {
      value = value?.[k];
    }
    if (typeof value === 'string') {
      return applyParams(value, params);
    }
  }
  
  // If still not found, return the key itself
  return key;
}

function applyParams(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  
  let result = text;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

