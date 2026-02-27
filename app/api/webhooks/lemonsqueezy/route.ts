import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

function derivePlan(variantName: string): "plus" | "pro" | null {
  if (variantName.includes("Pro")) return "pro"
  if (variantName.includes("Plus")) return "plus"
  return null
}

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    console.error("[lemonsqueezy] LEMONSQUEEZY_WEBHOOK_SECRET not set")
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
  }

  const rawBody = await req.text()

  const signature =
    req.headers.get("x-signature") ?? req.headers.get("X-Signature") ?? ""

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")

  let signatureValid = false
  try {
    signatureValid = timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex"),
    )
  } catch {
    signatureValid = false
  }

  if (!signatureValid) {
    console.warn("[lemonsqueezy] Invalid signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    console.error("[lemonsqueezy] Failed to parse JSON body")
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const meta = payload.meta as Record<string, unknown> | undefined
  const eventName = (meta?.event_name as string | undefined) ?? ""

  const data = payload.data as Record<string, unknown> | undefined
  const attributes = data?.attributes as Record<string, unknown> | undefined

  if (eventName === "order_created") {
    console.log("[lemonsqueezy] order_created received – no-op")
    return NextResponse.json({ ok: true })
  }

  if (
    eventName !== "subscription_created" &&
    eventName !== "subscription_updated" &&
    eventName !== "subscription_cancelled"
  ) {
    console.log(`[lemonsqueezy] Unhandled event: ${eventName} – no-op`)
    return NextResponse.json({ ok: true })
  }

  const subscriptionId = String(data?.id ?? "")
  const customerEmail =
    (attributes?.user_email as string | undefined) ??
    (attributes?.customer_email as string | undefined) ??
    ""

  const variantName =
    (attributes?.variant_name as string | undefined) ?? ""

  const isCancelled =
    eventName === "subscription_cancelled" ||
    (attributes?.status as string | undefined) === "cancelled"

  let plan: "free" | "plus" | "pro" = "free"
  let subscriptionStatus = "active"

  if (isCancelled) {
    plan = "free"
    subscriptionStatus = "cancelled"
  } else {
    const derived = derivePlan(variantName)
    if (derived) plan = derived
    subscriptionStatus = "active"
  }

  console.log(
    `[lemonsqueezy] event=${eventName} email=${customerEmail} variantName="${variantName}" plan=${plan} status=${subscriptionStatus}`,
  )

  if (!customerEmail) {
    console.warn("[lemonsqueezy] No customer email in payload – skipping DB update")
    return NextResponse.json({ ok: true })
  }

  const user = await prisma.user.findUnique({
    where: { email: customerEmail },
    select: { id: true },
  })

  if (!user) {
    console.log(`[lemonsqueezy] User not found for email: ${customerEmail}`)
    return NextResponse.json({ ok: true })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan,
      subscriptionStatus,
      lemonSubscriptionId: subscriptionId || undefined,
      lemonCustomerEmail: customerEmail || undefined,
    },
  })

  console.log(`[lemonsqueezy] Updated user ${user.id} to plan=${plan}`)

  return NextResponse.json({ ok: true })
}
