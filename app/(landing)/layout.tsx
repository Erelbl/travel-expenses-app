export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html dir="ltr" lang="en">
      <body>{children}</body>
    </html>
  )
}

