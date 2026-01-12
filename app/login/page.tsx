"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageContainer } from "@/components/ui/page-container"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const verify = searchParams.get("verify")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: "/trips",
      })
      setSent(true)
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (sent || verify) {
    return (
      <PageContainer>
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
              <p className="text-slate-600">
                A sign-in link has been sent to your email address.
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-600">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12 text-base"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full h-12 text-base"
            >
              {loading ? "Sending..." : "Send magic link"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            We'll send you a magic link to sign in
          </p>
        </div>
      </div>
    </PageContainer>
  )
}

