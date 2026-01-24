import type { Metadata } from "next";
import { Manrope, Heebo } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { SessionProvider } from "@/components/SessionProvider";

// Font for Latin characters (marketing pages)
const manrope = Manrope({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
  title: "מעקב הוצאות נסיעות | TravelWise",
  description: "מעקב הוצאות נסיעות מודרני לטיולים שלך",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TravelWise",
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${heebo.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <SessionProvider>
          <I18nProvider>
            <main className="relative z-10">{children}</main>
            <Toaster position="top-center" richColors />
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
