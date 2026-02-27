"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BottomNav } from "@/components/bottom-nav"
import { OfflineBanner } from "@/components/OfflineBanner"
import { Button } from "@/components/ui/button"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Input } from "@/components/ui/input"
import { DatePickerInput } from "@/components/ui/date-picker-input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PassportCard, StampBadge } from "@/components/ui/passport-card"
import { CountrySelect } from "@/components/CountrySelect"
import { AchievementUnlockOverlay } from "@/components/achievements/achievement-unlock-overlay"
import { tripsRepository, expensesRepository, ratesRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { CreateExpense, ExpenseCategory } from "@/lib/schemas/expense.schema"
import { CURRENCIES } from "@/lib/utils/currency"
import { COUNTRIES } from "@/lib/utils/countries"
import { getTodayString } from "@/lib/utils/date"
import { usePreferencesStore } from "@/lib/store/preferences.store"
import { useTripPreferencesStore } from "@/lib/store/trip-preferences.store"
import { 
  getTripAllowedCurrencies,
  getAllowedCurrenciesForPlan,
  getDefaultCurrencyForExpense,
  currencyForCountry
} from "@/lib/utils/countryCurrency"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { getCurrentUserMember, canAddExpense } from "@/lib/utils/permissions"
import { normalizeReceiptImageToJpeg } from "@/lib/utils/normalizeReceiptImage"
import type { AchievementKey } from "@prisma/client"
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

export default function AddExpensePage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const { t, locale } = useI18n()

  const { lastUsedCountry, setLastUsedCountry } = usePreferencesStore()
  const { getLastUsedCurrency, setLastUsedCurrency } = useTripPreferencesStore()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [rateWarning, setRateWarning] = useState(false)
  const [scanningReceipt, setScanningReceipt] = useState(false)
  const [userTouchedCountry, setUserTouchedCountry] = useState(false)
  const [userTouchedCategory, setUserTouchedCategory] = useState(false)
  const [scanHints, setScanHints] = useState<{
    amount?: string
    currency?: string
    date?: string
    merchant?: string
    country?: string
    category?: string
  }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [receiptScanStatus, setReceiptScanStatus] = useState<{
    plan: string
    limit: number
    remaining: number
    used: number
  } | null>(null)
  const [unlockedAchievements, setUnlockedAchievements] = useState<Array<{ key: AchievementKey; level: number }>>([])
  const [showAchievementOverlay, setShowAchievementOverlay] = useState(false)
  // Dedupe: track shown achievements in this session
  const shownAchievementsRef = useRef<Set<string>>(new Set())
  
  // FX Rate state
  const [fxRateStatus, setFxRateStatus] = useState<"checking" | "available" | "unavailable" | "manual">("checking")
  const [fxRate, setFxRate] = useState<number | null>(null)
  const [showManualFxInput, setShowManualFxInput] = useState(false)
  const [manualFxRate, setManualFxRate] = useState("")
  
  const [formState, setFormState] = useState<ExpenseFormState>({
    merchant: "", // What was this for? - First field!
    amount: "",
    currency: "",
    category: "Food" as ExpenseCategory,
    country: lastUsedCountry,
    note: "",
    date: getTodayString(),
    // Smart contextual fields
    numberOfNights: "",
    isFutureExpense: false,
    usageDate: "",
  })

  // Derive effective plan from receipt scan status (already fetched, uses admin override)
  const userPlan = receiptScanStatus?.plan ?? "free"

  // Allowed currencies: plan-aware (free = USD+EUR+baseCurrency; plus/pro = trip currencies)
  const allowedCurrencies = trip
    ? getAllowedCurrenciesForPlan(userPlan, trip.baseCurrency, trip.plannedCountries ?? undefined)
    : []

  // Currencies to show in dropdown - filtered by plan allowlist
  const displayCurrencies = CURRENCIES.filter((c) => allowedCurrencies.includes(c.code))

  // Get trip countries - ONLY these should be selectable
  const tripCountries = trip?.plannedCountries && trip.plannedCountries.length > 0 
    ? trip.plannedCountries 
    : trip?.countries || []
  
  const tripCountriesOptions = COUNTRIES.filter((c) => tripCountries.includes(c.code))

  useEffect(() => {
    loadTrip()
    fetchReceiptScanStatus()
  }, [tripId])

  async function fetchReceiptScanStatus() {
    try {
      const response = await fetch("/api/receipts/status")
      if (response.ok) {
        const data = await response.json()
        setReceiptScanStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch receipt scan status:", error)
    }
  }

  async function loadTrip() {
    try {
      const tripData = await tripsRepository.getTrip(tripId)
      if (!tripData) {
        router.push("/trips")
        return
      }
      setTrip(tripData)
      
      // Check if user can add expenses (viewer cannot)
      if (!canAddExpense(tripData)) {
        toast.error(t('addExpense.noPermission') || "You don't have permission to add expenses")
        router.push(`/trips/${tripId}`)
        return
      }
      
      // Smart default country - ONLY from trip countries
      const tripCountriesList = tripData.plannedCountries && tripData.plannedCountries.length > 0 
        ? tripData.plannedCountries 
        : tripData.countries || []
      
      // Default: last used for this trip (if it's in trip countries), or first trip country
      const defaultCountry = (lastUsedCountry && tripCountriesList.includes(lastUsedCountry))
        ? lastUsedCountry
        : tripCountriesList[0] || "US"
      
      // Smart default currency logic
      let defaultCurrency: string
      
      // Priority 1: Last used currency for this trip
      const lastCurrency = getLastUsedCurrency(tripId)
      if (lastCurrency) {
        defaultCurrency = lastCurrency
      }
      // Priority 2: Currency for default country
      else {
        defaultCurrency = getDefaultCurrencyForExpense(
          defaultCountry,
          tripData.baseCurrency,
          tripData.plannedCountries
        )
      }
      
      setFormState((prev) => ({
        ...prev,
        currency: defaultCurrency,
        country: defaultCountry,
      }))
    } catch (error) {
      console.error("Failed to load trip:", error)
    }
  }

  // Auto-update currency when country changes
  function handleCountryChange(newCountry: string) {
    if (!trip) return
    
    setFormState((prev) => {
      const countryCurrency = currencyForCountry(newCountry)
      
      // If country has a mapped currency and it's in our allowed list, use it
      if (countryCurrency && allowedCurrencies.includes(countryCurrency)) {
        return {
          ...prev,
          country: newCountry,
          currency: countryCurrency,
        }
      }
      
      // Otherwise just update country, keep current currency
      return {
        ...prev,
        country: newCountry,
      }
    })
  }

  // Fetch exchange rate when currency changes
  useEffect(() => {
    if (!trip) return
    fetchExchangeRate()
  }, [formState.currency, trip])

  async function fetchExchangeRate() {
    if (!trip) return
    
    // Same currency = no conversion needed
    if (formState.currency === trip.baseCurrency) {
      setFxRateStatus("available")
      setFxRate(1)
      setRateWarning(false)
      setShowManualFxInput(false)
      return
    }

    setFxRateStatus("checking")
    setRateWarning(false)

    try {
      // Try to fetch from our API route
      const response = await fetch(
        `/api/exchange-rates?base=${formState.currency}&target=${trip.baseCurrency}&date=${formState.date}`
      )

      if (response.ok) {
        const data = await response.json()
        setFxRate(data.rate)
        setFxRateStatus("available")
        
        // Also store in local rates repository for future use
        const currentRates = await ratesRepository.getRates(trip.baseCurrency)
        const updatedRates = {
          ...currentRates?.rates,
          [formState.currency]: data.rate,
        }
        await ratesRepository.setRates(trip.baseCurrency, updatedRates)
      } else {
        // API failed, check local storage
        const rates = await ratesRepository.getRates(trip.baseCurrency)
        if (rates && rates.rates[formState.currency]) {
          setFxRate(rates.rates[formState.currency])
          setFxRateStatus("available")
        } else {
          // No rate available
          setFxRateStatus("unavailable")
          setFxRate(null)
          setShowManualFxInput(false) // Don't show by default
        }
      }
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error)
      
      // Try local storage as fallback
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

  // Handle manual FX rate input
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
        const errorData = await response.json().catch(() => ({}))
        
        // Handle specific entitlement errors
        if (errorData.error?.code === "NO_ACCESS") {
          toast.error("Receipt scanning requires Plus or Pro plan")
          return
        }
        
        if (errorData.error?.code === "LIMIT_REACHED") {
          toast.error(`You've used all ${errorData.error.limit} receipt scans for this year`)
          return
        }
        
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

      // Apply country suggestion only if user has not manually touched country
      if (result.suggestedCountry && !userTouchedCountry) {
        setFormState((prev) => ({ ...prev, country: result.suggestedCountry }))
        newHints.country = t('addExpense.scanDetectedFrom')
      }

      // Apply category suggestion only if user has not manually touched category
      if (result.suggestedCategory && !userTouchedCategory) {
        setFormState((prev) => ({ ...prev, category: result.suggestedCategory as ExpenseCategory }))
        newHints.category = t('addExpense.scanDetectedFrom')
      }

      setScanHints(newHints)

      // Show success or partial success message
      const hasAnyData = result.amount || result.currency || result.date || result.merchant
      if (hasAnyData) {
        toast.success(t('addExpense.scanSuccess'))
        // Refresh receipt scan status after successful scan
        fetchReceiptScanStatus()
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
    if (!trip) return

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
      
      // Get current user for createdByMemberId
      const currentUser = getCurrentUserMember(trip)
      
      const expenseData: CreateExpense = {
        tripId,
        amount,
        currency: formState.currency,
        category: formState.category,
        country: formState.category === 'Flights' ? '' : formState.country, // Flights have no country
        merchant: formState.merchant || undefined,
        note: formState.note || undefined,
        date: formState.date,
        // Smart contextual fields
        numberOfNights: nights,
        isFutureExpense: formState.isFutureExpense || undefined,
        usageDate: formState.isFutureExpense && formState.usageDate ? formState.usageDate : undefined,
        pricePerNight: pricePerNight,
        // Collaboration field
        createdByMemberId: currentUser?.id,
        // Manual FX rate if provided
        manualRateToBase: fxRateStatus === "manual" && fxRate ? fxRate : undefined,
      }

      const response = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      })

      if (!response.ok) {
        throw new Error("Failed to create expense")
      }

      const result = await response.json()
      
      // Save preferences for next time (per-trip and global)
      setLastUsedCurrency(tripId, formState.currency) // Per-trip
      setLastUsedCountry(formState.country) // Global
      
      // If manual FX rate was used, store it for future use
      if (fxRateStatus === "manual" && fxRate) {
        const currentRates = await ratesRepository.getRates(trip.baseCurrency)
        await ratesRepository.setRates(trip.baseCurrency, {
          ...currentRates?.rates,
          [formState.currency]: fxRate,
        })
      }
      
      // Check for newly unlocked achievements - only if server returned them
      if (result.newlyUnlocked && result.newlyUnlocked.length > 0) {
        // Filter out achievements already shown in this session
        const newAchievements = result.newlyUnlocked.filter((ach: { key: AchievementKey; level: number }) => {
          const key = `${ach.key}:${ach.level}`
          return !shownAchievementsRef.current.has(key)
        })
        
        if (newAchievements.length > 0) {
          // Show at most ONE achievement (highest level)
          const highest = newAchievements.sort((a: { key: AchievementKey; level: number }, b: { key: AchievementKey; level: number }) => b.level - a.level)[0]
          const achievementKey = `${highest.key}:${highest.level}`
          shownAchievementsRef.current.add(achievementKey)
          
          setUnlockedAchievements([highest])
          setShowAchievementOverlay(true)
        } else {
          toast.success(t('addExpense.success'))
          router.push(`/trips/${tripId}`)
        }
      } else {
        toast.success(t('addExpense.success'))
        router.push(`/trips/${tripId}`)
      }
    } catch (error) {
      console.error("Failed to create expense:", error)
      setSaveError(true)
    } finally {
      setLoading(false)
    }
  }

  if (!trip) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t('addExpense.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32 md:pb-8" dir={locale === 'he' ? 'rtl' : 'ltr'}>
      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* Mobile Header - Clean and Minimal */}
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
          <h1 className="text-lg font-bold text-slate-900">{t('addExpense.title')}</h1>
          <p className="text-sm text-slate-600">{trip.name}</p>
        </div>
      </div>

      {/* Desktop Header - Clean and Minimal */}
      <div className="hidden px-6 py-8 md:block">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-900">{t('addExpense.title')}</h1>
          <p className="mt-1 text-base text-slate-600">
            {t('addExpense.subtitle')} {trip.name}
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
          {/* Receipt Scanner */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              {t('addExpense.title')}
            </h2>
            <div className="flex items-center gap-2">
              {receiptScanStatus && (
                <div className="text-xs text-slate-600">
                  {receiptScanStatus.plan === "free" ? (
                    <span className="text-amber-600">Plus required</span>
                  ) : receiptScanStatus.limit === Infinity ? (
                    <span className="text-green-600 font-medium">Unlimited</span>
                  ) : (
                    <span className={receiptScanStatus.remaining === 0 ? "text-red-600 font-medium" : "text-slate-600"}>
                      {receiptScanStatus.remaining}/{receiptScanStatus.limit}
                    </span>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleReceiptScan}
                className="hidden"
                disabled={scanningReceipt || (receiptScanStatus?.plan === "free")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanningReceipt || (receiptScanStatus?.plan === "free")}
                className="flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title={receiptScanStatus?.plan === "free" ? "Upgrade to Plus or Pro to scan receipts" : undefined}
              >
                {scanningReceipt ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                {scanningReceipt ? t('addExpense.scanningReceipt') : t('addExpense.scanReceipt')}
              </Button>
            </div>
          </div>

          {/* 1. WHAT WAS THIS FOR? - Purpose/Description */}
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
            <p className="text-xs text-slate-500">
              {t('addExpense.whatForHelp')}
            </p>
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
            
            {/* FX Rate - Only show when there's a problem (manual fallback needed) */}
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

                {/* Manual FX input field */}
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
                    <p className="text-xs text-slate-500">
                      {t('addExpense.fxRateManualHelp', { 
                        from: formState.currency, 
                        to: trip.baseCurrency 
                      })}
                    </p>
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
                    setUserTouchedCategory(true)
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

          {/* 4. COUNTRY - Only trip countries (hidden for flights) */}
          {formState.category !== 'Flights' && (
            <div className="space-y-2">
              <Label htmlFor="country" className="font-semibold text-slate-800">
                {t('addExpense.country')} <span className="text-red-500">*</span>
              </Label>
              {tripCountriesOptions.length === 1 ? (
                // Single country: show as read-only
                <div className="premium-input h-14 bg-slate-50 flex items-center justify-between px-4 text-base font-medium text-slate-700 cursor-not-allowed">
                  <span>{tripCountriesOptions[0].flag} {tripCountriesOptions[0].name}</span>
                  <Badge variant="secondary" className="text-xs">{t('common.only')}</Badge>
                </div>
              ) : (
                // Multiple countries: show searchable selector
                <>
                  <CountrySelect
                    value={formState.country}
                    onChange={(value) => {
                      setUserTouchedCountry(true)
                      handleCountryChange(value)
                      setScanHints((prev) => ({ ...prev, country: undefined }))
                    }}
                    placeholder={t('addExpense.country')}
                    required
                  />
                  {scanHints.country && (
                    <p className="text-xs text-blue-600">
                      💡 {scanHints.country}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {t('addExpense.currencyAutoUpdate')}
                  </p>
                </>
              )}
            </div>
          )}

          {/* 5. DATE */}
          <div className="space-y-2">
            <Label htmlFor="date" className="font-semibold text-slate-800">
              {t('addExpense.date')} <span className="text-red-500">*</span>
            </Label>
            <DatePickerInput
              id="date"
              value={formState.date}
              onChange={(e) => {
                setFormState({ ...formState, date: e.target.value })
                setScanHints((prev) => ({ ...prev, date: undefined }))
              }}
              className="h-14 bg-white text-base font-medium text-slate-900"
              locale={locale}
              required
            />
            {scanHints.date && (
              <p className="text-xs text-blue-600">
                💡 {scanHints.date}
              </p>
            )}
          </div>

          {/* 6. SMART FIELD: Number of Nights (Lodging only) */}
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

          {/* 7. SMART FIELD: Future Expense Checkbox */}
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

          {/* 8. Usage Date (shown only if isFutureExpense is checked) */}
          {formState.isFutureExpense && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="usageDate" className="font-semibold text-slate-800">
                {t('addExpense.usageDate')} <span className="text-red-500">*</span>
              </Label>
              <DatePickerInput
                id="usageDate"
                value={formState.usageDate}
                onChange={(e) =>
                  setFormState({ ...formState, usageDate: e.target.value })
                }
                className="h-14 bg-white text-base font-medium text-slate-900"
                locale={locale}
                required={formState.isFutureExpense}
                min={formState.date}
              />
              <p className="text-xs text-slate-500">
                {t('addExpense.usageDateHelp')}
              </p>
            </div>
          )}

          {/* 9. ADDITIONAL NOTE (Optional) */}
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

      {/* Sticky Bottom Actions for Mobile - With proper spacing */}
      <div className="fixed bottom-16 left-0 right-0 glass-effect border-t border-white/20 p-4 shadow-2xl md:hidden">
        <div className="container mx-auto max-w-2xl space-y-2">
          <p className="text-xs text-slate-600 text-center">
            {t('addExpense.calmNote')}
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
              disabled={loading || rateWarning}
              loading={loading}
              size="xl"
              className="flex-[2] h-14 text-base font-semibold"
            >
              {t('addExpense.save')}
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Desktop Actions - Non-sticky, natural flow */}
      <div className="hidden md:block">
        <div className="container mx-auto max-w-2xl px-4 py-6">
          <p className="text-xs text-slate-600 text-center mb-3">
            {t('addExpense.calmNote')}
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
              disabled={loading || rateWarning}
              loading={loading}
              className="h-12 px-8 text-base font-semibold"
            >
              {t('addExpense.save')}
            </PrimaryButton>
          </div>
        </div>
      </div>

      <BottomNav tripId={tripId} />
      
      {showAchievementOverlay && (
        <AchievementUnlockOverlay
          achievements={unlockedAchievements}
          onClose={() => {
            setShowAchievementOverlay(false)
            toast.success(t('addExpense.success'))
            router.push(`/trips/${tripId}`)
          }}
        />
      )}
    </div>
  )
}
