"use client"

import { useI18n } from "@/lib/i18n/I18nProvider"

export function TopNavTitle() {
  const { t } = useI18n()
  return <span>{t('app.name')}</span>
}

