"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, XCircle, Save } from "lucide-react"
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
import { updateTripBasics, closeTrip } from "../actions"
import { Badge } from "@/components/ui/badge"
import { CURRENCIES } from "@/lib/utils/currency"
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
    currentCountry: "",
    currentCurrency: "",
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
        currentCountry: tripData.currentCountry || "",
        currentCurrency: tripData.currentCurrency || "",
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
        currentCountry: formData.currentCountry || null,
        currentCurrency: formData.currentCurrency || null,
      })
      
      toast.success(t('settings.ratesSaved'))
      router.refresh()
      await loadData()
    } catch (error) {
      console.error("Failed to update trip:", error)
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
      router.push(`/trips/${tripId}`)
    } catch (error) {
      console.error("Failed to close trip:", error)
      toast.error(t('settings.closeTripError'))
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
        {/* Trip Basics Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Trip Basics
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
                    disabled={!canEdit || trip.isClosed}
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
                    disabled={!canEdit || trip.isClosed}
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
                    disabled={!canEdit || trip.isClosed}
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
                    value={formData.currentCountry}
                    onChange={(e) => {
                      const country = e.target.value
                      const currency = country ? currencyForCountry(country) : ""
                      setFormData({ 
                        ...formData, 
                        currentCountry: country,
                        currentCurrency: currency
                      })
                    }}
                    disabled={!canEdit || trip.isClosed}
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
                      Current Currency
                    </Label>
                    <Input
                      value={formData.currentCurrency}
                      disabled
                      className="bg-slate-50"
                    />
                  </div>
                )}

                {/* Save Button */}
                {!trip.isClosed && (
                  <Button
                    onClick={handleSaveTripBasics}
                    disabled={saving || !formData.name.trim()}
                    className="w-full"
                    size="lg"
                  >
                    <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {saving ? t('common.saving') : t('settings.saveRates')}
                  </Button>
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
                  Only owner/admin can edit trip settings
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Budget planning features coming soon
            </p>
          </CardContent>
        </Card>

        {/* Insights Profile Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Insights Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Trip metadata for personalized insights (trip type, travel style, group size, etc.)
            </p>
          </CardContent>
        </Card>

        {/* FX & Conversions Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              FX & Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Exchange rate configuration will be available here
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone Section */}
        {canManageTrip(trip) && !trip.isClosed && (
          <Card className="border-red-200 bg-red-50/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-red-900">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    {t('settings.closeTrip')}
                  </h3>
                  <p className="text-sm text-red-700 mb-3">
                    Mark this trip as finished. You won't be able to add or edit expenses after closing.
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

        {/* Closed Trip Badge */}
        {trip.isClosed && (
          <Card className="border-slate-200 bg-slate-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-slate-100 text-slate-700">
                  {t('trips.finished')}
                </Badge>
                <p className="text-sm text-slate-600">
                  This trip has been closed and is read-only
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav tripId={tripId} />
    </div>
  )
}
