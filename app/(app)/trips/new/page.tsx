"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CountryDropdownWithSearch } from "@/components/CountryDropdownWithSearch"
import { CreateTrip } from "@/lib/schemas/trip.schema"
import { CURRENCIES } from "@/lib/utils/currency"
import { COUNTRIES_DATA, getCountryName } from "@/lib/utils/countries.data"
import { getCurrencySelectLabel } from "@/lib/utils/currency.data"
import { getTodayString } from "@/lib/utils/date"
import { getTripAllowedCurrencies } from "@/lib/utils/countryCurrency"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { usePreferencesStore } from "@/lib/store/preferences.store"
import { createTripAction } from "./actions"

// Helper to convert ISO country code to emoji flag
const flagEmoji = (code: string) => {
  const cc = (code || '').trim().toUpperCase();
  if (cc.length !== 2) return '';
  const base = 0x1F1E6;
  const A = 'A'.charCodeAt(0);
  return String.fromCodePoint(
    base + (cc.charCodeAt(0) - A),
    base + (cc.charCodeAt(1) - A)
  );
};

export default function NewTripPage() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const { preferences, profile } = usePreferencesStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    startDate: getTodayString(),
    endDate: "",
    baseCurrency: preferences.baseCurrency || "USD",
    memberName: profile.nickname || profile.name || "",
    plannedCountries: [] as string[],
    tripType: "" as "" | "solo" | "couple" | "family" | "friends",
    adults: 1,
    children: 0,
  })

  // Derived currencies based on planned countries
  const allowedCurrencies = getTripAllowedCurrencies(formData.plannedCountries)

  function addCountry(countryCode: string) {
    if (!formData.plannedCountries.includes(countryCode)) {
      setFormData({
        ...formData,
        plannedCountries: [...formData.plannedCountries, countryCode],
      })
    }
  }

  function removeCountry(countryCode: string) {
    setFormData({
      ...formData,
      plannedCountries: formData.plannedCountries.filter((c) => c !== countryCode),
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const tripData: CreateTrip = {
        name: formData.name,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        baseCurrency: formData.baseCurrency,
        countries: [], // Keep for backward compatibility
        plannedCountries: formData.plannedCountries,
        itineraryLegs: [], // Will be added in enhanced form
        tripType: formData.tripType || undefined,
        adults: formData.tripType === 'family' ? formData.adults : null,
        children: formData.tripType === 'family' ? formData.children : null,
        travelStyle: undefined,
        isClosed: false,
        closedAt: null,
        members: [
          {
            id: crypto.randomUUID(),
            name: formData.memberName || "Me",
            role: "owner",
          },
        ],
      }

      const trip = await createTripAction(tripData)
      toast.success(t('createTrip.success'))
      router.push(`/trips/${trip.id}`)
    } catch (error) {
      console.error("Failed to create trip:", error)
      toast.error(t('createTrip.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl pb-6">
      {/* Mobile Header */}
      <div className="border-b bg-background p-4 md:hidden">
        <h1 className="text-xl font-bold">{t('createTrip.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('createTrip.subtitle')}
        </p>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <PageHeader
          title={t('createTrip.title')}
          description={t('createTrip.subtitle')}
        />
      </div>

      <Card className="mt-6 md:mt-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="name">{t('createTrip.tripName')} *</Label>
              <Input
                id="name"
                placeholder={t('createTrip.tripNamePlaceholder')}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">{t('createTrip.startDate')} *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">{t('createTrip.endDateOptional')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  min={formData.startDate}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plannedCountries">{t('createTrip.plannedCountries')}</Label>
              <p className="text-sm text-muted-foreground">{t('createTrip.plannedCountriesHelper')}</p>
              <CountryDropdownWithSearch
                id="plannedCountries"
                value=""
                onChange={(countryCode) => {
                  if (countryCode) {
                    addCountry(countryCode)
                  }
                }}
                placeholder={t('createTrip.selectCountries')}
                excludeCountries={formData.plannedCountries}
                flagEmoji={flagEmoji}
              />
              {formData.plannedCountries.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.plannedCountries.map((code) => {
                    return (
                      <Badge
                        key={code}
                        variant="secondary"
                        className="cursor-pointer text-base font-semibold px-3 py-2"
                        onClick={() => removeCountry(code)}
                      >
                        {getCountryName(code, locale)}
                        <X className={locale === 'he' ? 'mr-1.5 h-4 w-4' : 'ml-1.5 h-4 w-4'} />
                      </Badge>
                    )
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t('createTrip.selectCountriesHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseCurrency">{t('createTrip.baseCurrency')} *</Label>
              <p className="text-sm text-muted-foreground">{t('createTrip.baseCurrencyHelper')}</p>
              <Select
                id="baseCurrency"
                value={formData.baseCurrency}
                onChange={(e) =>
                  setFormData({ ...formData, baseCurrency: e.target.value })
                }
                required
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {getCurrencySelectLabel(currency.code, locale)}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('createTrip.baseCurrencyInfo')}
              </p>
            </div>

            {formData.plannedCountries.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-base font-medium">
                  {t('createTrip.currenciesForTrip')} {allowedCurrencies.join(", ")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('createTrip.currenciesShownFirst')}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="memberName">{t('createTrip.memberName')}</Label>
              <p className="text-sm text-muted-foreground">{t('createTrip.memberNameHelper')}</p>
              <Input
                id="memberName"
                placeholder={t('createTrip.memberNamePlaceholder')}
                value={formData.memberName}
                onChange={(e) =>
                  setFormData({ ...formData, memberName: e.target.value })
                }
              />
            </div>

            {/* Trip Insights Metadata - Optional */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {t('createTrip.metadataTitle')}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {t('createTrip.metadataSubtitle')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tripType">{t('createTrip.tripType')}</Label>
                <Select
                  id="tripType"
                  value={formData.tripType}
                  onChange={(e) => {
                    const tripType = e.target.value as typeof formData.tripType
                    const defaultAdults = tripType === "solo" ? 1 : tripType === "couple" ? 2 : tripType === "family" ? 2 : tripType === "friends" ? 3 : 1
                    setFormData({ ...formData, tripType, adults: defaultAdults })
                  }}
                >
                  <option value="">{t('createTrip.tripTypeSelect')}</option>
                  <option value="solo">{t('createTrip.tripTypeSolo')}</option>
                  <option value="couple">{t('createTrip.tripTypeCouple')}</option>
                  <option value="family">{t('createTrip.tripTypeFamily')}</option>
                  <option value="friends">{t('createTrip.tripTypeFriends')}</option>
                </Select>
              </div>

              {formData.tripType === 'family' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="adults">{t('createTrip.adults')}</Label>
                    <Input
                      id="adults"
                      type="number"
                      min="0"
                      value={formData.adults}
                      onChange={(e) =>
                        setFormData({ ...formData, adults: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="children">{t('createTrip.children')}</Label>
                    <Input
                      id="children"
                      type="number"
                      min="0"
                      value={formData.children}
                      onChange={(e) =>
                        setFormData({ ...formData, children: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1 md:flex-initial"
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading} size="lg" className="flex-1 md:flex-initial">
                {loading ? t('createTrip.creating') : t('createTrip.create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

