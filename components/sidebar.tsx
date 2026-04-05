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
  FileText,
  Network,
  X,
} from 'lucide-react'

type Filter = 'all' | 'starred' | 'recent'

export function Sidebar() {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [selectedColor, setSelectedColor] = useState<NodeColor>('amber')
  const [createInFolder, setCreateInFolder] = useState<string | null>(null)
  
  const folders = useStore(s => s.folders)
  const thoughts = useStore(s => s.thoughts)
  const selectedId = useStore(s => s.selectedThoughtId)
  const viewMode = useStore(s => s.viewMode)
  const isCreating = useStore(s => s.isCreating)
  const selectThought = useStore(s => s.selectThought)
  const addThought = useStore(s => s.addThought)
  const toggleFolder = useStore(s => s.toggleFolder)
  const setViewMode = useStore(s => s.setViewMode)
  const setIsCreating = useStore(s => s.setIsCreating)
  
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
      const folderId = createInFolder || folders[0]?.id || 'folder-misc'
      const folder = folders.find(f => f.id === folderId)
      addThought({
        folderId,
        title: newTitle.trim(),
        content: '',
        color: folder?.color || selectedColor,
        tags: [folderId.replace('folder-', '')],
        starred: false,
      })
      setNewTitle('')
      setCreateInFolder(null)
    }
  }
  
  const getThoughtsInFolder = (folderId: string) => {
    return filtered.filter(t => t.folderId === folderId)
  }
  
  const startCreating = (folderId?: string) => {
    setIsCreating(true)
    if (folderId) {
      setCreateInFolder(folderId)
      const folder = folders.find(f => f.id === folderId)
      if (folder) setSelectedColor(folder.color)
    }
  }
  
  return (
    <aside className="w-64 h-full flex flex-col glass-subtle" suppressHydrationWarning>
      {/* Header */}
      <div className="p-4 border-b border-white/8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Techy logo */}
            <div className="relative w-7 h-7 flex items-center justify-center">
              <div className="absolute inset-0 bg-amber-500/10 border border-amber-500/30" />
              <div className="absolute -top-px -left-px w-2 h-px bg-amber-500/70" />
              <div className="absolute -top-px -left-px w-px h-2 bg-amber-500/70" />
              <div className="absolute -bottom-px -right-px w-2 h-px bg-amber-500/50" />
              <div className="absolute -bottom-px -right-px w-px h-2 bg-amber-500/50" />
              <Network className="w-3.5 h-3.5 text-amber-400 relative z-10" />
            </div>
            <span className="font-mono text-xs tracking-widest uppercase text-white/70">Nodus</span>
          </div>
          <button
            onClick={() => { setViewMode('graph'); selectThought(null) }}
            className={`btn-icon-tech ${
              viewMode === 'graph' 
                ? 'text-amber-400 bg-amber-500/10' 
                : ''
            }`}
            title="Graph View"
          >
            <Network className="w-4 h-4" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            placeholder="search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-tech pl-8 font-mono text-xs"
          />
        </div>
      </div>
      
      {/* Quick filters */}
      <div className="px-2 py-2 border-b border-white/6">
        <button
          onClick={() => setFilter('all')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-mono tracking-wide transition-all ${
            filter === 'all' 
              ? 'bg-white/8 text-white/90' 
              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span className="uppercase">All</span>
          <span className="ml-auto text-[10px] text-white/40 tabular-nums">{thoughts.length}</span>
        </button>
        <button
          onClick={() => setFilter('starred')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-mono tracking-wide transition-all ${
            filter === 'starred' 
              ? 'bg-white/8 text-white/90' 
              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span className="uppercase">Starred</span>
          <span className="ml-auto text-[10px] text-white/40 tabular-nums">
            {thoughts.filter(t => t.starred).length}
          </span>
        </button>
        <button
          onClick={() => setFilter('recent')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-mono tracking-wide transition-all ${
            filter === 'recent' 
              ? 'bg-white/8 text-white/90' 
              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="uppercase">Recent</span>
        </button>
      </div>
      
      {/* Create thought */}
      {isCreating ? (
        <div className="p-3 border-b border-white/6 bg-white/3">
          <input
            type="text"
            placeholder="thought.title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
            className="input-tech mb-2 font-mono text-xs"
          />
          <div className="flex gap-1.5 mb-3">
            {(Object.keys(NODE_COLORS) as NodeColor[]).map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-5 h-5 transition-all ${
                  selectedColor === color 
                    ? 'ring-1 ring-white/50 ring-offset-1 ring-offset-[#0c0c0e] scale-110' 
                    : 'hover:scale-110 opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: NODE_COLORS[color] }}
              />
            ))}
          </div>
          <select
            value={createInFolder || folders[0]?.id || ''}
            onChange={e => setCreateInFolder(e.target.value)}
            className="w-full h-8 px-2 text-[10px] font-mono tracking-wide bg-[#0f0f11] border border-white/8 text-white/60 focus:outline-none mb-3 uppercase"
          >
            {folders.map(f => (
              <option key={f.id} value={f.id} className="bg-[#0c0c0e]">{f.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="btn-tech-primary flex-1 h-8 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Create
            </button>
            <button
              onClick={() => { setIsCreating(false); setCreateInFolder(null) }}
              className="btn-tech flex-1 h-8"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="px-2 py-2 border-b border-white/6">
          <button
            onClick={() => startCreating()}
            className="btn-tech-primary w-full flex items-center justify-center gap-2 h-9"
          >
            <Plus className="w-3.5 h-3.5" />
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
                  <div
                    onClick={() => toggleFolder(folder.id)}
                    className="w-full flex items-center gap-2 px-2 py-2 text-[11px] font-mono tracking-wide text-white/60 hover:text-white/80 hover:bg-white/5 transition-all group cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleFolder(folder.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-white/30" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white/30" />
                    )}
                    <span
                      className="w-1.5 h-1.5"
                      style={{ backgroundColor: NODE_COLORS[folder.color] }}
                    />
                    <span className="flex-1 text-left truncate uppercase">{folder.name}</span>
                    <span className="text-[10px] text-white/30 tabular-nums">{folderThoughts.length}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); startCreating(folder.id) }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 transition-all"
                    >
                      <Plus className="w-3 h-3 text-white/40" />
                    </button>
                  </div>
                  
                  {isExpanded && folderThoughts.length > 0 && (
                    <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/8 pl-2">
                      {folderThoughts.map((thought, idx) => (
                        <button
                          key={`${folder.id}-${thought.id}-${idx}`}
                          onClick={() => selectThought(thought.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 text-[11px] text-left transition-all active:bg-white/8 ${
                            selectedId === thought.id 
                              ? 'bg-white/10 text-white/90 border-l border-amber-500/50 -ml-px pl-[9px]' 
                              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                          }`}
                        >
                          <FileText className="w-3 h-3 text-white/30 flex-shrink-0" />
                          <span className="truncate flex-1">{thought.title}</span>
                          {thought.starred && (
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
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
            {filtered.length === 0 ? (
              <p className="text-center text-[11px] font-mono text-white/30 py-8 uppercase tracking-wide">
                {filter === 'starred' ? 'No starred' : 'No recent'}
              </p>
            ) : (
              filtered.map((thought, idx) => (
                <button
                  key={`flat-${thought.id}-${idx}`}
                  onClick={() => selectThought(thought.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-left transition-all active:bg-white/8 ${
                    selectedId === thought.id 
                      ? 'bg-white/10 text-white/90' 
                      : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 flex-shrink-0"
                    style={{ backgroundColor: NODE_COLORS[thought.color] }}
                  />
                  <span className="truncate flex-1">{thought.title}</span>
                  {thought.starred && (
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Footer stats */}
      <div className="px-4 py-3 border-t border-white/6 text-[10px] font-mono text-white/30 tracking-wide">
        <div className="flex justify-between uppercase">
          <span>{thoughts.length} thoughts</span>
          <span>{folders.length} folders</span>
        </div>
      </div>
    </aside>
  )
}
