'use client'

import { useState } from 'react'
import { Plus, FileText, Edit3, Tag, Star } from 'lucide-react'
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
        return activeThoughts.slice(0, 12)
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
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[#2E2E2E] bg-[#232323]">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-[#2E2E2E] px-4 py-4">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-[#7AA2F7]/20">
          <div className="h-2 w-2 rounded-full bg-[#7AA2F7]" />
        </div>
        <span className="text-[15px] font-semibold text-[#EAEAEA]">
          Thought Graph
        </span>
      </div>
      
      {/* New Note Button */}
      <div className="p-3">
        <button
          onClick={handleNewThought}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-[#2E2E2E] bg-[#2A2A2A] px-3 py-2.5 text-[14px] text-[#B0B0B0] transition-colors hover:border-[#3E3E3E] hover:bg-[#323232] hover:text-[#EAEAEA]"
        >
          <Plus className="h-4 w-4" />
          New Note
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
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[14px] transition-colors",
                activeFilter === item.id
                  ? "bg-[#2A2A2A] text-[#EAEAEA]"
                  : "text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-[#EAEAEA]"
              )}
            >
              <span className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.count !== undefined && (
                <span className="text-[12px] text-[#808080]">{item.count}</span>
              )}
            </button>
          ))}
        </div>
        
        {/* Thought List */}
        {activeFilter !== 'tags' && filteredThoughts.length > 0 && (
          <div className="mt-4 border-t border-[#2E2E2E] pt-3">
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-[#808080]">
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
                    "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left transition-colors",
                    selectedThoughtId === thought.id
                      ? "bg-[#7AA2F7]/15 text-[#7AA2F7]"
                      : "text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-[#EAEAEA]"
                  )}
                >
                  <div 
                    className="h-2 w-2 shrink-0 rounded-full" 
                    style={{ backgroundColor: thought.color }}
                  />
                  <span className="truncate text-[13px]">{thought.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Tags List */}
        {activeFilter === 'tags' && allTags.length > 0 && (
          <div className="mt-4 border-t border-[#2E2E2E] pt-3">
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-[#808080]">
              All Tags
            </p>
            <div className="flex flex-wrap gap-1.5 px-3">
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-[#2A2A2A] px-2.5 py-1 text-[11px] text-[#B0B0B0]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </nav>
      
      {/* Footer */}
      <div className="border-t border-[#2E2E2E] p-3">
        <p className="font-mono text-[10px] text-[#808080]">
          {thoughts.length} notes · {edges.length} connections
        </p>
      </div>
    </aside>
  )
}
