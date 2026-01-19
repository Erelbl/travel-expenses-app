"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"
import { useI18n } from "@/lib/i18n/I18nProvider"

export function OfflineBanner() {
  const { t } = useI18n()
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
      <div className="container mx-auto max-w-4xl flex items-center gap-2 text-sm">
        <WifiOff className="h-4 w-4 text-amber-600 shrink-0" />
        <div>
          <span className="font-medium text-amber-900">{t('common.offline')}</span>
          <span className="text-amber-700 mx-1">•</span>
          <span className="text-amber-700">{t('common.offlineMessage')}</span>
        </div>
      </div>
    </div>
  )
}

