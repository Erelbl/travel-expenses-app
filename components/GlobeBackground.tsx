"use client"

export function GlobeBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Deeper azure blue gradient - App Store ready */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-200 to-sky-300" />
      
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Large globe SVG - bottom right corner */}
      <svg
        className="fixed bottom-0 right-0 w-[50vw] h-[50vw] md:w-[30vw] md:h-[30vw] lg:w-[25vw] lg:h-[25vw] opacity-[0.06] blur-sm animate-fade-in pointer-events-none"
        style={{
          transform: 'translate(15%, 15%)',
        }}
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Globe circle */}
        <circle
          cx="400"
          cy="400"
          r="350"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-cyan-500"
        />
        
        {/* Latitude lines */}
        <ellipse cx="400" cy="400" rx="350" ry="100" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-cyan-400" opacity="0.6" />
        <ellipse cx="400" cy="400" rx="350" ry="200" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-cyan-400" opacity="0.6" />
        <ellipse cx="400" cy="400" rx="350" ry="300" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-cyan-400" opacity="0.6" />
        
        {/* Longitude lines */}
        <ellipse cx="400" cy="400" rx="100" ry="350" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-cyan-400" opacity="0.6" />
        <ellipse cx="400" cy="400" rx="200" ry="350" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-cyan-400" opacity="0.6" />
        <ellipse cx="400" cy="400" rx="300" ry="350" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-cyan-400" opacity="0.6" />
        
        {/* Equator */}
        <line x1="50" y1="400" x2="750" y2="400" stroke="currentColor" strokeWidth="2" className="text-cyan-500" opacity="0.7" />
        
        {/* Prime meridian */}
        <line x1="400" y1="50" x2="400" y2="750" stroke="currentColor" strokeWidth="2" className="text-cyan-500" opacity="0.7" />
        
        {/* Decorative dots for cities/locations */}
        <circle cx="300" cy="280" r="4" fill="currentColor" className="text-sky-500" opacity="0.8" />
        <circle cx="500" cy="320" r="4" fill="currentColor" className="text-sky-500" opacity="0.8" />
        <circle cx="350" cy="450" r="4" fill="currentColor" className="text-sky-500" opacity="0.8" />
        <circle cx="480" cy="500" r="4" fill="currentColor" className="text-sky-500" opacity="0.8" />
        <circle cx="420" cy="350" r="4" fill="currentColor" className="text-sky-500" opacity="0.8" />
        
        {/* Subtle glow effect */}
        <defs>
          <radialGradient id="glow">
            <stop offset="0%" stopColor="rgb(14, 165, 233)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="rgb(14, 165, 233)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="400" cy="400" r="380" fill="url(#glow)" />
      </svg>
      
      {/* Subtle accent orb - top left */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Accent orb - bottom center */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  )
}

