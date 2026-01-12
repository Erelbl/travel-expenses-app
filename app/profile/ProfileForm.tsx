"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"

interface ProfileFormProps {
  user: {
    email: string | null
    name: string | null
    nickname: string | null
    image: string | null
    baseCurrency: string
    language: string
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || "",
    nickname: user.nickname || "",
    image: user.image || "",
    baseCurrency: user.baseCurrency,
    language: user.language,
  })

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error("Failed to update profile")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Failed to save profile:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input value={user.email || ""} disabled className="bg-slate-50" />
        </div>

        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your name"
          />
        </div>

        <div>
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            placeholder="Display name"
          />
        </div>

        <div>
          <Label htmlFor="image">Profile Image URL</Label>
          <Input
            id="image"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div>
          <Label htmlFor="baseCurrency">Base Currency</Label>
          <Select
            id="baseCurrency"
            value={formData.baseCurrency}
            onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
          >
            {["USD", "EUR", "GBP", "ILS", "JPY", "AUD", "CAD", "CHF"].map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </Select>
        </div>

        <div>
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

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  )
}

