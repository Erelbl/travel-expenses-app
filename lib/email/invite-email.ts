import { getResendClient, EMAIL_FROM } from "./config"

interface SendInviteEmailParams {
  to: string
  tripName: string
  inviterName: string
  role: string
  acceptUrl: string
}

export async function sendInviteEmail({
  to,
  tripName,
  inviterName,
  role,
  acceptUrl,
}: SendInviteEmailParams): Promise<void> {
  console.log("[EMAIL] Getting Resend client")
  const resend = getResendClient()
  
  const roleDescription = role === 'editor' 
    ? 'You can view and add expenses to this trip.'
    : 'You can view expenses for this trip.'
  
  console.log("[EMAIL] Sending email", {
    from: EMAIL_FROM,
    to,
    subject: `${inviterName} invited you to join ${tripName}`,
  })
  
  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `${inviterName} invited you to join ${tripName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Trip Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Trip Invitation</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${inviterName}</strong> has invited you to join their trip:
            </p>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h2 style="color: #0f172a; margin: 0 0 10px 0; font-size: 22px;">${tripName}</h2>
              <p style="color: #64748b; margin: 0; font-size: 14px;">
                Role: <strong>${role.charAt(0).toUpperCase() + role.slice(1)}</strong>
              </p>
              <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px;">
                ${roleDescription}
              </p>
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin: 20px 0;">
              To accept this invitation and access the trip, click the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            
            <p style="font-size: 13px; color: #94a3b8; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              This invitation will expire in 7 days. If you don't have a TravelWise account yet, you'll be prompted to create one.
            </p>
            
            <p style="font-size: 12px; color: #cbd5e1; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${acceptUrl}" style="color: #0ea5e9; word-break: break-all;">${acceptUrl}</a>
            </p>
          </div>
        </body>
      </html>
    `,
  })
  
  console.log("[EMAIL] Email sent successfully, result:", result)
}

