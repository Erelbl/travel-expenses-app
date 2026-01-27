import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getEffectivePlan, checkReceiptScanEntitlement, getRemainingReceiptScans, type EntitlementUser, type PlanTier } from "@/lib/entitlements"

/**
 * Debug endpoint to verify entitlements work correctly
 * Only available in non-production environments
 */
export async function GET() {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Debug endpoint not available in production" },
      { status: 404 }
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    )
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      isAdmin: true,
      plan: true,
      receiptScansUsed: true,
      receiptScansResetAt: true,
    },
  })

  if (!dbUser) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    )
  }

  const user: EntitlementUser = {
    id: dbUser.id,
    isAdmin: dbUser.isAdmin,
    plan: dbUser.plan && (dbUser.plan === "free" || dbUser.plan === "plus" || dbUser.plan === "pro") 
      ? (dbUser.plan as PlanTier) 
      : undefined,
    receiptScansUsed: dbUser.receiptScansUsed,
    receiptScansResetAt: dbUser.receiptScansResetAt,
  }

  const effectivePlan = getEffectivePlan(user)
  const receiptEntitlement = checkReceiptScanEntitlement(user)
  const remaining = getRemainingReceiptScans(user)

  return NextResponse.json({
    debug: true,
    timestamp: new Date().toISOString(),
    user: {
      id: dbUser.id,
      email: dbUser.email,
      isAdmin: dbUser.isAdmin,
      actualPlan: user.plan || "free",
      effectivePlan,
    },
    receiptScanning: {
      allowed: receiptEntitlement.allowed,
      reason: receiptEntitlement.reason,
      limit: receiptEntitlement.limit,
      used: dbUser.receiptScansUsed,
      remaining,
    },
    explanation: dbUser.isAdmin 
      ? "✓ Admin bypass active - treated as PRO with unlimited features"
      : `Regular user on ${effectivePlan} plan`,
  })
}

