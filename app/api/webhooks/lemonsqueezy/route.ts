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

  console.log(
    `[lemonsqueezy] event=${eventName} dataId=${subscriptionId} customUserId="${customUserId}" email="${customerEmail}" productName="${productName}" variantName="${variantName}" variantId=${variantId} rawStatus=${rawStatus}`,
  )

  // Events that do nothing
  if (
    eventName !== "order_created" &&
    eventName !== "subscription_created" &&
    eventName !== "subscription_updated" &&
    eventName !== "subscription_cancelled"
  ) {
    console.log(`[lemonsqueezy] Unhandled event: ${eventName} – no-op`)
    return NextResponse.json({ ok: true })
  }

  const isCancelled =
    eventName === "subscription_cancelled" || rawStatus === "cancelled"

  // Derive plan
  let plan: "free" | "plus" | "pro" = "free"
  let subscriptionStatus = "active"

  if (isCancelled) {
    plan = "free"
    subscriptionStatus = "cancelled"
  } else {
    const derived = derivePlanFromNames(productName, variantName)
    if (derived) {
      plan = derived
    } else {
      // Cannot determine plan — log and skip to avoid wiping existing plan
      console.warn(
        `[lemonsqueezy] Could not derive plan from productName="${productName}" variantName="${variantName}" – skipping update`,
      )
      return NextResponse.json({ ok: true })
    }
    subscriptionStatus = "active"
  }

  console.log(`[lemonsqueezy] derivedPlan=${plan} subscriptionStatus=${subscriptionStatus}`)

  // --- User lookup: prefer by user_id, fallback to email ---
  let existingUser: { id: string; plan: string; lemonSubscriptionId: string | null } | null = null

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

  // Guard: on cancellation, only downgrade if the cancelled subscription is the
  // user's CURRENT active subscription. Upgrading Plus → Pro fires a cancellation
  // for the old Plus sub — that must NOT wipe the new Pro plan.
  if (isCancelled) {
    const currentSubId = existingUser.lemonSubscriptionId ?? ""
    if (currentSubId && currentSubId !== subscriptionId) {
      console.log(
        `[lemonsqueezy] cancelled: subscriptionId=${subscriptionId} does NOT match currentLemonSubscriptionId=${currentSubId} – ignoring to prevent downgrade`,
      )
      return NextResponse.json({ ok: true })
    }
    console.log(
      `[lemonsqueezy] cancelled: subscriptionId=${subscriptionId} matches current – proceeding with downgrade to free`,
    )
  }

  console.log(
    `[lemonsqueezy] updating userId=${existingUser.id}: plan ${existingUser.plan} -> ${plan}`,
  )

  const updated = await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      plan,
      subscriptionStatus,
      lemonSubscriptionId: subscriptionId || null,
      lemonCustomerEmail: customerEmail || null,
    },
    select: { id: true, plan: true, subscriptionStatus: true },
  })

  console.log(
    `[lemonsqueezy] update confirmed: userId=${updated.id} plan=${updated.plan} subscriptionStatus=${updated.subscriptionStatus}`,
  )

  return NextResponse.json({ ok: true })
}
