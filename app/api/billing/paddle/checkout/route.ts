import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await req.json()
    const { plan } = body

    if (!plan || (plan !== "plus" && plan !== "pro")) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'plus' or 'pro'" },
        { status: 400 }
      )
    }

    // 3. Get environment variables
    const paddleApiKey = process.env.PADDLE_API_KEY
    const paddleEnv = process.env.PADDLE_ENV || "sandbox"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    if (!paddleApiKey) {
      console.error("[PADDLE] PADDLE_API_KEY not configured")
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      )
    }

    // 4. Map plan to Paddle Price ID
    const priceIdMap = {
      plus: process.env.PADDLE_PRICE_PLUS_YEARLY,
      pro: process.env.PADDLE_PRICE_PRO_YEARLY,
    }

    const priceId = priceIdMap[plan]
    if (!priceId) {
      console.error(`[PADDLE] Price ID not configured for plan: ${plan}`)
      return NextResponse.json(
        { error: "Plan pricing not configured" },
        { status: 500 }
      )
    }

    // 5. Construct Paddle API URL (sandbox or production)
    const paddleApiUrl =
      paddleEnv === "sandbox"
        ? "https://sandbox-api.paddle.com/transactions"
        : "https://api.paddle.com/transactions"

    // 6. Create Paddle transaction/checkout
    const paddleResponse = await fetch(paddleApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${paddleApiKey}`,
      },
      body: JSON.stringify({
        items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        customer_email: session.user.email,
        custom_data: {
          userId: session.user.id,
          plan: plan,
        },
        checkout: {
          url: `${appUrl}/billing/success`,
        },
      }),
    })

    if (!paddleResponse.ok) {
      const errorText = await paddleResponse.text()
      console.error("[PADDLE] API error:", paddleResponse.status, errorText)
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      )
    }

    const data = await paddleResponse.json()

    // 7. Return checkout URL
    const checkoutUrl = data?.data?.checkout?.url
    if (!checkoutUrl) {
      console.error("[PADDLE] No checkout URL in response:", data)
      return NextResponse.json(
        { error: "Invalid response from payment provider" },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error("[PADDLE] Checkout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

