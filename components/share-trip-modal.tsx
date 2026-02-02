"use client"

import { useState, useEffect } from "react"
import { Copy, Check, Link2, Trash2, Users, Mail, X } from "lucide-react"
import { toast } from "sonner"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalClose } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trip, MemberRole } from "@/lib/schemas/trip.schema"
import { useI18n } from "@/lib/i18n/I18nProvider"

interface TripInvitation {
  id: string
  tripId: string
  invitedEmail: string | null
  role: MemberRole
  token: string
  createdAt: number
  expiresAt: number
}

interface ShareTripModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip: Trip
}

export function ShareTripModal({ open, onOpenChange, trip }: ShareTripModalProps) {
  const { t, locale } = useI18n()
  const isRTL = locale === "he"

  const [selectedRole, setSelectedRole] = useState<MemberRole>("viewer")
  const [invitedEmail, setInvitedEmail] = useState("")
  const [currentInvite, setCurrentInvite] = useState<TripInvitation | null>(null)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [revoking, setRevoking] = useState(false)

  // Load current pending invite
  useEffect(() => {
    if (open) {
      loadCurrentInvite()
    }
  }, [open, trip.id])

  async function loadCurrentInvite() {
    try {
      const res = await fetch(`/api/trips/${trip.id}/invitations`)
      if (!res.ok) return
      const data = await res.json()
      // Get the first pending invite (there should only be one)
      if (data && data.length > 0) {
        setCurrentInvite(data[0])
      } else {
        setCurrentInvite(null)
      }
    } catch (error) {
      console.error("Failed to load invitations:", error)
    }
  }

  async function handleCreateInvite() {
    setCreating(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitedEmail: invitedEmail.trim() || null,
          role: selectedRole,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create invitation")
      }

      const result = await res.json()
      setCurrentInvite(result)
      setInvitedEmail("")
      
      // Show appropriate message
      if (result.emailError) {
        toast.warning(t("share.emailFailedWarning"))
      } else if (result.emailSent) {
        toast.success(t("share.inviteSent"))
      } else {
        toast.success(t("share.linkCreated"))
      }
      
      await loadCurrentInvite()
    } catch (error) {
      console.error("Failed to create invite:", error)
      toast.error(error instanceof Error ? error.message : t("share.error"))
    } finally {
      setCreating(false)
    }
  }

  async function handleCopyLink() {
    if (!currentInvite) return
    
    try {
      const url = `${window.location.origin}/invites/${currentInvite.token}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success(t("share.linkCopied"))
    } catch (error) {
      toast.error(t("share.copyError"))
    }
  }

  async function handleWhatsAppShare() {
    if (!currentInvite) return
    
    const url = `${window.location.origin}/invites/${currentInvite.token}`
    const text = `${t("share.whatsappMessage")} ${url}`
    
    // Use Web Share API if available (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: t("share.title"),
          text: text,
        })
        return
      } catch (err) {
        // User cancelled or error - fallback to WhatsApp Web
        if ((err as Error).name === 'AbortError') {
          return
        }
      }
    }
    
    // Fallback to WhatsApp Web for desktop
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  async function handleRevokeInvite() {
    if (!currentInvite) return
    
    if (!confirm(t("share.revokeConfirm"))) return
    
    setRevoking(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}/invitations/${currentInvite.token}/revoke`, {
        method: "POST",
      })

      if (!res.ok) throw new Error("Failed to revoke invitation")

      setCurrentInvite(null)
      toast.success(t("share.linkRevoked"))
    } catch (error) {
      console.error("Failed to revoke invite:", error)
      toast.error(t("share.error"))
    } finally {
      setRevoking(false)
    }
  }

  function getRoleLabel(role: MemberRole): string {
    switch (role) {
      case "owner":
        return t("settings.roleOwner")
      case "editor":
        return t("settings.roleEditor")
      case "viewer":
        return t("settings.roleViewer")
      default:
        return role
    }
  }

  const inviteUrl = currentInvite ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invites/${currentInvite.token}` : ""

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="lg">
      <div dir={isRTL ? "rtl" : "ltr"}>
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-sky-500" />
            {t("share.title")}
          </ModalTitle>
          <ModalClose onClick={() => onOpenChange(false)} />
        </ModalHeader>

        <ModalContent className="space-y-6 max-h-[70vh] overflow-y-auto pb-6">
          {/* Trip Info */}
          <div className="text-center py-2">
            <p className="text-sm text-slate-500">{t("share.sharingTrip")}</p>
            <p className="font-semibold text-lg text-slate-900">{trip.name}</p>
          </div>

          {/* Current Share Link - Always visible */}
          <div className="space-y-3 p-4 bg-sky-50 rounded-xl border border-sky-200">
            <Label className="text-sm font-semibold text-slate-700">
              {t("share.shareLink")}
            </Label>
            
            {currentInvite ? (
              <div className="space-y-3">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="text-sm"
                />
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="flex-1"
                  >
                    {copied ? (
                      <Check className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    ) : (
                      <Copy className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    )}
                    {t("share.copy")}
                  </Button>
                  
                  <Button
                    onClick={handleWhatsAppShare}
                    variant="outline"
                    className="flex-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                  >
                    {t("share.whatsapp")}
                  </Button>
                  
                  <Button
                    onClick={handleRevokeInvite}
                    disabled={revoking}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <X className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t("share.revoke")}
                  </Button>
                </div>
                
                <p className="text-xs text-slate-500">
                  {t("share.linkExpiresInfo")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-3">
                {t("share.createLink")}
              </p>
            )}
          </div>

          {/* Email Invite Section - Always visible */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
            <Label className="text-sm font-semibold text-slate-700">
              {currentInvite ? t("share.sendAnotherInvite") : t("share.createLink")}
            </Label>
            
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={invitedEmail}
                  onChange={(e) => setInvitedEmail(e.target.value)}
                  placeholder={t("share.emailOptional")}
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateInvite()}
                />
              </div>
              
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
                  disabled={creating}
                  className="shrink-0"
                >
                  <Link2 className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t("share.create")}
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-slate-500">
              {t("share.inviteEmailInfo")}
            </p>
            
            {selectedRole === "editor" && (
              <p className="text-xs text-amber-600">
                {t("share.editorWarning")}
              </p>
            )}
          </div>

          {/* Current Members */}
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
        </ModalContent>
      </div>
    </Modal>
  )
}
