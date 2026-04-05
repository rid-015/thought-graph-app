'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { ArrowLeft, ChevronRight, Settings } from 'lucide-react'
import { useThoughtStore, type Thought, type Edge, NODE_COLORS } from '@/lib/thought-store'
import { cn } from '@/lib/utils'

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  thought: Thought
  radius: number
}

interface SimulationEdge {
  source: Node
  target: Node
  edge: Edge
}

// Edge color - reddish brown with low opacity like the reference
const EDGE_COLOR = 'rgba(180, 100, 80, 0.25)'
const EDGE_COLOR_HOVER = 'rgba(180, 100, 80, 0.6)'

export function ForceGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<SimulationEdge[]>([])
  const connectionCountRef = useRef<Map<string, number>>(new Map())
  
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNode, setDraggedNode] = useState<Node | null>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 })
  
  // Control panel state
  const [showGroups, setShowGroups] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const [showDisplay, setShowDisplay] = useState(false)
  const [showForces, setShowForces] = useState(false)
  
  // Display settings
  const [nodeSize, setNodeSize] = useState(1)
  const [edgeOpacity, setEdgeOpacity] = useState(0.25)
  const [showLabels, setShowLabels] = useState(false)
  
  const {
    thoughts,
    edges,
    selectedThoughtId,
    isCreatingThought,
    focusedClusterId,
    selectThought,
    addThought,
    setCreatingThought,
    setFocusedCluster,
    updatePosition,
  } = useThoughtStore()
  
  // Calculate connection counts
  useEffect(() => {
    const counts = new Map<string, number>()
    edges.forEach(edge => {
      counts.set(edge.source, (counts.get(edge.source) || 0) + 1)
      counts.set(edge.target, (counts.get(edge.target) || 0) + 1)
    })
    connectionCountRef.current = counts
  }, [edges])
  
  // Initialize nodes from thoughts
  useEffect(() => {
    const existingNodes = new Map(nodesRef.current.map(n => [n.id, n]))
    const counts = connectionCountRef.current
    
    nodesRef.current = thoughts.map(thought => {
      const existing = existingNodes.get(thought.id)
      const connectionCount = counts.get(thought.id) || 0
      // Radius based on connections (2-8 range, with multiplier)
      const baseRadius = Math.max(2, Math.min(8, 2 + connectionCount * 0.5)) * nodeSize
      
      if (existing) {
        return { ...existing, thought, radius: baseRadius }
      }
      return {
        id: thought.id,
        x: thought.x,
        y: thought.y,
        vx: 0,
        vy: 0,
        thought,
        radius: baseRadius,
      }
    })
  }, [thoughts, nodeSize])
  
  // Initialize edges
  useEffect(() => {
    edgesRef.current = edges.map(edge => {
      const source = nodesRef.current.find(n => n.id === edge.source)
      const target = nodesRef.current.find(n => n.id === edge.target)
      return { source: source!, target: target!, edge }
    }).filter(e => e.source && e.target)
  }, [edges, thoughts])
  
  // Force simulation - very gentle to keep nodes mostly stable
  const simulate = useCallback(() => {
    const nodes = nodesRef.current
    const simEdges = edgesRef.current
    
    const centerX = 600
    const centerY = 400
    
    nodes.forEach((node, i) => {
      if (draggedNode?.id === node.id) return
      
      // Very weak repulsion
      nodes.forEach((other, j) => {
        if (i === j) return
        const dx = node.x - other.x
        const dy = node.y - other.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        if (dist < 50) {
          const force = 100 / (dist * dist)
          node.vx += (dx / dist) * force * 0.1
          node.vy += (dy / dist) * force * 0.1
        }
      })
      
      // Very weak edge attraction
      simEdges.forEach(({ source, target }) => {
        if (source.id !== node.id && target.id !== node.id) return
        const other = source.id === node.id ? target : source
        const dx = other.x - node.x
        const dy = other.y - node.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const idealDist = 80
        if (dist > idealDist * 1.5) {
          const force = (dist - idealDist) * 0.001
          node.vx += (dx / dist) * force
          node.vy += (dy / dist) * force
        }
      })
      
      // Very gentle centering
      node.vx += (centerX - node.x) * 0.00005
      node.vy += (centerY - node.y) * 0.00005
      
      // High damping for stability
      node.vx *= 0.85
      node.vy *= 0.85
      
      // Only move if velocity is significant
      if (Math.abs(node.vx) > 0.01 || Math.abs(node.vy) > 0.01) {
        node.x += node.vx
        node.y += node.vy
      }
    })
  }, [draggedNode])
  
  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    
    // Clear with dark background
    ctx.fillStyle = '#0f1115'
    ctx.fillRect(0, 0, rect.width, rect.height)
    
    ctx.save()
    ctx.translate(transform.x + rect.width / 2, transform.y + rect.height / 2)
    ctx.scale(transform.scale, transform.scale)
    ctx.translate(-600, -400)
    
    const nodes = nodesRef.current
    const simEdges = edgesRef.current
    
    // Draw edges first
    simEdges.forEach(({ source, target }) => {
      const isConnected = 
        hoveredNodeId === source.id || 
        hoveredNodeId === target.id ||
        selectedThoughtId === source.id ||
        selectedThoughtId === target.id
      
      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      
      ctx.strokeStyle = isConnected ? EDGE_COLOR_HOVER : `rgba(180, 100, 80, ${edgeOpacity})`
      ctx.lineWidth = isConnected ? 1.5 : 0.8
      ctx.stroke()
    })
    
    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNodeId === node.id
      const isSelected = selectedThoughtId === node.id
      const isConnectedToHovered = hoveredNodeId && simEdges.some(
        e => (e.source.id === hoveredNodeId && e.target.id === node.id) ||
             (e.target.id === hoveredNodeId && e.source.id === node.id)
      )
      const isConnectedToSelected = selectedThoughtId && simEdges.some(
        e => (e.source.id === selectedThoughtId && e.target.id === node.id) ||
             (e.target.id === selectedThoughtId && e.source.id === node.id)
      )
      
      const radius = node.radius * (isHovered || isSelected ? 1.3 : 1)
      const dimmed = (hoveredNodeId || selectedThoughtId) && !isHovered && !isSelected && !isConnectedToHovered && !isConnectedToSelected
      const alpha = dimmed ? 0.2 : 1
      
      // Soft glow effect
      if (isHovered || isSelected) {
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, radius * 4
        )
        gradient.addColorStop(0, node.thought.color.replace(')', `, 0.4)`).replace('rgb', 'rgba').replace('#', ''))
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius * 4, 0, Math.PI * 2)
        ctx.fill()
      }
      
      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
      
      // Parse hex color and apply alpha
      let fillColor = node.thought.color
      if (fillColor.startsWith('#')) {
        const r = parseInt(fillColor.slice(1, 3), 16)
        const g = parseInt(fillColor.slice(3, 5), 16)
        const b = parseInt(fillColor.slice(5, 7), 16)
        fillColor = `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
      
      ctx.fillStyle = fillColor
      ctx.fill()
      
      // Subtle white border on hover/select
      if (isHovered || isSelected) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      
      // Show label on hover if enabled or always for hovered/selected
      if ((showLabels || isHovered || isSelected) && (isHovered || isSelected)) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(node.thought.title, node.x, node.y - radius - 6)
      }
    })
    
    ctx.restore()
  }, [transform, hoveredNodeId, selectedThoughtId, edgeOpacity, showLabels])
  
  // Animation loop
  useEffect(() => {
    let running = true
    
    const tick = () => {
      if (!running) return
      simulate()
      render()
      animationRef.current = requestAnimationFrame(tick)
    }
    
    tick()
    
    return () => {
      running = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [simulate, render])
  
  // Get node at position
  const getNodeAtPosition = useCallback((clientX: number, clientY: number): Node | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    
    const rect = canvas.getBoundingClientRect()
    const canvasX = clientX - rect.left
    const canvasY = clientY - rect.top
    
    // Reverse transform
    const x = (canvasX - rect.width / 2 - transform.x) / transform.scale + 600
    const y = (canvasY - rect.height / 2 - transform.y) / transform.scale + 400
    
    for (const node of nodesRef.current) {
      const dx = node.x - x
      const dy = node.y - y
      if (Math.sqrt(dx * dx + dy * dy) < node.radius + 5) {
        return node
      }
    }
    return null
  }, [transform])
  
  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPos.x
      const dy = e.clientY - lastPanPos.y
      setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }))
      setLastPanPos({ x: e.clientX, y: e.clientY })
      return
    }
    
    if (isDragging && draggedNode) {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const canvasX = e.clientX - rect.left
      const canvasY = e.clientY - rect.top
      
      const x = (canvasX - rect.width / 2 - transform.x) / transform.scale + 600
      const y = (canvasY - rect.height / 2 - transform.y) / transform.scale + 400
      
      draggedNode.x = x
      draggedNode.y = y
      draggedNode.vx = 0
      draggedNode.vy = 0
      return
    }
    
    const node = getNodeAtPosition(e.clientX, e.clientY)
    setHoveredNodeId(node?.id || null)
  }, [getNodeAtPosition, isPanning, lastPanPos, isDragging, draggedNode, transform])
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY)
    
    if (node) {
      setIsDragging(true)
      setDraggedNode(node)
    } else {
      setIsPanning(true)
      setLastPanPos({ x: e.clientX, y: e.clientY })
    }
  }, [getNodeAtPosition])
  
  const handleMouseUp = useCallback(() => {
    if (isDragging && draggedNode) {
      updatePosition(draggedNode.id, draggedNode.x, draggedNode.y)
    }
    
    setIsDragging(false)
    setDraggedNode(null)
    setIsPanning(false)
  }, [isDragging, draggedNode, updatePosition])
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY)
    
    if (node) {
      selectThought(node.id)
    } else if (isCreatingThought) {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const canvasX = e.clientX - rect.left
      const canvasY = e.clientY - rect.top
      
      const x = (canvasX - rect.width / 2 - transform.x) / transform.scale + 600
      const y = (canvasY - rect.height / 2 - transform.y) / transform.scale + 400
      
      addThought({
        title: 'New Thought',
        content: '',
        x,
        y,
        color: '',
        tags: [],
        starred: false,
        isDraft: true,
      })
    }
  }, [getNodeAtPosition, selectThought, isCreatingThought, addThought, transform])
  
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY)
    if (node) {
      setFocusedCluster(node.id)
      setTransform({
        x: -node.x * 1.5 + 600,
        y: -node.y * 1.5 + 400,
        scale: 1.5,
      })
    }
  }, [getNodeAtPosition, setFocusedCluster])
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.2, Math.min(4, transform.scale * delta))
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const mouseX = e.clientX - rect.left - rect.width / 2
    const mouseY = e.clientY - rect.top - rect.height / 2
    
    setTransform(t => ({
      scale: newScale,
      x: mouseX - (mouseX - t.x) * (newScale / t.scale),
      y: mouseY - (mouseY - t.y) * (newScale / t.scale),
    }))
  }, [transform.scale])
  
  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 0.8 })
    setFocusedCluster(null)
  }, [setFocusedCluster])

  // Control panel section component
  const ControlSection = ({ 
    label, 
    isOpen, 
    onToggle,
    children 
  }: { 
    label: string
    isOpen: boolean
    onToggle: () => void
    children?: React.ReactNode
  }) => (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 py-1.5 text-sm text-primary hover:text-primary/80"
      >
        <ChevronRight className={cn("h-3 w-3 transition-transform", isOpen && "rotate-90")} />
        {label}
      </button>
      {isOpen && children && (
        <div className="ml-5 mt-1 space-y-2 text-xs text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#0f1115]">
      {/* Control panel overlay - like Obsidian */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-0.5 rounded-md bg-[#1a1d24]/90 p-3 backdrop-blur-sm">
        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Settings className="h-3.5 w-3.5" />
          <span className="font-medium">Graph view</span>
        </div>
        
        <ControlSection label="Groups" isOpen={showGroups} onToggle={() => setShowGroups(!showGroups)}>
          <div className="space-y-1">
            {['core', 'research', 'ideas', 'projects'].map(group => (
              <label key={group} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="h-3 w-3 accent-primary" />
                <span className="capitalize">{group}</span>
              </label>
            ))}
          </div>
        </ControlSection>
        
        <ControlSection label="Filters" isOpen={showFilters} onToggle={() => setShowFilters(!showFilters)}>
          <div className="space-y-1">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-3 w-3 accent-primary" />
              <span>Show orphans</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-3 w-3 accent-primary" />
              <span>Show attachments</span>
            </label>
          </div>
        </ControlSection>
        
        <ControlSection label="Colors" isOpen={showColors} onToggle={() => setShowColors(!showColors)}>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(NODE_COLORS).slice(0, 6).map(([name, color]) => (
              <div
                key={name}
                className="h-4 w-4 rounded-full border border-white/10"
                style={{ backgroundColor: color }}
                title={name}
              />
            ))}
          </div>
        </ControlSection>
        
        <ControlSection label="Display" isOpen={showDisplay} onToggle={() => setShowDisplay(!showDisplay)}>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block">Node size</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={nodeSize}
                onChange={(e) => setNodeSize(parseFloat(e.target.value))}
                className="h-1 w-full accent-primary"
              />
            </div>
            <div>
              <label className="mb-1 block">Edge opacity</label>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={edgeOpacity}
                onChange={(e) => setEdgeOpacity(parseFloat(e.target.value))}
                className="h-1 w-full accent-primary"
              />
            </div>
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="h-3 w-3 accent-primary" 
              />
              <span>Show labels</span>
            </label>
          </div>
        </ControlSection>
        
        <ControlSection label="Forces" isOpen={showForces} onToggle={() => setShowForces(!showForces)}>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block">Center force</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                defaultValue="0.5"
                className="h-1 w-full accent-primary"
              />
            </div>
            <div>
              <label className="mb-1 block">Repel force</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                defaultValue="0.3"
                className="h-1 w-full accent-primary"
              />
            </div>
          </div>
        </ControlSection>
      </div>
      
      {/* Back button */}
      {(focusedClusterId || transform.scale !== 0.8) && (
        <button
          onClick={resetView}
          className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-md bg-[#1a1d24]/90 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Reset view
        </button>
      )}
      
      {/* Creating mode indicator */}
      {isCreatingThought && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-md bg-primary/20 px-4 py-2 text-xs text-primary backdrop-blur-sm">
          Click anywhere on the graph to place a new thought
        </div>
      )}
      
      {/* Node count */}
      <div className="absolute bottom-4 right-4 z-10 rounded-md bg-[#1a1d24]/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
        {thoughts.length} nodes · {edges.length} connections
      </div>
      
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ 
          cursor: isCreatingThought ? 'crosshair' : hoveredNodeId ? 'pointer' : isPanning ? 'grabbing' : 'grab' 
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      />
    </div>
  )
}
