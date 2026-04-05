'use client'

import { useState } from 'react'
import { Plus, FileText, Edit3, Tag, Star, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThoughtStore } from '@/lib/thought-store'

type FilterType = 'active' | 'drafts' | 'tags' | 'starred'

export function LeftSidebar() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('active')
  const { thoughts, setCreatingThought, selectThought, selectedThoughtId } = useThoughtStore()
  
  const activeThoughts = thoughts.filter(t => !t.isDraft)
  const drafts = thoughts.filter(t => t.isDraft)
  const starredThoughts = thoughts.filter(t => t.starred)
  const allTags = [...new Set(thoughts.flatMap(t => t.tags))]
  
  const handleNewThought = () => {
    setCreatingThought(true)
  }
  
  const menuItems: { id: FilterType; label: string; icon: typeof FileText; count?: number }[] = [
    { id: 'active', label: 'Active Threads', icon: FileText, count: activeThoughts.length },
    { id: 'drafts', label: 'Drafts', icon: Edit3, count: drafts.length },
    { id: 'tags', label: 'Tags', icon: Tag, count: allTags.length },
    { id: 'starred', label: 'Starred', icon: Star, count: starredThoughts.length },
  ]
  
  const getFilteredThoughts = () => {
    switch (activeFilter) {
      case 'active':
        return activeThoughts
      case 'drafts':
        return drafts
      case 'starred':
        return starredThoughts
      default:
        return []
    }
  }
  
  const filteredThoughts = getFilteredThoughts()

  return (
    <aside className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
        <span className="font-mono text-sm font-medium tracking-tight text-sidebar-foreground">
          thought.graph
        </span>
      </div>
      
      {/* New Thought Button */}
      <div className="p-3">
        <button
          onClick={handleNewThought}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 font-mono text-xs text-secondary-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          New Thought
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <div className="space-y-0.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveFilter(item.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left font-mono text-xs transition-colors",
                activeFilter === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </span>
              {item.count !== undefined && (
                <span className="text-[10px] text-muted-foreground">{item.count}</span>
              )}
            </button>
          ))}
        </div>
        
        {/* Thought List */}
        {activeFilter !== 'tags' && filteredThoughts.length > 0 && (
          <div className="mt-4 border-t border-sidebar-border pt-3">
            <p className="mb-2 px-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {activeFilter === 'active' && 'Recent'}
              {activeFilter === 'drafts' && 'Drafts'}
              {activeFilter === 'starred' && 'Starred'}
            </p>
            <div className="space-y-0.5">
              {filteredThoughts.slice(0, 8).map((thought) => (
                <button
                  key={thought.id}
                  onClick={() => selectThought(thought.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors",
                    selectedThoughtId === thought.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                  <span className="truncate font-mono text-xs">{thought.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Tags List */}
        {activeFilter === 'tags' && allTags.length > 0 && (
          <div className="mt-4 border-t border-sidebar-border pt-3">
            <p className="mb-2 px-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              All Tags
            </p>
            <div className="flex flex-wrap gap-1.5 px-2.5">
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] text-secondary-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </nav>
      
      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <p className="font-mono text-[10px] text-muted-foreground">
          {thoughts.length} thoughts · {useThoughtStore.getState().edges.length} connections
        </p>
      </div>
    </aside>
  )
}
