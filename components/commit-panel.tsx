'use client'

import { useState, useMemo } from 'react'
import { useStore, NODE_COLORS } from '@/lib/store'
import { 
  GitCommit, 
  Plus, 
  Link2, 
  Lightbulb, 
  Pencil,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

const COMMIT_ICONS = {
  create: Plus,
  update: Pencil,
  connect: Link2,
  insight: Lightbulb,
}

// Amber-based activity colors
const ACTIVITY_COLORS = [
  'rgba(255, 255, 255, 0.04)',
  'rgba(217, 119, 6, 0.20)',
  'rgba(217, 119, 6, 0.35)',
  'rgba(217, 119, 6, 0.55)',
  'rgba(217, 119, 6, 0.80)',
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
  const selectThought = useStore(s => s.selectThought)
  const addCommit = useStore(s => s.addCommit)
  
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
    <aside className="w-72 h-full flex flex-col glass-subtle border-l border-white/6">
      {/* Header */}
      <div className="p-4 border-b border-white/6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-amber-500/15 flex items-center justify-center">
            <GitCommit className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-sm font-medium text-white/80">Activity</span>
        </div>
      </div>
      
      {/* Activity Graph */}
      <div className="p-4 border-b border-white/6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-white/40">{totalActivity} entries this year</span>
        </div>
        
        {/* GitHub-style contribution grid */}
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-[2px]">
            {activityGrid.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[2px]">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="w-[9px] h-[9px] rounded-[2px] transition-all duration-150 hover:ring-1 hover:ring-white/30 hover:scale-125"
                    style={{ backgroundColor: getActivityColor(day.count) }}
                    title={`${format(day.date, 'MMM d, yyyy')}: ${day.count} entr${day.count !== 1 ? 'ies' : 'y'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-3">
          <span className="text-[9px] text-white/30 mr-1">Less</span>
          {ACTIVITY_COLORS.map((color, i) => (
            <div
              key={i}
              className="w-[9px] h-[9px] rounded-[2px]"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-[9px] text-white/30 ml-1">More</span>
        </div>
      </div>
      
      {/* Commit input */}
      <div className="p-3 border-b border-white/6">
        <div className="flex gap-2" suppressHydrationWarning>
          <input
            type="text"
            placeholder="Add an insight..."
            value={newCommit}
            onChange={e => setNewCommit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCommit()}
            className="input flex-1"
          />
          <button
            onClick={handleAddCommit}
            disabled={!newCommit.trim()}
            className="group btn-primary h-9 w-9 flex items-center justify-center p-0 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all duration-150"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
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
                className="group relative flex gap-3 py-2.5 px-2 rounded-sm hover:bg-white/3 transition-all duration-150 hover:translate-x-0.5"
              >
                {/* Timeline line */}
                {idx < commits.length - 1 && (
                  <div className="absolute left-[17px] top-[30px] bottom-0 w-px bg-white/6" />
                )}
                
                {/* Icon */}
                <div className={`relative z-10 w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0 ${
                  commit.type === 'create' ? 'bg-emerald-500/15 text-emerald-400' :
                  commit.type === 'connect' ? 'bg-blue-500/15 text-blue-400' :
                  commit.type === 'insight' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-white/8 text-white/50'
                }`}>
                  <Icon className="w-2.5 h-2.5" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/70 leading-snug mb-1">
                    {commit.message}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-white/30 font-mono">
                      {formatDistanceToNow(commit.timestamp, { addSuffix: true })}
                    </span>
                    {thought && (
                      <button
                        onClick={() => selectThought(thought.id)}
                        className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/60 transition-colors"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
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
      <div className="p-4 border-t border-white/6">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/3 rounded-sm py-2.5 hover:bg-white/5 transition-colors duration-150">
            <div className="text-sm font-medium text-white/90">{thoughts.length}</div>
            <div className="text-[9px] text-white/40">Thoughts</div>
          </div>
          <div className="bg-white/3 rounded-sm py-2.5 hover:bg-white/5 transition-colors duration-150">
            <div className="text-sm font-medium text-white/90">{commits.length}</div>
            <div className="text-[9px] text-white/40">Commits</div>
          </div>
          <div className="group relative bg-amber-500/10 rounded-sm py-2.5 hover:bg-amber-500/15 transition-colors duration-150">
            <span className="absolute -top-px -left-px w-1.5 h-px bg-amber-500/50 group-hover:w-2.5 transition-all duration-200" />
            <span className="absolute -top-px -left-px w-px h-1.5 bg-amber-500/50 group-hover:h-2.5 transition-all duration-200" />
            <div className="text-sm font-medium text-amber-400">
              {thoughts.filter(t => t.starred).length}
            </div>
            <div className="text-[9px] text-white/40">Starred</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
