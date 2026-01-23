import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ContactClient } from "./ContactClient"

export default async function ContactPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/login")
  }
  
  return <ContactClient userId={session.user.id} />
}

