"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Settings as SettingsIcon, CreditCard, Shield, Check, LogOut, UserCog, Lock } from "lucide-react"
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
import { signOut } from "next-auth/react"
import Link from "next/link"
import { changePasswordAction } from "@/app/auth/actions"
import { updateUserProfileAction } from "./actions"

interface SettingsClientProps {
  isAdmin: boolean
  initialFullName: string
  initialDisplayName: string
  initialEmail: string
  initialBaseCurrency: string
}

export function SettingsClient({ isAdmin, initialFullName, initialDisplayName, initialEmail, initialBaseCurrency }: SettingsClientProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const isRTL = locale === 'he'
  
  const { profile, preferences, setProfile, setPreferences } = usePreferencesStore()
  
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [fullName, setFullName] = useState(initialFullName)
  const [formPreferences, setFormPreferences] = useState({
    ...preferences,
    baseCurrency: initialBaseCurrency,
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    const nameChanged = displayName !== initialDisplayName || fullName !== initialFullName
    const prefsChanged = formPreferences.baseCurrency !== initialBaseCurrency
    setHasChanges(nameChanged || prefsChanged)
  }, [displayName, fullName, formPreferences, initialDisplayName, initialFullName, initialBaseCurrency])

  async function handleSave() {
    setSaving(true)
    try {
      const result = await updateUserProfileAction({
        displayName: displayName,
        fullName: fullName,
        baseCurrency: formPreferences.baseCurrency,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        setProfile({ ...profile, nickname: displayName, name: fullName })
        setPreferences(formPreferences)
        setHasChanges(false)
        toast.success(t('appSettings.savedSuccess'))
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error(t('appSettings.savedError'))
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDisplayName(initialDisplayName)
    setFullName(initialFullName)
    setFormPreferences({
      ...preferences,
      baseCurrency: initialBaseCurrency,
    })
    setHasChanges(false)
  }

  function handleSignOut() {
    signOut({ callbackUrl: "/auth/login" })
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    
    setChangingPassword(true)
    try {
      const result = await changePasswordAction({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Password changed successfully")
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      }
    } catch (error) {
      toast.error("Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  const isPasswordFormValid = 
    passwordForm.currentPassword.length > 0 &&
    passwordForm.newPassword.length >= 8 &&
    passwordForm.newPassword === passwordForm.confirmPassword

  return (
    <div className="min-h-screen bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4 p-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/trips")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{t('appSettings.title')}</h1>
              <p className="text-sm text-slate-500">{t('appSettings.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="gap-1">
                    <UserCog className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('auth.signOut')}</span>
              </Button>
              {hasChanges && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
                    {t('common.cancel')}
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? t('common.saving') : t('common.save')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-6 pb-8">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-sky-600" />
                {t('appSettings.profile')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-2xl font-bold text-white shadow-lg ring-4 ring-sky-100">
                  {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
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

              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium text-slate-700">
                  {t('appSettings.profileNickname')}
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder={t('appSettings.profileNicknamePlaceholder')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  This name is shown across the app
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                  {t('appSettings.profileName')}
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t('appSettings.profileNamePlaceholder')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Your full name (optional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  {t('appSettings.profileEmail')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('appSettings.profileEmailPlaceholder')}
                  value={initialEmail}
                  disabled
                  className="bg-slate-50"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SettingsIcon className="h-5 w-5 text-sky-600" />
                {t('appSettings.preferences')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-sky-600" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
                    Current Password
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    disabled={changingPassword}
                    autoComplete="current-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    disabled={changingPassword}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-slate-500">
                    Must be at least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    disabled={changingPassword}
                    autoComplete="new-password"
                  />
                  {passwordForm.confirmPassword.length > 0 && 
                   passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-xs text-red-600">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={!isPasswordFormValid || changingPassword}
                  className="w-full"
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

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

          <div className="text-center space-y-2 pb-4">
            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                Privacy Policy
              </Link>
              <span className="text-slate-300">•</span>
              <Link href="/terms" className="hover:text-slate-900 transition-colors">
                Terms of Service
              </Link>
              <span className="text-slate-300">•</span>
              <Link href="/contact" className="hover:text-slate-900 transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} TravelWise. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg md:hidden">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

