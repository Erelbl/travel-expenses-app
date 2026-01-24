export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div dir="ltr" className="font-[family-name:var(--font-manrope)]">
      {children}
    </div>
  )
}

