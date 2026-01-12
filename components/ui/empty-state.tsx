import { ReactNode } from "react"
import { Button } from "./button"

interface EmptyStateProps {
  title: string
  message?: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ title, message, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="mb-5">{icon}</div>}
      <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
      {message && <p className="text-base text-slate-600 mb-8 max-w-md leading-relaxed">{message}</p>}
      {action}
    </div>
  )
}

