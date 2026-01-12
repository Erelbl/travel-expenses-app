import * as React from "react"
import { cn } from "@/lib/utils"

export interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "sm" | "lg" | "xl"
  variant?: "primary" | "secondary" | "outline" | "ghost"
  loading?: boolean
}

const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, variant = "primary", size = "default", loading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      primary: "premium-button-primary",
      secondary: "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl",
      outline: "border-2 border-slate-300 bg-white/80 text-slate-900 hover:bg-white hover:border-slate-400 shadow-sm hover:shadow-md",
      ghost: "text-slate-700 hover:bg-white/50 hover:text-slate-900",
    }
    
    const sizes = {
      default: "h-11 px-6 py-2.5 text-base",
      sm: "h-9 px-4 py-2 text-sm",
      lg: "h-12 px-8 py-3 text-base",
      xl: "h-14 px-10 py-3.5 text-lg",
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
PrimaryButton.displayName = "PrimaryButton"

export { PrimaryButton }

