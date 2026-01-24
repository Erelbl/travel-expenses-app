import { Plus_Jakarta_Sans } from "next/font/google"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div 
      dir="ltr" 
      className={plusJakartaSans.className}
      style={{ fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui' }}
    >
      {children}
    </div>
  )
}

