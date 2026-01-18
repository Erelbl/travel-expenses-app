"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { CURRENCIES } from "@/lib/utils/currency"
import { logError } from "@/lib/utils/logger"

interface SettingsFormProps {
  user: {
    id: string
    email: string | null
    name: string | null
    nickname: string | null
    image: string | null
    baseCurrency: string
    language: string
  }
}

export function SettingsForm({ user }: SettingsFormProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: user.name || "",
    nickname: user.nickname || "",
    image: user.image || "",
    baseCurrency: user.baseCurrency,
    language: user.language,
  })
  const [saving, setSaving] = useState(false)

  const hasChanges =
    formData.name !== (user.name || "") ||
    formData.nickname !== (user.nickname || "") ||
    formData.image !== (user.image || "") ||
    formData.baseCurrency !== user.baseCurrency ||
    formData.language !== user.language

  async function handleSave() {
    setSaving(true)
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      toast.success(t("profile.updateSuccess") || "Profile updated")
      router.refresh()
    } catch (error) {
      logError("Profile update", error)
      toast.error(t("profile.updateError") || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-sky-600" />
          Profile & Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email (read-only)</Label>
          <Input id="email" type="email" value={user.email || ""} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Image URL</Label>
          <Input
            id="image"
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="baseCurrency">Base Currency</Label>
          <Select
            id="baseCurrency"
            value={formData.baseCurrency}
            onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.code} - {currency.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select
            id="language"
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="he">עברית</option>
          </Select>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

