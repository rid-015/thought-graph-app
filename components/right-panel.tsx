'use client'

import { useState } from 'react'
import { X, Star, GitCommit, Link2, MessageSquare, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThoughtStore, type RelationshipType } from '@/lib/thought-store'

const relationshipColors: Record<RelationshipType, string> = {
  supports: 'text-green-400 bg-green-400/10',
  contradicts: 'text-red-400 bg-red-400/10',
  relates: 'text-blue-400 bg-blue-400/10',
  causes: 'text-orange-400 bg-orange-400/10',
}

export function RightPanel() {
  const [newComment, setNewComment] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [linkType, setLinkType] = useState<RelationshipType>('relates')
  
  const {
    thoughts,
    edges,
    selectedThoughtId,
    selectThought,
    updateThought,
    addComment,
    addEdge,
    toggleStar,
    deleteThought,
  } = useThoughtStore()
  
  const selectedThought = thoughts.find(t => t.id === selectedThoughtId)
  
  if (!selectedThought) {
    return (
      <aside className="flex h-full w-80 flex-col border-l border-[#232634] bg-[#151821]">
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#1d212b]">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-sans text-sm text-muted-foreground">
              Select a thought to view details
            </p>
            <p className="mt-1 font-sans text-xs text-muted-foreground/60">
              or click anywhere on the graph to create one
            </p>
          </div>
        </div>
      </aside>
    )
  }
  
  const connectedEdges = edges.filter(
    e => e.source === selectedThought.id || e.target === selectedThought.id
  )
  
  const connectedThoughts = connectedEdges.map(edge => {
    const otherId = edge.source === selectedThought.id ? edge.target : edge.source
    const thought = thoughts.find(t => t.id === otherId)
    return { edge, thought }
  }).filter(({ thought }) => thought)
  
  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(selectedThought.id, newComment.trim())
      setNewComment('')
    }
  }
  
  const handleLink = (targetId: string) => {
    addEdge(selectedThought.id, targetId, linkType)
    setIsLinking(false)
  }
  
  const unlinkedThoughts = thoughts.filter(
    t => t.id !== selectedThought.id && 
    !connectedEdges.some(e => e.source === t.id || e.target === t.id)
  ).slice(0, 20) // Limit to 20 for performance
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <aside className="flex h-full w-80 flex-col border-l border-[#232634] bg-[#151821]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#232634] px-4 py-3">
        <div className="flex items-center gap-2">
          <GitCommit className="h-4 w-4 text-primary" />
          <span className="font-sans text-sm font-medium text-foreground">Thought Thread</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleStar(selectedThought.id)}
            className={cn(
              "rounded p-1.5 transition-colors",
              selectedThought.starred 
                ? "text-yellow-400 hover:text-yellow-300" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Star className={cn("h-4 w-4", selectedThought.starred && "fill-current")} />
          </button>
          <button
            onClick={() => selectThought(null)}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Title */}
        <div className="border-b border-[#232634] p-4">
          <input
            type="text"
            value={selectedThought.title}
            onChange={(e) => updateThought(selectedThought.id, { title: e.target.value })}
            className="w-full bg-transparent font-sans text-base font-medium text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Thought title..."
          />
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatDate(selectedThought.updatedAt)}
            </span>
            {selectedThought.isDraft && (
              <span className="rounded bg-primary/20 px-1.5 py-0.5 font-sans text-[10px] text-primary">
                draft
              </span>
            )}
          </div>
          {/* Tags */}
          {selectedThought.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedThought.tags.map(tag => (
                <span
                  key={tag}
                  className="rounded-full bg-[#252a36] px-2 py-0.5 font-sans text-[10px] text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div className="border-b border-[#232634] p-4">
          <textarea
            value={selectedThought.content}
            onChange={(e) => updateThought(selectedThought.id, { content: e.target.value })}
            className="min-h-[100px] w-full resize-none bg-transparent font-sans text-sm leading-relaxed text-foreground/90 outline-none placeholder:text-muted-foreground"
            placeholder="Write your thoughts..."
          />
        </div>
        
        {/* Thread / Comments */}
        <div className="border-b border-[#232634] p-4">
          <div className="mb-3 flex items-center gap-2">
            <GitCommit className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-sans text-xs font-medium text-muted-foreground">
              Thought Commits ({selectedThought.comments.length})
            </span>
          </div>
          
          {selectedThought.comments.length > 0 ? (
            <div className="space-y-3">
              {selectedThought.comments.map(comment => (
                <div key={comment.id} className="border-l-2 border-[#2a2f3d] pl-3">
                  <p className="font-sans text-sm text-foreground/80">{comment.content}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {formatDate(comment.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-sans text-xs text-muted-foreground/60">No commits yet</p>
          )}
          
          {/* Add Comment */}
          <div className="mt-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a commit..."
              className="w-full resize-none rounded-md border border-[#2a2f3d] bg-[#1d212b] px-3 py-2 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
              rows={2}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="mt-2 w-full rounded-md bg-[#252a36] px-3 py-2 font-sans text-xs text-foreground transition-colors hover:bg-[#2a2f3d] disabled:opacity-50"
            >
              Add Commit
            </button>
          </div>
        </div>
        
        {/* Connections */}
        <div className="border-b border-[#232634] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-sans text-xs font-medium text-muted-foreground">
                Connections ({connectedThoughts.length})
              </span>
            </div>
            <button
              onClick={() => setIsLinking(!isLinking)}
              className={cn(
                "rounded px-2.5 py-1 font-sans text-xs transition-colors",
                isLinking 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-[#252a36] text-muted-foreground hover:text-foreground"
              )}
            >
              {isLinking ? 'Cancel' : '+ Link'}
            </button>
          </div>
          
          {/* Link Mode */}
          {isLinking && (
            <div className="mb-3 rounded-md border border-[#2a2f3d] bg-[#1d212b] p-3">
              <p className="mb-2 font-sans text-[11px] text-muted-foreground">
                Select relationship type:
              </p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(['supports', 'contradicts', 'relates', 'causes'] as RelationshipType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setLinkType(type)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-sans text-[11px] capitalize transition-colors",
                      linkType === type ? relationshipColors[type] : "bg-[#252a36] text-muted-foreground"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <p className="mb-2 font-sans text-[11px] text-muted-foreground">
                Select thought to link:
              </p>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {unlinkedThoughts.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleLink(t.id)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-[#252a36]"
                  >
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="truncate font-sans text-xs text-foreground/80">
                      {t.title}
                    </span>
                  </button>
                ))}
                {unlinkedThoughts.length === 0 && (
                  <p className="font-sans text-[11px] text-muted-foreground/60">
                    All nearby thoughts are connected
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Connected Thoughts */}
          {connectedThoughts.length > 0 ? (
            <div className="space-y-1.5">
              {connectedThoughts.slice(0, 10).map(({ edge, thought }) => thought && (
                <button
                  key={edge.id}
                  onClick={() => selectThought(thought.id)}
                  className="flex w-full items-center gap-2 rounded-md bg-[#1d212b] px-2.5 py-2 text-left transition-colors hover:bg-[#252a36]"
                >
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 font-sans text-[9px] capitalize",
                    relationshipColors[edge.type]
                  )}>
                    {edge.type}
                  </span>
                  <span className="flex-1 truncate font-sans text-xs text-foreground/80">
                    {thought.title}
                  </span>
                </button>
              ))}
              {connectedThoughts.length > 10 && (
                <p className="px-2.5 font-sans text-[11px] text-muted-foreground">
                  +{connectedThoughts.length - 10} more connections
                </p>
              )}
            </div>
          ) : (
            <p className="font-sans text-xs text-muted-foreground/60">No connections yet</p>
          )}
        </div>
        
        {/* Filters (collapsible) */}
        <div className="p-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex w-full items-center justify-between font-sans text-xs text-muted-foreground"
          >
            <span>Filters & Groups</span>
            {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          
          {showFilters && (
            <div className="mt-3 space-y-3">
              <div>
                <p className="mb-1.5 font-sans text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  By Connection Type
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(['supports', 'contradicts', 'relates', 'causes'] as RelationshipType[]).map(type => (
                    <span
                      key={type}
                      className={cn(
                        "rounded-full px-2 py-0.5 font-sans text-[10px] capitalize",
                        relationshipColors[type]
                      )}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="border-t border-[#232634] p-3">
        <button
          onClick={() => {
            deleteThought(selectedThought.id)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-destructive/10 px-3 py-2 font-sans text-xs text-destructive transition-colors hover:bg-destructive/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Thought
        </button>
      </div>
    </aside>
  )
}
