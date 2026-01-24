'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'pwa-install-dismissed'

export function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      return
    }

    // Check if already installed
    const isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isInstalled) {
      return
    }

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent)
    const isAndroidChrome = /android/.test(userAgent) && /chrome/.test(userAgent)

    if (isIOS && isSafari) {
      setPlatform('ios')
      setShowBanner(true)
    } else if (isAndroidChrome) {
      setPlatform('android')
      
      // Listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setShowBanner(true)
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShowBanner(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    await deferredPrompt.prompt()

    // Wait for the user's response
    const choiceResult = await deferredPrompt.userChoice

    if (choiceResult.outcome === 'accepted' || choiceResult.outcome === 'dismissed') {
      handleDismiss()
    }

    setDeferredPrompt(null)
  }

  if (!showBanner || !platform) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-md">
      <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            {platform === 'android' && (
              <>
                <p className="text-sm font-medium text-white">
                  Install TravelWise
                </p>
                <p className="mt-0.5 text-xs text-blue-100">
                  Add to your home screen for quick access
                </p>
                <button
                  onClick={handleInstall}
                  className="mt-2 rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
                >
                  Install
                </button>
              </>
            )}
            
            {platform === 'ios' && (
              <>
                <p className="text-sm font-medium text-white">
                  Add TravelWise to Home Screen
                </p>
                <p className="mt-1 text-xs text-blue-100">
                  Tap <span className="inline-flex items-center">
                    <svg className="mx-0.5 inline h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .9 2 2z"/>
                    </svg>
                  </span> then "Add to Home Screen"
                </p>
              </>
            )}
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded-md p-1 text-blue-100 transition-colors hover:bg-blue-600 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

