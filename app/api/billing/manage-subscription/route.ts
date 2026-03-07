import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lemonSubscriptionId: true },
  })

  if (!user?.lemonSubscriptionId) {
    return NextResponse.json({ error: "NO_SUBSCRIPTION" }, { status: 400 })
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  if (!apiKey) {
    console.error("[manage-subscription] LEMONSQUEEZY_API_KEY not set")
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 503 })
  }

  const lemonRes = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${user.lemonSubscriptionId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
      },
    },
  )

  if (!lemonRes.ok) {
    const body = await lemonRes.text().catch(() => "")
    console.error(
      `[manage-subscription] Lemon API error status=${lemonRes.status} body=${body}`,
    )
    return NextResponse.json(
      { error: "LEMON_API_ERROR", status: lemonRes.status },
      { status: 502 },
    )
  }

  const data = await lemonRes.json()
  const urls = data?.data?.attributes?.urls as Record<string, string> | undefined

  const portalUrl: string | null = urls?.customer_portal ?? null
  const updatePaymentUrl: string | null = urls?.update_payment_method ?? null

  if (!portalUrl) {
    console.warn(
      `[manage-subscription] No customer_portal URL in Lemon response for subscriptionId=${user.lemonSubscriptionId}`,
    )
    return NextResponse.json({ error: "NO_PORTAL_URL" }, { status: 502 })
  }

  console.log(
    `[manage-subscription] userId=${userId} subscriptionId=${user.lemonSubscriptionId} portalUrl_present=true`,
  )

  return NextResponse.json({ portalUrl, updatePaymentUrl })
}
