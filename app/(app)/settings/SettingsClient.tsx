"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Settings as SettingsIcon, CreditCard, Shield, Check, LogOut, UserCog, Lock, Camera, Infinity as InfinityIcon, Trophy, Loader2 } from "lucide-react"
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
import { getEffectivePlan, getRemainingReceiptScans, getReceiptScanLimit } from "@/lib/entitlements"

interface SettingsClientProps {
  isAdmin: boolean
  initialFullName: string
  initialDisplayName: string
  initialEmail: string
  initialBaseCurrency: string
  initialGender: "male" | "female"
  userPlan: "free" | "plus" | "pro"
  receiptScansUsed: number
  receiptScansResetAt: Date | null
  subscriptionStatus: string | null
  subscriptionEndsAt: Date | null
  subscriptionRenewsAt: Date | null
}

function formatBillingDate(date: Date | null | undefined): string {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function SettingsClient({ 
  isAdmin, 
  initialFullName, 
  initialDisplayName, 
  initialEmail, 
  initialBaseCurrency,
  initialGender,
  userPlan,
  receiptScansUsed,
  receiptScansResetAt,
  subscriptionStatus,
  subscriptionEndsAt,
  subscriptionRenewsAt,
}: SettingsClientProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const isRTL = locale === 'he'
  
  const { profile, preferences, setProfile, setPreferences } = usePreferencesStore()
  
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [fullName, setFullName] = useState(initialFullName)
  const [gender, setGender] = useState<"male" | "female">(initialGender)
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
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [managingSubscription, setManagingSubscription] = useState(false)
  const [updatingPayment, setUpdatingPayment] = useState(false)

  async function handleUpgrade(plan: "plus" | "pro") {
    setCheckoutLoading(plan)
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok || !data?.url) throw new Error(data?.detail || data?.error || "CHECKOUT_URL_MISSING")
      console.log("[billing redirect client]", data.url)
      window.location.assign(data.url)
      // navigation fired — do not reset loading state
    } catch (err) {
      setCheckoutLoading(null)
      toast.error(err instanceof Error ? err.message : "Unable to start checkout.")
    }
  }

  async function handleManageSubscription() {
    setManagingSubscription(true)
    try {
      const res = await fetch("/api/billing/manage-subscription", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data?.portalUrl) {
        if (data?.error === "NO_SUBSCRIPTION") {
          toast.error("No active subscription found.")
        } else {
          throw new Error(data?.error || "PORTAL_URL_MISSING")
        }
        setManagingSubscription(false)
        return
      }
      console.log("[billing manage subscription]", data.portalUrl)
      window.location.assign(data.portalUrl)
      // navigation fired — do not reset loading state
    } catch (err) {
      setManagingSubscription(false)
      toast.error(err instanceof Error ? err.message : "Unable to open subscription portal.")
    }
  }

  async function handleUpdatePaymentMethod() {
    setUpdatingPayment(true)
    try {
      const res = await fetch("/api/billing/manage-subscription", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "PORTAL_URL_MISSING")
      const target = data?.updatePaymentUrl || data?.portalUrl
      if (!target) throw new Error("PORTAL_URL_MISSING")
      console.log("[billing update payment]", target)
      window.location.assign(target)
    } catch (err) {
      setUpdatingPayment(false)
      toast.error(err instanceof Error ? err.message : "Unable to open payment portal.")
    }
  }

  useEffect(() => {
    const nameChanged = displayName !== initialDisplayName || fullName !== initialFullName
    const genderChanged = gender !== initialGender
    const prefsChanged = formPreferences.baseCurrency !== initialBaseCurrency
    setHasChanges(nameChanged || genderChanged || prefsChanged)
  }, [displayName, fullName, gender, formPreferences, initialDisplayName, initialFullName, initialGender, initialBaseCurrency])

  async function handleSave() {
    setSaving(true)
    try {
      const result = await updateUserProfileAction({
        displayName: displayName,
        fullName: fullName,
        baseCurrency: formPreferences.baseCurrency,
        gender: gender,
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
    setGender(initialGender)
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
          {/* Achievements Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-sky-600" />
                {t('achievements.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                {t('achievements.trackProgress')}
              </p>
              <Link href="/settings/achievements">
                <Button variant="outline" className="w-full">
                  {t('achievements.viewAchievements')}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-sky-600" />
                {t('appSettings.profile')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="gender" className="text-sm font-medium text-slate-700">
                  {t('appSettings.profileGender')}
                </Label>
                <Select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "male" | "female")}
                >
                  <option value="male">{t('appSettings.genderMale')}</option>
                  <option value="female">{t('appSettings.genderFemale')}</option>
                </Select>
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
                    <h3 className="text-base font-semibold text-slate-900 capitalize">
                      {isAdmin ? "Pro (Admin)" : userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
                    </h3>
                    {userPlan === "pro" || isAdmin ? (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                        Premium
                      </Badge>
                    ) : userPlan === "plus" ? (
                      <Badge className="bg-sky-50 text-sky-700 border-sky-200">
                        Plus
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Free
                      </Badge>
                    )}
                  </div>
                  {/* Subscription status messaging */}
                  {!isAdmin && (() => {
                    if (userPlan === "free") {
                      return (
                        <p className="text-sm text-slate-500 mb-3">
                          {t('appSettings.planFreeDesc') || "Upgrade to unlock advanced features."}
                        </p>
                      )
                    }

                    const endsAfterToday =
                      subscriptionEndsAt && new Date(subscriptionEndsAt) > new Date()

                    if (subscriptionStatus === "cancelled" && endsAfterToday) {
                      return (
                        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-0.5">
                          <p className="text-sm font-medium text-amber-800">
                            Your subscription has been cancelled.
                          </p>
                          <p className="text-xs text-amber-700">
                            You will keep access until{" "}
                            <span className="font-semibold">{formatBillingDate(subscriptionEndsAt)}</span>.
                          </p>
                        </div>
                      )
                    }

                    if (subscriptionStatus === "expired") {
                      return (
                        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                          <p className="text-sm text-slate-600">Your subscription has expired.</p>
                        </div>
                      )
                    }

                    if (subscriptionStatus === "active") {
                      return (
                        <p className="text-sm text-slate-500 mb-3">
                          {subscriptionRenewsAt ? (
                            <>Renews on <span className="font-medium text-slate-700">{formatBillingDate(subscriptionRenewsAt)}</span></>
                          ) : (
                            userPlan === "plus" ? "For travelers who want more control" : "For power users and teams"
                          )}
                        </p>
                      )
                    }

                    // Fallback: paid plan but no status metadata yet
                    return (
                      <p className="text-sm text-slate-500 mb-3">
                        {userPlan === "plus" ? "For travelers who want more control" : "For power users and teams"}
                      </p>
                    )
                  })()}

                  {isAdmin && (
                    <p className="text-sm text-slate-500 mb-3">For power users and teams</p>
                  )}
                  
                  {/* Receipt Scanning Status */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 shrink-0">
                        <Camera className="h-5 w-5 text-sky-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">
                          Receipt Scanning
                        </h4>
                        {(() => {
                          const effectivePlan = getEffectivePlan({ 
                            id: "current", 
                            isAdmin, 
                            plan: userPlan, 
                            receiptScansUsed, 
                            receiptScansResetAt 
                          })
                          const limit = getReceiptScanLimit(effectivePlan)
                          const remaining = getRemainingReceiptScans({ 
                            id: "current", 
                            isAdmin, 
                            plan: userPlan, 
                            receiptScansUsed, 
                            receiptScansResetAt 
                          })
                          
                          if (limit === 0) {
                            return (
                              <p className="text-xs text-slate-600">
                                Not available on Free plan. Upgrade to Plus or Pro to scan receipts.
                              </p>
                            )
                          } else if (limit === Infinity) {
                            return (
                              <p className="text-xs text-slate-600 flex items-center gap-1">
                                <span className="font-semibold text-green-600">Unlimited</span>
                                <span>receipt scans</span>
                              </p>
                            )
                          } else {
                            return (
                              <p className="text-xs text-slate-600">
                                <span className="font-semibold text-sky-600">{remaining} of {limit}</span> scans remaining this year
                              </p>
                            )
                          }
                        })()}
                      </div>
                    </div>
                  </div>

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

              {/* Upgrade / Manage plan — not shown to admins (they always have Pro) */}
              {!isAdmin && userPlan === "free" && (
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => handleUpgrade("plus")}
                    disabled={checkoutLoading !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-60 disabled:cursor-wait"
                  >
                    {checkoutLoading === "plus" && <Loader2 className="h-4 w-4 animate-spin" />}
                    Upgrade to Plus
                  </button>
                  <button
                    onClick={() => handleUpgrade("pro")}
                    disabled={checkoutLoading !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 disabled:cursor-wait"
                  >
                    {checkoutLoading === "pro" && <Loader2 className="h-4 w-4 animate-spin" />}
                    Upgrade to Pro
                  </button>
                </div>
              )}

              {!isAdmin && userPlan === "plus" && (
                <div className="space-y-2 pt-1">
                  {subscriptionStatus !== "cancelled" && (
                    <button
                      onClick={() => handleUpgrade("pro")}
                      disabled={checkoutLoading !== null || managingSubscription}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 disabled:cursor-wait"
                    >
                      {checkoutLoading === "pro" && <Loader2 className="h-4 w-4 animate-spin" />}
                      Upgrade to Pro
                    </button>
                  )}
                  <button
                    onClick={handleManageSubscription}
                    disabled={managingSubscription || checkoutLoading !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 disabled:cursor-wait"
                  >
                    {managingSubscription && <Loader2 className="h-4 w-4 animate-spin" />}
                    Manage subscription
                  </button>
                  <button
                    onClick={handleUpdatePaymentMethod}
                    disabled={updatingPayment || managingSubscription}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 disabled:cursor-wait"
                  >
                    {updatingPayment && <Loader2 className="h-4 w-4 animate-spin" />}
                    Update payment method
                  </button>
                </div>
              )}

              {!isAdmin && userPlan === "pro" && (
                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleManageSubscription}
                    disabled={managingSubscription}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 disabled:cursor-wait"
                  >
                    {managingSubscription && <Loader2 className="h-4 w-4 animate-spin" />}
                    Manage subscription
                  </button>
                  <button
                    onClick={handleUpdatePaymentMethod}
                    disabled={updatingPayment || managingSubscription}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 disabled:cursor-wait"
                  >
                    {updatingPayment && <Loader2 className="h-4 w-4 animate-spin" />}
                    Update payment method
                  </button>
                </div>
              )}
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

