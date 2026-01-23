"use client"

import { motion } from "framer-motion"

export default function TripSettingsLoading() {
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
        <div className="container mx-auto max-w-4xl relative">
          <div className="p-4">
            <div className="h-6 w-32 bg-white/20 rounded-lg animate-pulse-slow" />
          </div>
        </div>
      </motion.div>

      {/* Content Skeleton */}
      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Trip Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-6 space-y-4"
        >
          <div className="h-5 w-32 bg-slate-200/80 rounded animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-slate-200/80 rounded animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </div>
              <div className="h-10 w-full bg-slate-200/80 rounded-lg animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Members Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-6 space-y-4"
        >
          <div className="h-5 w-32 bg-slate-200/80 rounded animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-slate-200/80 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-200/80 rounded animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
                <div className="h-3 w-24 bg-slate-200/80 rounded animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

