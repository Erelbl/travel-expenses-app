"use client"

import { useI18n } from "@/lib/i18n/I18nProvider"

interface FloatingAddButtonProps {
  onClick: () => void
  label?: string
}

/**
 * Floating Action Button (FAB) for quick expense adding
 * - Positioned bottom-right (LTR) or bottom-left (RTL)
 * - Visible on desktop; mobile uses bottom nav
 * - Modern, accessible design with smooth interactions
 */
export function FloatingAddButton({ onClick, label }: FloatingAddButtonProps) {
  const { locale, t } = useI18n()
  const isRTL = locale === 'he'
  const ariaLabel = label || t('dashboard.addExpense')

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        fixed z-40 hidden md:flex
        items-center justify-center
        w-14 h-14
        rounded-full
        bg-gradient-to-br from-sky-500 to-sky-600
        text-white text-3xl font-light
        shadow-lg shadow-sky-500/30
        transition-all duration-200 ease-out
        hover:shadow-xl hover:shadow-sky-500/40 hover:scale-105
        active:scale-95
        focus:outline-none focus:ring-4 focus:ring-sky-400/50 focus:ring-offset-2
        ${isRTL ? 'left-6 bottom-6' : 'right-6 bottom-6'}
      `}
    >
      <span className="leading-none pb-0.5">+</span>
    </button>
  )
}

