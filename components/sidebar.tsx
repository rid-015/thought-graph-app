'use client'

import { useState } from 'react'
import { useStore, NODE_COLORS } from '@/lib/store'
import { 
  Search, 
  Plus, 
  Star, 
  Clock, 
  ChevronRight,
  Folder,
  FileText,
  Network,
} from 'lucide-react'

type Filter = 'all' | 'starred' | 'recent'

export function Sidebar() {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [newTitle, setNewTitle] = useState('')
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
        color: folder?.color || 'amber',
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
    }
  }
  
  return (
    <aside className="w-64 h-full flex flex-col glass-subtle" suppressHydrationWarning>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500/15 flex items-center justify-center">
              <Network className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-semibold text-[15px] text-white/90">Nodus</span>
          </div>
          <button
            onClick={() => { setViewMode('graph'); selectThought(null) }}
            className={`w-8 h-8 flex items-center justify-center transition-all duration-150 hover:bg-white/5 active:scale-95 ${viewMode === 'graph' ? 'text-amber-400 bg-amber-500/10' : 'text-white/40'}`}
            title="Graph View"
          >
            <Network className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search thoughts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm bg-white/5 border border-white/8 text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/15 focus:bg-white/8 transition-all duration-150"
          />
        </div>
      </div>
      
      {/* Quick filters */}
      <div className="px-3 pb-3">
        <div className="flex gap-1 p-1 bg-white/3 border border-white/6">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] transition-all duration-150 ${
              filter === 'all' 
                ? 'bg-white/10 text-white/90' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>All</span>
          </button>
          <button
            onClick={() => setFilter('starred')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] transition-all duration-150 ${
              filter === 'starred' 
                ? 'bg-white/10 text-white/90' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filter === 'starred' ? 'fill-current' : ''}`} />
            <span>Starred</span>
          </button>
          <button
            onClick={() => setFilter('recent')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] transition-all duration-150 ${
              filter === 'recent' 
                ? 'bg-white/10 text-white/90' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Recent</span>
          </button>
        </div>
      </div>
      
      {/* Create thought */}
      {isCreating ? (
        <div className="relative mx-3 mb-3 p-3 bg-[#0a0a0c] border border-white/8">
          {/* Corner accents */}
          <span className="absolute -top-px -left-px w-3 h-px bg-amber-500/50" />
          <span className="absolute -top-px -left-px w-px h-3 bg-amber-500/50" />
          <span className="absolute -bottom-px -right-px w-3 h-px bg-amber-500/30" />
          <span className="absolute -bottom-px -right-px w-px h-3 bg-amber-500/30" />
          
          <div className="text-[10px] text-white/30 mb-2 font-mono tracking-wide">// new.thought</div>
          
          <input
            type="text"
            placeholder="Enter thought title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
            className="w-full h-9 px-3 text-sm bg-white/5 border border-white/10 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-amber-500/40 focus:bg-white/8 transition-all duration-150 mb-3"
          />
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] text-white/30">Folder:</span>
            <select
              value={createInFolder || folders[0]?.id || ''}
              onChange={e => setCreateInFolder(e.target.value)}
              className="flex-1 h-7 px-2 text-xs bg-white/5 border border-white/10 text-white/60 focus:outline-none focus:border-amber-500/40 transition-all duration-150"
            >
              {folders.map(f => (
                <option key={f.id} value={f.id} className="bg-[#0c0c0e]">{f.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="group relative flex-1 h-8 text-sm bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
            >
              <span className="absolute -top-px -left-px w-2 h-px bg-amber-500/50" />
              <span className="absolute -top-px -left-px w-px h-2 bg-amber-500/50" />
              Create
            </button>
            <button
              onClick={() => { setIsCreating(false); setCreateInFolder(null) }}
              className="flex-1 h-8 text-sm bg-white/5 border border-white/10 text-white/40 hover:bg-white/8 hover:text-white/60 active:scale-[0.98] transition-all duration-150"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="px-3 pb-3">
          <button
            onClick={() => startCreating()}
            className="group relative w-full flex items-center justify-center gap-2 h-9 bg-white/5 border border-white/8 text-white/50 text-sm hover:bg-white/8 hover:text-white/70 hover:border-white/12 active:scale-[0.98] transition-all duration-150"
          >
            {/* Corner accents - appear on hover */}
            <span className="absolute -top-px -left-px w-2 h-px bg-transparent group-hover:bg-amber-500/50 transition-colors duration-200" />
            <span className="absolute -top-px -left-px w-px h-2 bg-transparent group-hover:bg-amber-500/50 transition-colors duration-200" />
            <span className="absolute -bottom-px -right-px w-2 h-px bg-transparent group-hover:bg-amber-500/30 transition-colors duration-200" />
            <span className="absolute -bottom-px -right-px w-px h-2 bg-transparent group-hover:bg-amber-500/30 transition-colors duration-200" />
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            <span>New Thought</span>
          </button>
        </div>
      )}
      
      {/* Divider */}
      <div className="h-px bg-white/6 mx-3" />
      
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
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-sm text-[13px] text-white/60 hover:text-white/80 hover:bg-white/5 transition-all duration-150 group cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleFolder(folder.id)}
                  >
                    <ChevronRight className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
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
