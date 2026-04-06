'use client'

import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'initial' | 'text1' | 'text2' | 'dots' | 'fadeout'>('initial')

  useEffect(() => {
    // Animation timeline
    const timers = [
      setTimeout(() => setPhase('text1'), 300),
      setTimeout(() => setPhase('text2'), 1800),
      setTimeout(() => setPhase('dots'), 2800),
      setTimeout(() => setPhase('fadeout'), 4200),
      setTimeout(() => onComplete(), 4800),
    ]

    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-[#0c0c0e] flex items-center justify-center transition-opacity duration-500 ${
        phase === 'fadeout' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Animated dots in background */}
      <div className="absolute inset-0 overflow-hidden">
        {phase === 'dots' && (
          <>
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2
              const radius = 120 + (i % 3) * 40
              const delay = i * 0.08
              return (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-amber-500/60 animate-pulse"
                  style={{
                    left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                    top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                    transform: 'translate(-50%, -50%)',
                    animation: `splash-dot-appear 0.6s ease-out ${delay}s both, pulse 2s ease-in-out ${delay + 0.6}s infinite`,
                  }}
                />
              )
            })}
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ animation: 'splash-lines-appear 0.8s ease-out 0.5s both' }}>
              {Array.from({ length: 6 }).map((_, i) => {
                const angle1 = (i / 12) * Math.PI * 2
                const angle2 = ((i + 5) / 12) * Math.PI * 2
                const r1 = 120 + (i % 3) * 40
                const r2 = 120 + ((i + 5) % 3) * 40
                return (
                  <line
                    key={i}
                    x1={`calc(50% + ${Math.cos(angle1) * r1}px)`}
                    y1={`calc(50% + ${Math.sin(angle1) * r1}px)`}
                    x2={`calc(50% + ${Math.cos(angle2) * r2}px)`}
                    y2={`calc(50% + ${Math.sin(angle2) * r2}px)`}
                    stroke="rgba(245, 158, 11, 0.15)"
                    strokeWidth="1"
                    style={{
                      transformOrigin: 'center',
                    }}
                  />
                )
              })}
            </svg>
          </>
        )}
      </div>

      {/* Center content */}
      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* Main text */}
        <h1 
          className={`text-lg md:text-xl font-light text-white/90 tracking-wide leading-relaxed transition-all duration-700 ${
            phase === 'initial' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          A graph-based tool for structured thinking.
        </h1>

        {/* Tagline */}
        <p 
          className={`mt-4 text-amber-400/90 text-base md:text-lg font-medium tracking-wider transition-all duration-700 ${
            ['text2', 'dots', 'fadeout'].includes(phase) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          Connect the dots.
        </p>

        {/* Subtle underline accent */}
        <div 
          className={`mt-6 mx-auto h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent transition-all duration-700 ${
            ['text2', 'dots', 'fadeout'].includes(phase) ? 'w-32 opacity-100' : 'w-0 opacity-0'
          }`}
        />
      </div>

      {/* Corner accents */}
      <div className={`absolute top-8 left-8 transition-opacity duration-500 ${phase !== 'initial' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-8 h-px bg-white/20" />
        <div className="w-px h-8 bg-white/20" />
      </div>
      <div className={`absolute top-8 right-8 transition-opacity duration-500 ${phase !== 'initial' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-8 h-px bg-white/20 ml-auto" />
        <div className="w-px h-8 bg-white/20 ml-auto" />
      </div>
      <div className={`absolute bottom-8 left-8 transition-opacity duration-500 ${phase !== 'initial' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-px h-8 bg-white/20" />
        <div className="w-8 h-px bg-white/20" />
      </div>
      <div className={`absolute bottom-8 right-8 transition-opacity duration-500 ${phase !== 'initial' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-px h-8 bg-white/20 ml-auto" />
        <div className="w-8 h-px bg-white/20 ml-auto" />
      </div>

      <style jsx>{`
        @keyframes splash-dot-appear {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes splash-lines-appear {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
