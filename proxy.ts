import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  try {
    const { pathname } = req.nextUrl
    const isLoggedIn = !!req.auth

    // Public paths that don't require authentication
    const publicPaths = ["/login", "/api/auth"]
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // If accessing protected path without auth, redirect to login
    if (!isPublicPath && !isLoggedIn) {
      const loginUrl = new URL("/login", req.url)
      return NextResponse.redirect(loginUrl)
    }

    // If accessing login while authenticated, redirect to trips
    if (pathname === "/login" && isLoggedIn) {
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
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)"
  ],
}

