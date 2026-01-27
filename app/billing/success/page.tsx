"use client"

import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Payment successful!
          </h1>
          
          <p className="text-slate-600 mb-2">
            Your subscription has been activated.
          </p>
          
          <p className="text-sm text-slate-500 mb-8">
            (Sandbox mode)
          </p>
          
          <Link
            href="/app"
            className="inline-block w-full bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition-colors"
          >
            Go to app
          </Link>
        </div>
      </div>
    </div>
  )
}

