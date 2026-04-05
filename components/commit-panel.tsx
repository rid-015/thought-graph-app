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
  ExternalLink,
  Activity
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

const COMMIT_ICONS = {
  create: Plus,
  update: Pencil,
  connect: Link2,
  insight: Lightbulb,
}

// Activity level colors (GitHub style)
const ACTIVITY_COLORS = [
  '#161b22', // 0 - empty
  '#0e4429', // 1-2
  '#006d32', // 3-4
  '#26a641', // 5-6
  '#39d353', // 7+
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
    <aside className="w-80 h-full flex flex-col bg-[#0c0c0e] border-l border-[#1f1f23]">
      {/* Selected thought detail */}
      {selectedThought && (
        <div className="border-b border-[#1f1f23]">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[selectedThought.color] }}
                />
                <h2 className="font-medium text-sm leading-tight">{selectedThought.title}</h2>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => toggleStar(selectedThought.id)}
                  className="p-1.5 rounded-md hover:bg-[#27272a] transition-colors"
                >
                  <Star 
                    className={`w-3.5 h-3.5 ${
                      selectedThought.starred 
                        ? 'text-yellow-500 fill-yellow-500' 
                        : 'text-[#525259]'
                    }`} 
                  />
                </button>
                <button
                  onClick={() => selectThought(null)}
                  className="p-1.5 rounded-md hover:bg-[#27272a] transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-[#525259]" />
                </button>
              </div>
            </div>
            
            <p className="text-[13px] text-[#a1a1aa] mb-3 leading-relaxed">
              {selectedThought.content || 'No content yet...'}
            </p>
            
            <div className="flex items-center gap-2 text-[11px] text-[#525259]">
              <span className="font-mono">
                {formatDistanceToNow(selectedThought.updatedAt, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Activity Graph */}
      <div className="p-4 border-b border-[#1f1f23]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <span className="text-[13px] font-medium">Activity</span>
          </div>
          <span className="text-[11px] text-[#525259]">{totalActivity} contributions</span>
        </div>
        
        {/* GitHub-style contribution grid */}
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-[3px]">
            {activityGrid.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="w-[10px] h-[10px] rounded-sm transition-colors"
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
          <span className="text-[10px] text-[#525259] mr-1">Less</span>
          {ACTIVITY_COLORS.map((color, i) => (
            <div
              key={i}
              className="w-[10px] h-[10px] rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-[10px] text-[#525259] ml-1">More</span>
        </div>
      </div>
      
      {/* Commit input */}
      <div className="p-3 border-b border-[#1f1f23]">
        <div className="flex items-center gap-2 mb-2">
          <GitCommit className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-[12px] font-medium text-[#71717a]">Thought Stream</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Log an insight..."
            value={newCommit}
            onChange={e => setNewCommit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCommit()}
            className="flex-1 h-8 px-3 text-[13px] bg-[#18181b] border border-[#27272a] rounded-lg placeholder:text-[#525259] focus:outline-none focus:border-[#3f3f46] transition-colors"
          />
          <button
            onClick={handleAddCommit}
            disabled={!newCommit.trim()}
            className="h-8 px-3 bg-teal-500 text-white rounded-lg hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                  commit.type === 'create' ? 'bg-emerald-500/20 text-emerald-400' :
                  commit.type === 'update' ? 'bg-blue-500/20 text-blue-400' :
                  commit.type === 'connect' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  <Icon className="w-2.5 h-2.5" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#e4e4e7] leading-snug mb-1">
                    {commit.message}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono text-[#525259]">
                      {formatDistanceToNow(commit.timestamp, { addSuffix: true })}
                    </span>
                    {thought && (
                      <button
                        onClick={() => selectThought(thought.id)}
                        className="flex items-center gap-1.5 text-[11px] text-[#525259] hover:text-white transition-colors"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: NODE_COLORS[thought.color] }}
                        />
                        <span className="truncate max-w-28">{thought.title}</span>
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
      
      {/* Stats footer */}
      <div className="p-3 border-t border-[#1f1f23]">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-base font-semibold text-white">{thoughts.length}</div>
            <div className="text-[10px] text-[#525259] uppercase tracking-wide">Thoughts</div>
          </div>
          <div>
            <div className="text-base font-semibold text-white">{commits.length}</div>
            <div className="text-[10px] text-[#525259] uppercase tracking-wide">Commits</div>
          </div>
          <div>
            <div className="text-base font-semibold text-white">
              {thoughts.filter(t => t.starred).length}
            </div>
            <div className="text-[10px] text-[#525259] uppercase tracking-wide">Starred</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
