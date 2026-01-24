import { auth } from "@/lib/auth"
import { TopNav } from "@/components/top-nav"
import TopographicBackground from "@/components/TopographicBackground"
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner"
import { InstallBanner } from "@/components/pwa/InstallBanner"
import { prisma } from "@/lib/db"
import { unstable_cache } from "next/cache"

// Cached user verification check (10s cache)
const getUserVerificationStatus = (userId: string) =>
  unstable_cache(
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerified: true },
      });
      return !user?.emailVerified;
    },
    [`user-verification-${userId}`],
    { revalidate: 10, tags: [`user-${userId}`] }
  )();

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();
  let showBanner = false;
  let userId = "";

  if (session?.user?.id) {
    userId = session.user.id;
    showBanner = await getUserVerificationStatus(userId);
  }

  return (
    <div dir="rtl" className="font-app">
      <TopographicBackground />
      <TopNav />
      {showBanner && <EmailVerificationBanner userId={userId} />}
      {children}
      <InstallBanner />
    </div>
  )
}

