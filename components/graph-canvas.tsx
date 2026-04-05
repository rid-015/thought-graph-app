'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useStore, NODE_COLORS, type Thought, type Connection } from '@/lib/store'

interface GraphNode {
  id: string
  thought: Thought
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface GraphEdge {
  source: GraphNode
  target: GraphNode
  connection: Connection
}

// Physics constants
const REPULSION = 500
const ATTRACTION = 0.005
const DAMPING = 0.9
const CENTER_GRAVITY = 0.004

// Theme-oriented muted colors (amber/warm palette)
const THEME_COLORS: Record<string, string> = {
  amber: '#b45309',
  orange: '#c2410c', 
  rose: '#9f1239',
  violet: '#6d28d9',
  blue: '#1d4ed8',
  emerald: '#047857',
  slate: '#475569',
}

// Edge colors
const EDGE_COLOR = 'rgba(255, 255, 255, 0.06)'
const EDGE_HOVER_COLOR = 'rgba(245, 158, 11, 0.35)'
const BG_COLOR = '#0c0c0e'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Seeded random for consistent initial positions
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

interface TooltipData {
  x: number
  y: number
  title: string
  folder: string
  connections: number
}

export function GraphCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<GraphNode[]>([])
  const edgesRef = useRef<GraphEdge[]>([])
  const transformRef = useRef({ x: 0, y: 0, scale: 1 })
  const dragStateRef = useRef({ 
    isDragging: false, 
    dragStart: { x: 0, y: 0 },
    draggedNode: null as GraphNode | null 
  })
  const animationRef = useRef<number | null>(null)
  const initializedRef = useRef(false)
  
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  
  const thoughts = useStore(s => s.thoughts)
  const connections = useStore(s => s.connections)
  const folders = useStore(s => s.folders)
  const selectedId = useStore(s => s.selectedThoughtId)
  const hoveredId = useStore(s => s.hoveredThoughtId)
  const selectThought = useStore(s => s.selectThought)
  const hoverThought = useStore(s => s.hoverThought)
  
  // Store refs for callbacks
  const stateRef = useRef({ selectedId, hoveredId })
  stateRef.current = { selectedId, hoveredId }
  
  // Count connections per thought
  const connectionCountRef = useRef<Record<string, number>>({})
  
  // Initialize graph data only once
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return
    initializedRef.current = true
    
    const { width, height } = containerRef.current.getBoundingClientRect()
    const centerX = width / 2
    const centerY = height / 2
    const random = seededRandom(123)
    
    // Count connections per thought
    const connectionCount: Record<string, number> = {}
    connections.forEach(c => {
      connectionCount[c.source] = (connectionCount[c.source] || 0) + 1
      connectionCount[c.target] = (connectionCount[c.target] || 0) + 1
    })
    connectionCountRef.current = connectionCount
    
    // Create nodes with organic spiral distribution - SMALLER NODES
    const nodes: GraphNode[] = thoughts.map((thought, i) => {
      const angle = i * 0.618 * Math.PI * 2 // Golden angle
      const radius = 80 + Math.sqrt(i) * 30
      const jitter = random() * 30 - 15
      const x = centerX + Math.cos(angle) * (radius + jitter)
      const y = centerY + Math.sin(angle) * (radius + jitter)
      
      const count = connectionCount[thought.id] || 0
      // Smaller base radius: 2-4 instead of 3-7
      const nodeRadius = Math.max(2, Math.min(4, 2 + count * 0.2))
      
      return {
        id: thought.id,
        thought,
        x,
        y,
        vx: 0,
        vy: 0,
        radius: nodeRadius,
      }
    })
    
    nodesRef.current = nodes
    
    // Create edges
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const edges: GraphEdge[] = connections
      .map(conn => {
        const source = nodeMap.get(conn.source)
        const target = nodeMap.get(conn.target)
        if (source && target) {
          return { source, target, connection: conn }
        }
        return null
      })
      .filter((e): e is GraphEdge => e !== null)
    
    edgesRef.current = edges
  }, [thoughts, connections])
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let running = true
    
    const tick = () => {
      if (!running) return
      
      const nodes = nodesRef.current
      const edges = edgesRef.current
      const transform = transformRef.current
      const dragState = dragStateRef.current
      const { selectedId, hoveredId } = stateRef.current
      
      if (nodes.length === 0) {
        animationRef.current = requestAnimationFrame(tick)
        return
      }
      
      const { width, height } = container.getBoundingClientRect()
      const centerX = width / 2
      const centerY = height / 2
      const dpr = window.devicePixelRatio || 1
      
      // Resize canvas if needed
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
      }
      
      // Physics simulation
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i]
        if (dragState.draggedNode?.id === nodeA.id) continue
        
        // Center gravity
        nodeA.vx += (centerX - nodeA.x) * CENTER_GRAVITY
        nodeA.vy += (centerY - nodeA.y) * CENTER_GRAVITY
        
        // Repulsion
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j]
          const dx = nodeB.x - nodeA.x
          const dy = nodeB.y - nodeA.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          
          if (dist < 200) {
            const force = REPULSION / (dist * dist)
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force
            
            nodeA.vx -= fx
            nodeA.vy -= fy
            if (dragState.draggedNode?.id !== nodeB.id) {
              nodeB.vx += fx
              nodeB.vy += fy
            }
          }
        }
      }
      
      // Edge attraction
      edges.forEach(edge => {
        const dx = edge.target.x - edge.source.x
        const dy = edge.target.y - edge.source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        
        const force = (dist - 60) * ATTRACTION
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        
        if (dragState.draggedNode?.id !== edge.source.id) {
          edge.source.vx += fx
          edge.source.vy += fy
        }
        if (dragState.draggedNode?.id !== edge.target.id) {
          edge.target.vx -= fx
          edge.target.vy -= fy
        }
      })
      
      // Update positions
      nodes.forEach(node => {
        if (dragState.draggedNode?.id === node.id) return
        
        node.vx *= DAMPING
        node.vy *= DAMPING
        node.x += node.vx
        node.y += node.vy
        
        // Soft bounds
        const margin = 60
        if (node.x < margin) node.vx += (margin - node.x) * 0.04
        if (node.x > width - margin) node.vx += (width - margin - node.x) * 0.04
        if (node.y < margin) node.vy += (margin - node.y) * 0.04
        if (node.y > height - margin) node.vy += (height - margin - node.y) * 0.04
      })
      
      // Render
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, width, height)
      
      ctx.save()
      ctx.translate(transform.x, transform.y)
      ctx.scale(transform.scale, transform.scale)
      
      // Get highlighted nodes
      const connectedToHovered = new Set<string>()
      const connectedToSelected = new Set<string>()
      
      if (hoveredId) {
        connectedToHovered.add(hoveredId)
        edges.forEach(e => {
          if (e.source.id === hoveredId) connectedToHovered.add(e.target.id)
          if (e.target.id === hoveredId) connectedToHovered.add(e.source.id)
        })
      }
      
      if (selectedId) {
        connectedToSelected.add(selectedId)
        edges.forEach(e => {
          if (e.source.id === selectedId) connectedToSelected.add(e.target.id)
          if (e.target.id === selectedId) connectedToSelected.add(e.source.id)
        })
      }
      
      const hasHighlight = hoveredId || selectedId
      
      // Draw edges - thinner lines
      ctx.lineWidth = 0.5
      edges.forEach(edge => {
        const isHighlighted = 
          (connectedToHovered.has(edge.source.id) && connectedToHovered.has(edge.target.id)) ||
          (connectedToSelected.has(edge.source.id) && connectedToSelected.has(edge.target.id))
        
        ctx.beginPath()
        ctx.moveTo(edge.source.x, edge.source.y)
        ctx.lineTo(edge.target.x, edge.target.y)
        ctx.strokeStyle = isHighlighted ? EDGE_HOVER_COLOR : hasHighlight ? 'rgba(255, 255, 255, 0.02)' : EDGE_COLOR
        ctx.stroke()
      })
      
      // Draw nodes
      nodes.forEach(node => {
        const isHovered = node.id === hoveredId
        const isSelected = node.id === selectedId
        const isConnected = connectedToHovered.has(node.id) || connectedToSelected.has(node.id)
        const isDimmed = hasHighlight && !isConnected
        
        // Use theme-oriented color
        const themeColor = THEME_COLORS[node.thought.color] || THEME_COLORS.slate
        const radius = node.radius * (isHovered || isSelected ? 2 : 1)
        
        // Subtle glow for selected/hovered
        if (isHovered || isSelected) {
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 6)
          gradient.addColorStop(0, hexToRgba(themeColor, 0.2))
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(node.x, node.y, radius * 6, 0, Math.PI * 2)
          ctx.fill()
        }
        
        // Node dot
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = isDimmed ? hexToRgba(themeColor, 0.15) : hexToRgba(themeColor, 0.8)
        ctx.fill()
        
        // Bright center for visibility
        if (!isDimmed) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, radius * 0.4, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
          ctx.fill()
        }
      })
      
      ctx.restore()
      
      animationRef.current = requestAnimationFrame(tick)
    }
    
    tick()
    
    return () => {
      running = false
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])
  
  // Mouse handlers
  const getMousePos = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0, screenX: 0, screenY: 0 }
    const t = transformRef.current
    return {
      x: (e.clientX - rect.left - t.x) / t.scale,
      y: (e.clientY - rect.top - t.y) / t.scale,
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top,
    }
  }, [])
  
  const findNodeAt = useCallback((x: number, y: number) => {
    const nodes = nodesRef.current
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      const dx = x - node.x
      const dy = y - node.y
      // Larger hit area for smaller nodes
      if (dx * dx + dy * dy < (node.radius + 12) ** 2) return node
    }
    return null
  }, [])
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getMousePos(e)
    const node = findNodeAt(pos.x, pos.y)
    
    if (node) {
      dragStateRef.current.draggedNode = node
    } else {
      dragStateRef.current.isDragging = true
      dragStateRef.current.dragStart = { 
        x: e.clientX - transformRef.current.x, 
        y: e.clientY - transformRef.current.y 
      }
    }
  }, [getMousePos, findNodeAt])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getMousePos(e)
    const drag = dragStateRef.current
    
    if (drag.draggedNode) {
      drag.draggedNode.x = pos.x
      drag.draggedNode.y = pos.y
      drag.draggedNode.vx = 0
      drag.draggedNode.vy = 0
      setTooltip(null)
    } else if (drag.isDragging) {
      transformRef.current.x = e.clientX - drag.dragStart.x
      transformRef.current.y = e.clientY - drag.dragStart.y
      setTooltip(null)
    } else {
      const node = findNodeAt(pos.x, pos.y)
      hoverThought(node?.id || null)
      
      if (node) {
        const folder = folders.find(f => f.id === node.thought.folderId)
        const connCount = connectionCountRef.current[node.id] || 0
        setTooltip({
          x: pos.screenX,
          y: pos.screenY,
          title: node.thought.title,
          folder: folder?.name || 'Uncategorized',
          connections: connCount,
        })
      } else {
        setTooltip(null)
      }
    }
  }, [getMousePos, findNodeAt, hoverThought, folders])
  
  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false
    dragStateRef.current.draggedNode = null
  }, [])
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    const pos = getMousePos(e)
    const node = findNodeAt(pos.x, pos.y)
    if (node) {
      selectThought(node.id)
    }
  }, [getMousePos, findNodeAt, selectThought])
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const t = transformRef.current
    
    const delta = e.deltaY > 0 ? 0.92 : 1.08
    const newScale = Math.max(0.3, Math.min(3, t.scale * delta))
    const scaleChange = newScale / t.scale
    
    transformRef.current = {
      x: mouseX - (mouseX - t.x) * scaleChange,
      y: mouseY - (mouseY - t.y) * scaleChange,
      scale: newScale,
    }
  }, [])
  
  const handleMouseLeave = useCallback(() => {
    dragStateRef.current.isDragging = false
    dragStateRef.current.draggedNode = null
    setTooltip(null)
    hoverThought(null)
  }, [hoverThought])
  
  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      
      {/* Tooltip overlay - like the reference image */}
      {tooltip && (
        <div 
          className="absolute pointer-events-none z-50"
          style={{
            left: tooltip.x + 16,
            top: tooltip.y - 8,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="bg-[#1a1a1f]/95 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 shadow-xl">
            <div className="text-[13px] font-medium text-white/90 mb-1">
              {tooltip.title}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-white/50">
              <span>{tooltip.folder}</span>
              <span className="text-white/30">|</span>
              <span>{tooltip.connections} connections</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Graph view indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/8">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
        <span className="text-[11px] text-white/50">Graph View</span>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-[10px] text-white/30">
        Drag to pan · Scroll to zoom · Click node to view
      </div>
    </div>
  )
}
