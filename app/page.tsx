'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { GraphCanvas } from '@/components/graph-canvas'
import { CommitPanel } from '@/components/commit-panel'
import { ThoughtEditor } from '@/components/thought-editor'
import { SplashScreen } from '@/components/splash-screen'
import { useStore } from '@/lib/store'
import { Network, BookOpen, GitCommit, List } from 'lucide-react'

type MobileTab = 'notes' | 'graph' | 'activity'

export default function NodusGraphApp() {
  const viewMode = useStore(s => s.viewMode)
  const [mobileTab, setMobileTab] = useState<MobileTab>('graph')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0c0c0e]">
      {/* Splash screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* ── DESKTOP LAYOUT (md+) ── */}
      <div className="hidden md:flex w-full h-full">
        {/* Left sidebar */}
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>

        {/* Center - Graph or Editor */}
        <main className="flex-1 relative flex flex-col min-w-0">
          {viewMode === 'graph' ? <GraphCanvas /> : <ThoughtEditor />}
        </main>

        {/* Right panel */}
        <CommitPanel />
      </div>

      {/* ── MOBILE LAYOUT (< md) ── */}
      <div className="flex md:hidden flex-col w-full h-full">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/8 glass-subtle flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#f59e0b]/15 flex items-center justify-center">
              <Network className="w-4 h-4 text-[#f59e0b]" />
            </div>
            <span className="font-semibold text-[15px] text-white/90">Nodus</span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all duration-150 active:scale-95"
            aria-label="Open thoughts list"
          >
            <List className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile main content */}
        <main className="flex-1 relative overflow-hidden">
          {mobileTab === 'graph' && (
            <div className="h-full animate-scale-fade-in">
              <GraphCanvas />
            </div>
          )}
          {mobileTab === 'notes' && (
            <div className="h-full animate-scale-fade-in">
              {viewMode === 'editor' ? <ThoughtEditor /> : (
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="text-center px-6">
                    <BookOpen className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm mb-4">Select a thought to read or edit it</p>
                    <button
                      onClick={() => setMobileSidebarOpen(true)}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      Browse Thoughts
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {mobileTab === 'activity' && (
            <div className="h-full overflow-y-auto animate-scale-fade-in">
              <CommitPanel />
            </div>
          )}
        </main>

        {/* Mobile bottom nav */}
        <nav className="flex-shrink-0 flex items-center border-t border-white/8 bg-[#0c0c0e]/95 backdrop-blur-sm safe-area-bottom">
          {(
            [
              { tab: 'graph' as MobileTab, icon: Network, label: 'Graph' },
              { tab: 'notes' as MobileTab, icon: BookOpen, label: 'Notes' },
              { tab: 'activity' as MobileTab, icon: GitCommit, label: 'Activity' },
            ] as const
          ).map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`relative flex-1 flex flex-col items-center gap-1 py-3 pb-4 text-[11px] transition-all duration-150 active:scale-95 ${
                mobileTab === tab
                  ? 'text-[#f59e0b]'
                  : 'text-white/40'
              }`}
            >
              <Icon className={`w-5 h-5 ${mobileTab === tab ? 'opacity-100' : 'opacity-60'}`} />
              <span>{label}</span>
              {mobileTab === tab && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#f59e0b]/60 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] z-10 animate-slide-in-left">
            <Sidebar onClose={() => {
              setMobileSidebarOpen(false)
              setMobileTab('notes')
            }} />
          </div>
        </div>
      )}
    </div>
  )
}
