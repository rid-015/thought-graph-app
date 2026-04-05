'use client'

import { Sidebar } from '@/components/sidebar'
import { GraphCanvas } from '@/components/graph-canvas'
import { CommitPanel } from '@/components/commit-panel'
import { ThoughtEditor } from '@/components/thought-editor'
import { useStore } from '@/lib/store'

export default function CortexApp() {
  const viewMode = useStore(s => s.viewMode)
  
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0c0c0e]">
      {/* Left sidebar - Navigation */}
      <Sidebar />
      
      {/* Center - Graph or Editor */}
      <main className="flex-1 relative flex flex-col">
        {viewMode === 'graph' ? (
          <>
            <GraphCanvas />
            {/* Graph overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg glass">
              <div className="w-2 h-2 rounded-full bg-amber-400/60" />
              <span className="text-xs text-white/60">Graph View</span>
              <span className="text-[10px] text-white/30 ml-2">
                Drag to pan • Scroll to zoom • Click node to edit
              </span>
            </div>
          </>
        ) : (
          <ThoughtEditor />
        )}
      </main>
      
      {/* Right panel - Commit stream */}
      <CommitPanel />
    </div>
  )
}
