"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { BottomNav } from "@/components/bottom-nav"
import { OfflineBanner } from "@/components/OfflineBanner"
import { Button } from "@/components/ui/button"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { tripsRepository, expensesRepository, ratesRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { Expense, ExpenseCategory } from "@/lib/schemas/expense.schema"
import { CURRENCIES } from "@/lib/utils/currency"
import { COUNTRIES } from "@/lib/utils/countries"
import { 
  getTripAllowedCurrencies, 
  currencyForCountry
} from "@/lib/utils/countryCurrency"
import { useI18n } from "@/lib/i18n/I18nProvider"

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

export default function EditExpensePage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const expenseId = params.expenseId as string
  const { t, locale } = useI18n()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [originalExpense, setOriginalExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  // FX Rate state
  const [fxRateStatus, setFxRateStatus] = useState<"checking" | "available" | "unavailable" | "manual">("checking")
  const [fxRate, setFxRate] = useState<number | null>(null)
  const [showManualFxInput, setShowManualFxInput] = useState(false)
  const [manualFxRate, setManualFxRate] = useState("")
  
  const [formData, setFormData] = useState({
    merchant: "",
    amount: "",
    currency: "",
    category: "Food" as ExpenseCategory,
    country: "",
    note: "",
    date: "",
    numberOfNights: "",
    isFutureExpense: false,
    usageDate: "",
  })

  // Get allowed currencies
  const allowedCurrencies = trip ? getTripAllowedCurrencies(trip.plannedCountries) : []
  const displayCurrencies = CURRENCIES.filter((c) => allowedCurrencies.includes(c.code))

  // Get trip countries
  const tripCountries = trip?.plannedCountries && trip.plannedCountries.length > 0 
    ? trip.plannedCountries 
    : trip?.countries || []
  const tripCountriesOptions = COUNTRIES.filter((c) => tripCountries.includes(c.code))

  useEffect(() => {
    loadData()
  }, [tripId, expenseId])

  async function loadData() {
    try {
      const [tripData, expenseData] = await Promise.all([
        tripsRepository.getTrip(tripId),
        expensesRepository.getExpense(expenseId)
      ])
      
      if (!tripData || !expenseData) {
        router.push(`/trips/${tripId}`)
        return
      }
      
      setTrip(tripData)
      setOriginalExpense(expenseData)
      
      // Pre-fill form with existing expense data - DO NOT override with defaults
      setFormData({
        merchant: expenseData.merchant || "",
        amount: expenseData.amount.toString(),
        currency: expenseData.currency,
        category: expenseData.category,
        country: expenseData.country,
        note: expenseData.note || "",
        date: expenseData.date,
        numberOfNights: expenseData.numberOfNights?.toString() || "",
        isFutureExpense: expenseData.isFutureExpense || false,
        usageDate: expenseData.usageDate || "",
      })
      
      // Set FX rate from original if available
      if (expenseData.fxRateUsed) {
        setFxRate(expenseData.fxRateUsed)
        setFxRateStatus("available")
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      router.push(`/trips/${tripId}`)
    } finally {
      setInitialLoading(false)
    }
  }

  // Auto-update currency when country changes
  function handleCountryChange(newCountry: string) {
    if (!trip) return
    
    setFormData((prev) => {
      const countryCurrency = currencyForCountry(newCountry)
      
      if (countryCurrency && allowedCurrencies.includes(countryCurrency)) {
        return {
          ...prev,
          country: newCountry,
          currency: countryCurrency,
        }
      }
      
      return {
        ...prev,
        country: newCountry,
      }
    })
  }

  // Fetch exchange rate when currency or date changes
  useEffect(() => {
    if (!trip || initialLoading) return
    fetchExchangeRate()
  }, [formData.currency, formData.date, trip, initialLoading])

  async function fetchExchangeRate() {
    if (!trip) return
    
    if (formData.currency === trip.baseCurrency) {
      setFxRateStatus("available")
      setFxRate(1)
      setShowManualFxInput(false)
      return
    }

    setFxRateStatus("checking")

    try {
      const response = await fetch(
        `/api/exchange-rates?base=${formData.currency}&target=${trip.baseCurrency}&date=${formData.date}`
      )

      if (response.ok) {
        const data = await response.json()
        setFxRate(data.rate)
        setFxRateStatus("available")
        
        const currentRates = await ratesRepository.getRates(trip.baseCurrency)
        const updatedRates = {
          ...currentRates?.rates,
          [formData.currency]: data.rate,
        }
        await ratesRepository.setRates(trip.baseCurrency, updatedRates)
      } else {
        const rates = await ratesRepository.getRates(trip.baseCurrency)
        if (rates && rates.rates[formData.currency]) {
          setFxRate(rates.rates[formData.currency])
          setFxRateStatus("available")
        } else {
          setFxRateStatus("unavailable")
          setFxRate(null)
          setShowManualFxInput(false)
        }
      }
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error)
      
      try {
        const rates = await ratesRepository.getRates(trip.baseCurrency)
        if (rates && rates.rates[formData.currency]) {
          setFxRate(rates.rates[formData.currency])
          setFxRateStatus("available")
        } else {
          setFxRateStatus("unavailable")
          setFxRate(null)
        }
      } catch {
        setFxRateStatus("unavailable")
        setFxRate(null)
      }
    }
  }

  function handleManualFxRateChange(value: string) {
    setManualFxRate(value)
    const rate = parseFloat(value)
    if (!isNaN(rate) && rate > 0) {
      setFxRate(rate)
      setFxRateStatus("manual")
    } else {
      if (fxRateStatus === "manual") {
        setFxRateStatus("unavailable")
        setFxRate(null)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!trip || !originalExpense) return

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('addExpense.invalidAmount'))
      return
    }

    setLoading(true)
    setSaveError(false)

    try {
      const nights = formData.numberOfNights ? parseInt(formData.numberOfNights) : undefined
      const pricePerNight = nights && nights > 0 ? amount / nights : undefined
      
      // Determine if we need to recalculate FX
      const needsNewFx = 
        formData.currency !== originalExpense.currency ||
        formData.date !== originalExpense.date ||
        amount !== originalExpense.amount
      
      // Prepare updated expense data
      const updates: Partial<Expense> = {
        amount,
        currency: formData.currency,
        category: formData.category,
        country: formData.country,
        merchant: formData.merchant || undefined,
        note: formData.note || undefined,
        date: formData.date,
        numberOfNights: nights,
        isFutureExpense: formData.isFutureExpense || undefined,
        usageDate: formData.isFutureExpense && formData.usageDate ? formData.usageDate : undefined,
        pricePerNight: pricePerNight,
      }
      
      // Recalculate conversion if needed
      if (needsNewFx) {
        if (formData.currency === trip.baseCurrency) {
          updates.fxRateUsed = 1
          updates.convertedAmount = amount
          updates.amountInBase = amount
          updates.fxRateDate = formData.date
          updates.fxRateSource = "auto"
        } else if (fxRate) {
          updates.fxRateUsed = fxRate
          updates.convertedAmount = amount * fxRate
          updates.amountInBase = amount * fxRate
          updates.fxRateDate = formData.date
          updates.fxRateSource = fxRateStatus === "manual" ? "manual" : "auto"
        }
      }

      await expensesRepository.updateExpense(expenseId, updates)
      
      // Store manual FX rate for future use
      if (fxRateStatus === "manual" && fxRate) {
        const currentRates = await ratesRepository.getRates(trip.baseCurrency)
        await ratesRepository.setRates(trip.baseCurrency, {
          ...currentRates?.rates,
          [formData.currency]: fxRate,
        })
      }
      
      toast.success(t('editExpense.success'))
      router.push(`/trips/${tripId}`)
    } catch (error) {
      console.error("Failed to update expense:", error)
      setSaveError(true)
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading || !trip || !originalExpense) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32 md:pb-8" dir={locale === 'he' ? 'rtl' : 'ltr'}>
      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* Mobile Header */}
      <div className="sticky top-0 z-20 flex items-center gap-4 glass-effect border-b border-white/20 p-4 shadow-lg md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-slate-900 hover:bg-white/30"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t('editExpense.title')}</h1>
          <p className="text-sm text-slate-600">{trip.name}</p>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden px-6 py-8 md:block">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-900">{t('editExpense.title')}</h1>
          <p className="mt-1 text-base text-slate-600">
            {t('editExpense.subtitle')} {trip.name}
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Save Error Banner */}
        {saveError && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-rose-900 mb-1">
              {t('common.saveFailed')}
            </p>
            <p className="text-xs text-rose-700">
              {t('common.saveFailedMessage')}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. WHAT WAS THIS FOR? */}
          <div className="space-y-2">
            <Label htmlFor="merchant" className="font-semibold text-slate-800">
              {t('addExpense.whatFor')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="merchant"
              placeholder={t('addExpense.whatForPlaceholder')}
              value={formData.merchant}
              onChange={(e) =>
                setFormData({ ...formData, merchant: e.target.value })
              }
              className="premium-input h-14 bg-white text-base font-medium text-slate-900 placeholder:text-slate-400"
              required
              autoFocus
            />
          </div>

          {/* 2. AMOUNT + CURRENCY */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="font-semibold text-slate-800">
              {t('addExpense.amount')} <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-3">
              <Input
                id="amount"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="premium-input h-20 flex-1 bg-white text-4xl font-bold text-slate-900 placeholder:text-slate-300"
                required
              />
              <Select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="premium-input h-20 w-28 bg-white text-lg font-semibold text-slate-900 md:w-32"
                required
              >
                {displayCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code}
                  </option>
                ))}
              </Select>
            </div>
            
            {/* FX Rate warning */}
            {trip && formData.currency !== trip.baseCurrency && fxRateStatus === "unavailable" && (
              <div className="space-y-3">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm font-medium text-amber-800 mb-2">
                    {t('addExpense.fxRateFetchFailed')}
                  </p>
                  <p className="text-xs text-amber-700 mb-3">
                    {t('addExpense.fxRateUnavailable')}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowManualFxInput(!showManualFxInput)}
                    className="text-xs text-amber-800 hover:bg-amber-100"
                  >
                    {showManualFxInput ? "×" : "+"} {t('addExpense.fxRateManualOption')}
                  </Button>
                </div>

                {showManualFxInput && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="manualFxRate" className="font-semibold text-slate-800">
                      {t('addExpense.fxRateManualLabel')}
                    </Label>
                    <Input
                      id="manualFxRate"
                      type="number"
                      step="0.0001"
                      inputMode="decimal"
                      placeholder={t('addExpense.fxRateManualPlaceholder')}
                      value={manualFxRate}
                      onChange={(e) => handleManualFxRateChange(e.target.value)}
                      className="premium-input h-14 bg-white text-base font-medium text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. CATEGORY */}
          <div className="space-y-2">
            <Label className="font-semibold text-slate-800">
              {t('addExpense.category')} <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFormData({ ...formData, category })}
                  className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    formData.category === category
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {t(`categories.${category}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 4. COUNTRY */}
          <div className="space-y-2">
            <Label htmlFor="country" className="font-semibold text-slate-800">
              {t('addExpense.country')} <span className="text-red-500">*</span>
            </Label>
            {tripCountriesOptions.length === 1 ? (
              <div className="premium-input h-14 bg-slate-50 flex items-center justify-between px-4 text-base font-medium text-slate-700 cursor-not-allowed">
                <span>{tripCountriesOptions[0].flag} {tripCountriesOptions[0].name}</span>
                <Badge variant="secondary" className="text-xs">{t('common.only')}</Badge>
              </div>
            ) : (
              <Select
                id="country"
                value={formData.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="premium-input h-14 bg-white text-base font-medium text-slate-900"
                required
              >
                {tripCountriesOptions.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* 5. DATE */}
          <div className="space-y-2">
            <Label htmlFor="date" className="font-semibold text-slate-800">
              {t('addExpense.date')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="premium-input h-14 bg-white text-base font-medium text-slate-900"
              required
            />
          </div>

          {/* 6. Number of Nights (Lodging only) */}
          {formData.category === "Lodging" && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="numberOfNights" className="font-semibold text-slate-800">
                {t('addExpense.numberOfNights')}
              </Label>
              <Input
                id="numberOfNights"
                type="number"
                min="1"
                step="1"
                placeholder={t('addExpense.numberOfNightsPlaceholder')}
                value={formData.numberOfNights}
                onChange={(e) =>
                  setFormData({ ...formData, numberOfNights: e.target.value })
                }
                className="premium-input h-14 bg-white text-base font-medium text-slate-900 placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-500">
                {t('addExpense.numberOfNightsHelp')}
              </p>
            </div>
          )}

          {/* 7. Future Expense Checkbox */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.isFutureExpense}
                onChange={(e) =>
                  setFormData({ ...formData, isFutureExpense: e.target.checked, usageDate: e.target.checked ? formData.usageDate : "" })
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all"
              />
              <div className="flex-1">
                <span className="text-base font-medium text-slate-800 group-hover:text-slate-900 transition-colors">
                  {t('addExpense.isFutureExpense')}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  {t('addExpense.isFutureExpenseHelp')}
                </p>
              </div>
            </label>
          </div>

          {/* 8. Usage Date */}
          {formData.isFutureExpense && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="usageDate" className="font-semibold text-slate-800">
                {t('addExpense.usageDate')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="usageDate"
                type="date"
                value={formData.usageDate}
                onChange={(e) =>
                  setFormData({ ...formData, usageDate: e.target.value })
                }
                className="premium-input h-14 bg-white text-base font-medium text-slate-900"
                required={formData.isFutureExpense}
                min={formData.date}
              />
              <p className="text-xs text-slate-500">
                {t('addExpense.usageDateHelp')}
              </p>
            </div>
          )}

          {/* 9. NOTE */}
          <div className="space-y-2">
            <Label htmlFor="note" className="font-semibold text-slate-800">
              {t('addExpense.notes')}
            </Label>
            <Input
              id="note"
              placeholder={t('addExpense.notesPlaceholder')}
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              className="premium-input h-14 bg-white text-base font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </form>
      </div>

      {/* Sticky Bottom Actions for Mobile */}
      <div className="fixed bottom-16 left-0 right-0 glass-effect border-t border-white/20 p-4 shadow-2xl md:hidden">
        <div className="container mx-auto max-w-2xl space-y-2">
          <p className="text-xs text-slate-600 text-center">
            {t('editExpense.calmNote')}
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="h-14 flex-1 rounded-xl border-2 border-slate-300 bg-white text-base font-semibold text-slate-900 hover:bg-slate-50"
            >
              {t('common.cancel')}
            </Button>
            <PrimaryButton
              onClick={handleSubmit}
              disabled={loading}
              loading={loading}
              size="xl"
              className="flex-[2] h-14 text-base font-semibold"
            >
              {t('editExpense.save')}
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Desktop Actions */}
      <div className="hidden md:block">
        <div className="container mx-auto max-w-2xl px-4 py-6">
          <p className="text-xs text-slate-600 text-center mb-3">
            {t('editExpense.calmNote')}
          </p>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="h-12 px-6 rounded-xl border-2 border-slate-300 bg-white text-base font-semibold text-slate-900 hover:bg-slate-50"
            >
              {t('common.cancel')}
            </Button>
            <PrimaryButton
              onClick={handleSubmit}
              size="lg"
              disabled={loading}
              loading={loading}
              className="h-12 px-8 text-base font-semibold"
            >
              {t('editExpense.save')}
            </PrimaryButton>
          </div>
        </div>
      </div>

      <BottomNav tripId={tripId} />
    </div>
  )
}

