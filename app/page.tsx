'use client'

import { Sidebar } from '@/components/sidebar'
import { GraphCanvas } from '@/components/graph-canvas'
import { CommitPanel } from '@/components/commit-panel'

export default function CortexApp() {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Left sidebar - Navigation */}
      <Sidebar />
      
      {/* Center - Graph visualization */}
      <main className="flex-1 relative">
        <GraphCanvas />
        
        {/* Graph title overlay */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg glass">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium">Graph View</span>
          <span className="text-xs text-muted-foreground ml-2">
            Drag to pan · Scroll to zoom · Click nodes to select
          </span>
        </div>
      </main>
      
      {/* Right panel - Commit stream */}
      <CommitPanel />
    </div>
  )
}
