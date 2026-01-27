"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const Popover = ({ open, onOpenChange, children }: PopoverProps) => {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, onOpenChange])

  return <div ref={ref}>{children}</div>
}

interface PopoverTriggerProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

const PopoverTrigger = ({ children, onClick, className }: PopoverTriggerProps) => {
  return (
    <div onClick={onClick} className={className}>
      {children}
    </div>
  )
}

interface PopoverContentProps {
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end"
}

const PopoverContent = ({ children, className, align = "start" }: PopoverContentProps) => {
  return (
    <div
      className={cn(
        "absolute z-50 mt-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Popover, PopoverTrigger, PopoverContent }

