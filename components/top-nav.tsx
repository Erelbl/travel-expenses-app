import Link from "next/link"
import Image from "next/image"
import { User } from "lucide-react"
import { TopNavTitle } from "./top-nav-title"

export function TopNav() {
  return (
    <nav className="relative z-20 border-b border-white/20 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/app" className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
          <Image src="/brand/Logo2-png-final.png" alt="TravelWise" width={24} height={24} className="h-6 w-6 rounded-lg" />
          <TopNavTitle />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 transition-colors"
            aria-label="Settings"
          >
            <User className="h-5 w-5 text-slate-700" />
          </Link>
        </div>
      </div>
    </nav>
  )
}

