import { TopNav } from "@/components/top-nav"
import TopographicBackground from "@/components/TopographicBackground"
import { InstallBanner } from "@/components/pwa/InstallBanner"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div dir="rtl" className="font-app">
      <TopographicBackground />
      <TopNav />
      {children}
      <InstallBanner />
    </div>
  )
}

