'use client'

import { useState, useMemo } from 'react'
import { useStore, NODE_COLORS } from '@/lib/store'
import { 
  GitCommit, 
  Plus, 
  Link2, 
  Lightbulb, 
  Pencil,
  Star,
  X,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const COMMIT_ICONS = {
  create: Plus,
  update: Pencil,
  connect: Link2,
  insight: Lightbulb,
}

export function CommitPanel() {
  const [newCommit, setNewCommit] = useState('')
  
  const thoughts = useStore(s => s.thoughts)
  const commits = useStore(s => s.commits)
  const selectedId = useStore(s => s.selectedThoughtId)
  const selectedThought = thoughts.find(t => t.id === selectedId)
  const selectThought = useStore(s => s.selectThought)
  const addCommit = useStore(s => s.addCommit)
  const toggleStar = useStore(s => s.toggleStar)
  
  // Get thought by ID
  const getThought = (id: string | null) => {
    if (!id) return null
    return thoughts.find(t => t.id === id)
  }
  
  const handleAddCommit = () => {
    if (newCommit.trim()) {
      addCommit(newCommit.trim(), null, 'insight')
      setNewCommit('')
    }
  }
  
  return (
    <aside className="w-80 h-full flex flex-col bg-[#0f0f11] border-l border-[#27272a]">
      {/* Selected thought detail */}
      {selectedThought ? (
        <div className="border-b border-[#27272a]">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[selectedThought.color] }}
                />
                <h2 className="font-medium text-sm">{selectedThought.title}</h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleStar(selectedThought.id)}
                  className="p-1 rounded hover:bg-[#27272a] transition-colors"
                >
                  <Star 
                    className={`w-3.5 h-3.5 ${
                      selectedThought.starred 
                        ? 'text-yellow-500 fill-yellow-500' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                </button>
                <button
                  onClick={() => selectThought(null)}
                  className="p-1 rounded hover:bg-[#27272a] transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {selectedThought.content || 'No content yet...'}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">
                {formatDistanceToNow(selectedThought.updatedAt, { addSuffix: true })}
              </span>
              {selectedThought.tags.length > 0 && (
                <>
                  <span className="text-[#27272a]">·</span>
                  <span>{selectedThought.tags.join(', ')}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
      
      {/* Commit input */}
      <div className="p-3 border-b border-[#27272a]">
        <div className="flex items-center gap-2 mb-2">
          <GitCommit className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Thought Stream</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Commit an insight..."
            value={newCommit}
            onChange={e => setNewCommit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCommit()}
            className="flex-1 h-8 px-3 text-sm bg-[#18181b] border border-[#27272a] rounded-md placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            onClick={handleAddCommit}
            disabled={!newCommit.trim()}
            className="h-8 px-3 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Commit history */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {commits.map((commit, idx) => {
            const Icon = COMMIT_ICONS[commit.type]
            const thought = getThought(commit.thoughtId)
            
            return (
              <div
                key={commit.id}
                className="group relative flex gap-3 py-2.5 px-2"
              >
                {/* Timeline line */}
                {idx < commits.length - 1 && (
                  <div className="absolute left-[17px] top-[28px] bottom-0 w-px bg-[#27272a]" />
                )}
                
                {/* Icon */}
                <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  commit.type === 'create' ? 'bg-green-500/20 text-green-400' :
                  commit.type === 'update' ? 'bg-blue-500/20 text-blue-400' :
                  commit.type === 'connect' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  <Icon className="w-2.5 h-2.5" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug mb-1">
                    {commit.message}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatDistanceToNow(commit.timestamp, { addSuffix: true })}
                    </span>
                    {thought && (
                      <button
                        onClick={() => selectThought(thought.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: NODE_COLORS[thought.color] }}
                        />
                        <span className="truncate max-w-24">{thought.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Stats */}
      <div className="p-3 border-t border-[#27272a]">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-semibold">{thoughts.length}</div>
            <div className="text-xs text-muted-foreground">Thoughts</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{commits.length}</div>
            <div className="text-xs text-muted-foreground">Commits</div>
          </div>
          <div>
            <div className="text-lg font-semibold">
              {thoughts.filter(t => t.starred).length}
            </div>
            <div className="text-xs text-muted-foreground">Starred</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
