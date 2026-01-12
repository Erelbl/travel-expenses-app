import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "success"
  interactive?: boolean
}

function Badge({ className, variant = "default", interactive, ...props }: BadgeProps) {
  const variants = {
    default: "bg-sky-100 text-sky-700 border border-sky-200 hover:bg-sky-200 hover:border-sky-300",
    secondary: "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:border-slate-300",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400",
    destructive: "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 hover:border-red-300",
    success: "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 hover:border-emerald-300",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2",
        variants[variant],
        interactive && "cursor-pointer active:scale-95",
        className
      )}
      {...props}
    />
  )
}

export { Badge }

