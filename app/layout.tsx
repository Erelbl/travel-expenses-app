import type { Metadata } from "next";
import { Manrope, Heebo } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/top-nav";
import TopographicBackground from "@/components/TopographicBackground";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { auth } from "@/lib/auth";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

// Font for Latin characters
const manrope = Manrope({ 
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

// Font for Hebrew characters
const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "מעקב הוצאות נסיעות | TravelExpense",
  description: "מעקב הוצאות נסיעות מודרני לטיולים שלך",
};

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  let showBanner = false;
  let userId = "";

  if (session?.user?.id) {
    userId = session.user.id;
    showBanner = await getUserVerificationStatus(userId);
  }

  return (
    // Default to Hebrew (RTL) - I18nProvider will adjust dynamically
    <html lang="he" dir="rtl" className={`${manrope.variable} ${heebo.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <I18nProvider>
          <TopographicBackground />
          <TopNav />
          {showBanner && <EmailVerificationBanner userId={userId} />}
          <main className="relative z-10">{children}</main>
          <Toaster position="top-center" richColors />
        </I18nProvider>
      </body>
    </html>
  );
}
