export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div dir="ltr" className="font-marketing" style={{ fontFamily: 'var(--font-manrope), system-ui, -apple-system, sans-serif' }}>
      {children}
    </div>
  )
}

