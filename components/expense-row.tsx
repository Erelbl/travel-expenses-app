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
      className={`group flex items-center gap-4 px-5 py-4 cursor-pointer transition-all border-b border-white/50 last:border-0 ${categoryColors.bg} ${categoryColors.bgHover}`}
      onClick={onClick}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Main content: Country + Details */}
      <div className="flex items-center gap-5 flex-1 min-w-0">
        {/* Country name - positioned more centrally, slightly larger */}
        <div 
          className="shrink-0 w-20 text-center"
          title={countryName}
        >
          <span className="text-sm font-semibold text-slate-700 line-clamp-2 leading-tight">
            {countryName}
          </span>
        </div>
        
        {/* Expense details */}
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate">
            {expense.merchant || categoryName}
          </p>
          <div className="flex items-center gap-2.5 text-sm text-slate-600 flex-wrap">
            <span>{formatDateShort(expense.date, locale)}</span>
            <span className="text-slate-400">•</span>
            <span className={`font-medium ${categoryColors.text}`}>{categoryName}</span>
            {expense.currency !== "USD" && (
              <>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{expense.currency}</span>
              </>
            )}
          </div>
          {/* Show "Added by" for shared trips */}
          {isSharedTrip && creatorName && (
            <p className="text-xs text-slate-500">
              {t("expense.addedBy")} {creatorName}
            </p>
          )}
          {expense.note && (
            <p className="text-sm text-slate-500 truncate">{expense.note}</p>
          )}
        </div>
      </div>
      
      {/* Amount + Edit button area */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Edit button - visible on hover, only if user can edit */}
        {onEdit && canEdit && (
          <button
            onClick={handleEditClick}
            className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white/60 transition-all"
            title={t('common.edit')}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        
        {/* Amount */}
        <div className="text-end min-w-[80px]">
          <p className="font-bold text-slate-900">{formatCurrency(expense.amount, expense.currency)}</p>
          {expense.currency !== "USD" && expense.amountInBase && (
            <p className="text-xs text-slate-500">
              ≈ {formatCurrency(expense.amountInBase, "USD")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
