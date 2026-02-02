"use client"

import { useEffect, useState, useMemo } from "react"
import { RefreshCw, ArrowRightLeft, AlertCircle } from "lucide-react"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalClose } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ratesRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { ExchangeRate } from "@/lib/schemas/exchange-rate.schema"
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/currency"
import { getTripAllowedCurrencies, CORE_CURRENCIES } from "@/lib/utils/countryCurrency"
import { useI18n } from "@/lib/i18n/I18nProvider"

interface ExchangeRatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip: Trip
}

export function ExchangeRatesModal({ open, onOpenChange, trip }: ExchangeRatesModalProps) {
  const { t, locale } = useI18n()
  const isRTL = locale === "he"

  const [rates, setRates] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(true)

  // Calculator state
  const [fromCurrency, setFromCurrency] = useState(trip.baseCurrency)
  const [toCurrency, setToCurrency] = useState("USD")
  const [amount, setAmount] = useState("")

  // Get trip-relevant currencies
  const tripCurrencies = useMemo(() => {
    const currencies = getTripAllowedCurrencies(trip.plannedCountries || trip.countries)
    // Make sure base currency is included
    if (!currencies.includes(trip.baseCurrency)) {
      currencies.unshift(trip.baseCurrency)
    }
    return currencies
  }, [trip])

  // Load rates when modal opens
  useEffect(() => {
    if (open) {
      loadRates()
    }
  }, [open, trip.baseCurrency])

  async function loadRates() {
    setLoading(true)
    try {
      const data = await ratesRepository.getRates(trip.baseCurrency)
      setRates(data)
    } catch (error) {
      console.error("Failed to load rates:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate conversion
  const conversionResult = useMemo(() => {
    if (!rates || !amount) return null

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) return null

    // Get rates relative to base currency
    // exchangerate-api returns: rates[X] = how many X per 1 base
    // e.g., if base=USD, rates["EUR"]=0.92 means 1 USD = 0.92 EUR
    const fromRate = fromCurrency === trip.baseCurrency ? 1 : rates.rates[fromCurrency]
    const toRate = toCurrency === trip.baseCurrency ? 1 : rates.rates[toCurrency]

    if (!fromRate || !toRate) return null

    // Fixed conversion: amount * (toRate / fromRate)
    // Example: 100 EUR to GBP where base=USD, EUR rate=0.92, GBP rate=0.79
    // 100 * (0.79 / 0.92) = 100 * 0.859 = 85.9 GBP ✓
    const result = numAmount * (toRate / fromRate)

    return result
  }, [rates, amount, fromCurrency, toCurrency, trip.baseCurrency])

  // Format last updated date
  const lastUpdated = useMemo(() => {
    if (!rates?.updatedAt) return null
    const date = new Date(rates.updatedAt)
    return date.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [rates?.updatedAt, locale])

  // Swap currencies
  function swapCurrencies() {
    const temp = fromCurrency
    setFromCurrency(toCurrency)
    setToCurrency(temp)
  }

  // Check if rate is available for a currency
  function hasRate(currency: string): boolean {
    if (currency === trip.baseCurrency) return true
    return rates?.rates[currency] !== undefined
  }

  // Get display rate for a currency (relative to base)
  function getDisplayRate(currency: string): string | null {
    if (currency === trip.baseCurrency) return "1.00"
    const rate = rates?.rates[currency]
    if (!rate) return null
    return rate.toFixed(4)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="lg">
      <div dir={isRTL ? "rtl" : "ltr"}>
        <ModalHeader>
          <ModalTitle className="text-lg">{t("rates.title")}</ModalTitle>
          <ModalClose onClick={() => onOpenChange(false)} />
        </ModalHeader>

        <ModalContent className="space-y-6 max-h-[70vh] overflow-y-auto pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* Last Updated */}
              {lastUpdated && (
                <p className="text-xs text-slate-500 text-center">
                  {t("rates.lastUpdated")}: {lastUpdated}
                </p>
              )}

              {/* Rates Table */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  {t("rates.currentRates")}
                </Label>
                <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100">
                  {tripCurrencies.map((currency) => {
                    const rate = getDisplayRate(currency)
                    const isBase = currency === trip.baseCurrency

                    return (
                      <div
                        key={currency}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-slate-900">
                            {currency}
                          </span>
                          <span className="text-sm text-slate-500">
                            {getCurrencySymbol(currency)}
                          </span>
                          {isBase && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium">
                              {t("rates.base")}
                            </span>
                          )}
                        </div>
                        <div className="text-end">
                          {rate ? (
                            <span className="text-base font-medium text-slate-700">
                              {rate}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">
                              {t("rates.unavailable")}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-400 text-center">
                  {t("rates.ratesNote", { base: trip.baseCurrency })}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 pt-4">
                <Label className="text-sm font-semibold text-slate-700">
                  {t("rates.calculator")}
                </Label>
              </div>

              {/* Calculator */}
              <div className="space-y-4">
                {/* From */}
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-slate-500">{t("rates.from")}</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 text-lg font-semibold"
                    />
                  </div>
                  <div className="w-24 space-y-1.5">
                    <Label className="text-xs text-slate-500 invisible">.</Label>
                    <Select
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value)}
                      className="h-12 font-semibold"
                    >
                      {tripCurrencies.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={swapCurrencies}
                    className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </button>
                </div>

                {/* To */}
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-slate-500">{t("rates.to")}</Label>
                    <div className="h-12 px-4 flex items-center bg-slate-50 border border-slate-200 rounded-lg">
                      {conversionResult !== null ? (
                        <span className="text-lg font-bold text-slate-900">
                          {formatCurrency(conversionResult, toCurrency)}
                        </span>
                      ) : amount && parseFloat(amount) > 0 ? (
                        <span className="text-sm text-slate-400 flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4" />
                          {t("rates.conversionUnavailable")}
                        </span>
                      ) : (
                        <span className="text-lg text-slate-300">0.00</span>
                      )}
                    </div>
                  </div>
                  <div className="w-24 space-y-1.5">
                    <Label className="text-xs text-slate-500 invisible">.</Label>
                    <Select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      className="h-12 font-semibold"
                    >
                      {tripCurrencies.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Rate info */}
                {amount && parseFloat(amount) > 0 && conversionResult !== null && (
                  <p className="text-xs text-slate-500 text-center">
                    1 {fromCurrency} = {(conversionResult / parseFloat(amount)).toFixed(4)} {toCurrency}
                  </p>
                )}
              </div>
            </>
          )}
        </ModalContent>
      </div>
    </Modal>
  )
}

