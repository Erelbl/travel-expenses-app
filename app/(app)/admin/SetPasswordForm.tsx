"use client"

import { useState } from "react"
import { setUserPasswordAction } from "./actions"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Key } from "lucide-react"

export function SetPasswordForm() {
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!email || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "All fields are required" })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" })
      return
    }

    setLoading(true)

    try {
      const result = await setUserPasswordAction({ email, newPassword })

      if (result.error) {
        setMessage({ type: "error", text: result.error })
      } else if (result.success) {
        setMessage({ type: "success", text: `Password updated for ${result.email}` })
        setEmail("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Key className="w-5 h-5 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-800">Set User Password</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="admin-email">User Email</Label>
          <Input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            disabled={loading}
            autoComplete="off"
          />
        </div>

        <div>
          <Label htmlFor="admin-new-password">New Password</Label>
          <Input
            id="admin-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 characters"
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        <div>
          <Label htmlFor="admin-confirm-password">Confirm Password</Label>
          <Input
            id="admin-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <PrimaryButton type="submit" disabled={loading} className="w-full">
          {loading ? "Setting Password..." : "Set Password"}
        </PrimaryButton>
      </form>
    </Card>
  )
}

