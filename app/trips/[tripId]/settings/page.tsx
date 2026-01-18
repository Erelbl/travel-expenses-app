"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, XCircle, Save, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CountryMultiSelect } from "@/components/CountryMultiSelect"
import { tripsRepository } from "@/lib/data"
import { Trip } from "@/lib/schemas/trip.schema"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { canManageTrip } from "@/lib/utils/permissions"
import { updateTripBasics, updateBudget, updateInsightsProfile, closeTrip, reopenTrip } from "../actions"
import { Badge } from "@/components/ui/badge"
import { getCountryName } from "@/lib/utils/countries.data"
import { currencyForCountry } from "@/lib/utils/countryCurrency"

export default function TripSettingsPage() {
  const { t, locale } = useI18n()
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const isRTL = locale === 'he'

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
    adults: 1,
    children: 0,
  })

  useEffect(() => {
    loadData()
  }, [tripId])

  async function loadData() {
    try {
      setLoading(true)
      const tripData = await tripsRepository.getTrip(tripId)

      if (!tripData) {
        router.push("/trips")
        return
      }

      setTrip(tripData)
      
      // Initialize form data
      setFormData({
        name: tripData.name,
        startDate: tripData.startDate || "",
        endDate: tripData.endDate || "",
        countries: tripData.countries || [],
        currentCountry: tripData.currentCountry ?? null,
        currentCurrency: tripData.currentCurrency ?? null,
      })

      // Initialize budget data
      setBudgetData({
        targetBudget: tripData.targetBudget ?? null,
      })

      // Initialize insights data
      setInsightsData({
        tripType: tripData.tripType ?? null,
        adults: tripData.adults ?? 1,
        children: tripData.children ?? 0,
      })
    } catch (error) {
      console.error("Failed to load trip:", error)
      toast.error(t('common.errorMessage'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveTripBasics() {
    if (!trip) return

    try {
      setSaving(true)
      
      await updateTripBasics(tripId, {
        name: formData.name,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        countries: formData.countries,
        currentCountry: formData.currentCountry,
        currentCurrency: formData.currentCurrency,
      })
      
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

  async function handleSaveBudget() {
    if (!trip) return

    try {
      setSaving(true)
      
      await updateBudget(tripId, {
        targetBudget: budgetData.targetBudget,
      })
      
      toast.success(t('settings.budgetSaved'))
      router.refresh()
      await loadData()
    } catch (error) {
      console.error("Failed to update budget:", error)
      toast.error(t('settings.ratesSaveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveInsightsProfile() {
    if (!trip) return

    try {
      setSaving(true)
      
      await updateInsightsProfile(tripId, {
        tripType: insightsData.tripType,
        adults: insightsData.adults,
        children: insightsData.children,
      })
      
      toast.success(t('settings.profileSaved'))
      router.refresh()
      await loadData()
    } catch (error) {
      console.error("Failed to update insights profile:", error)
      toast.error(t('settings.ratesSaveError'))
    } finally {
      setSaving(false)
    }
  }

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
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-medium text-slate-700">
                    {t('createTrip.endDateOptional')}
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
                    {formData.countries.map((country) => (
                      <option key={country} value={country}>
                        {getCountryName(country, locale)}
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

                {/* Save Button */}
                <Button
                  onClick={handleSaveTripBasics}
                  disabled={saving || !formData.name.trim()}
                  className="w-full"
                  size="lg"
                >
                  <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {saving ? t('common.saving') : t('settings.saveChanges')}
                </Button>
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
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveBudget}
                  disabled={saving}
                  className="w-full"
                  size="lg"
                >
                  <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {saving ? t('common.saving') : t('settings.saveBudget')}
                </Button>
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

                {/* Adults */}
                <div className="space-y-2">
                  <Label htmlFor="adults" className="text-sm font-medium text-slate-700">
                    {t('createTrip.adults')}
                  </Label>
                  <Input
                    id="adults"
                    type="number"
                    min="0"
                    value={insightsData.adults}
                    onChange={(e) => setInsightsData({ ...insightsData, adults: Math.max(0, parseInt(e.target.value) || 0) })}
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
                    value={insightsData.children}
                    onChange={(e) => setInsightsData({ ...insightsData, children: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveInsightsProfile}
                  disabled={saving}
                  className="w-full"
                  size="lg"
                >
                  <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {saving ? t('common.saving') : t('settings.saveProfile')}
                </Button>
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
                  <span className="font-medium text-slate-700">{t('createTrip.adults')}:</span>
                  <span className="ml-2 text-slate-900">{trip.adults ?? 1}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">{t('createTrip.children')}:</span>
                  <span className="ml-2 text-slate-900">{trip.children ?? 0}</span>
                </div>
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
          <CardContent>
            <p className="text-sm text-slate-500">
              {t('settings.ratesHelper')} {trip.baseCurrency}
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone Section */}
        {canManageTrip(trip) && !trip.isClosed && (
          <Card className="border-red-200 bg-red-50/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-red-900">
                {t('settings.dangerZone')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    {t('settings.closeTrip')}
                  </h3>
                  <p className="text-sm text-red-700 mb-3">
                    {t('settings.closeTripConfirm')}
                  </p>
                  <Button
                    onClick={handleCloseTrip}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
                  >
                    <XCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('settings.closeTrip')}
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
