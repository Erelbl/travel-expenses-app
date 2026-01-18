"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Copy, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { tripsRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { ExpenseCategory } from "@/lib/schemas/expense.schema"
import { getTodayString } from "@/lib/utils/date"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { getCurrentUserMember, canAddExpense } from "@/lib/utils/permissions"
import { getTripAllowedCurrencies } from "@/lib/utils/countryCurrency"
import { getCurrencySymbol } from "@/lib/utils/currency"
import { batchAddExpenses, BatchExpenseInput } from "./actions"

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

interface ExpenseRow extends BatchExpenseInput {
  tempId: string
  error?: string
}

export default function BatchAddPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const { t, locale } = useI18n()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(false)
  const [globalDate, setGlobalDate] = useState(getTodayString())
  const [country, setCountry] = useState("")
  const [globalError, setGlobalError] = useState<string | null>(null)

  const [rows, setRows] = useState<ExpenseRow[]>([])
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  useEffect(() => {
    loadTrip()
  }, [tripId])

  async function loadTrip() {
    try {
      const tripData = await tripsRepository.getTrip(tripId)
      if (!tripData) {
        router.push("/trips")
        return
      }
      setTrip(tripData)

      if (!canAddExpense(tripData)) {
        toast.error(t("addExpense.noPermission"))
        router.push(`/trips/${tripId}`)
        return
      }

      const tripCountries =
        tripData.plannedCountries && tripData.plannedCountries.length > 0
          ? tripData.plannedCountries
          : tripData.countries || []
      const defaultCountry = tripData.currentCountry || tripCountries[0] || "US"
      setCountry(defaultCountry)

      // Add initial row with trip's current currency or base currency
      addRow(tripData.currentCurrency || tripData.baseCurrency)
    } catch (error) {
      console.error("Failed to load trip:", error)
    }
  }

  function addRow(defaultCurrency?: string) {
    const currency = defaultCurrency || trip?.currentCurrency || trip?.baseCurrency || "USD"
    setRows((prev) => [
      ...prev,
      {
        tempId: `row-${Date.now()}-${Math.random()}`,
        amount: 0,
        currency,
        category: "Food",
        merchant: "",
        note: "",
        date: globalDate,
      },
    ])
  }

  function removeRow(tempId: string) {
    setRows((prev) => prev.filter((r) => r.tempId !== tempId))
  }

  function updateRow(tempId: string, updates: Partial<ExpenseRow>) {
    setRows((prev) =>
      prev.map((r) => (r.tempId === tempId ? { ...r, ...updates } : r))
    )
  }

  function duplicateRow(tempId: string) {
    const rowToDuplicate = rows.find((r) => r.tempId === tempId)
    if (!rowToDuplicate) return

    const newRow: ExpenseRow = {
      ...rowToDuplicate,
      tempId: `row-${Date.now()}-${Math.random()}`,
      error: undefined,
    }

    setRows((prev) => {
      const index = prev.findIndex((r) => r.tempId === tempId)
      const newRows = [...prev]
      newRows.splice(index + 1, 0, newRow)
      return newRows
    })

    // Focus the description field of the new row after render
    setTimeout(() => {
      const newMerchantInput = inputRefs.current.get(`${newRow.tempId}-merchant`)
      newMerchantInput?.focus()
      newMerchantInput?.select()
    }, 50)
  }

  function clearRow(tempId: string) {
    const defaultCurrency = trip?.currentCurrency || trip?.baseCurrency || "USD"
    updateRow(tempId, {
      amount: 0,
      currency: defaultCurrency,
      category: "Food",
      merchant: "",
      note: "",
      date: globalDate,
      error: undefined,
    })
  }

  function handleKeyDown(e: React.KeyboardEvent, tempId: string, fieldName: string) {
    if (e.key === "Enter" && !e.shiftKey && fieldName === "note") {
      e.preventDefault()
      
      const row = rows.find((r) => r.tempId === tempId)
      if (!row) return

      // Validate row minimally
      if (row.amount <= 0) {
        updateRow(tempId, { error: t("batchAdd.amountRequired") })
        return
      }
      if (!row.merchant.trim()) {
        updateRow(tempId, { error: t("batchAdd.merchantRequired") })
        return
      }

      // Clear error if valid
      if (row.error) {
        updateRow(tempId, { error: undefined })
      }

      // If this is the last row, add a new one
      const rowIndex = rows.findIndex((r) => r.tempId === tempId)
      if (rowIndex === rows.length - 1) {
        addRow()
        // Focus description field of new row after render
        setTimeout(() => {
          const newRows = rows
          if (newRows.length > rowIndex + 1) {
            const nextRowId = rows[rows.length - 1]?.tempId
            if (nextRowId) {
              const nextMerchantInput = inputRefs.current.get(`${nextRowId}-merchant`)
              nextMerchantInput?.focus()
            }
          }
        }, 50)
      }
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!trip) return

    // Clear previous errors
    setGlobalError(null)
    setRows((prev) => prev.map((r) => ({ ...r, error: undefined })))

    // Validation
    const validRows = rows.filter((r) => r.amount > 0 && r.merchant.trim() !== "")
    if (validRows.length === 0) {
      setGlobalError(t("batchAdd.noValidRows"))
      return
    }

    // Check for invalid rows and mark them
    let hasInvalidRows = false
    setRows((prev) =>
      prev.map((r) => {
        if (r.amount <= 0 && r.merchant.trim()) {
          hasInvalidRows = true
          return { ...r, error: t("batchAdd.amountRequired") }
        }
        if (!r.merchant.trim() && r.amount > 0) {
          hasInvalidRows = true
          return { ...r, error: t("batchAdd.merchantRequired") }
        }
        return r
      })
    )

    if (hasInvalidRows) {
      setGlobalError(t("batchAdd.fixErrors"))
      return
    }

    setLoading(true)

    try {
      const result = await batchAddExpenses(
        tripId,
        country,
        validRows
      )

      if (result.success) {
        toast.success(t("batchAdd.success", { count: result.created }))
        router.refresh()
        router.push(`/trips/${tripId}`)
      } else {
        // Handle row-specific errors
        if (result.errors && result.errors.length > 0) {
          const hasSpecificErrors = result.errors.some((e) => e.index >= 0)
          
          if (hasSpecificErrors) {
            // Map errors to rows
            setRows((prev) =>
              prev.map((r, idx) => {
                const error = result.errors?.find((e) => e.index === idx)
                if (error) {
                  return { ...r, error: error.message }
                }
                return r
              })
            )
            setGlobalError(t("batchAdd.someRowsFailed"))
          } else {
            // Generic error
            setGlobalError(result.errors[0].message)
          }
        } else {
          setGlobalError(t("batchAdd.error"))
        }
      }
    } catch (error) {
      console.error("Batch add failed:", error)
      setGlobalError(t("batchAdd.error"))
    } finally {
      setLoading(false)
    }
  }

  if (!trip) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    )
  }

  const allowedCurrencies = getTripAllowedCurrencies(trip.plannedCountries)
  const tripCountries =
    trip.plannedCountries && trip.plannedCountries.length > 0
      ? trip.plannedCountries
      : trip.countries || []

  return (
    <div className="min-h-screen pb-32 md:pb-8" dir={locale === "he" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-4 glass-effect border-b border-white/20 p-4 shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-slate-900 hover:bg-white/30"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            {t("batchAdd.title")}
          </h1>
          <p className="text-sm text-slate-600">{trip.name}</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-6">
        {/* Global Error */}
        {globalError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            <p className="font-medium">{globalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Global Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <h3 className="font-semibold text-slate-900">
              {t("batchAdd.globalSettings")}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="globalDate">{t("addExpense.date")}</Label>
                <Input
                  id="globalDate"
                  type="date"
                  value={globalDate}
                  onChange={(e) => {
                    setGlobalDate(e.target.value)
                    // Update all rows
                    setRows((prev) =>
                      prev.map((r) => ({ ...r, date: e.target.value }))
                    )
                  }}
                  className="h-12 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">{t("addExpense.country")}</Label>
                <Select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-12 bg-white"
                >
                  {tripCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* Expense Rows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                {t("batchAdd.expenses")} ({rows.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addRow()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("batchAdd.addRow")}
              </Button>
            </div>

            {rows.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {t("batchAdd.noRows")}
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map((row, index) => (
                  <div
                    key={row.tempId}
                    className={`bg-white rounded-lg border ${
                      row.error ? "border-red-300" : "border-slate-200"
                    } p-4 space-y-3`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-500">
                        #{index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => duplicateRow(row.tempId)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title={t("batchAdd.duplicate")}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => clearRow(row.tempId)}
                          className="text-slate-500 hover:text-slate-700 transition-colors"
                          title={t("batchAdd.clear")}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(row.tempId)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title={t("batchAdd.removeRow")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Row error */}
                    {row.error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
                        {row.error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Description - First field */}
                      <div className="md:col-span-4">
                        <Input
                          ref={(el) => {
                            if (el) inputRefs.current.set(`${row.tempId}-merchant`, el)
                          }}
                          placeholder={t("batchAdd.description")}
                          value={row.merchant}
                          onChange={(e) =>
                            updateRow(row.tempId, { merchant: e.target.value })
                          }
                          className="h-10"
                          required
                        />
                      </div>

                      {/* Amount - Second field */}
                      <div className="md:col-span-3">
                        <Input
                          ref={(el) => {
                            if (el) inputRefs.current.set(`${row.tempId}-amount`, el)
                          }}
                          type="number"
                          step="0.01"
                          placeholder={t("addExpense.amount")}
                          value={row.amount || ""}
                          onChange={(e) =>
                            updateRow(row.tempId, {
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-10"
                          required
                        />
                      </div>

                      {/* Currency - Third field */}
                      <div className="md:col-span-2">
                        <Select
                          value={row.currency}
                          onChange={(e) =>
                            updateRow(row.tempId, { currency: e.target.value })
                          }
                          className="h-10"
                        >
                          {allowedCurrencies.map((curr) => (
                            <option key={curr} value={curr}>
                              {getCurrencySymbol(curr)} {curr}
                            </option>
                          ))}
                        </Select>
                      </div>

                      {/* Category */}
                      <div className="md:col-span-2">
                        <Select
                          value={row.category}
                          onChange={(e) =>
                            updateRow(row.tempId, {
                              category: e.target.value as ExpenseCategory,
                            })
                          }
                          className="h-10"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {t(`categories.${cat}`).replace(/[🍔🚕✈️🏨🎟️🛍️💊💳]\s*/, "")}
                            </option>
                          ))}
                        </Select>
                      </div>

                      {/* Note (optional) */}
                      <div className="md:col-span-1">
                        <Input
                          placeholder={t("batchAdd.note")}
                          value={row.note}
                          onChange={(e) =>
                            updateRow(row.tempId, { note: e.target.value })
                          }
                          onKeyDown={(e) => handleKeyDown(e, row.tempId, "note")}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 glass-effect border-t border-white/20 p-4 shadow-2xl z-30">
        <div className="container mx-auto flex max-w-4xl gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => addRow()}
            disabled={loading}
            className="h-12 flex-1 rounded-xl border-2 border-slate-300 bg-white font-semibold gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("batchAdd.addRow")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="h-12 flex-1 rounded-xl border-2 border-slate-300 bg-white font-semibold"
          >
            {t("common.cancel")}
          </Button>
          <PrimaryButton
            onClick={handleSubmit}
            disabled={loading || rows.length === 0}
            loading={loading}
            size="xl"
            className="flex-[2] h-12 font-semibold"
          >
            {loading ? t("common.saving") : t("batchAdd.saveAll")} ({rows.filter((r) => r.amount > 0 && r.merchant.trim()).length})
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

