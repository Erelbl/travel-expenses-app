export function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-sky-100/60 via-blue-100/40 to-slate-50/60">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.2s' }} />
        <div className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.2s' }} />
        <div className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.2s' }} />
      </div>
    </div>
  )
}

