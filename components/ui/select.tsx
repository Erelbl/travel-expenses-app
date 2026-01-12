import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  errorMessage?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, errorMessage, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          className={cn(
            "premium-input flex h-10 w-full px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error && errorMessage && (
          <p className="mt-1.5 text-xs text-red-600 rtl:text-right">{errorMessage}</p>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }

