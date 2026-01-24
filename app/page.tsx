import { LandingNav } from "@/components/landing-nav"
import { LandingPage } from "./(landing)/landing-page"

export default async function HomePage() {
  // Landing page is public - accessible to everyone
  return (
    <>
      <LandingNav variant="marketing" />
      <LandingPage />
    </>
  )
}

