'use client'

import { useState } from 'react'
import { useStore, NODE_COLORS, type NodeColor } from '@/lib/store'
import { 
  Search, 
  Plus, 
  Star, 
  Clock, 
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Sparkles,
} from 'lucide-react'

type Filter = 'all' | 'starred' | 'recent'

export function Sidebar() {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [selectedColor, setSelectedColor] = useState<NodeColor>('blue')
  const [createInFolder, setCreateInFolder] = useState<string | null>(null)
  
  const folders = useStore(s => s.folders)
  const thoughts = useStore(s => s.thoughts)
  const selectedId = useStore(s => s.selectedThoughtId)
  const selectThought = useStore(s => s.selectThought)
  const addThought = useStore(s => s.addThought)
  const toggleFolder = useStore(s => s.toggleFolder)
  
  // Filter thoughts
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
  
  filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  
  if (filter === 'recent') {
    filtered = filtered.slice(0, 15)
  }
  
  const handleCreate = () => {
    if (newTitle.trim()) {
      addThought({
        folderId: createInFolder || folders[0]?.id || 'folder-misc',
        title: newTitle.trim(),
        content: '',
        color: selectedColor,
        tags: [],
        starred: false,
      })
      setNewTitle('')
      setIsCreating(false)
      setCreateInFolder(null)
    }
  }
  
  const getThoughtsInFolder = (folderId: string) => {
    return filtered.filter(t => t.folderId === folderId)
  }
  
  return (
    <aside className="w-64 h-full flex flex-col bg-[#0c0c0e] border-r border-[#1f1f23]">
      {/* Header */}
      <div className="p-4 border-b border-[#1f1f23]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-teal-400" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Cortex</span>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#525259]" />
          <input
            type="text"
            placeholder="Search thoughts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-sm bg-[#18181b] border border-[#27272a] rounded-lg placeholder:text-[#525259] focus:outline-none focus:border-[#3f3f46] transition-colors"
          />
        </div>
      </div>
      
      {/* Quick filters */}
      <div className="px-2 py-2 border-b border-[#1f1f23]">
        <button
          onClick={() => setFilter('all')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all ${
            filter === 'all' 
              ? 'bg-[#18181b] text-white' 
              : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]/50'
          }`}
        >
          <Folder className="w-4 h-4" />
          All Thoughts
          <span className="ml-auto text-[11px] text-[#525259] tabular-nums">{thoughts.length}</span>
        </button>
        <button
          onClick={() => setFilter('starred')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all ${
            filter === 'starred' 
              ? 'bg-[#18181b] text-white' 
              : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]/50'
          }`}
        >
          <Star className="w-4 h-4" />
          Starred
          <span className="ml-auto text-[11px] text-[#525259] tabular-nums">
            {thoughts.filter(t => t.starred).length}
          </span>
        </button>
        <button
          onClick={() => setFilter('recent')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all ${
            filter === 'recent' 
              ? 'bg-[#18181b] text-white' 
              : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]/50'
          }`}
        >
          <Clock className="w-4 h-4" />
          Recent
        </button>
      </div>
      
      {/* Create thought */}
      {isCreating ? (
        <div className="p-3 border-b border-[#1f1f23]">
          <input
            type="text"
            placeholder="Thought title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
            className="w-full h-8 px-2.5 text-sm bg-[#18181b] border border-[#27272a] rounded-lg placeholder:text-[#525259] focus:outline-none focus:border-[#3f3f46] mb-2"
          />
          <div className="flex gap-1.5 mb-2">
            {(Object.keys(NODE_COLORS) as NodeColor[]).slice(0, 6).map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-5 h-5 rounded-full transition-all ${
                  selectedColor === color ? 'ring-2 ring-white/80 ring-offset-1 ring-offset-[#0c0c0e] scale-110' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: NODE_COLORS[color] }}
              />
            ))}
          </div>
          <select
            value={createInFolder || ''}
            onChange={e => setCreateInFolder(e.target.value)}
            className="w-full h-7 px-2 text-xs bg-[#18181b] border border-[#27272a] rounded-md text-[#a1a1aa] focus:outline-none mb-2"
          >
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex-1 h-7 text-xs font-medium bg-teal-500 text-white rounded-md hover:bg-teal-400 transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => { setIsCreating(false); setCreateInFolder(null) }}
              className="flex-1 h-7 text-xs bg-[#18181b] text-[#a1a1aa] rounded-md hover:bg-[#27272a] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="px-2 py-2 border-b border-[#1f1f23]">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-1.5 h-8 text-[13px] text-[#a1a1aa] hover:text-white bg-[#18181b] hover:bg-[#27272a] rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            New Thought
          </button>
        </div>
      )}
      
      {/* Folders and thoughts */}
      <div className="flex-1 overflow-y-auto py-2">
        {filter === 'all' ? (
          // Folder view
          <div className="space-y-0.5 px-2">
            {folders.map(folder => {
              const folderThoughts = getThoughtsInFolder(folder.id)
              const isExpanded = folder.isExpanded
              
              return (
                <div key={folder.id}>
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] text-[#a1a1aa] hover:text-white hover:bg-[#18181b]/50 transition-all"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#525259]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#525259]" />
                    )}
                    {isExpanded ? (
                      <FolderOpen className="w-4 h-4" style={{ color: NODE_COLORS[folder.color] }} />
                    ) : (
                      <Folder className="w-4 h-4" style={{ color: NODE_COLORS[folder.color] }} />
                    )}
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                    <span className="text-[11px] text-[#525259] tabular-nums">{folderThoughts.length}</span>
                  </button>
                  
                  {isExpanded && folderThoughts.length > 0 && (
                    <div className="ml-5 mt-0.5 space-y-0.5 border-l border-[#27272a] pl-2">
                      {folderThoughts.map(thought => (
                        <button
                          key={thought.id}
                          onClick={() => selectThought(thought.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-left transition-all ${
                            selectedId === thought.id 
                              ? 'bg-[#18181b] text-white' 
                              : 'text-[#71717a] hover:text-white hover:bg-[#18181b]/50'
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
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          // Flat view for starred/recent
          <div className="space-y-0.5 px-2">
            {filtered.map(thought => (
              <button
                key={thought.id}
                onClick={() => selectThought(thought.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-left transition-all ${
                  selectedId === thought.id 
                    ? 'bg-[#18181b] text-white' 
                    : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]/50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: NODE_COLORS[thought.color] }}
                />
                <span className="truncate flex-1">{thought.title}</span>
                {thought.starred && (
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
