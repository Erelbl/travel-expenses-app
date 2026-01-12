import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "container mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PageContainer.displayName = "PageContainer"

export { PageContainer }

