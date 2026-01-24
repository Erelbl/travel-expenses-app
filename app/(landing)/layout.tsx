export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div dir="ltr" className="font-marketing">
      {children}
    </div>
  )
}

