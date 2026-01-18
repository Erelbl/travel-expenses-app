import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { LandingNav } from "@/components/landing-nav"
import { LandingPage } from "./(landing)/landing-page"

export default async function HomePage() {
  const session = await auth()
  
  // If user is logged in, redirect to app
  if (session?.user?.id) {
    redirect("/app")
  }

  // Otherwise show landing page
  return (
    <>
      <LandingNav />
      <LandingPage />
    </>
  )
}

