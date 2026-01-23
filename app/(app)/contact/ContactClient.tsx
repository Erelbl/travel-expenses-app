"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, Phone, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/I18nProvider"

export function ContactClient() {
  const { locale } = useI18n()
  const router = useRouter()
  const isRTL = locale === 'he'

  const email = "erel@example.com"
  const phone = "+972-50-000-0000"
  const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`

  return (
    <div className="min-h-screen bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4 p-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">צור קשר / פידבק</h1>
              <p className="text-sm text-slate-500">נשמח לשמוע ממך</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-6 pb-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">יצירת קשר</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                מצאתם באג או יש לכם רעיון לשיפור? אשמח לשמוע
              </p>

              <div className="space-y-3">
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                    <Mail className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">אימייל</div>
                    <div className="text-sm text-slate-600">{email}</div>
                  </div>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">WhatsApp</div>
                    <div className="text-sm text-slate-600">{phone}</div>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <Phone className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">טלפון</div>
                    <div className="text-sm text-slate-600">{phone}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

