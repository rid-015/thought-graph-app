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
      <aside className="flex h-full w-80 flex-col border-l border-border bg-card">
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-mono text-sm text-muted-foreground">
              Select a thought to view details
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground/60">
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
  )
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <aside className="flex h-full w-80 flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <GitCommit className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs font-medium text-foreground">Thought Thread</span>
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
        <div className="border-b border-border p-4">
          <input
            type="text"
            value={selectedThought.title}
            onChange={(e) => updateThought(selectedThought.id, { title: e.target.value })}
            className="w-full bg-transparent font-mono text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Thought title..."
          />
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatDate(selectedThought.updatedAt)}
            </span>
            {selectedThought.isDraft && (
              <span className="rounded bg-accent/20 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                draft
              </span>
            )}
          </div>
          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedThought.tags.map(tag => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] text-secondary-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="border-b border-border p-4">
          <textarea
            value={selectedThought.content}
            onChange={(e) => updateThought(selectedThought.id, { content: e.target.value })}
            className="min-h-[120px] w-full resize-none bg-transparent font-mono text-xs leading-relaxed text-foreground/90 outline-none placeholder:text-muted-foreground"
            placeholder="Write your thoughts..."
          />
        </div>
        
        {/* Thread / Comments */}
        <div className="border-b border-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <GitCommit className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-xs font-medium text-muted-foreground">
              Thought Commits ({selectedThought.comments.length})
            </span>
          </div>
          
          {selectedThought.comments.length > 0 ? (
            <div className="space-y-3">
              {selectedThought.comments.map(comment => (
                <div key={comment.id} className="border-l-2 border-border pl-3">
                  <p className="font-mono text-xs text-foreground/80">{comment.content}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {formatDate(comment.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs text-muted-foreground/60">No commits yet</p>
          )}
          
          {/* Add Comment */}
          <div className="mt-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a commit..."
              className="w-full resize-none rounded-md border border-border bg-input px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
              rows={2}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="mt-2 w-full rounded-md bg-secondary px-3 py-1.5 font-mono text-xs text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
            >
              Add Commit
            </button>
          </div>
        </div>
        
        {/* Connections */}
        <div className="border-b border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-xs font-medium text-muted-foreground">
                Connections ({connectedThoughts.length})
              </span>
            </div>
            <button
              onClick={() => setIsLinking(!isLinking)}
              className={cn(
                "rounded px-2 py-1 font-mono text-[10px] transition-colors",
                isLinking 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {isLinking ? 'Cancel' : '+ Link'}
            </button>
          </div>
          
          {/* Link Mode */}
          {isLinking && (
            <div className="mb-3 rounded-md border border-border bg-input p-3">
              <p className="mb-2 font-mono text-[10px] text-muted-foreground">
                Select relationship type:
              </p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(['supports', 'contradicts', 'relates', 'causes'] as RelationshipType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setLinkType(type)}
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-[10px] capitalize transition-colors",
                      linkType === type ? relationshipColors[type] : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <p className="mb-2 font-mono text-[10px] text-muted-foreground">
                Select thought to link:
              </p>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {unlinkedThoughts.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleLink(t.id)}
                    className="w-full rounded px-2 py-1 text-left font-mono text-xs text-foreground/80 transition-colors hover:bg-secondary"
                  >
                    {t.title}
                  </button>
                ))}
                {unlinkedThoughts.length === 0 && (
                  <p className="font-mono text-[10px] text-muted-foreground/60">
                    All thoughts are connected
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Connected Thoughts */}
          {connectedThoughts.length > 0 ? (
            <div className="space-y-2">
              {connectedThoughts.map(({ edge, thought }) => thought && (
                <button
                  key={edge.id}
                  onClick={() => selectThought(thought.id)}
                  className="flex w-full items-center gap-2 rounded-md bg-secondary/30 px-2.5 py-2 text-left transition-colors hover:bg-secondary/50"
                >
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 font-mono text-[9px] capitalize",
                    relationshipColors[edge.type]
                  )}>
                    {edge.type}
                  </span>
                  <span className="flex-1 truncate font-mono text-xs text-foreground/80">
                    {thought.title}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs text-muted-foreground/60">No connections yet</p>
          )}
        </div>
        
        {/* Filters (collapsible) */}
        <div className="p-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex w-full items-center justify-between font-mono text-xs text-muted-foreground"
          >
            <span>Filters & Groups</span>
            {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          
          {showFilters && (
            <div className="mt-3 space-y-3">
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  By Connection Type
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(['supports', 'contradicts', 'relates', 'causes'] as RelationshipType[]).map(type => (
                    <span
                      key={type}
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-[10px] capitalize",
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
      <div className="border-t border-border p-3">
        <button
          onClick={() => {
            deleteThought(selectedThought.id)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive transition-colors hover:bg-destructive/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Thought
        </button>
      </div>
    </aside>
  )
}
