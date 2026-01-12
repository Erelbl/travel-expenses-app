"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, detectLocale, getStoredLocale, setStoredLocale, t as translateFn } from './index';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize locale on mount
    const storedLocale = getStoredLocale();
    const initialLocale = storedLocale || detectLocale();
    setLocaleState(initialLocale);
    updateDocumentLocale(initialLocale);
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
    updateDocumentLocale(newLocale);
  };

  const updateDocumentLocale = (loc: Locale) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = loc;
      document.documentElement.dir = loc === 'he' ? 'rtl' : 'ltr';
    }
  };

  const t = (key: string) => translateFn(key, locale);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

