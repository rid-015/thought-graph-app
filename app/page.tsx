'use client'

import { Sidebar } from '@/components/sidebar'
import { GraphCanvas } from '@/components/graph-canvas'
import { CommitPanel } from '@/components/commit-panel'

export default function CortexApp() {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0a0a0c]">
      {/* Left sidebar - Navigation */}
      <Sidebar />
      
      {/* Center - Graph visualization */}
      <main className="flex-1 relative">
        <GraphCanvas />
        
        {/* Minimal overlay */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg glass">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <span className="text-[11px] text-white/50">Graph</span>
          <span className="text-[10px] text-white/25 ml-1">
            Drag to pan / Scroll to zoom
          </span>
        </div>
      </main>
      
      {/* Right panel - Commit stream */}
      <CommitPanel />
    </div>
  )
}
