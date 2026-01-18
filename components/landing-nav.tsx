"use client"

import Link from "next/link"
import { Plane } from "lucide-react"

export function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-7xl">
        <Link href="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
          <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-1.5 sm:p-2 rounded-lg">
            <Plane className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <span>TravelWise</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/auth/login"
            className="text-slate-600 hover:text-slate-900 font-medium transition-colors text-sm sm:text-base"
          >
            Log in
          </Link>
          <Link
            href="/auth/login"
            className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold hover:from-sky-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  )
}

