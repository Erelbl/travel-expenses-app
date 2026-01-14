import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  try {
    const { pathname } = req.nextUrl
    
    // Skip static files
    if (pathname.includes('.') && !pathname.startsWith('/api')) {
      return NextResponse.next()
    }
    
    const isLoggedIn = !!req.auth

    // Public paths that don't require authentication
    const publicPaths = ["/login", "/auth/login", "/auth/signup", "/auth/verify", "/api/auth"]
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // For API routes (except /api/auth), return 401 JSON instead of redirecting
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth") && !isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // If accessing protected path without auth, redirect to login
    if (!isPublicPath && !isLoggedIn) {
      const loginUrl = new URL("/auth/login", req.url)
      return NextResponse.redirect(loginUrl)
    }

    // If accessing login/signup while authenticated, redirect to trips
    if ((pathname === "/login" || pathname === "/auth/login" || pathname === "/auth/signup") && isLoggedIn) {
      return NextResponse.redirect(new URL("/trips", req.url))
    }

    return NextResponse.next()
  } catch (error) {
    // Log only in development
    if (process.env.NODE_ENV !== "production") {
      console.error("[Proxy] Error:", error)
    }
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

