"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Link2, Copy, Check, Users } from "lucide-react"
import { toast } from "sonner"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { tripsRepository, ratesRepository } from "@/lib/data"
import { Trip, TripMember, MemberRole } from "@/lib/schemas/trip.schema"
import { ExchangeRate } from "@/lib/schemas/exchange-rate.schema"
import { CURRENCIES, getCurrencySymbol } from "@/lib/utils/currency"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { TripInvite, invitesRepository } from "@/lib/data/local/invites-local.repository"
import { getCurrentUserMember, canShareTrip } from "@/lib/utils/permissions"

export default function TripSettingsPage() {
  const { t, locale } = useI18n()
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const isRTL = locale === 'he'

  const [trip, setTrip] = useState<Trip | null>(null)
  const [rates, setRates] = useState<ExchangeRate | null>(null)
  const [editingRates, setEditingRates] = useState<Record<string, string>>({})
  const [newMember, setNewMember] = useState({ name: "", role: "viewer" as MemberRole })
  
  // Sharing state
  const [invites, setInvites] = useState<TripInvite[]>([])
  const [selectedRole, setSelectedRole] = useState<MemberRole>("viewer")
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [tripId])

  async function loadData() {
    const [tripData, ratesData] = await Promise.all([
      tripsRepository.getTrip(tripId),
      ratesRepository.getRates("USD"), // Load default rates
    ])

    if (!tripData) {
      router.push("/trips")
      return
    }

    setTrip(tripData)
    
    // Load rates for trip's base currency
    const tripRates = await ratesRepository.getRates(tripData.baseCurrency)
    if (tripRates) {
      setRates(tripRates)
      // Initialize editing state
      const initial: Record<string, string> = {}
      Object.entries(tripRates.rates).forEach(([currency, rate]) => {
        initial[currency] = rate.toString()
      })
      setEditingRates(initial)
    }
    
    // Load invites
    const existingInvites = await invitesRepository.getInvitesForTrip(tripId)
    setInvites(existingInvites)
  }

  async function handleSaveRates() {
    if (!trip || !rates) return

    try {
      const newRates: Record<string, number> = {}
      Object.entries(editingRates).forEach(([currency, value]) => {
        const rate = parseFloat(value)
        if (!isNaN(rate) && rate > 0) {
          newRates[currency] = rate
        }
      })

      await ratesRepository.setRates(trip.baseCurrency, newRates)
      toast.success(t('settings.ratesSaved'))
      loadData()
    } catch (error) {
      console.error("Failed to save rates:", error)
      toast.error(t('settings.ratesSaveError'))
    }
  }

  async function handleAddMember() {
    if (!trip || !newMember.name.trim()) {
      toast.error(t('settings.memberNameRequired'))
      return
    }

    try {
      const updatedMembers = [
        ...trip.members,
        {
          id: crypto.randomUUID(),
          name: newMember.name.trim(),
          role: newMember.role,
        },
      ]

      await tripsRepository.updateTrip(tripId, { members: updatedMembers })
      toast.success(t('settings.memberAdded'))
      setNewMember({ name: "", role: "viewer" })
      loadData()
    } catch (error) {
      console.error("Failed to add member:", error)
      toast.error(t('settings.ratesSaveError'))
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!trip) return

    // Don't allow removing the last owner
    const owners = trip.members.filter((m) => m.role === "owner")
    const memberToRemove = trip.members.find((m) => m.id === memberId)
    
    if (memberToRemove?.role === "owner" && owners.length === 1) {
      toast.error(t('settings.memberNameRequired'))
      return
    }

    try {
      const updatedMembers = trip.members.filter((m) => m.id !== memberId)
      await tripsRepository.updateTrip(tripId, { members: updatedMembers })
      toast.success(t('settings.memberRemoved'))
      loadData()
    } catch (error) {
      console.error("Failed to remove member:", error)
      toast.error(t('settings.ratesSaveError'))
    }
  }

  // Invite functions
  async function handleCreateInvite() {
    if (!trip) return
    setCreatingInvite(true)
    try {
      const currentUser = getCurrentUserMember(trip)
      const invite = await invitesRepository.createInvite(
        trip.id,
        trip.name,
        selectedRole,
        currentUser?.name || "Owner"
      )
      
      setInvites([...invites, invite])
      
      // Copy link immediately
      const url = invitesRepository.getInviteUrl(invite.id)
      await navigator.clipboard.writeText(url)
      setCopiedId(invite.id)
      setTimeout(() => setCopiedId(null), 2000)
      
      toast.success(t("share.linkCreated"))
    } catch (error) {
      console.error("Failed to create invite:", error)
      toast.error(t("share.error"))
    } finally {
      setCreatingInvite(false)
    }
  }

  async function handleCopyLink(inviteId: string) {
    try {
      const url = invitesRepository.getInviteUrl(inviteId)
      await navigator.clipboard.writeText(url)
      setCopiedId(inviteId)
      setTimeout(() => setCopiedId(null), 2000)
      toast.success(t("share.linkCopied"))
    } catch (error) {
      toast.error(t("share.copyError"))
    }
  }

  async function handleDeleteInvite(inviteId: string) {
    try {
      await invitesRepository.deleteInvite(inviteId)
      setInvites(invites.filter((i) => i.id !== inviteId))
      toast.success(t("share.linkDeleted"))
    } catch (error) {
      toast.error(t("share.error"))
    }
  }

  function formatExpiry(expiresAt: number): string {
    const days = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
    if (days <= 0) return t("share.expired")
    if (days === 1) return t("share.expiresIn1Day")
    return t("share.expiresInDays", { days: days.toString() })
  }

  // Role translation helper
  function getRoleLabel(role: MemberRole): string {
    switch (role) {
      case "owner": return t('settings.roleOwner')
      case "editor": return t('settings.roleEditor')
      case "viewer": return t('settings.roleViewer')
      default: return role
    }
  }

  if (!trip) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl pb-20 md:pb-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/trips/${tripId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{t('settings.title')}</h1>
          <p className="text-sm text-muted-foreground">{trip.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rates" className="p-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rates">{t('settings.rates')}</TabsTrigger>
          <TabsTrigger value="members">{t('settings.members')}</TabsTrigger>
          <TabsTrigger value="sharing">{t('settings.sharing')}</TabsTrigger>
        </TabsList>

        {/* Rates Tab */}
        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('settings.exchangeRates')} ({trip.baseCurrency})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('settings.ratesHelper')} {trip.baseCurrency}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {CURRENCIES.map((currency) => (
                <div key={currency.code} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">
                      {currency.symbol} {currency.code}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {currency.name}
                    </p>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="Rate"
                      value={editingRates[currency.code] || ""}
                      onChange={(e) =>
                        setEditingRates({
                          ...editingRates,
                          [currency.code]: e.target.value,
                        })
                      }
                      className={isRTL ? 'text-left' : 'text-right'}
                    />
                  </div>
                </div>
              ))}

              <Button onClick={handleSaveRates} className="w-full" size="lg">
                {t('settings.saveRates')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('settings.members')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('settings.subtitle')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Members */}
              <div className="space-y-2">
                {trip.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <Badge variant="outline" className="mt-1">
                        {getRoleLabel(member.role)}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={
                        member.role === "owner" &&
                        trip.members.filter((m) => m.role === "owner").length === 1
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Member */}
              <div className="space-y-3 border-t pt-4">
                <Label>{t('settings.addMember')}</Label>
                <Input
                  placeholder={t('settings.memberNamePlaceholder')}
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                />
                <Select
                  value={newMember.role}
                  onChange={(e) =>
                    setNewMember({ ...newMember, role: e.target.value as MemberRole })
                  }
                >
                  <option value="owner">{t('settings.roleOwner')}</option>
                  <option value="editor">{t('settings.roleEditor')}</option>
                  <option value="viewer">{t('settings.roleViewer')}</option>
                </Select>
                <Button
                  onClick={handleAddMember}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('settings.addMember')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sharing Tab */}
        <TabsContent value="sharing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                {t('share.title')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('share.settingsDesc')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create New Invite */}
              {canShareTrip(trip) && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                  <Label className="text-sm font-semibold text-slate-700">
                    {t("share.createLink")}
                  </Label>
                  
                  <div className="flex gap-3">
                    <Select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
                      className="flex-1"
                    >
                      <option value="viewer">{t("settings.roleViewer")} - {t("share.canView")}</option>
                      <option value="editor">{t("settings.roleEditor")} - {t("share.canAddEdit")}</option>
                    </Select>
                    
                    <Button
                      onClick={handleCreateInvite}
                      disabled={creatingInvite}
                      className="shrink-0"
                    >
                      <Link2 className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {t("share.create")}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-slate-500">
                    {t("share.linkExpiry")}
                  </p>
                  
                  {selectedRole === "editor" && (
                    <p className="text-xs text-amber-600">
                      {t("share.editorWarning")}
                    </p>
                  )}
                </div>
              )}

              {/* Active Links */}
              {invites.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700">
                    {t("share.activeLinks")} ({invites.length})
                  </Label>
                  
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="shrink-0">
                              {getRoleLabel(invite.role)}
                            </Badge>
                            <span className="text-xs text-slate-500 truncate">
                              {formatExpiry(invite.expiresAt)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyLink(invite.id)}
                            className="h-8 w-8"
                          >
                            {copiedId === invite.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteInvite(invite.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Members Summary */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <Label className="text-sm font-semibold text-slate-700">
                  {t("share.currentMembers")} ({trip.members.length})
                </Label>
                
                <div className="space-y-2">
                  {trip.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <span className="font-medium text-slate-900">{member.name}</span>
                      <Badge variant="outline">
                        {getRoleLabel(member.role)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BottomNav tripId={tripId} />
    </div>
  )
}
