import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ContactClient } from "./ContactClient"

export default async function ContactPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/login")
  }
  
  return <ContactClient userEmail={session.user.email || ""} userId={session.user.id} />
}

