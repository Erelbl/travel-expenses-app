"use client"

import { Expense } from "@/lib/schemas/expense.schema"
import { Trip } from "@/lib/schemas/trip.schema"
import { formatCurrency } from "@/lib/utils/currency"
import { formatDateShort } from "@/lib/utils/date"
import { getCountryName } from "@/lib/utils/countries.data"
import { getCategoryColors } from "@/lib/utils/categoryColors"
import { getMemberName, canEditExpense } from "@/lib/utils/permissions"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { Pencil } from "lucide-react"

interface ExpenseRowProps {
  expense: Expense
  trip?: Trip // Optional trip for permission checks and member names
  onClick?: () => void
  onEdit?: () => void
}

export function ExpenseRow({ expense, trip, onClick, onEdit }: ExpenseRowProps) {
  const { locale, t } = useI18n()
  const countryName = getCountryName(expense.country, locale)
  const isRtl = locale === 'he'
  const categoryColors = getCategoryColors(expense.category)
  
  // Localized category name
  const categoryName = t(`categories.${expense.category}`)

  // Check if this is a shared trip (multiple members)
  const isSharedTrip = trip && trip.members.length > 1
  
  // Get creator name if in shared trip
  const creatorName = trip ? getMemberName(trip, expense.createdByMemberId) : null
  
  // Check if current user can edit this expense
  const canEdit = trip ? canEditExpense(trip, expense) : true

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.()
  }

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-all border-b border-white/50 last:border-0 ${categoryColors.bg} ${categoryColors.bgHover}`}
      onClick={onClick}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Main content: Country + Details */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {/* Two-line layout for mobile */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Country name */}
            <div 
              className="shrink-0 w-16 text-center"
              title={countryName}
            >
              <span className="text-xs font-semibold text-slate-700 line-clamp-1 leading-tight">
                {countryName}
              </span>
            </div>
            
            {/* Description (merchant or category) */}
            <p className="font-semibold text-slate-900 line-clamp-1 min-w-0">
              {expense.merchant || categoryName}
            </p>
          </div>
          
          {/* Amount - never wraps */}
          <div className="text-end shrink-0">
            <p className="font-bold text-slate-900 whitespace-nowrap tabular-nums">
              {formatCurrency(expense.amount, expense.currency)}
            </p>
            {trip && expense.currency !== trip.baseCurrency && expense.amountInBase && (
              <p className="text-xs text-slate-500 whitespace-nowrap tabular-nums">
                ≈ {formatCurrency(expense.amountInBase, trip.baseCurrency)}
              </p>
            )}
          </div>
        </div>
        
        {/* Meta row: date, category, currency, etc */}
        <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
          <span>{formatDateShort(expense.date, locale)}</span>
          <span className="text-slate-400">•</span>
          <span className={`font-medium ${categoryColors.text}`}>{categoryName}</span>
          {trip && expense.currency !== trip.baseCurrency && (
            <>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{expense.currency}</span>
            </>
          )}
          {isSharedTrip && creatorName && (
            <>
              <span className="text-slate-400">•</span>
              <span>{t("expense.addedBy")} {creatorName}</span>
            </>
          )}
        </div>
        
        {/* Note */}
        {expense.note && (
          <p className="text-xs text-slate-500 line-clamp-2">{expense.note}</p>
        )}
      </div>
      
      {/* Edit button */}
      {onEdit && canEdit && (
        <button
          onClick={handleEditClick}
          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white/60 transition-all shrink-0"
          title={t('common.edit')}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
