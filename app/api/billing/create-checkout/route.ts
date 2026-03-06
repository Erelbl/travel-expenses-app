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

  if (!apiKey || !storeId || !variantId) {
    console.error("[create-checkout] Missing env:", { apiKey: !!apiKey, storeId: !!storeId, variantId: !!variantId })
    return NextResponse.json({ error: "Checkout not configured" }, { status: 503 })
  }

  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_options: { embed: false },
        checkout_data: {
          email: session.user.email,
          custom: { user_id: session.user.id },
        },
        locale: "en",
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
    return NextResponse.json({ error: "Failed to reach checkout provider" }, { status: 502 })
  }

  if (!lsRes.ok) {
    const errText = await lsRes.text()
    console.error("[create-checkout] Lemon API error:", lsRes.status, errText)
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 502 })
  }

  const data = await lsRes.json()
  const checkoutUrl: string | undefined = data?.data?.attributes?.url

  if (!checkoutUrl) {
    console.error("[create-checkout] No URL in Lemon response:", JSON.stringify(data))
    return NextResponse.json({ error: "No checkout URL returned" }, { status: 502 })
  }

  return NextResponse.json({ url: checkoutUrl })
}
