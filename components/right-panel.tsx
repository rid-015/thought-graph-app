'use client'

import { useState } from 'react'
import { GitCommit, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThoughtStore } from '@/lib/thought-store'

export function RightPanel() {
  const [newCommitText, setNewCommitText] = useState('')
  
  const {
    globalCommits,
    addGlobalCommit,
    selectThought,
    selectedThoughtId,
  } = useThoughtStore()
  
  const handleAddCommit = () => {
    if (newCommitText.trim()) {
      addGlobalCommit(newCommitText.trim(), selectedThoughtId || undefined)
      setNewCommitText('')
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddCommit()
    }
  }
  
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-[#2E2E2E] bg-[#232323]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#2E2E2E] px-4 py-3">
        <GitCommit className="h-4 w-4 text-[#7AA2F7]" />
        <span className="text-[14px] font-medium text-[#EAEAEA]">Global Updates</span>
      </div>
      
      {/* Add Commit Input */}
      <div className="border-b border-[#2E2E2E] p-4">
        <input
          type="text"
          value={newCommitText}
          onChange={(e) => setNewCommitText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add update..."
          className="w-full rounded-md border border-[#2E2E2E] bg-[#1E1E1E] px-3 py-2 text-[14px] text-[#EAEAEA] placeholder-[#808080] outline-none transition-colors focus:border-[#7AA2F7]/50"
        />
        <p className="mt-2 text-[11px] text-[#808080]">
          Press Enter to add a thought commit
        </p>
      </div>
      
      {/* Commits List */}
      <div className="flex-1 overflow-y-auto">
        {globalCommits.length > 0 ? (
          <div className="divide-y divide-[#2E2E2E]">
            {globalCommits.map((commit) => (
              <div
                key={commit.id}
                className="px-4 py-3 transition-colors hover:bg-[#2A2A2A]"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center">
                    <Circle className="h-2 w-2 fill-current text-[#7AA2F7]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-relaxed text-[#EAEAEA]">
                      {commit.content}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[#808080]">
                        {formatTime(commit.timestamp)}
                      </span>
                      {commit.nodeId && commit.nodeTitle && (
                        <>
                          <span className="text-[#808080]">·</span>
                          <button
                            onClick={() => selectThought(commit.nodeId!)}
                            className={cn(
                              "truncate text-[11px] transition-colors",
                              selectedThoughtId === commit.nodeId
                                ? "text-[#7AA2F7]"
                                : "text-[#B0B0B0] hover:text-[#7AA2F7]"
                            )}
                          >
                            {commit.nodeTitle}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#2A2A2A]">
                <GitCommit className="h-4 w-4 text-[#808080]" />
              </div>
              <p className="text-[14px] text-[#B0B0B0]">No updates yet</p>
              <p className="mt-1 text-[12px] text-[#808080]">
                Add your first thought commit above
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t border-[#2E2E2E] p-3">
        <p className="font-mono text-[10px] text-[#808080]">
          {globalCommits.length} commits
        </p>
      </div>
    </aside>
  )
}
