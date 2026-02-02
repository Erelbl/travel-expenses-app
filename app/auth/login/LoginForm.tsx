"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { loginAction } from "../actions"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [callbackUrl, setCallbackUrl] = useState("/trips")

  useEffect(() => {
    const urlCallback = searchParams.get("callbackUrl")
    if (urlCallback) {
      setCallbackUrl(urlCallback)
      console.log(`[AUTH_FORM] callbackUrl_detected=${urlCallback}`)
    }
  }, [searchParams])

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    
    // Add callbackUrl to form data
    formData.append("callbackUrl", callbackUrl)

    const result = await loginAction(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    console.log(`[AUTH_FORM] google_signin callbackUrl=${callbackUrl}`)
    await signIn("google", { callbackUrl })
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
        className="w-full h-12 text-base bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {googleLoading ? "Connecting..." : "Continue with Google"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-300" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">Or continue with email</span>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          disabled={loading}
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          disabled={loading}
          className="h-12 text-base"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full h-12 text-base">
        {loading ? "Signing in..." : "Sign in"}
      </Button>

      {/* TODO: Implement password reset */}
      <div className="text-center">
        <a href="#" className="text-sm text-slate-600 hover:text-slate-900">
          Forgot password?
        </a>
      </div>
    </form>
    </div>
  )
}

