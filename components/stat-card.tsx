import { Card, CardContent } from "@/components/ui/card"
import { PassportCard } from "@/components/ui/passport-card"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  subtitle?: string
}

export function StatCard({ title, value, icon: Icon, subtitle }: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200 border-t-2 border-t-sky-500/30 rounded-lg p-5 transition-all hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-600 break-words leading-tight">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        <div className="rounded-full bg-sky-50 p-2.5 flex-shrink-0">
          <Icon className="h-5 w-5 text-sky-500" />
        </div>
      </div>
    </div>
  )
}
