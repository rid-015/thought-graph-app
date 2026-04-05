'use client'

import { useState } from 'react'
import { Plus, FileText, Edit3, Tag, Star, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThoughtStore } from '@/lib/thought-store'

type FilterType = 'active' | 'drafts' | 'tags' | 'starred'

export function LeftSidebar() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('active')
  const { thoughts, setCreatingThought, selectThought, selectedThoughtId, edges } = useThoughtStore()
  
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
        return activeThoughts.slice(0, 10)
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
    <aside className="flex h-full w-60 flex-col border-r border-[#232634] bg-[#151821]">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-[#232634] px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
        <span className="font-sans text-[15px] font-semibold tracking-tight text-foreground">
          Thought Graph
        </span>
      </div>
      
      {/* New Thought Button */}
      <div className="p-3">
        <button
          onClick={handleNewThought}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2a2f3d] bg-[#1d212b] px-3 py-2.5 font-sans text-sm text-muted-foreground transition-all hover:border-primary/30 hover:bg-[#252a36] hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
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
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-sans text-sm transition-colors",
                activeFilter === item.id
                  ? "bg-[#252a36] text-foreground"
                  : "text-muted-foreground hover:bg-[#1d212b] hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.count !== undefined && (
                <span className="text-xs text-muted-foreground/70">{item.count}</span>
              )}
            </button>
          ))}
        </div>
        
        {/* Thought List */}
        {activeFilter !== 'tags' && filteredThoughts.length > 0 && (
          <div className="mt-4 border-t border-[#232634] pt-3">
            <p className="mb-2 px-3 font-sans text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              {activeFilter === 'active' && 'Recent'}
              {activeFilter === 'drafts' && 'Drafts'}
              {activeFilter === 'starred' && 'Starred'}
            </p>
            <div className="space-y-0.5">
              {filteredThoughts.map((thought) => (
                <button
                  key={thought.id}
                  onClick={() => selectThought(thought.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-colors",
                    selectedThoughtId === thought.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-[#1d212b] hover:text-foreground"
                  )}
                >
                  <div 
                    className="h-2 w-2 shrink-0 rounded-full" 
                    style={{ backgroundColor: thought.color }}
                  />
                  <span className="truncate font-sans text-[13px]">{thought.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Tags List */}
        {activeFilter === 'tags' && allTags.length > 0 && (
          <div className="mt-4 border-t border-[#232634] pt-3">
            <p className="mb-2 px-3 font-sans text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              All Tags
            </p>
            <div className="flex flex-wrap gap-1.5 px-3">
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-[#252a36] px-2.5 py-1 font-sans text-[11px] text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </nav>
      
      {/* Footer */}
      <div className="border-t border-[#232634] p-3">
        <p className="font-mono text-[10px] text-muted-foreground/60">
          {thoughts.length} thoughts · {edges.length} connections
        </p>
      </div>
    </aside>
  )
}
