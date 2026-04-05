'use client'

import { LeftSidebar } from '@/components/left-sidebar'
import { ForceGraph } from '@/components/force-graph'
import { RightPanel } from '@/components/right-panel'

export default function ThoughtGraphPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Left Sidebar - Navigation */}
      <LeftSidebar />
      
      {/* Center - Graph Canvas */}
      <main className="flex-1">
        <ForceGraph />
      </main>
      
      {/* Right Panel - Thought Details */}
      <RightPanel />
    </div>
  )
}
