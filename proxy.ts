import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  try {
    const { pathname } = req.nextUrl
    
    // Skip static files
    if (pathname.includes('.')) {
      return NextResponse.next()
    }
    
    const isLoggedIn = !!req.auth

    // Public paths that don't require authentication
    const publicPaths = ["/login", "/auth/login", "/auth/signup", "/auth/verify"]
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

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
    // Never crash - always allow request through
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

