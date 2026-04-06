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
      setTimeout(() => setPhase('text2'), 1600),
      setTimeout(() => setPhase('dots'), 2400),
      setTimeout(() => setPhase('fadeout'), 3800),
      setTimeout(() => onComplete(), 4400),
    ]

    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  // Clean 3x3 grid of evenly spaced nodes
  const spacing = 70
  const graphNodes = [
    { x: -spacing, y: -spacing, r: 4, delay: 0 },
    { x: 0, y: -spacing, r: 3, delay: 0.05 },
    { x: spacing, y: -spacing, r: 4, delay: 0.1 },
    { x: -spacing, y: 0, r: 3, delay: 0.15 },
    { x: 0, y: 0, r: 5, delay: 0.2 },  // Center node slightly larger
    { x: spacing, y: 0, r: 3, delay: 0.25 },
    { x: -spacing, y: spacing, r: 4, delay: 0.3 },
    { x: 0, y: spacing, r: 3, delay: 0.35 },
    { x: spacing, y: spacing, r: 4, delay: 0.4 },
  ]

  // Simple connections - only adjacent nodes
  const connections: [number, number][] = [
    [0,1], [1,2],           // Top row
    [3,4], [4,5],           // Middle row  
    [6,7], [7,8],           // Bottom row
    [0,3], [3,6],           // Left column
    [1,4], [4,7],           // Center column
    [2,5], [5,8],           // Right column
  ]

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-[#0c0c0e] flex items-center justify-center transition-opacity duration-600 ${
        phase === 'fadeout' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated constellation in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {phase === 'dots' && (
          <svg className="absolute inset-0 w-full h-full">
            {/* Connection lines */}
            <g style={{ animation: 'splash-lines-appear 0.8s ease-out 0.3s both' }}>
              {connections.map(([from, to], i) => {
                  const a = graphNodes[from]
                  const b = graphNodes[to]
                  if (!a || !b) return null
                  return (
                    <line
                      key={i}
                      x1={`calc(50% + ${a.x}px)`}
                      y1={`calc(50% + ${a.y}px)`}
                      x2={`calc(50% + ${b.x}px)`}
                      y2={`calc(50% + ${b.y}px)`}
                      stroke="rgba(255,255,255,0.10)"
                      strokeWidth="1"
                    />
                  )
                })}
            </g>
            
            {/* Nodes */}
            {graphNodes.map((node, i) => (
              <circle
                key={i}
                cx={`calc(50% + ${node.x}px)`}
                cy={`calc(50% + ${node.y}px)`}
                r={node.r}
                fill={i === 4 ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.35)'}
                style={{
                  animation: `splash-dot-appear 0.4s ease-out ${node.delay}s both`,
                }}
              />
            ))}
          </svg>
        )}
      </div>

      {/* Center content */}
      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* Main text - larger */}
        <h1 
          className={`text-xl md:text-2xl font-light text-white/80 leading-relaxed transition-all duration-700 ${
            phase === 'initial' ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
          }`}
          style={{ letterSpacing: '-0.03em' }}
        >
          A graph-based tool for structured thinking.
        </h1>

        {/* Tagline - smaller, subtle */}
        <p 
          className={`mt-5 text-white/50 text-sm md:text-base font-light transition-all duration-700 ${
            ['text2', 'dots', 'fadeout'].includes(phase) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ letterSpacing: '-0.03em' }}
        >
          Connect the dots.
        </p>
      </div>

      {/* Minimal corner accents */}
      <div className={`absolute top-8 left-8 transition-opacity duration-500 ${phase !== 'initial' ? 'opacity-30' : 'opacity-0'}`}>
        <div className="w-6 h-px bg-white/40" />
        <div className="w-px h-6 bg-white/40" />
      </div>
      <div className={`absolute bottom-8 right-8 transition-opacity duration-500 ${phase !== 'initial' ? 'opacity-30' : 'opacity-0'}`}>
        <div className="w-6 h-px bg-white/40 ml-auto" />
        <div className="w-px h-6 bg-white/40 ml-auto" />
      </div>

      <style jsx>{`
        @keyframes splash-dot-appear {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
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
