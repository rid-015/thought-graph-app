'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore, NODE_COLORS } from '@/lib/store'
import { 
  ArrowLeft,
  Star,
  Trash2,
  Link2,
  Save,
  Hash,
  Calendar,
  Clock,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

export function ThoughtEditor() {
  const selectedId = useStore(s => s.selectedThoughtId)
  const thoughts = useStore(s => s.thoughts)
  const connections = useStore(s => s.connections)
  const folders = useStore(s => s.folders)
  const selectThought = useStore(s => s.selectThought)
  const updateThought = useStore(s => s.updateThought)
  const deleteThought = useStore(s => s.deleteThought)
  const toggleStar = useStore(s => s.toggleStar)
  const setViewMode = useStore(s => s.setViewMode)
  
  const thought = thoughts.find(t => t.id === selectedId)
  const folder = folders.find(f => f.id === thought?.folderId)
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  
  // Initialize state when thought changes
  useEffect(() => {
    if (thought) {
      setTitle(thought.title)
      setContent(thought.content)
      setHasChanges(false)
    }
  }, [thought?.id])
  
  // Get connected thoughts (deduplicated)
  const linkedThoughts = thought ? Array.from(
    new Map(
      connections
        .filter(c => c.source === thought.id || c.target === thought.id)
        .map(c => {
          const linkedId = c.source === thought.id ? c.target : c.source
          return thoughts.find(t => t.id === linkedId)
        })
        .filter(Boolean)
        .map(t => [t!.id, t])
    ).values()
  ) : []
  
  const handleTitleChange = (value: string) => {
    setTitle(value)
    setHasChanges(true)
  }
  
  const handleContentChange = (value: string) => {
    setContent(value)
    setHasChanges(true)
  }
  
  const handleSave = useCallback(() => {
    if (thought && hasChanges) {
      updateThought(thought.id, { title, content })
      setHasChanges(false)
    }
  }, [thought, title, content, hasChanges, updateThought])
  
  // Auto-save on blur or after pause
  useEffect(() => {
    if (!hasChanges) return
    const timer = setTimeout(handleSave, 2000)
    return () => clearTimeout(timer)
  }, [title, content, hasChanges, handleSave])
  
  const handleBack = () => {
    if (hasChanges) handleSave()
    selectThought(null)
    setViewMode('graph')
  }
  
  const handleDelete = () => {
    if (thought && confirm('Delete this thought? This cannot be undone.')) {
      deleteThought(thought.id)
    }
  }
  
  if (!thought) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 text-sm">No thought selected</p>
          <button
            onClick={() => setViewMode('graph')}
            className="btn-primary mt-4"
          >
            Back to Graph
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="group btn-icon active:scale-95 transition-all duration-150"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
          </button>
          
          <div className="flex items-center gap-2 text-sm text-white/50">
            {folder && (
              <>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[folder.color] }}
                />
                <span>{folder.name}</span>
                <span className="text-white/20">/</span>
              </>
            )}
            <span className="text-white/70 truncate max-w-48">{thought.title}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {hasChanges && (
            <button
              onClick={handleSave}
              className="btn-primary flex items-center gap-1.5 py-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          )}
          
          <button
            onClick={() => toggleStar(thought.id)}
            className={`group btn-icon active:scale-90 transition-all duration-150 ${
              thought.starred 
                ? 'text-amber-400 bg-amber-400/10' 
                : ''
            }`}
          >
            <Star className={`w-4 h-4 group-hover:scale-110 transition-transform duration-150 ${thought.starred ? 'fill-current' : ''}`} />
          </button>
          
          <button
            onClick={handleDelete}
            className="group btn-icon hover:text-red-400 hover:bg-red-400/10 active:scale-90 transition-all duration-150"
          >
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-150" />
          </button>
        </div>
      </header>
      
      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="w-full text-2xl font-medium text-white/90 bg-transparent border-none outline-none placeholder:text-white/20 mb-2"
          />
          
          {/* Meta */}
          <div className="flex items-center gap-4 text-[11px] text-white/30 mb-8">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              <span>{format(thought.createdAt, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>updated {formatDistanceToNow(thought.updatedAt, { addSuffix: true })}</span>
            </div>
            {thought.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Hash className="w-3 h-3" />
                <span>{thought.tags.join(', ')}</span>
              </div>
            )}
          </div>
          
          {/* Content */}
          <textarea
            value={content}
            onChange={e => handleContentChange(e.target.value)}
            placeholder="Start writing..."
            className="w-full min-h-[400px] text-[15px] leading-relaxed text-white/70 bg-transparent border-none outline-none resize-none placeholder:text-white/20"
          />
          
          {/* Linked thoughts */}
          {linkedThoughts.length > 0 && (
            <div className="mt-12 pt-8 border-t border-white/8">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="w-3.5 h-3.5 text-white/30" />
                <h3 className="text-sm text-white/50">
                  Linked thoughts ({linkedThoughts.length})
                </h3>
              </div>
              
              <div className="grid gap-2">
                {linkedThoughts.map((linked, idx) => linked && (
                  <button
                    key={`linked-${linked.id}-${idx}`}
                    onClick={() => selectThought(linked.id)}
                    className="group flex items-center gap-3 p-3 text-left bg-white/3 hover:bg-white/5 border border-white/6 hover:border-white/10 rounded-sm transition-all duration-150 hover:translate-x-1 active:scale-[0.99]"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: NODE_COLORS[linked.color] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/70 truncate">{linked.title}</div>
                      <div className="text-[11px] text-white/30 truncate">
                        {folders.find(f => f.id === linked.folderId)?.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
