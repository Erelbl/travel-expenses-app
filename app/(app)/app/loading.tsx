"use client"

import { motion } from "framer-motion"
import { TripCardSkeleton } from "@/components/ui/skeleton"

export default function AppDashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100/60 via-blue-100/40 to-slate-50/60">
      {/* Hero Header Skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden bg-gradient-to-br from-sky-400/90 via-blue-500/90 to-indigo-500/90"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTAgMTJjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L2c+PC9zdmc+')] opacity-20" />
        
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="space-y-3 animate-pulse-slow">
            <div className="h-9 w-64 bg-white/20 rounded-lg" />
            <div className="h-11 w-48 bg-white/30 rounded-lg" />
          </div>
        </div>
      </motion.div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="space-y-6"
        >
          <div className="h-8 w-32 bg-slate-200/80 rounded-lg animate-pulse" />
          
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.25 }}
              >
                <TripCardSkeleton />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

