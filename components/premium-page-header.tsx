import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PremiumPageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PremiumPageHeader({ title, description, action, className }: PremiumPageHeaderProps) {
  return (
    <div className={cn("mb-8 animate-fade-in", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 drop-shadow-sm md:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="text-base text-slate-700 drop-shadow-sm md:text-lg">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

