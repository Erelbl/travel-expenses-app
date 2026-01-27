"use client"

import { useState, useEffect } from "react"
import { Copy, Check, Link2, Trash2, Users, Mail } from "lucide-react"
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
  invitedEmail: string
  role: MemberRole
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
  const [invites, setInvites] = useState<TripInvitation[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // Load existing invites
  useEffect(() => {
    if (open) {
      loadInvites()
    }
  }, [open, trip.id])

  async function loadInvites() {
    try {
      const res = await fetch(`/api/trips/${trip.id}/invitations`)
      if (!res.ok) throw new Error("Failed to load invitations")
      const data = await res.json()
      setInvites(data)
    } catch (error) {
      console.error("Failed to load invitations:", error)
    }
  }

  async function handleCreateInvite() {
    if (!invitedEmail.trim()) {
      toast.error("Please enter an email address")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(invitedEmail)) {
      toast.error("Please enter a valid email address")
      return
    }

    setCreating(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitedEmail: invitedEmail.trim().toLowerCase(),
          role: selectedRole,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create invitation")
      }

      const invite = await res.json()
      setInvites([invite, ...invites])
      setInvitedEmail("")
      
      toast.success(t("share.inviteSent"))
    } catch (error) {
      console.error("Failed to create invite:", error)
      toast.error(error instanceof Error ? error.message : t("share.error"))
    } finally {
      setCreating(false)
    }
  }

  async function handleCopyLink(inviteId: string) {
    try {
      const url = `${window.location.origin}/join/${inviteId}`
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
      const res = await fetch(`/api/trips/${trip.id}/invitations/${inviteId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete invitation")

      setInvites(invites.filter((i) => i.id !== inviteId))
      toast.success(t("share.linkDeleted"))
    } catch (error) {
      console.error("Failed to delete invitation:", error)
      toast.error(t("share.error"))
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

  function formatExpiry(expiresAt: number): string {
    const days = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
    if (days <= 0) return t("share.expired")
    if (days === 1) return t("share.expiresIn1Day")
    return t("share.expiresInDays", { days: days.toString() })
  }

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

          {/* Create New Invite */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
            <Label className="text-sm font-semibold text-slate-700">
              {t("share.createLink")}
            </Label>
            
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={invitedEmail}
                  onChange={(e) => setInvitedEmail(e.target.value)}
                  placeholder="colleague@example.com"
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
                  disabled={creating || !invitedEmail.trim()}
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

          {/* Existing Invites */}
          {invites.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">
                {t("share.pendingInvites")} ({invites.length})
              </Label>
              
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 truncate">
                            {invite.invitedEmail}
                          </span>
                          <Badge variant="outline" className="shrink-0">
                            {getRoleLabel(invite.role)}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatExpiry(invite.expiresAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
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

