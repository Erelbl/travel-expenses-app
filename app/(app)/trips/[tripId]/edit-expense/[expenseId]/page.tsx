"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Trash2, Camera } from "lucide-react"
import { toast } from "sonner"
import { BottomNav } from "@/components/bottom-nav"
import { OfflineBanner } from "@/components/OfflineBanner"
import { Button } from "@/components/ui/button"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalClose } from "@/components/ui/modal"
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
import { normalizeReceiptImageToJpeg } from "@/lib/utils/normalizeReceiptImage"

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

interface ExpenseFormState {
  merchant: string
  amount: string
  currency: string
  category: ExpenseCategory
  country: string
  note: string
  date: string
  numberOfNights: string
  isFutureExpense: boolean
  usageDate: string
}

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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [scanningReceipt, setScanningReceipt] = useState(false)
  const [scanHints, setScanHints] = useState<{
    amount?: string
    currency?: string
    date?: string
    merchant?: string
    country?: string
    category?: string
  }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // FX Rate state
  const [fxRateStatus, setFxRateStatus] = useState<"checking" | "available" | "unavailable" | "manual">("checking")
  const [fxRate, setFxRate] = useState<number | null>(null)
  const [showManualFxInput, setShowManualFxInput] = useState(false)
  const [manualFxRate, setManualFxRate] = useState("")
  
  const [formState, setFormState] = useState<ExpenseFormState>({
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
      setFormState({
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
    
    setFormState((prev) => {
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
  }, [formState.currency, formState.date, trip, initialLoading])

  async function fetchExchangeRate() {
    if (!trip) return
    
    if (formState.currency === trip.baseCurrency) {
      setFxRateStatus("available")
      setFxRate(1)
      setShowManualFxInput(false)
      return
    }

    setFxRateStatus("checking")

    try {
      const response = await fetch(
        `/api/exchange-rates?base=${formState.currency}&target=${trip.baseCurrency}&date=${formState.date}`
      )

      if (response.ok) {
        const data = await response.json()
        setFxRate(data.rate)
        setFxRateStatus("available")
        
        const currentRates = await ratesRepository.getRates(trip.baseCurrency)
        const updatedRates = {
          ...currentRates?.rates,
          [formState.currency]: data.rate,
        }
        await ratesRepository.setRates(trip.baseCurrency, updatedRates)
      } else {
        const rates = await ratesRepository.getRates(trip.baseCurrency)
        if (rates && rates.rates[formState.currency]) {
          setFxRate(rates.rates[formState.currency])
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
        if (rates && rates.rates[formState.currency]) {
          setFxRate(rates.rates[formState.currency])
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

  async function handleReceiptScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setScanningReceipt(true)
    setScanHints({})

    try {
      // Normalize image to JPEG for reliable extraction
      const normalizedFile = await normalizeReceiptImageToJpeg(file)
      
      const uploadFormData = new FormData()
      uploadFormData.append("image", normalizedFile)

      const response = await fetch("/api/receipts/extract", {
        method: "POST",
        body: uploadFormData,
      })

      if (!response.ok) {
        throw new Error("Failed to extract receipt data")
      }

      const result = await response.json()

      // Update form fields with extracted data
      const newHints: typeof scanHints = {}

      if (result.amount && result.confidence.amount > 0) {
        setFormState((prev) => ({ ...prev, amount: result.amount.toString() }))
        if (result.confidence.amount < 0.7) {
          newHints.amount = t('addExpense.scanLowConfidence')
        } else {
          newHints.amount = t('addExpense.scanDetectedFrom')
        }
      }

      if (result.currency && result.confidence.currency > 0 && allowedCurrencies.includes(result.currency)) {
        setFormState((prev) => ({ ...prev, currency: result.currency }))
        if (result.confidence.currency < 0.7) {
          newHints.currency = t('addExpense.scanLowConfidence')
        } else {
          newHints.currency = t('addExpense.scanDetectedFrom')
        }
      }

      if (result.date && result.confidence.date > 0) {
        setFormState((prev) => ({ ...prev, date: result.date }))
        if (result.confidence.date < 0.7) {
          newHints.date = t('addExpense.scanLowConfidence')
        } else {
          newHints.date = t('addExpense.scanDetectedFrom')
        }
      }

      if (result.merchant && result.confidence.merchant > 0) {
        setFormState((prev) => ({ ...prev, merchant: result.merchant }))
        if (result.confidence.merchant < 0.7) {
          newHints.merchant = t('addExpense.scanLowConfidence')
        } else {
          newHints.merchant = t('addExpense.scanDetectedFrom')
        }
      }

      // Apply country suggestion only if country is not yet set
      if (result.suggestedCountry && !formState.country) {
        setFormState((prev) => ({ ...prev, country: result.suggestedCountry }))
        newHints.country = t('addExpense.scanDetectedFrom')
      }

      // Apply category suggestion only if field is empty
      if (result.suggestedCategory && !formState.category) {
        setFormState((prev) => ({ ...prev, category: result.suggestedCategory as ExpenseCategory }))
        newHints.category = t('addExpense.scanDetectedFrom')
      }

      setScanHints(newHints)

      // Show success or partial success message
      const hasAnyData = result.amount || result.currency || result.date || result.merchant
      if (hasAnyData) {
        toast.success(t('addExpense.scanSuccess'))
      } else {
        toast.error(t('addExpense.scanFailed'))
      }
    } catch (error) {
      console.error("Receipt scan error:", error)
      toast.error(t('addExpense.scanFailed'))
    } finally {
      setScanningReceipt(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!trip || !originalExpense) return

    const amount = parseFloat(formState.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('addExpense.invalidAmount'))
      return
    }

    setLoading(true)
    setSaveError(false)

    try {
      const nights = formState.numberOfNights ? parseInt(formState.numberOfNights) : undefined
      const pricePerNight = nights && nights > 0 ? amount / nights : undefined
      
      // Determine if we need to recalculate FX
      const needsNewFx = 
        formState.currency !== originalExpense.currency ||
        formState.date !== originalExpense.date ||
        amount !== originalExpense.amount
      
      // Prepare updated expense data
      const updates: Partial<Expense> = {
        amount,
        currency: formState.currency,
        category: formState.category,
        country: formState.category === 'Flights' ? '' : formState.country, // Flights have no country
        merchant: formState.merchant || undefined,
        note: formState.note || undefined,
        date: formState.date,
        numberOfNights: nights,
        isFutureExpense: formState.isFutureExpense || undefined,
        usageDate: formState.isFutureExpense && formState.usageDate ? formState.usageDate : undefined,
        pricePerNight: pricePerNight,
      }
      
      // Recalculate conversion if needed
      if (needsNewFx) {
        if (formState.currency === trip.baseCurrency) {
          updates.fxRateUsed = 1
          updates.convertedAmount = amount
          updates.amountInBase = amount
          updates.fxRateDate = formState.date
          updates.fxRateSource = "auto"
        } else if (fxRate) {
          updates.fxRateUsed = fxRate
          updates.convertedAmount = amount * fxRate
          updates.amountInBase = amount * fxRate
          updates.fxRateDate = formState.date
          updates.fxRateSource = fxRateStatus === "manual" ? "manual" : "auto"
        }
      }

      await expensesRepository.updateExpense(expenseId, updates)
      
      // Store manual FX rate for future use
      if (fxRateStatus === "manual" && fxRate) {
        const currentRates = await ratesRepository.getRates(trip.baseCurrency)
        await ratesRepository.setRates(trip.baseCurrency, {
          ...currentRates?.rates,
          [formState.currency]: fxRate,
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

  async function handleDelete() {
    if (!originalExpense || deleting) return

    setDeleting(true)

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete expense')
      }

      toast.success(t('editExpense.deleteSuccess'))
      setShowDeleteModal(false)
      router.push(`/trips/${tripId}`)
    } catch (error) {
      console.error("Failed to delete expense:", error)
      toast.error(t('editExpense.deleteError'))
    } finally {
      setDeleting(false)
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
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900">{t('editExpense.title')}</h1>
          <p className="text-sm text-slate-600">{trip.name}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDeleteModal(true)}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          title={t('common.delete')}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Desktop Header */}
      <div className="hidden px-6 py-8 md:block">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t('editExpense.title')}</h1>
              <p className="mt-1 text-base text-slate-600">
                {t('editExpense.subtitle')} {trip.name}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteModal(true)}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              title={t('common.delete')}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
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
          {/* Receipt Scanner */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              {t('editExpense.title')}
            </h2>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleReceiptScan}
                className="hidden"
                disabled={scanningReceipt}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanningReceipt}
                className="flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                <Camera className="h-4 w-4" />
                {scanningReceipt ? t('addExpense.scanningReceipt') : t('addExpense.scanReceipt')}
              </Button>
            </div>
          </div>

          {/* 1. WHAT WAS THIS FOR? */}
          <div className="space-y-2">
            <Label htmlFor="merchant" className="font-semibold text-slate-800">
              {t('addExpense.whatFor')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="merchant"
              placeholder={t('addExpense.whatForPlaceholder')}
              value={formState.merchant}
              onChange={(e) => {
                setFormState({ ...formState, merchant: e.target.value })
                setScanHints((prev) => ({ ...prev, merchant: undefined }))
              }}
              className="premium-input h-14 bg-white text-base font-medium text-slate-900 placeholder:text-slate-400"
              required
              autoFocus
            />
            {scanHints.merchant && (
              <p className="text-xs text-blue-600">
                💡 {scanHints.merchant}
              </p>
            )}
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
                value={formState.amount}
                onChange={(e) => {
                  setFormState({ ...formState, amount: e.target.value })
                  setScanHints((prev) => ({ ...prev, amount: undefined }))
                }}
                className="premium-input h-20 flex-1 bg-white text-4xl font-bold text-slate-900 placeholder:text-slate-300"
                required
              />
              <Select
                value={formState.currency}
                onChange={(e) => {
                  setFormState({ ...formState, currency: e.target.value })
                  setScanHints((prev) => ({ ...prev, currency: undefined }))
                }}
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
            {(scanHints.amount || scanHints.currency) && (
              <p className="text-xs text-blue-600">
                💡 {scanHints.amount || scanHints.currency}
              </p>
            )}
            
            {/* FX Rate warning */}
            {trip && formState.currency !== trip.baseCurrency && fxRateStatus === "unavailable" && (
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
                  onClick={() => {
                    // Clear country when switching to Flights
                    if (category === 'Flights') {
                      setFormState({ ...formState, category, country: '' })
                    } else {
                      setFormState({ ...formState, category })
                    }
                    setScanHints((prev) => ({ ...prev, category: undefined }))
                  }}
                  className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    formState.category === category
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {t(`categories.${category}`)}
                </button>
              ))}
            </div>
            {scanHints.category && (
              <p className="text-xs text-blue-600">
                💡 {scanHints.category}
              </p>
            )}
          </div>

          {/* 4. COUNTRY - hidden for flights */}
          {formState.category !== 'Flights' && (
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
                  value={formState.country}
                  onChange={(e) => {
                    handleCountryChange(e.target.value)
                    setScanHints((prev) => ({ ...prev, country: undefined }))
                  }}
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
              {scanHints.country && (
                <p className="text-xs text-blue-600">
                  💡 {scanHints.country}
                </p>
              )}
            </div>
          )}

          {/* 5. DATE */}
          <div className="space-y-2">
            <Label htmlFor="date" className="font-semibold text-slate-800">
              {t('addExpense.date')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formState.date}
              onChange={(e) => {
                setFormState({ ...formState, date: e.target.value })
                setScanHints((prev) => ({ ...prev, date: undefined }))
              }}
              className="premium-input h-14 bg-white text-base font-medium text-slate-900"
              required
            />
            {scanHints.date && (
              <p className="text-xs text-blue-600">
                💡 {scanHints.date}
              </p>
            )}
          </div>

          {/* 6. Number of Nights (Lodging only) */}
          {formState.category === "Lodging" && (
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
                value={formState.numberOfNights}
                onChange={(e) =>
                  setFormState({ ...formState, numberOfNights: e.target.value })
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
                checked={formState.isFutureExpense}
                onChange={(e) =>
                  setFormState({ ...formState, isFutureExpense: e.target.checked, usageDate: e.target.checked ? formState.usageDate : "" })
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
          {formState.isFutureExpense && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="usageDate" className="font-semibold text-slate-800">
                {t('addExpense.usageDate')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="usageDate"
                type="date"
                value={formState.usageDate}
                onChange={(e) =>
                  setFormState({ ...formState, usageDate: e.target.value })
                }
                className="premium-input h-14 bg-white text-base font-medium text-slate-900"
                required={formState.isFutureExpense}
                min={formState.date}
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
              value={formState.note}
              onChange={(e) =>
                setFormState({ ...formState, note: e.target.value })
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

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <div dir={locale === 'he' ? 'rtl' : 'ltr'}>
          <ModalHeader>
            <ModalTitle>{t('editExpense.deleteTitle')}</ModalTitle>
            <ModalClose onClick={() => setShowDeleteModal(false)} />
          </ModalHeader>
          <ModalContent>
            <p className="text-sm text-slate-600 mb-6">
              {t('editExpense.deleteMessage')}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? t('common.loading') : t('editExpense.deleteButton')}
              </Button>
            </div>
          </ModalContent>
        </div>
      </Modal>
    </div>
  )
}

