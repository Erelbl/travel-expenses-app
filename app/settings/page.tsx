"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Settings as SettingsIcon, CreditCard, Shield, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LanguageToggle } from "@/components/LanguageToggle"
import { usePreferencesStore } from "@/lib/store/preferences.store"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { CURRENCIES } from "@/lib/utils/currency"

export default function AppSettingsPage() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const isRTL = locale === 'he'
  
  const { profile, preferences, setProfile, setPreferences } = usePreferencesStore()
  
  // Local state for form
  const [formProfile, setFormProfile] = useState(profile)
  const [formPreferences, setFormPreferences] = useState(preferences)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // Check if there are unsaved changes
    const profileChanged = JSON.stringify(formProfile) !== JSON.stringify(profile)
    const prefsChanged = JSON.stringify(formPreferences) !== JSON.stringify(preferences)
    setHasChanges(profileChanged || prefsChanged)
  }, [formProfile, formPreferences, profile, preferences])

  function handleSave() {
    try {
      setProfile(formProfile)
      setPreferences(formPreferences)
      setHasChanges(false)
      toast.success(t('appSettings.savedSuccess'))
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error(t('appSettings.savedError'))
    }
  }

  function handleCancel() {
    setFormProfile(profile)
    setFormPreferences(preferences)
    setHasChanges(false)
  }

  return (
    <div className="min-h-screen bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/trips")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{t('appSettings.title')}</h1>
              <p className="text-sm text-slate-500">{t('appSettings.subtitle')}</p>
            </div>
            {hasChanges && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  {t('common.cancel')}
                </Button>
                <Button size="sm" onClick={handleSave}>
                  {t('common.save')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-6 pb-8">
        <div className="space-y-8">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-sky-600" />
                {t('appSettings.profile')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Photo */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-2xl font-bold text-white shadow-lg ring-4 ring-sky-100">
                  {formProfile.name ? formProfile.name.charAt(0).toUpperCase() : 
                   formProfile.nickname ? formProfile.nickname.charAt(0).toUpperCase() : 
                   <User className="h-8 w-8" />}
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-slate-700">
                    {t('appSettings.profilePhoto')}
                  </Label>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('appSettings.profilePhotoComingSoon')}
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                  {t('appSettings.profileName')}
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('appSettings.profileNamePlaceholder')}
                  value={formProfile.name}
                  onChange={(e) => setFormProfile({ ...formProfile, name: e.target.value })}
                />
              </div>

              {/* Display Name / Nickname */}
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-sm font-medium text-slate-700">
                  {t('appSettings.profileNickname')}
                </Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder={t('appSettings.profileNicknamePlaceholder')}
                  value={formProfile.nickname}
                  onChange={(e) => setFormProfile({ ...formProfile, nickname: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  {t('appSettings.profileEmail')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('appSettings.profileEmailPlaceholder')}
                  value={formProfile.email}
                  onChange={(e) => setFormProfile({ ...formProfile, email: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SettingsIcon className="h-5 w-5 text-sky-600" />
                {t('appSettings.preferences')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Default Base Currency */}
              <div className="space-y-2">
                <Label htmlFor="baseCurrency" className="text-sm font-medium text-slate-700">
                  {t('appSettings.defaultCurrency')}
                </Label>
                <Select
                  id="baseCurrency"
                  value={formPreferences.baseCurrency}
                  onChange={(e) => setFormPreferences({ ...formPreferences, baseCurrency: e.target.value })}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-slate-500">
                  {t('appSettings.defaultCurrencyHelper')}
                </p>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  {t('appSettings.language')}
                </Label>
                <div className="flex items-center gap-3">
                  <LanguageToggle />
                  <span className="text-sm text-slate-500">
                    {locale === 'en' ? 'English' : 'עברית'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {t('appSettings.languageHelper')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Plan Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-sky-600" />
                {t('appSettings.plan')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-slate-900">
                      {t('appSettings.planFree')}
                    </h3>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {t('common.only')}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    {t('appSettings.planFreeDesc')}
                  </p>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      {t('appSettings.planFeatures')}
                    </p>
                    <ul className="space-y-1.5">
                      {[1, 2, 3, 4].map((num) => (
                        <li key={num} className="flex items-center gap-2 text-sm text-slate-600">
                          <Check className="h-4 w-4 text-green-600 shrink-0" />
                          <span>{t(`appSettings.planFeature${num}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full" disabled>
                {t('appSettings.planUpgrade')}
              </Button>
            </CardContent>
          </Card>

          {/* Sharing & Privacy Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-sky-600" />
                {t('appSettings.privacyTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                {t('appSettings.privacyDesc')}
              </p>

              {/* Local Storage */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                    <Shield className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">
                      {t('appSettings.privacyDataLocal')}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {t('appSettings.privacyDataLocalDesc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trip Sharing - Placeholder */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 opacity-60">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-700 mb-1">
                      {t('appSettings.privacySharing')}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {t('appSettings.privacySharingDesc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Export - Placeholder */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 opacity-60">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200">
                    <CreditCard className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-700 mb-1">
                      {t('appSettings.privacyExport')}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {t('appSettings.privacyExportDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Save Button on Mobile */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg md:hidden">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCancel}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

