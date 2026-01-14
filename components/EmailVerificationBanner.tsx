"use client"

import { useState } from "react"
import { sendVerificationEmail } from "@/app/auth/actions"
import { Button } from "./ui/button"
import { Mail, X } from "lucide-react"

interface EmailVerificationBannerProps {
  userId: string
}

export function EmailVerificationBanner({ userId }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (dismissed) return null

  async function handleSendEmail() {
    setLoading(true)
    setError(null)

    const result = await sendVerificationEmail(userId)

    if (result.error) {
      setError(result.error)
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-green-50 border-b border-green-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">
              Verification email sent! Check your inbox.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-green-600 hover:text-green-800"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Mail className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-800">
            Your email is not verified. Verify to enable sharing and invites.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-red-600">{error}</span>
          )}
          <Button
            size="sm"
            onClick={handleSendEmail}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {loading ? "Sending..." : "Send verification email"}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-800 ml-2"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

