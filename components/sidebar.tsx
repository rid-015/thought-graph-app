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
    <aside className="w-64 h-full flex flex-col glass-subtle">
      {/* Header */}
      <div className="p-4 border-b border-white/8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
              <Network className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white/90">Cortex</span>
          </div>
          <button
            onClick={() => { setViewMode('graph'); selectThought(null) }}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'graph' 
                ? 'bg-amber-500/15 text-amber-400' 
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
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
            placeholder="Search thoughts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-sm bg-white/5 border border-white/8 rounded-lg placeholder:text-white/30 text-white/80 focus:outline-none focus:border-amber-500/30 focus:bg-white/6 transition-all"
          />
        </div>
      </div>
      
      {/* Quick filters */}
      <div className="px-2 py-2 border-b border-white/6">
        <button
          onClick={() => setFilter('all')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
            filter === 'all' 
              ? 'bg-white/8 text-white/90' 
              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <Folder className="w-4 h-4" />
          All Thoughts
          <span className="ml-auto text-[11px] text-white/40 tabular-nums bg-white/5 px-1.5 py-0.5 rounded">{thoughts.length}</span>
        </button>
        <button
          onClick={() => setFilter('starred')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
            filter === 'starred' 
              ? 'bg-white/8 text-white/90' 
              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <Star className="w-4 h-4" />
          Starred
          <span className="ml-auto text-[11px] text-white/40 tabular-nums bg-white/5 px-1.5 py-0.5 rounded">
            {thoughts.filter(t => t.starred).length}
          </span>
        </button>
        <button
          onClick={() => setFilter('recent')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
            filter === 'recent' 
              ? 'bg-white/8 text-white/90' 
              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          Recent
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
            className="w-full h-9 px-3 text-sm bg-white/5 border border-white/10 rounded-lg placeholder:text-white/30 text-white/80 focus:outline-none focus:border-amber-500/30 mb-2"
          />
          <div className="flex gap-1.5 mb-3">
            {(Object.keys(NODE_COLORS) as NodeColor[]).map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full transition-all ${
                  selectedColor === color 
                    ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-[#0c0c0e] scale-110' 
                    : 'hover:scale-110 opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: NODE_COLORS[color] }}
              />
            ))}
          </div>
          <select
            value={createInFolder || folders[0]?.id || ''}
            onChange={e => setCreateInFolder(e.target.value)}
            className="w-full h-8 px-2 text-xs bg-white/5 border border-white/8 rounded-lg text-white/60 focus:outline-none mb-3"
          >
            {folders.map(f => (
              <option key={f.id} value={f.id} className="bg-[#0c0c0e]">{f.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="flex-1 h-8 text-xs font-medium bg-amber-500 text-black rounded-lg hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Create Thought
            </button>
            <button
              onClick={() => { setIsCreating(false); setCreateInFolder(null) }}
              className="flex-1 h-8 text-xs bg-white/5 text-white/60 rounded-lg hover:bg-white/8 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="px-2 py-2 border-b border-white/6">
          <button
            onClick={() => startCreating()}
            className="w-full flex items-center justify-center gap-2 h-9 text-[13px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 rounded-lg transition-all"
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
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] text-white/60 hover:text-white/80 hover:bg-white/5 transition-all group"
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
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-all"
                    >
                      <Plus className="w-3 h-3 text-white/40" />
                    </button>
                  </button>
                  
                  {isExpanded && folderThoughts.length > 0 && (
                    <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/8 pl-2">
                      {folderThoughts.map(thought => (
                        <button
                          key={thought.id}
                          onClick={() => selectThought(thought.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-left transition-all ${
                            selectedId === thought.id 
                              ? 'bg-amber-500/15 text-white/90 border-l-2 border-amber-500 -ml-[3px] pl-[11px]' 
                              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                          <span className="truncate flex-1">{thought.title}</span>
                          {thought.starred && (
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
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
              <p className="text-center text-sm text-white/30 py-8">
                {filter === 'starred' ? 'No starred thoughts' : 'No recent thoughts'}
              </p>
            ) : (
              filtered.map(thought => (
                <button
                  key={thought.id}
                  onClick={() => selectThought(thought.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left transition-all ${
                    selectedId === thought.id 
                      ? 'bg-amber-500/15 text-white/90' 
                      : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: NODE_COLORS[thought.color] }}
                  />
                  <span className="truncate flex-1">{thought.title}</span>
                  {thought.starred && (
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
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
