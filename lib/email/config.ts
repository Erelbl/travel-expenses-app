import { Resend } from "resend"

// Centralized email configuration with runtime validation
const EMAIL_FROM = process.env.EMAIL_FROM ?? "TravelWise <no-reply@mail.gettravelwise.com>"

// Runtime validation - log warnings on startup if env vars are missing
if (typeof window === "undefined") {
  if (!process.env.RESEND_API_KEY) {
    console.error("[EMAIL_CONFIG] RESEND_API_KEY is not set. Email sending will fail.")
  }
  if (!process.env.EMAIL_FROM) {
    console.warn("[EMAIL_CONFIG] EMAIL_FROM is not set. Using fallback:", EMAIL_FROM)
  }
}

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured")
  }
  return new Resend(apiKey)
}

export { EMAIL_FROM }

