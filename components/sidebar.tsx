'use client'

import { useState } from 'react'
import { useStore, NODE_COLORS, type NodeColor } from '@/lib/store'
import { 
  Search, 
  Plus, 
  Star, 
  Clock, 
  Hash, 
  ChevronRight,
  Sparkles,
  GitCommit
} from 'lucide-react'

type Filter = 'all' | 'starred' | 'recent'

export function Sidebar() {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [selectedColor, setSelectedColor] = useState<NodeColor>('blue')
  
  const thoughts = useStore(s => s.thoughts)
  const selectedId = useStore(s => s.selectedThoughtId)
  const selectThought = useStore(s => s.selectThought)
  const addThought = useStore(s => s.addThought)
  
  // Filter and sort thoughts
  let filtered = [...thoughts]
  
  if (search) {
    const query = search.toLowerCase()
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.content.toLowerCase().includes(query)
    )
  }
  
  if (filter === 'starred') {
    filtered = filtered.filter(t => t.starred)
  }
  
  // Sort by recent
  filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  
  if (filter === 'recent') {
    filtered = filtered.slice(0, 10)
  }
  
  const handleCreate = () => {
    if (newTitle.trim()) {
      addThought({
        title: newTitle.trim(),
        content: '',
        color: selectedColor,
        tags: [],
        starred: false,
      })
      setNewTitle('')
      setIsCreating(false)
    }
  }
  
  // Get unique tags
  const allTags = [...new Set(thoughts.flatMap(t => t.tags))]
  
  return (
    <aside className="w-60 h-full flex flex-col bg-[#0f0f11] border-r border-[#27272a]">
      {/* Header */}
      <div className="p-4 border-b border-[#27272a]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm">Cortex</span>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search thoughts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-sm bg-[#18181b] border border-[#27272a] rounded-md placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>
      
      {/* Quick filters */}
      <div className="p-2 border-b border-[#27272a]">
        <button
          onClick={() => setFilter('all')}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
            filter === 'all' ? 'bg-[#18181b] text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-[#18181b]/50'
          }`}
        >
          <GitCommit className="w-3.5 h-3.5" />
          All Thoughts
          <span className="ml-auto text-xs text-muted-foreground">{thoughts.length}</span>
        </button>
        <button
          onClick={() => setFilter('starred')}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
            filter === 'starred' ? 'bg-[#18181b] text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-[#18181b]/50'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          Starred
          <span className="ml-auto text-xs text-muted-foreground">
            {thoughts.filter(t => t.starred).length}
          </span>
        </button>
        <button
          onClick={() => setFilter('recent')}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
            filter === 'recent' ? 'bg-[#18181b] text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-[#18181b]/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Recent
        </button>
      </div>
      
      {/* Create thought */}
      {isCreating ? (
        <div className="p-2 border-b border-[#27272a]">
          <input
            type="text"
            placeholder="Thought title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
            className="w-full h-8 px-2 text-sm bg-[#18181b] border border-[#27272a] rounded-md placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 mb-2"
          />
          <div className="flex gap-1 mb-2">
            {(Object.keys(NODE_COLORS) as NodeColor[]).slice(0, 6).map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  selectedColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0f0f11] scale-110' : ''
                }`}
                style={{ backgroundColor: NODE_COLORS[color] }}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleCreate}
              className="flex-1 h-7 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="flex-1 h-7 text-xs bg-[#18181b] text-muted-foreground rounded-md hover:bg-[#27272a] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="p-2 border-b border-[#27272a]">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-1.5 h-8 text-sm text-muted-foreground hover:text-foreground bg-[#18181b] hover:bg-[#27272a] rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Thought
          </button>
        </div>
      )}
      
      {/* Thoughts list */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-0.5">
          {filtered.map(thought => (
            <button
              key={thought.id}
              onClick={() => selectThought(thought.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors ${
                selectedId === thought.id 
                  ? 'bg-[#18181b] text-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-[#18181b]/50'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: NODE_COLORS[thought.color] }}
              />
              <span className="truncate flex-1">{thought.title}</span>
              {thought.starred && (
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tags */}
      {allTags.length > 0 && (
        <div className="p-2 border-t border-[#27272a]">
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground mb-1">
            <Hash className="w-3 h-3" />
            Tags
          </div>
          <div className="flex flex-wrap gap-1 px-2">
            {allTags.slice(0, 6).map(tag => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs bg-[#18181b] text-muted-foreground rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
