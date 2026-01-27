"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, XCircle, Save, RotateCcw, RefreshCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePickerInput } from "@/components/ui/date-picker-input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CountryMultiSelect } from "@/components/CountryMultiSelect"
import { tripsRepository, expensesRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { Expense } from "@/lib/schemas/expense.schema"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { canManageTrip } from "@/lib/utils/permissions"
import { updateTripBasics, updateBudget, updateInsightsProfile, closeTrip, reopenTrip, deleteTrip } from "../actions"
import { Badge } from "@/components/ui/badge"
import { getCountryName, COUNTRIES_DATA } from "@/lib/utils/countries.data"
import { currencyForCountry } from "@/lib/utils/countryCurrency"

export default function TripSettingsPage() {
  const { t, locale } = useI18n()
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const isRTL = locale === 'he'

  const [trip, setTrip] = useState<Trip | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Form state for Trip Basics
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    countries: [] as string[],
    currentCountry: null as string | null,
    currentCurrency: null as string | null,
  })

  // Form state for Budget
  const [budgetData, setBudgetData] = useState({
    targetBudget: null as number | null,
  })

  // Form state for Insights Profile
  const [insightsData, setInsightsData] = useState({
    tripType: null as string | null,
    adults: null as number | null,
    children: null as number | null,
    ageRange: null as string | null,
  })

  // Track initial values for dirty checking
  const [initialValues, setInitialValues] = useState<any>(null)

  useEffect(() => {
    loadData()
    // Sanity check: ensure countries list is comprehensive (dev-only)
    if (process.env.NODE_ENV === 'development' && COUNTRIES_DATA.length < 150) {
      console.warn(`⚠️ Countries list is too small: ${COUNTRIES_DATA.length} countries. Expected 150+`)
    }
  }, [tripId])

  async function loadData() {
    try {
      setLoading(true)
      const [tripData, expensesData] = await Promise.all([
        tripsRepository.getTrip(tripId),
        expensesRepository.listExpenses(tripId)
      ])

      if (!tripData) {
        router.push("/trips")
        return
      }

      setTrip(tripData)
      setExpenses(expensesData)
      
      // Initialize form data
      const initialFormData = {
        name: tripData.name,
        startDate: tripData.startDate || "",
        endDate: tripData.endDate || "",
        countries: tripData.countries || [],
        currentCountry: tripData.currentCountry ?? null,
        currentCurrency: tripData.currentCurrency ?? null,
      }
      setFormData(initialFormData)

      // Initialize budget data
      const initialBudgetData = {
        targetBudget: tripData.targetBudget ?? null,
      }
      setBudgetData(initialBudgetData)

      // Initialize insights data
      const initialInsightsData = {
        tripType: tripData.tripType ?? null,
        adults: tripData.adults ?? null,
        children: tripData.children ?? null,
        ageRange: tripData.ageRange ?? null,
      }
      setInsightsData(initialInsightsData)

      // Store initial values for dirty checking
      setInitialValues({
        formData: initialFormData,
        budgetData: initialBudgetData,
        insightsData: initialInsightsData,
      })
      setIsDirty(false)
    } catch (error) {
      console.error("Failed to load trip:", error)
      toast.error(t('common.errorMessage'))
    } finally {
      setLoading(false)
    }
  }

  // Unified save handler
  async function handleSaveAll() {
    if (!trip || !isDirty) return

    try {
      setSaving(true)
      
      // Save all sections in parallel
      await Promise.all([
        updateTripBasics(tripId, {
          name: formData.name,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          countries: formData.countries,
          currentCountry: formData.currentCountry,
          currentCurrency: formData.currentCurrency,
        }),
        updateBudget(tripId, {
          targetBudget: budgetData.targetBudget,
        }),
        updateInsightsProfile(tripId, {
          tripType: insightsData.tripType,
          adults: insightsData.tripType === 'family' ? insightsData.adults : null,
          children: insightsData.tripType === 'family' ? insightsData.children : null,
          ageRange: insightsData.ageRange,
        })
      ])
      
      toast.success(t('settings.changesSaved'))
      router.refresh()
      await loadData()
    } catch (error) {
      console.error("Failed to update trip:", error)
      toast.error(t('settings.ratesSaveError'))
    } finally {
      setSaving(false)
    }
  }

  // Check if form is dirty
  useEffect(() => {
    if (!initialValues) return
    
    const isFormDirty = JSON.stringify(formData) !== JSON.stringify(initialValues.formData)
    const isBudgetDirty = JSON.stringify(budgetData) !== JSON.stringify(initialValues.budgetData)
    const isInsightsDirty = JSON.stringify(insightsData) !== JSON.stringify(initialValues.insightsData)
    
    setIsDirty(isFormDirty || isBudgetDirty || isInsightsDirty)
  }, [formData, budgetData, insightsData, initialValues])

  async function handleCloseTrip() {
    if (!trip) return
    
    const confirmed = window.confirm(t('settings.closeTripConfirm'))
    if (!confirmed) return

    try {
      await closeTrip(tripId)
      toast.success(t('settings.closeTripSuccess'))
      router.refresh()
      await loadData()
    } catch (error) {
      console.error("Failed to close trip:", error)
      toast.error(t('settings.closeTripError'))
    }
  }

  async function handleReopenTrip() {
    if (!trip) return
    
    const confirmed = window.confirm(t('settings.reopenTripConfirm'))
    if (!confirmed) return

    try {
      await reopenTrip(tripId)
      toast.success(t('settings.reopenTripSuccess'))
      router.refresh()
      await loadData()
    } catch (error) {
      console.error("Failed to reopen trip:", error)
      toast.error(t('settings.reopenTripError'))
    }
  }

  async function handleDeleteTrip() {
    if (!trip) return
    
    const confirmed = window.confirm(t('settings.deleteTripConfirm'))
    if (!confirmed) return

    try {
      await deleteTrip(tripId)
      toast.success(t('settings.deleteTripSuccess'))
      router.push('/trips')
    } catch (error) {
      console.error("Failed to delete trip:", error)
      const errorMessage = (error as Error).message
      if (errorMessage.includes('owner')) {
        toast.error(t('settings.deleteTripPermissionError'))
      } else {
        toast.error(t('settings.deleteTripError'))
      }
    }
  }

  const canEdit = trip ? canManageTrip(trip) : false

  if (loading || !trip) {
    return (
      <div className="min-h-screen pb-20 md:pb-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="sticky top-0 z-10 border-b bg-white">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-4 p-4">
              <div className="h-6 w-6 bg-slate-200 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 md:pb-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/trips/${tripId}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{t('nav.settings')}</h1>
              <p className="text-sm text-slate-500">{trip.name}</p>
            </div>
            {trip.isClosed && (
              <Badge variant="outline" className="bg-slate-100 text-slate-700">
                {t('trips.finished')}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Trip Closed Notice */}
        {trip.isClosed && (
          <Card className="border-slate-300 bg-slate-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {t('settings.tripClosed')}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t('settings.tripClosedDesc')}
                  </p>
                </div>
                {canEdit && (
                  <Button
                    onClick={handleReopenTrip}
                    variant="outline"
                    className="shrink-0"
                  >
                    <RotateCcw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('settings.reopenTrip')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trip Basics Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              {t('settings.tripBasics')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canEdit ? (
              <>
                {/* Trip Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                    {t('createTrip.tripName')}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('createTrip.tripNamePlaceholder')}
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-medium text-slate-700">
                    {t('createTrip.startDate')}
                  </Label>
                  <DatePickerInput
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    locale={locale}
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-medium text-slate-700">
                    {t('createTrip.endDateOptional')}
                  </Label>
                  <DatePickerInput
                    id="endDate"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    locale={locale}
                  />
                </div>

                {/* Countries */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    {t('createTrip.plannedCountries')}
                  </Label>
                  <CountryMultiSelect
                    value={formData.countries}
                    onChange={(countries) => setFormData({ ...formData, countries })}
                    placeholder={t('createTrip.searchCountries')}
                  />
                  <p className="text-xs text-slate-500">
                    {t('createTrip.selectCountriesHelp')}
                  </p>
                </div>

                {/* Current Country */}
                <div className="space-y-2">
                  <Label htmlFor="currentCountry" className="text-sm font-medium text-slate-700">
                    {t('home.currentLocation')}
                  </Label>
                  <Select
                    id="currentCountry"
                    value={formData.currentCountry ?? ""}
                    onChange={(e) => {
                      const country = e.target.value || null
                      const currency = country ? currencyForCountry(country) : null
                      setFormData({ 
                        ...formData, 
                        currentCountry: country,
                        currentCurrency: currency
                      })
                    }}
                  >
                    <option value="">{t('home.selectLocation')}</option>
                    {COUNTRIES_DATA.map((country) => (
                      <option key={country.code} value={country.code}>
                        {getCountryName(country.code, locale)}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Current Currency (auto-filled) */}
                {formData.currentCurrency && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      {t('createTrip.baseCurrency')}
                    </Label>
                    <Input
                      value={formData.currentCurrency ?? ""}
                      disabled
                      className="bg-slate-50"
                    />
                  </div>
                )}

              </>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-slate-700">{t('createTrip.tripName')}:</span>
                  <span className="ml-2 text-slate-900">{trip.name}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">{t('createTrip.startDate')}:</span>
                  <span className="ml-2 text-slate-900">{trip.startDate || '—'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">{t('createTrip.endDate')}:</span>
                  <span className="ml-2 text-slate-900">{trip.endDate || '—'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">{t('createTrip.plannedCountries')}:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {(trip.countries || []).map((country) => (
                      <Badge key={country} variant="outline">
                        {getCountryName(country, locale)}
                      </Badge>
                    ))}
                  </div>
                </div>
                {trip.currentCountry && (
                  <div>
                    <span className="font-medium text-slate-700">{t('home.currentLocation')}:</span>
                    <span className="ml-2 text-slate-900">
                      {getCountryName(trip.currentCountry, locale)}
                      {trip.currentCurrency && ` (${trip.currentCurrency})`}
                    </span>
                  </div>
                )}
                <p className="text-xs text-slate-500 pt-2">
                  {t('settings.subtitle')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              {t('settings.budget')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canEdit ? (
              <>
                {/* Target Budget */}
                <div className="space-y-2">
                  <Label htmlFor="targetBudget" className="text-sm font-medium text-slate-700">
                    {t('settings.targetBudget')}
                  </Label>
                  <Input
                    id="targetBudget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetData.targetBudget ?? ""}
                    onChange={(e) => setBudgetData({ targetBudget: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder={t('settings.targetBudgetPlaceholder')}
                  />
                  <p className="text-xs text-slate-500">
                    {t('settings.targetBudgetHelper')}
                  </p>
                  <p className="text-xs text-slate-600">
                    {t('settings.budgetCalmNote')}
                  </p>
                </div>

              </>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-slate-700">{t('settings.targetBudget')}:</span>
                  <span className="ml-2 text-slate-900">
                    {trip.targetBudget ? `${trip.baseCurrency} ${trip.targetBudget.toFixed(2)}` : '—'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 pt-2">
                  {t('settings.subtitle')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights Profile Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              {t('settings.insightsProfile')}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              {t('createTrip.metadataSubtitle')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {canEdit ? (
              <>
                {/* Trip Type */}
                <div className="space-y-2">
                  <Label htmlFor="tripType" className="text-sm font-medium text-slate-700">
                    {t('createTrip.tripType')}
                  </Label>
                  <Select
                    id="tripType"
                    value={insightsData.tripType ?? ""}
                    onChange={(e) => setInsightsData({ ...insightsData, tripType: e.target.value || null })}
                  >
                    <option value="">{t('createTrip.tripTypeSelect')}</option>
                    <option value="solo">{t('createTrip.tripTypeSolo')}</option>
                    <option value="couple">{t('createTrip.tripTypeCouple')}</option>
                    <option value="family">{t('createTrip.tripTypeFamily')}</option>
                    <option value="friends">{t('createTrip.tripTypeFriends')}</option>
                  </Select>
                </div>

                {/* Age Range */}
                <div className="space-y-2">
                  <Label htmlFor="ageRange" className="text-sm font-medium text-slate-700">
                    {t('createTrip.ageRange')}
                  </Label>
                  <Select
                    id="ageRange"
                    value={insightsData.ageRange ?? ""}
                    onChange={(e) => setInsightsData({ ...insightsData, ageRange: e.target.value || null })}
                  >
                    <option value="">{t('createTrip.ageRangeSelect')}</option>
                    <option value="18_25">{t('createTrip.ageRange18_25')}</option>
                    <option value="26_35">{t('createTrip.ageRange26_35')}</option>
                    <option value="36_45">{t('createTrip.ageRange36_45')}</option>
                    <option value="46_60">{t('createTrip.ageRange46_60')}</option>
                    <option value="60_plus">{t('createTrip.ageRange60_plus')}</option>
                  </Select>
                </div>

                {/* Adults & Children - Only for Family trips */}
                {insightsData.tripType === 'family' && (
                  <>
                    {/* Adults */}
                    <div className="space-y-2">
                      <Label htmlFor="adults" className="text-sm font-medium text-slate-700">
                        {t('createTrip.adults')}
                      </Label>
                      <Input
                        id="adults"
                        type="number"
                        min="0"
                        value={insightsData.adults ?? ""}
                        onChange={(e) => setInsightsData({ ...insightsData, adults: e.target.value ? Math.max(0, parseInt(e.target.value)) : null })}
                      />
                    </div>

                    {/* Children */}
                    <div className="space-y-2">
                      <Label htmlFor="children" className="text-sm font-medium text-slate-700">
                        {t('createTrip.children')}
                      </Label>
                      <Input
                        id="children"
                        type="number"
                        min="0"
                        value={insightsData.children ?? ""}
                        onChange={(e) => setInsightsData({ ...insightsData, children: e.target.value ? Math.max(0, parseInt(e.target.value)) : null })}
                      />
                    </div>
                  </>
                )}

              </>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-slate-700">{t('createTrip.tripType')}:</span>
                  <span className="ml-2 text-slate-900">
                    {trip.tripType ? t(`createTrip.tripType${trip.tripType.charAt(0).toUpperCase() + trip.tripType.slice(1)}`) : '—'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">{t('createTrip.ageRange')}:</span>
                  <span className="ml-2 text-slate-900">
                    {trip.ageRange ? t(`createTrip.ageRange${trip.ageRange.charAt(0).toUpperCase() + trip.ageRange.slice(1).replace('_', '_')}`) : '—'}
                  </span>
                </div>
                {trip.tripType === 'family' && (
                  <>
                    <div>
                      <span className="font-medium text-slate-700">{t('createTrip.adults')}:</span>
                      <span className="ml-2 text-slate-900">{trip.adults ?? '—'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">{t('createTrip.children')}:</span>
                      <span className="ml-2 text-slate-900">{trip.children ?? '—'}</span>
                    </div>
                  </>
                )}
                <p className="text-xs text-slate-500 pt-2">
                  {t('settings.subtitle')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FX & Conversions Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              {t('settings.exchangeRates')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <span className="font-medium text-slate-700">{t('createTrip.baseCurrency')}:</span>
              <span className="ml-2 text-slate-900">{trip.baseCurrency}</span>
            </div>
            
            {/* Currencies used in expenses */}
            {(() => {
              const usedCurrencies = Array.from(new Set(expenses.map(e => e.currency)))
              return usedCurrencies.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    {t('settings.currenciesUsed')}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {usedCurrencies.map(currency => (
                      <Badge key={currency} variant="secondary" className="text-sm">
                        {currency}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {t('settings.ratesHelper')} {trip.baseCurrency}
                  </p>
                </div>
              ) : (
                <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-200">
                  {t('settings.noCurrenciesYet')}
                </div>
              )
            })()}
          </CardContent>
        </Card>

        {/* Unified Save Button */}
        {canEdit && (
          <div className="sticky bottom-20 z-10">
            <Button
              onClick={handleSaveAll}
              disabled={saving || !isDirty || !formData.name.trim()}
              className="w-full shadow-lg"
              size="lg"
            >
              <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {saving ? t('common.saving') : t('settings.saveChanges')}
            </Button>
          </div>
        )}

        {/* Trip Status Section */}
        {canManageTrip(trip) && !trip.isClosed && (
          <Card className="border-slate-300 bg-slate-50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-900">
                {t('settings.tripStatus')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {t('settings.closeTrip')}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    {t('settings.closeTripConfirm')}
                  </p>
                  <Button
                    onClick={handleCloseTrip}
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <XCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('settings.closeTrip')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone Section */}
        {canManageTrip(trip) && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-red-900">
                {t('settings.dangerZone')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    {t('settings.deleteTrip')}
                  </h3>
                  <p className="text-sm text-red-700 mb-3">
                    {t('settings.deleteTripDesc')}
                  </p>
                  <Button
                    onClick={handleDeleteTrip}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
                  >
                    <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('settings.deleteTrip')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav tripId={tripId} />
    </div>
  )
}
