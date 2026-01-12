"use client"

import React from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      <button
        onClick={() => setLocale('en')}
        className={`
          flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all
          ${locale === 'en'
            ? 'bg-white text-sky-600 shadow-sm ring-1 ring-sky-200'
            : 'text-slate-600 hover:text-slate-900'
          }
        `}
      >
        <span className="text-base">🇺🇸</span>
        <span>EN</span>
      </button>
      <button
        onClick={() => setLocale('he')}
        className={`
          flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all
          ${locale === 'he'
            ? 'bg-white text-sky-600 shadow-sm ring-1 ring-sky-200'
            : 'text-slate-600 hover:text-slate-900'
          }
        `}
      >
        <span className="text-base">🇮🇱</span>
        <span>HE</span>
      </button>
    </div>
  );
}

