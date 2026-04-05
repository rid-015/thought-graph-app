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
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-sm bg-amber-500/15 flex items-center justify-center">
              <Network className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="font-semibold text-sm text-white/90">Nodus</span>
          </div>
          <button
            onClick={() => { setViewMode('graph'); selectThought(null) }}
            className={`btn-icon ${viewMode === 'graph' ? 'text-amber-400 bg-amber-500/10' : ''}`}
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
            placeholder="Search thoughts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-8"
          />
        </div>
      </div>
      
      {/* Quick filters */}
      <div className="px-2 py-2 border-b border-white/6">
        <button
          onClick={() => setFilter('all')}
          className={`btn-tab ${filter === 'all' ? 'btn-tab-active' : ''}`}
        >
          <Folder className="w-4 h-4" />
          <span>All</span>
          <span className="ml-auto text-[11px] text-white/40 tabular-nums">{thoughts.length}</span>
        </button>
        <button
          onClick={() => setFilter('starred')}
          className={`btn-tab ${filter === 'starred' ? 'btn-tab-active' : ''}`}
        >
          <Star className="w-4 h-4" />
          <span>Starred</span>
          <span className="ml-auto text-[11px] text-white/40 tabular-nums">
            {thoughts.filter(t => t.starred).length}
          </span>
        </button>
        <button
          onClick={() => setFilter('recent')}
          className={`btn-tab ${filter === 'recent' ? 'btn-tab-active' : ''}`}
        >
          <Clock className="w-4 h-4" />
          <span>Recent</span>
        </button>
      </div>
      
      {/* Create thought */}
      {isCreating ? (
        <div className="p-3 border-b border-white/6 bg-white/3">
          <input
            type="text"
            placeholder="Thought title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
            className="input mb-2"
          />
          <div className="flex gap-1.5 mb-3">
            {(Object.keys(NODE_COLORS) as NodeColor[]).map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-5 h-5 rounded-sm transition-all ${
                  selectedColor === color 
                    ? 'ring-2 ring-white/50 ring-offset-1 ring-offset-[#0c0c0e] scale-110' 
                    : 'hover:scale-110 opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: NODE_COLORS[color] }}
              />
            ))}
          </div>
          <select
            value={createInFolder || folders[0]?.id || ''}
            onChange={e => setCreateInFolder(e.target.value)}
            className="input h-8 text-xs mb-3"
          >
            {folders.map(f => (
              <option key={f.id} value={f.id} className="bg-[#0c0c0e]">{f.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="btn-primary flex-1 h-8 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Create
            </button>
            <button
              onClick={() => { setIsCreating(false); setCreateInFolder(null) }}
              className="btn flex-1 h-8"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="px-3 py-3 border-b border-white/6">
          <button
            onClick={() => startCreating()}
            className="btn-primary w-full flex items-center justify-center gap-2 h-9"
          >
            <Plus className="w-4 h-4" />
            <span>New Thought</span>
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
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-sm text-[13px] text-white/60 hover:text-white/80 hover:bg-white/5 transition-all group cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleFolder(folder.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                    )}
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: NODE_COLORS[folder.color] }}
                    />
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                    <span className="text-[11px] text-white/30 tabular-nums">{folderThoughts.length}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); startCreating(folder.id) }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-white/10 transition-all"
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
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-[13px] text-left transition-all ${
                            selectedId === thought.id 
                              ? 'bg-white/10 text-white/90 border-l-2 border-amber-500/50 -ml-[3px] pl-[11px]' 
                              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
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
              <p className="text-center text-[13px] text-white/30 py-8">
                {filter === 'starred' ? 'No starred thoughts' : 'No recent thoughts'}
              </p>
            ) : (
              filtered.map((thought, idx) => (
                <button
                  key={`flat-${thought.id}-${idx}`}
                  onClick={() => selectThought(thought.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-[13px] text-left transition-all ${
                    selectedId === thought.id 
                      ? 'bg-white/10 text-white/90' 
                      : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
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
      <div className="px-4 py-3 border-t border-white/6 text-[11px] text-white/30">
        <div className="flex justify-between">
          <span>{thoughts.length} thoughts</span>
          <span>{folders.length} folders</span>
        </div>
      </div>
    </aside>
  )
}
