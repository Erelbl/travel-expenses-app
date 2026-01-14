import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

/**
 * Server-side utility to require verified email for sensitive features.
 * Currently gates: Trip sharing/invites
 * 
 * Usage in server components or server actions:
 * ```ts
 * await requireVerifiedEmail(session.user.id)
 * ```
 * 
 * @throws Redirects to profile page if email not verified
 */
export async function requireVerifiedEmail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) {
    redirect("/profile?error=email-not-verified");
  }
}

/**
 * Check if user has verified email without redirecting.
 * Useful for conditional UI rendering.
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  return !!user?.emailVerified;
}

// TODO: Apply requireVerifiedEmail to:
// - Trip sharing features (when implemented)
// - Trip invite creation/acceptance (when implemented)
// Example usage:
// export async function createTripInvite(tripId: string, email: string) {
//   const session = await auth()
//   if (!session?.user?.id) throw new Error("Unauthorized")
//   await requireVerifiedEmail(session.user.id) // <-- Gate here
//   // ... rest of invite logic
// }

