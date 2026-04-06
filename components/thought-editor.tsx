'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Pencil,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

// Simple markdown renderer - converts markdown to JSX
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeContent: string[] = []
  
  lines.forEach((line, idx) => {
    // Code block handling
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${idx}`} className="bg-white/5 border border-white/8 p-3 text-[13px] font-mono text-white/70 overflow-x-auto my-3">
            {codeContent.join('\n')}
          </pre>
        )
        codeContent = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      return
    }
    
    if (inCodeBlock) {
      codeContent.push(line)
      return
    }
    
    // H1 heading
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={idx} className="text-xl font-semibold text-white/90 mt-6 mb-3 first:mt-0">
          {line.slice(2)}
        </h1>
      )
      return
    }
    
    // H2 heading
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={idx} className="text-lg font-medium text-white/85 mt-5 mb-2">
          {line.slice(3)}
        </h2>
      )
      return
    }
    
    // H3 heading
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={idx} className="text-base font-medium text-white/80 mt-4 mb-2">
          {line.slice(4)}
        </h3>
      )
      return
    }
    
    // List items
    if (line.match(/^[-*]\s/)) {
      const content = line.slice(2)
      elements.push(
        <li key={idx} className="text-[15px] text-white/70 ml-4 mb-1 list-disc">
          {formatInlineText(content)}
        </li>
      )
      return
    }
    
    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\d+\.\s/, '')
      elements.push(
        <li key={idx} className="text-[15px] text-white/70 ml-4 mb-1 list-decimal">
          {formatInlineText(content)}
        </li>
      )
      return
    }
    
    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={idx} className="h-3" />)
      return
    }
    
    // Regular paragraph
    elements.push(
      <p key={idx} className="text-[15px] leading-relaxed text-white/70 mb-2">
        {formatInlineText(line)}
      </p>
    )
  })
  
  return elements
}

// Format inline text (bold, italic, code)
function formatInlineText(text: string): React.ReactNode {
  // Replace **bold** with styled spans
  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIdx = 0
  
  // Handle bold
  while (remaining.includes('**')) {
    const start = remaining.indexOf('**')
    const end = remaining.indexOf('**', start + 2)
    
    if (end === -1) break
    
    if (start > 0) {
      parts.push(formatCode(remaining.slice(0, start), keyIdx++))
    }
    parts.push(
      <strong key={`bold-${keyIdx++}`} className="font-semibold text-white/85">
        {remaining.slice(start + 2, end)}
      </strong>
    )
    remaining = remaining.slice(end + 2)
  }
  
  if (remaining) {
    parts.push(formatCode(remaining, keyIdx))
  }
  
  return parts.length > 0 ? parts : text
}

// Format inline code
function formatCode(text: string, baseKey: number): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIdx = baseKey
  
  while (remaining.includes('`')) {
    const start = remaining.indexOf('`')
    const end = remaining.indexOf('`', start + 1)
    
    if (end === -1) break
    
    if (start > 0) {
      parts.push(remaining.slice(0, start))
    }
    parts.push(
      <code key={`code-${keyIdx++}`} className="px-1.5 py-0.5 bg-white/8 text-amber-400/90 text-[13px] font-mono">
        {remaining.slice(start + 1, end)}
      </code>
    )
    remaining = remaining.slice(end + 1)
  }
  
  if (remaining) {
    parts.push(remaining)
  }
  
  return parts.length > 0 ? parts : text
}

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
  const [isEditing, setIsEditing] = useState(false)
  
  // Initialize state when thought changes
  useEffect(() => {
    if (thought) {
      setTitle(thought.title)
      setContent(thought.content)
      setHasChanges(false)
      setIsEditing(false)
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
      <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/8">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <button
            onClick={handleBack}
            className="group btn-icon active:scale-95 transition-all duration-150 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
          </button>
          
          <div className="flex items-center gap-2 text-sm text-white/50 min-w-0">
            {folder && (
              <>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: NODE_COLORS[folder.color] }}
                />
                <span className="hidden sm:inline truncate">{folder.name}</span>
                <span className="hidden sm:inline text-white/20">/</span>
              </>
            )}
            <span className="text-white/70 truncate max-w-[160px] md:max-w-48">{thought.title}</span>
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
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
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
          {isEditing ? (
            <textarea
              value={content}
              onChange={e => handleContentChange(e.target.value)}
              placeholder="Start writing..."
              className="w-full min-h-[400px] text-[15px] leading-relaxed text-white/70 bg-transparent border-none outline-none resize-none placeholder:text-white/20 font-mono"
              autoFocus
            />
          ) : (
            <div 
              className="min-h-[400px] cursor-text"
              onClick={() => setIsEditing(true)}
            >
              {content ? (
                <div className="prose-custom">{renderMarkdown(content)}</div>
              ) : (
                <p className="text-white/20 text-[15px]">Click to start writing...</p>
              )}
            </div>
          )}
          
          {/* Edit toggle */}
          <div className="mt-6 pt-4 border-t border-white/6">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-3 py-1.5 text-[12px] transition-all duration-150 ${
                isEditing 
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                  : 'bg-white/5 text-white/50 border border-white/8 hover:text-white/70'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              {isEditing ? 'Preview' : 'Edit'}
            </button>
          </div>
          
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
