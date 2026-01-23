"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MessageCircle, Send, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/I18nProvider"

interface ContactClientProps {
  userId: string
}

export function ContactClient({ userId }: ContactClientProps) {
  const { locale } = useI18n()
  const router = useRouter()
  const isRTL = locale === 'he'

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(null)

  const phone = "+972543037729"
  const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`

  const MAX_MESSAGE_LENGTH = 2000
  const RATE_LIMIT_SECONDS = 30

  useEffect(() => {
    const stored = localStorage.getItem("lastContactSubmit")
    if (stored) {
      setLastSubmitTime(parseInt(stored, 10))
    }
  }, [])

  const canSubmit = () => {
    if (!lastSubmitTime) return true
    const now = Date.now()
    const diff = (now - lastSubmitTime) / 1000
    return diff > RATE_LIMIT_SECONDS
  }

  const isValid = email.trim().length > 0 && message.trim().length > 0 && message.length <= MAX_MESSAGE_LENGTH

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!canSubmit()) {
      toast.error("אנא המתן לפני שליחת הודעה נוספת")
      return
    }

    if (honeypot) {
      return
    }

    if (!isValid) {
      toast.error("אנא מלא את כל השדות הנדרשים")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          message: message.trim(),
          userId,
          honeypot,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      setSubmitted(true)
      const now = Date.now()
      setLastSubmitTime(now)
      localStorage.setItem("lastContactSubmit", now.toString())

      setName("")
      setMessage("")
    } catch (error) {
      toast.error("אירעה שגיאה בשליחת ההודעה. אנא נסה שוב")
    } finally {
      setSubmitting(false)
    }
  }

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
              <CardTitle className="text-lg">שלח הודעה</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">תודה!</h3>
                    <p className="text-slate-600">
                      ההודעה נשלחה ואחזור אליך בהקדם.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                  >
                    שלח הודעה נוספת
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-slate-600 text-sm">
                    מצאתם באג או יש לכם רעיון לשיפור? אשמח לשמוע
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                      שם (אופציונלי)
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="השם שלך"
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                      אימייל <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium text-slate-700">
                      הודעה <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="מה תרצה לשתף?"
                      required
                      disabled={submitting}
                      rows={6}
                      maxLength={MAX_MESSAGE_LENGTH}
                    />
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>נדרש</span>
                      <span className={message.length > MAX_MESSAGE_LENGTH * 0.9 ? "text-amber-600" : ""}>
                        {message.length} / {MAX_MESSAGE_LENGTH}
                      </span>
                    </div>
                  </div>

                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px" }}
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <Button
                    type="submit"
                    disabled={!isValid || submitting || !canSubmit()}
                    className="w-full"
                  >
                    {submitting ? (
                      "שולח..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 ml-2" />
                        שלח
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="text-center py-4 space-y-2">
            <p className="text-sm text-slate-600">צריך משהו דחוף?</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>שלח הודעה ב-WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
