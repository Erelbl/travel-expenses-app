"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TripsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect /trips to /app (the new dashboard)
    router.replace("/app")
  }, [router])
  
  return null
}

