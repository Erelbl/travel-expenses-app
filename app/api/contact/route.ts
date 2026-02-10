import { NextRequest, NextResponse } from "next/server"
import { getResendClient, EMAIL_FROM } from "@/lib/email/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message, userId, honeypot } = body

    // Anti-spam: honeypot check
    if (honeypot) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Validation
    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      )
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    if (typeof message !== "string" || message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long" },
        { status: 400 }
      )
    }

    // Prepare email content
    const timestamp = new Date().toLocaleString("he-IL", {
      timeZone: "Asia/Jerusalem",
    })

    const emailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0369a1;">פנייה חדשה מ-TravelWise</h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${name ? `<p><strong>שם:</strong> ${name}</p>` : ""}
          <p><strong>אימייל:</strong> ${email}</p>
          ${userId ? `<p><strong>User ID:</strong> ${userId}</p>` : ""}
          <p><strong>זמן:</strong> ${timestamp}</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="color: #334155; margin-top: 0;">הודעה:</h3>
          <p style="white-space: pre-wrap; color: #475569;">${message}</p>
        </div>
      </div>
    `

    const emailText = `
פנייה חדשה מ-TravelWise

${name ? `שם: ${name}` : ""}
אימייל: ${email}
${userId ? `User ID: ${userId}` : ""}
זמן: ${timestamp}

הודעה:
${message}
    `

    const resend = getResendClient()
    await resend.emails.send({
      from: EMAIL_FROM,
      to: "blerelbl@gmail.com",
      replyTo: email,
      subject: "[TravelWise] פנייה חדשה מהאפליקציה",
      html: emailHtml,
      text: emailText,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}

