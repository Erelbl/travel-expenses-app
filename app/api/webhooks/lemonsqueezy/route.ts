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

  // Log raw fields to help diagnose payload shape
  console.log(`[lemonsqueezy] event=${eventName} dataId=${String(data?.id ?? "")}`)
  console.log(`[lemonsqueezy] attributes keys=${Object.keys(attributes ?? {}).join(",")}`)

  if (eventName === "order_created") {
    console.log("[lemonsqueezy] order_created – no-op")
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

  // Try both known email field locations in Lemon payload
  const customerEmail: string =
    (attributes?.user_email as string | undefined) ??
    (attributes?.customer_email as string | undefined) ??
    ""

  const variantName: string =
    (attributes?.variant_name as string | undefined) ?? ""

  const rawStatus = (attributes?.status as string | undefined) ?? ""

  const isCancelled =
    eventName === "subscription_cancelled" || rawStatus === "cancelled"

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
    `[lemonsqueezy] parsed: event=${eventName} subscriptionId=${subscriptionId} email="${customerEmail}" variantName="${variantName}" rawStatus=${rawStatus} derivedPlan=${plan} subscriptionStatus=${subscriptionStatus}`,
  )

  if (!customerEmail) {
    console.warn("[lemonsqueezy] No customer email in payload – skipping DB update")
    return NextResponse.json({ ok: true })
  }

  // User lookup
  const existingUser = await prisma.user.findUnique({
    where: { email: customerEmail },
    select: { id: true, plan: true },
  })

  console.log(
    `[lemonsqueezy] user lookup email="${customerEmail}" found=${existingUser !== null} userId=${existingUser?.id ?? "n/a"} currentPlan=${existingUser?.plan ?? "n/a"}`,
  )

  if (!existingUser) {
    console.log(`[lemonsqueezy] User not found for email: ${customerEmail} – returning 200`)
    return NextResponse.json({ ok: true })
  }

  console.log(
    `[lemonsqueezy] updating user ${existingUser.id}: plan ${existingUser.plan} -> ${plan}`,
  )

  const updated = await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      plan,
      subscriptionStatus,
      lemonSubscriptionId: subscriptionId || null,
      lemonCustomerEmail: customerEmail,
    },
    select: { id: true, plan: true, subscriptionStatus: true },
  })

  console.log(
    `[lemonsqueezy] update confirmed: userId=${updated.id} plan=${updated.plan} subscriptionStatus=${updated.subscriptionStatus}`,
  )

  return NextResponse.json({ ok: true })
}
