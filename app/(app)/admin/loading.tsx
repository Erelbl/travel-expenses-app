"use client"

import { motion } from "framer-motion"
import { StatCardSkeleton } from "@/components/ui/skeleton"

export default function AdminLoading() {
  return (
    <div className="min-h-screen pb-20 md:pb-6 bg-gradient-to-b from-sky-100/60 via-blue-100/40 to-slate-50/60">
      {/* Header Skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden bg-gradient-to-br from-sky-400/90 via-blue-500/90 to-indigo-500/90 border-b border-white/10"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTAgMTJjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6bTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L2c+PC9zdmc+')] opacity-20" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="p-4">
            <div className="h-6 w-32 bg-white/20 rounded-lg animate-pulse-slow" />
          </div>
        </div>
      </motion.div>

      {/* Content Skeleton */}
      <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.03, duration: 0.25 }}
            >
              <StatCardSkeleton />
            </motion.div>
          ))}
        </motion.div>

        {/* Table/List Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-6 space-y-4"
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-b-0"
            >
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-slate-200/80 rounded animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
                <div className="h-4 w-1/2 bg-slate-200/80 rounded animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
              </div>
              <div className="w-24 h-9 bg-slate-200/80 rounded-lg animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

