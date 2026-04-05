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
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

const COMMIT_ICONS = {
  create: Plus,
  update: Pencil,
  connect: Link2,
  insight: Lightbulb,
}

// Activity level colors - subtle grayscale
const ACTIVITY_COLORS = [
  'rgba(255, 255, 255, 0.04)',
  'rgba(255, 255, 255, 0.10)',
  'rgba(255, 255, 255, 0.18)',
  'rgba(255, 255, 255, 0.28)',
  'rgba(255, 255, 255, 0.40)',
]

function getActivityColor(count: number): string {
  if (count === 0) return ACTIVITY_COLORS[0]
  if (count <= 2) return ACTIVITY_COLORS[1]
  if (count <= 4) return ACTIVITY_COLORS[2]
  if (count <= 6) return ACTIVITY_COLORS[3]
  return ACTIVITY_COLORS[4]
}

export function CommitPanel() {
  const [newCommit, setNewCommit] = useState('')
  
  const thoughts = useStore(s => s.thoughts)
  const commits = useStore(s => s.commits)
  const activity = useStore(s => s.activity)
  const selectedId = useStore(s => s.selectedThoughtId)
  const selectedThought = thoughts.find(t => t.id === selectedId)
  const selectThought = useStore(s => s.selectThought)
  const addCommit = useStore(s => s.addCommit)
  const toggleStar = useStore(s => s.toggleStar)
  
  // Group activity by weeks for grid
  const activityGrid = useMemo(() => {
    const weeks: typeof activity[] = []
    for (let i = 0; i < activity.length; i += 7) {
      weeks.push(activity.slice(i, i + 7))
    }
    return weeks
  }, [activity])
  
  // Calculate stats
  const totalActivity = useMemo(() => 
    activity.reduce((sum, a) => sum + a.count, 0), 
    [activity]
  )
  
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
    <aside className="w-72 h-full flex flex-col glass-subtle">
      {/* Selected thought detail */}
      {selectedThought && (
        <div className="border-b border-white/[0.04]">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full opacity-60"
                  style={{ backgroundColor: NODE_COLORS[selectedThought.color] }}
                />
                <h2 className="font-medium text-[13px] text-white/90 leading-tight">{selectedThought.title}</h2>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => toggleStar(selectedThought.id)}
                  className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors"
                >
                  <Star 
                    className={`w-3 h-3 ${
                      selectedThought.starred 
                        ? 'text-white/60 fill-white/60' 
                        : 'text-white/30'
                    }`} 
                  />
                </button>
                <button
                  onClick={() => selectThought(null)}
                  className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-3 h-3 text-white/30" />
                </button>
              </div>
            </div>
            
            <p className="text-[12px] text-white/40 mb-3 leading-relaxed">
              {selectedThought.content || 'No content yet...'}
            </p>
            
            <div className="text-[10px] text-white/25 font-mono">
              {formatDistanceToNow(selectedThought.updatedAt, { addSuffix: true })}
            </div>
          </div>
        </div>
      )}
      
      {/* Activity Graph */}
      <div className="p-4 border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-medium text-white/60">Activity</span>
          <span className="text-[10px] text-white/30">{totalActivity} contributions</span>
        </div>
        
        {/* GitHub-style contribution grid */}
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-[2px]">
            {activityGrid.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[2px]">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="w-[8px] h-[8px] rounded-[2px] transition-colors"
                    style={{ backgroundColor: getActivityColor(day.count) }}
                    title={`${format(day.date, 'MMM d, yyyy')}: ${day.count} contribution${day.count !== 1 ? 's' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-2">
          <span className="text-[9px] text-white/25 mr-1">Less</span>
          {ACTIVITY_COLORS.map((color, i) => (
            <div
              key={i}
              className="w-[8px] h-[8px] rounded-[2px]"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-[9px] text-white/25 ml-1">More</span>
        </div>
      </div>
      
      {/* Commit input */}
      <div className="p-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 mb-2">
          <GitCommit className="w-3 h-3 text-white/30" />
          <span className="text-[11px] font-medium text-white/40">Stream</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Log an insight..."
            value={newCommit}
            onChange={e => setNewCommit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCommit()}
            className="flex-1 h-7 px-2.5 text-[12px] bg-white/[0.04] border border-white/[0.06] rounded-md placeholder:text-white/25 focus:outline-none focus:border-white/10 transition-colors"
          />
          <button
            onClick={handleAddCommit}
            disabled={!newCommit.trim()}
            className="h-7 w-7 flex items-center justify-center bg-white/[0.08] rounded-md hover:bg-white/12 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-white/60" />
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
                className="group relative flex gap-2.5 py-2 px-2"
              >
                {/* Timeline line */}
                {idx < commits.length - 1 && (
                  <div className="absolute left-[13px] top-[22px] bottom-0 w-px bg-white/[0.06]" />
                )}
                
                {/* Icon */}
                <div className="relative z-10 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-white/[0.06]">
                  <Icon className="w-2 h-2 text-white/40" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/60 leading-snug mb-1">
                    {commit.message}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-white/25">
                      {formatDistanceToNow(commit.timestamp, { addSuffix: true })}
                    </span>
                    {thought && (
                      <button
                        onClick={() => selectThought(thought.id)}
                        className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors"
                      >
                        <span
                          className="w-1 h-1 rounded-full opacity-60"
                          style={{ backgroundColor: NODE_COLORS[thought.color] }}
                        />
                        <span className="truncate max-w-20">{thought.title}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Stats footer */}
      <div className="p-3 border-t border-white/[0.04]">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-sm font-medium text-white/80">{thoughts.length}</div>
            <div className="text-[9px] text-white/30 uppercase tracking-wider">Thoughts</div>
          </div>
          <div>
            <div className="text-sm font-medium text-white/80">{commits.length}</div>
            <div className="text-[9px] text-white/30 uppercase tracking-wider">Commits</div>
          </div>
          <div>
            <div className="text-sm font-medium text-white/80">
              {thoughts.filter(t => t.starred).length}
            </div>
            <div className="text-[9px] text-white/30 uppercase tracking-wider">Starred</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
