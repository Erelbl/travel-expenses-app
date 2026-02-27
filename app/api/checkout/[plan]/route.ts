import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getEffectivePlanForUser } from "@/lib/billing/plan"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ plan: string }> }
) {
  const { plan } = await params
  const pricingUrl = new URL("/pricing", request.url).toString()

  const session = await auth()
  if (!session?.user?.id) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", "/pricing")
    return NextResponse.redirect(loginUrl.toString())
  }

  const effectivePlan = await getEffectivePlanForUser(session.user.id)

  // Already on this plan or better — redirect back to pricing
  if (plan === "plus" && (effectivePlan === "plus" || effectivePlan === "pro")) {
    return NextResponse.redirect(pricingUrl)
  }
  if (plan === "pro" && effectivePlan === "pro") {
    return NextResponse.redirect(pricingUrl)
  }

  const checkoutUrl =
    plan === "plus"
      ? process.env.LEMONSQUEEZY_PLUS_CHECKOUT_URL
      : plan === "pro"
      ? process.env.LEMONSQUEEZY_PRO_CHECKOUT_URL
      : undefined

  if (!checkoutUrl) {
    return NextResponse.redirect(pricingUrl)
  }

  // Append Lemon Squeezy email prefill param
  const email = session.user.email
  let finalUrl = checkoutUrl
  if (email) {
    try {
      const url = new URL(checkoutUrl)
      url.searchParams.set("checkout[email]", email)
      finalUrl = url.toString()
    } catch {
      // Malformed URL — proceed without prefill
    }
  }

  return NextResponse.redirect(finalUrl)
}
