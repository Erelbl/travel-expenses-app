"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalClose } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PrimaryButton } from "@/components/ui/primary-button"
import { expensesRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { CreateExpense, ExpenseCategory } from "@/lib/schemas/expense.schema"
import { getTodayString } from "@/lib/utils/date"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { getCategoryColors } from "@/lib/utils/categoryColors"
import { getCurrentUserMember } from "@/lib/utils/permissions"

const CATEGORIES: ExpenseCategory[] = [
  "Food",
  "Transport",
  "Flights",
  "Lodging",
  "Activities",
  "Shopping",
  "Health",
  "Other",
]

interface QuickAddExpenseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip: Trip
  defaultCountry: string
  defaultCurrency: string
  onExpenseAdded: () => void
}

export function QuickAddExpense({
  open,
  onOpenChange,
  trip,
  defaultCountry,
  defaultCurrency,
  onExpenseAdded,
}: QuickAddExpenseProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const isRTL = locale === 'he'
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    merchant: "",
    amount: "",
    category: "Food" as ExpenseCategory,
  })

  function resetForm() {
    setFormData({
      merchant: "",
      amount: "",
      category: "Food",
    })
  }

  function handleClose() {
    onOpenChange(false)
    // Reset form after animation completes
    setTimeout(resetForm, 200)
  }

  async function handleSave(redirectToEdit = false) {
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('addExpense.invalidAmount'))
      return
    }

    if (!formData.merchant.trim()) {
      toast.error(t('quickAdd.merchantRequired'))
      return
    }

    setLoading(true)

    try {
      // Get current user for createdByMemberId
      const currentUser = getCurrentUserMember(trip)
      
      const expenseData: CreateExpense = {
        tripId: trip.id,
        amount,
        currency: defaultCurrency,
        category: formData.category,
        country: defaultCountry,
        merchant: formData.merchant.trim(),
        date: getTodayString(),
        createdByMemberId: currentUser?.id,
      }

      const created = await expensesRepository.createExpense(expenseData)
      
      toast.success(t('addExpense.success'))
      onExpenseAdded()
      onOpenChange(false)
      
      // Reset form
      setTimeout(resetForm, 200)
      
      // Redirect to edit if requested
      if (redirectToEdit) {
        router.push(`/trips/${trip.id}/edit-expense/${created.id}`)
      }
    } catch (error) {
      console.error("Failed to create expense:", error)
      toast.error(t('addExpense.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        <ModalHeader>
          <ModalTitle>{t('quickAdd.title')}</ModalTitle>
          <ModalClose onClick={handleClose} />
        </ModalHeader>
        
        <ModalContent className="space-y-6 pb-6">
          {/* What did I spend on? */}
          <div className="space-y-2">
            <Label htmlFor="qa-merchant" className="font-semibold text-slate-800">
              {t('quickAdd.whatFor')}
            </Label>
            <Input
              id="qa-merchant"
              placeholder={t('quickAdd.whatForPlaceholder')}
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="h-12 bg-white text-base font-medium text-slate-900 placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="qa-amount" className="font-semibold text-slate-800">
              {t('addExpense.amount')} ({defaultCurrency})
            </Label>
            <Input
              id="qa-amount"
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="h-14 bg-white text-2xl font-bold text-slate-900 placeholder:text-slate-300"
            />
          </div>

          {/* Category - Compact pills */}
          <div className="space-y-2">
            <Label className="font-semibold text-slate-800">
              {t('addExpense.category')}
            </Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const colors = getCategoryColors(category)
                const isSelected = formData.category === category
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setFormData({ ...formData, category })}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-all
                      ${isSelected
                        ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-current`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }
                    `}
                  >
                    {t(`categories.${category}`)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <PrimaryButton
              onClick={() => handleSave(false)}
              disabled={loading || !formData.merchant.trim() || !formData.amount}
              loading={loading}
              size="lg"
              className="w-full h-12 text-base font-semibold"
            >
              {t('quickAdd.save')}
            </PrimaryButton>
            
            {/* Secondary: Save and add more details */}
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={loading || !formData.merchant.trim() || !formData.amount}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              {t('quickAdd.addMoreDetails')}
            </button>
          </div>
        </ModalContent>
      </div>
    </Modal>
  )
}

