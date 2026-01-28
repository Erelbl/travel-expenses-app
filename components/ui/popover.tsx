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

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleEscape)
      }
    }
  }, [open, onOpenChange])

  return <div ref={ref} className="relative">{children}</div>
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
  side?: "top" | "bottom" | "left" | "right"
  sideOffset?: number
}

const PopoverContent = ({ children, className, align = "start", side = "bottom", sideOffset = 0 }: PopoverContentProps) => {
  return (
    <div
      className={cn(
        "absolute z-50 rounded-md border border-slate-200 bg-white shadow-md outline-none animate-in fade-in-0 zoom-in-95",
        side === "bottom" && "mt-2",
        side === "top" && "mb-2 bottom-full",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className
      )}
      style={{
        marginTop: side === "bottom" ? `${8 + sideOffset}px` : undefined,
        marginBottom: side === "top" ? `${8 + sideOffset}px` : undefined,
      }}
    >
      {children}
    </div>
  )
}

Popover.displayName = "Popover"
PopoverTrigger.displayName = "PopoverTrigger"
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }

