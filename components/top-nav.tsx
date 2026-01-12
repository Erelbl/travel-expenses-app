"use client"

import Link from "next/link"
import { Plane } from "lucide-react"
import { LanguageToggle } from "./LanguageToggle"
import { useI18n } from "@/lib/i18n/I18nProvider"

export function TopNav() {
  const { t } = useI18n()
  
  return (
    <nav className="relative z-20 border-b border-white/20 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/trips" className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Plane className="h-6 w-6 text-sky-600" />
          <span>{t('app.name')}</span>
        </Link>
        <LanguageToggle />
      </div>
    </nav>
  )
}

