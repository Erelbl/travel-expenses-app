import * as React from "react"
import { Input, InputProps } from "./input"
import { cn } from "@/lib/utils"

export interface DateInputProps extends Omit<InputProps, 'type'> {}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        type="date"
        className={cn("h-10 w-full min-w-0 max-w-full", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
DateInput.displayName = "DateInput"

export { DateInput }

