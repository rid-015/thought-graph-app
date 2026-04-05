'use client'

import { Sidebar } from '@/components/sidebar'
import { Graph3D } from '@/components/graph-3d'
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
          <Graph3D />
        ) : (
          <ThoughtEditor />
        )}
      </main>
      
      {/* Right panel - Commit stream */}
      <CommitPanel />
    </div>
  )
}
