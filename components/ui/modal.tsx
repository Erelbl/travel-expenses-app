"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  size?: "default" | "lg"
}

/**
 * Centered modal popup component
 * - Horizontally and vertically centered
 * - Constrained width on desktop (max-w-md)
 * - 90% width on mobile
 * - Backdrop click to close
 * - Escape key to close
 */
export function Modal({ open, onOpenChange, children, size = "default" }: ModalProps) {
  // Handle escape key
  React.useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }
    
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, onOpenChange])

  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      
      {/* Modal Container - Centered */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        {/* Modal Content */}
        <div
          className={cn(
            "pointer-events-auto w-full bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in-0 duration-200",
            size === "lg" ? "max-w-lg" : "max-w-md"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  )
}

export function ModalHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-slate-100 px-6 py-5",
        className
      )}
      {...props}
    />
  )
}

export function ModalTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-xl font-semibold text-slate-900", className)}
      {...props}
    />
  )
}

export function ModalContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-6 py-5", className)}
      {...props}
    />
  )
}

interface ModalCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function ModalClose({ className, onClick, ...props }: ModalCloseProps) {
  return (
    <button
      className={cn(
        "rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors",
        className
      )}
      onClick={onClick}
      aria-label="Close"
      {...props}
    >
      <X className="h-5 w-5" />
    </button>
  )
}

