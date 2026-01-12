import type { Metadata } from "next";
import { Manrope, Heebo } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/top-nav";
import TopographicBackground from "@/components/TopographicBackground";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Default to Hebrew (RTL) - I18nProvider will adjust dynamically
    <html lang="he" dir="rtl" className={`${manrope.variable} ${heebo.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <I18nProvider>
          <TopographicBackground />
          <TopNav />
          <main className="relative z-10">{children}</main>
          <Toaster position="top-center" richColors />
        </I18nProvider>
      </body>
    </html>
  );
}
