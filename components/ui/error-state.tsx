"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "./button"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load the data. Please try again.",
  onRetry,
  retryLabel = "Try Again",
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="rounded-full bg-red-50 p-5 mb-5">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
      <p className="text-base text-slate-600 mb-8 max-w-md leading-relaxed">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="lg">
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

// Compact error state for inline use
export function ErrorStateInline({
  message = "Failed to load data",
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-100">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
        <p className="text-sm text-red-700">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

