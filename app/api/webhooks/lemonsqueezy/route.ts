import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Derive plan from product_name (preferred) or variant_name (fallback).
 * variant_name is often "Default" in live payloads — do not rely on it alone.
 */
function derivePlanFromNames(productName: string, variantName: string): "plus" | "pro" | null {
  const combined = `${productName} ${variantName}`
  if (combined.includes("Pro")) return "pro"
  if (combined.includes("Plus")) return "plus"
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

  // --- Extract identity fields ---

  // Preferred: user_id injected into custom_data at checkout creation
  const customData = meta?.custom_data as Record<string, unknown> | undefined
  const customUserId = String(customData?.user_id ?? "").trim()

  // Fallback: email from payload attributes
  const customerEmail: string =
    String(
      (attributes?.user_email as string | undefined) ??
      (attributes?.customer_email as string | undefined) ??
      ""
    ).trim()

  // --- Plan signal fields ---
  const productName: string = String(attributes?.product_name ?? "").trim()
  const variantName: string = String(attributes?.variant_name ?? "").trim()
  const variantId: string = String(attributes?.variant_id ?? "").trim()
  const rawStatus: string = String(attributes?.status ?? "").trim()
  const subscriptionId = String(data?.id ?? "")

  // ends_at is present for cancelled/expired subscriptions
  const endsAtRaw = attributes?.ends_at as string | undefined | null
  // renews_at is present for active subscriptions (next billing date)
  const renewsAtRaw = attributes?.renews_at as string | undefined | null

  console.log(
    `[lemonsqueezy] event=${eventName} dataId=${subscriptionId} customUserId="${customUserId}" email="${customerEmail}" productName="${productName}" variantName="${variantName}" variantId=${variantId} rawStatus=${rawStatus} ends_at=${endsAtRaw ?? "n/a"} renews_at=${renewsAtRaw ?? "n/a"}`,
  )

  // Events we handle
  const HANDLED_EVENTS = [
    "order_created",
    "subscription_created",
    "subscription_updated",
    "subscription_cancelled",
    "subscription_resumed",
    "subscription_expired",
  ]
  if (!HANDLED_EVENTS.includes(eventName)) {
    console.log(`[lemonsqueezy] Unhandled event: ${eventName} – no-op`)
    return NextResponse.json({ ok: true })
  }

  // --- User lookup: prefer by user_id, fallback to email ---
  type ExistingUser = { id: string; plan: string; lemonSubscriptionId: string | null }
  let existingUser: ExistingUser | null = null

  if (customUserId) {
    existingUser = await prisma.user.findUnique({
      where: { id: customUserId },
      select: { id: true, plan: true, lemonSubscriptionId: true },
    })
    console.log(
      `[lemonsqueezy] user lookup by id="${customUserId}" found=${existingUser !== null} currentPlan=${existingUser?.plan ?? "n/a"}`,
    )
  }

  if (!existingUser && customerEmail) {
    existingUser = await prisma.user.findUnique({
      where: { email: customerEmail },
      select: { id: true, plan: true, lemonSubscriptionId: true },
    })
    console.log(
      `[lemonsqueezy] user lookup by email="${customerEmail}" found=${existingUser !== null} currentPlan=${existingUser?.plan ?? "n/a"}`,
    )
  }

  if (!existingUser) {
    console.warn(
      `[lemonsqueezy] No user found for customUserId="${customUserId}" email="${customerEmail}" – returning 200`,
    )
    return NextResponse.json({ ok: true })
  }

  // --- Guard: subscription ID mismatch for cancel/expire ---
  // If the incoming subscription is not the user's current active one, ignore it
  // (e.g. old Plus sub cancellation arriving after a Pro upgrade).
  if (
    eventName === "subscription_cancelled" ||
    eventName === "subscription_expired" ||
    rawStatus === "cancelled" ||
    rawStatus === "expired"
  ) {
    const currentSubId = existingUser.lemonSubscriptionId ?? ""
    if (currentSubId && currentSubId !== subscriptionId) {
      console.log(
        `[lemonsqueezy] ${eventName}: subscriptionId=${subscriptionId} does NOT match currentLemonSubscriptionId=${currentSubId} – ignoring to prevent erroneous downgrade`,
      )
      return NextResponse.json({ ok: true })
    }
  }

  // --- Derive what to store ---
  let planToStore: "free" | "plus" | "pro"
  let newStatus: string
  let newEndsAt: Date | null = null
  let newRenewsAt: Date | null = null
  let clearSubscriptionId = false

  if (eventName === "subscription_expired" || rawStatus === "expired") {
    // Subscription fully expired — downgrade to free now
    planToStore = "free"
    newStatus = "expired"
    clearSubscriptionId = true
    console.log(`[lemonsqueezy] ${eventName}: subscription expired – downgrading to free`)
  } else if (eventName === "subscription_resumed") {
    // User re-activated their subscription
    const derived = derivePlanFromNames(productName, variantName)
    if (!derived) {
      console.warn(
        `[lemonsqueezy] resumed: Could not derive plan from productName="${productName}" variantName="${variantName}" – skipping`,
      )
      return NextResponse.json({ ok: true })
    }
    planToStore = derived
    newStatus = "active"
    console.log(`[lemonsqueezy] ${eventName}: subscription resumed – restoring plan=${planToStore}`)
  } else if (
    eventName === "subscription_cancelled" ||
    rawStatus === "cancelled"
  ) {
    // Cancelled but still active until ends_at.
    // Keep the paid plan — user has access until the billing period ends.
    const derived = derivePlanFromNames(productName, variantName)
    planToStore = derived ?? (existingUser.plan as "free" | "plus" | "pro")
    newStatus = "cancelled"
    newEndsAt = endsAtRaw ? new Date(endsAtRaw) : null
    console.log(
      `[lemonsqueezy] ${eventName}: cancelled – keeping plan=${planToStore} until endsAt=${newEndsAt?.toISOString() ?? "unknown"}`,
    )
  } else {
    // subscription_created / subscription_updated / order_created — active purchase
    const derived = derivePlanFromNames(productName, variantName)
    if (!derived) {
      console.warn(
        `[lemonsqueezy] Could not derive plan from productName="${productName}" variantName="${variantName}" – skipping update`,
      )
      return NextResponse.json({ ok: true })
    }
    planToStore = derived
    newStatus = "active"
    newRenewsAt = renewsAtRaw ? new Date(renewsAtRaw) : null
    console.log(`[lemonsqueezy] ${eventName}: active – setting plan=${planToStore} renews_at=${newRenewsAt?.toISOString() ?? "n/a"}`)
  }

  console.log(
    `[lemonsqueezy] updating userId=${existingUser.id}: plan ${existingUser.plan} -> ${planToStore} status=${newStatus}`,
  )

  const updated = await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      plan: planToStore,
      subscriptionStatus: newStatus,
      lemonSubscriptionId: clearSubscriptionId ? null : (subscriptionId || null),
      lemonCustomerEmail: customerEmail || null,
      subscriptionEndsAt: newEndsAt,
      subscriptionRenewsAt: newRenewsAt,
    },
    select: { id: true, plan: true, subscriptionStatus: true, subscriptionEndsAt: true, subscriptionRenewsAt: true },
  })

  console.log(
    `[lemonsqueezy] update confirmed: userId=${updated.id} plan=${updated.plan} status=${updated.subscriptionStatus} endsAt=${updated.subscriptionEndsAt?.toISOString() ?? "n/a"} renewsAt=${updated.subscriptionRenewsAt?.toISOString() ?? "n/a"}`,
  )

  return NextResponse.json({ ok: true })
}
