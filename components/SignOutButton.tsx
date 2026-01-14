"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useI18n } from "@/lib/i18n/I18nProvider"

export function SignOutButton() {
  const { t } = useI18n()

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/login" })
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
    >
      <LogOut className="h-4 w-4 mr-2" />
      {t("auth.signOut")}
    </Button>
  )
}

