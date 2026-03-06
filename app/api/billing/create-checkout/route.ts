import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { plan?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { plan } = body
  if (plan !== "plus" && plan !== "pro") {
    return NextResponse.json({ error: "Invalid plan. Must be 'plus' or 'pro'." }, { status: 400 })
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  const variantId =
    plan === "plus"
      ? process.env.LEMONSQUEEZY_PLUS_VARIANT_ID
      : process.env.LEMONSQUEEZY_PRO_VARIANT_ID

  console.log("[create-checkout] plan=%s userId=%s email_present=%s apiKey_present=%s storeId=%s variantId=%s",
    plan,
    session.user.id,
    !!session.user.email,
    !!apiKey,
    storeId ?? "MISSING",
    variantId ?? "MISSING",
  )

  if (!apiKey || !storeId || !variantId) {
    return NextResponse.json(
      { error: "CHECKOUT_NOT_CONFIGURED", detail: `Missing: ${[!apiKey && "LEMONSQUEEZY_API_KEY", !storeId && "LEMONSQUEEZY_STORE_ID", !variantId && `LEMONSQUEEZY_${plan.toUpperCase()}_VARIANT_ID`].filter(Boolean).join(", ")}` },
      { status: 503 }
    )
  }

  // Lemon Squeezy create-checkout payload
  // Ref: https://docs.lemonsqueezy.com/api/checkouts/create-checkout
  // Note: `locale` is NOT a valid top-level attribute — omit it to avoid 422
  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_options: {
          embed: false,
        },
        checkout_data: {
          email: session.user.email,
          custom: {
            user_id: session.user.id,
          },
        },
      },
      relationships: {
        store: { data: { type: "stores", id: storeId } },
        variant: { data: { type: "variants", id: variantId } },
      },
    },
  }

  let lsRes: Response
  try {
    lsRes = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error("[create-checkout] Network error calling Lemon API:", err)
    return NextResponse.json({ error: "CHECKOUT_CREATION_FAILED", detail: "Network error reaching checkout provider" }, { status: 502 })
  }

  if (!lsRes.ok) {
    let errBody = ""
    try {
      errBody = await lsRes.text()
    } catch {
      errBody = "(unreadable)"
    }
    console.error("[create-checkout] Lemon API returned %d: %s", lsRes.status, errBody)
    // Surface a safe subset of the error to help debug (no secrets in errBody)
    return NextResponse.json(
      { error: "CHECKOUT_CREATION_FAILED", detail: `Lemon API ${lsRes.status}`, lemonError: errBody.slice(0, 500) },
      { status: 502 }
    )
  }

  const data = await lsRes.json()
  const checkoutUrl: string | undefined = data?.data?.attributes?.url

  if (!checkoutUrl) {
    console.error("[create-checkout] No URL in Lemon response:", JSON.stringify(data).slice(0, 500))
    return NextResponse.json({ error: "CHECKOUT_CREATION_FAILED", detail: "No checkout URL returned by Lemon" }, { status: 502 })
  }

  console.log("[create-checkout] Success plan=%s", plan)
  return NextResponse.json({ url: checkoutUrl })
}
