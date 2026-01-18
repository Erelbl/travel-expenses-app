"use client"

import Link from "next/link"
import { Plane, User } from "lucide-react"
import { LanguageToggle } from "./LanguageToggle"
import { useI18n } from "@/lib/i18n/I18nProvider"

export function TopNav() {
  const { t } = useI18n()
  
  return (
    <nav className="relative z-20 border-b border-white/20 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/app" className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Plane className="h-6 w-6 text-sky-600" />
          <span>{t('app.name')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 transition-colors"
            aria-label="Settings"
          >
            <User className="h-5 w-5 text-slate-700" />
          </Link>
          <LanguageToggle />
        </div>
      </div>
    </nav>
  )
}

