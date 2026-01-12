"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, BarChart3, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/I18nProvider"

interface BottomNavProps {
  tripId: string
}

export function BottomNav({ tripId }: BottomNavProps) {
  const { t } = useI18n()
  const pathname = usePathname()

  const links = [
    {
      href: `/trips/${tripId}`,
      label: t('nav.dashboard'),
      icon: Home,
      match: (path: string) => path === `/trips/${tripId}`,
    },
    {
      href: `/trips/${tripId}/add-expense`,
      label: t('nav.add'),
      icon: Plus,
      match: (path: string) => path.includes("/add-expense"),
      primary: true,
    },
    {
      href: `/trips/${tripId}/reports`,
      label: t('nav.reports'),
      icon: BarChart3,
      match: (path: string) => path.includes("/reports"),
    },
    {
      href: `/trips/${tripId}/settings`,
      label: t('nav.settings'),
      icon: Settings,
      match: (path: string) => path.includes("/settings"),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden">
      <div className="flex items-center justify-around h-16">
        {links.map((link) => {
          const isActive = link.match(pathname)
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors",
                link.primary
                  ? "relative -mt-4"
                  : isActive
                  ? "text-sky-600"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              {link.primary ? (
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-sky-600 text-white shadow-md hover:bg-sky-700 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
              ) : (
                <>
                  <Icon className="w-5 h-5" />
                  <span className={cn("text-xs", isActive && "font-medium")}>
                    {link.label}
                  </span>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

