import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getEffectivePlan, getRemainingReceiptScans, getReceiptScanLimit, type EntitlementUser, type PlanTier } from "@/lib/entitlements"

export async function GET() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
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
  const limit = getReceiptScanLimit(effectivePlan)
  const remaining = getRemainingReceiptScans(user)

  return NextResponse.json({
    plan: effectivePlan,
    limit,
    remaining,
    used: user.receiptScansUsed || 0,
  })
}

