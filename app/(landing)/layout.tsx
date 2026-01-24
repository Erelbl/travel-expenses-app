import { marketingFont } from "@/lib/fonts/marketing-font"

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div dir="ltr" className={marketingFont.className}>
      {children}
    </div>
  )
}

