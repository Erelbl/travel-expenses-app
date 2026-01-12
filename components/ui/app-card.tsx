import * as React from "react"
import { cn } from "@/lib/utils"

export interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "elevated"
}

const AppCard = React.forwardRef<HTMLDivElement, AppCardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "premium-card",
      glass: "glass-effect border border-white/20 shadow-xl",
      elevated: "premium-card shadow-xl hover:shadow-2xl transition-shadow duration-300",
    }

    return (
      <div
        ref={ref}
        className={cn(variants[variant], "animate-scale-in", className)}
        {...props}
      />
    )
  }
)
AppCard.displayName = "AppCard"

const AppCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
    {...props}
  />
))
AppCardHeader.displayName = "AppCardHeader"

const AppCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-slate-900",
      className
    )}
    {...props}
  />
))
AppCardTitle.displayName = "AppCardTitle"

const AppCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-600", className)}
    {...props}
  />
))
AppCardDescription.displayName = "AppCardDescription"

const AppCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
AppCardContent.displayName = "AppCardContent"

export { AppCard, AppCardHeader, AppCardTitle, AppCardDescription, AppCardContent }

