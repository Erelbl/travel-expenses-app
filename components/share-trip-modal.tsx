"use client"

import { useState, useEffect } from "react"
import { Copy, Check, Link2, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalClose } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trip, MemberRole } from "@/lib/schemas/trip.schema"
import { TripInvite, invitesRepository } from "@/lib/data/local/invites-local.repository"
import { getCurrentUserMember } from "@/lib/utils/permissions"
import { useI18n } from "@/lib/i18n/I18nProvider"

interface ShareTripModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip: Trip
}

export function ShareTripModal({ open, onOpenChange, trip }: ShareTripModalProps) {
  const { t, locale } = useI18n()
  const isRTL = locale === "he"

  const [selectedRole, setSelectedRole] = useState<MemberRole>("viewer")
  const [invites, setInvites] = useState<TripInvite[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // Load existing invites
  useEffect(() => {
    if (open) {
      loadInvites()
    }
  }, [open, trip.id])

  async function loadInvites() {
    const existingInvites = await invitesRepository.getInvitesForTrip(trip.id)
    setInvites(existingInvites)
  }

  async function handleCreateInvite() {
    setCreating(true)
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
      setCreating(false)
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
            
            <p className="text-xs text-slate-500">
              {t("share.linkExpiry")}
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

