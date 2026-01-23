"use client"

import { motion } from "framer-motion"

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100/60 via-blue-100/40 to-slate-50/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-4"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-[0_8px_16px_rgba(15,23,42,0.08)] p-8 space-y-6">
          {/* Logo/Title */}
          <div className="text-center space-y-2">
            <div className="h-8 w-48 mx-auto bg-slate-200/80 rounded-lg animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
            <div className="h-4 w-64 mx-auto bg-slate-200/80 rounded animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.25 }}
                className="space-y-2"
              >
                <div className="h-4 w-20 bg-slate-200/80 rounded animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
                <div className="h-11 w-full bg-slate-200/80 rounded-lg animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Button */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.25 }}
            className="h-11 w-full bg-slate-200/80 rounded-lg animate-pulse relative overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

