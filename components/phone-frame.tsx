import { ReactNode } from "react"

interface PhoneFrameProps {
  children: ReactNode
  className?: string
}

export function PhoneFrame({ children, className = "" }: PhoneFrameProps) {
  return (
    <div className={`relative bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden ${className}`} style={{ aspectRatio: '9/19.5' }}>
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-3xl z-20" />
      
      {/* Screen Content */}
      <div className="absolute inset-3 bg-white rounded-[2.5rem] overflow-hidden">
        {children}
      </div>
      
      {/* Border highlight */}
      <div className="absolute inset-0 rounded-[3rem] ring-1 ring-slate-700/50" />
    </div>
  )
}

