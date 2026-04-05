'use client'

import { Sidebar } from '@/components/sidebar'
import { GraphCanvas } from '@/components/graph-canvas'
import { CommitPanel } from '@/components/commit-panel'
import { ThoughtEditor } from '@/components/thought-editor'
import { useStore } from '@/lib/store'

export default function NodusGraphApp() {
  const viewMode = useStore(s => s.viewMode)
  
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0c0c0e]">
      {/* Left sidebar - Navigation */}
      <Sidebar />
      
      {/* Center - Graph or Editor */}
      <main className="flex-1 relative flex flex-col">
        {viewMode === 'graph' ? (
          <GraphCanvas />
        ) : (
          <ThoughtEditor />
        )}
      </main>
      
      {/* Right panel - Commit stream */}
      <CommitPanel />
    </div>
  )
}
