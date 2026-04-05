'use client'

import { useEffect, useRef, useCallback } from 'react'
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
const REPULSION = 600
const ATTRACTION = 0.006
const DAMPING = 0.85
const CENTER_GRAVITY = 0.008

// Colors
const EDGE_COLOR = 'rgba(251, 146, 60, 0.15)'
const EDGE_HOVER_COLOR = 'rgba(251, 146, 60, 0.45)'
const BG_COLOR = '#09090b'

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
  
  const thoughts = useStore(s => s.thoughts)
  const connections = useStore(s => s.connections)
  const selectedId = useStore(s => s.selectedThoughtId)
  const hoveredId = useStore(s => s.hoveredThoughtId)
  const selectThought = useStore(s => s.selectThought)
  const hoverThought = useStore(s => s.hoverThought)
  
  // Store refs for callbacks
  const stateRef = useRef({ selectedId, hoveredId })
  stateRef.current = { selectedId, hoveredId }
  
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
    
    // Create nodes with organic spiral distribution
    const nodes: GraphNode[] = thoughts.map((thought, i) => {
      const angle = i * 0.618 * Math.PI * 2 // Golden angle
      const radius = 100 + Math.sqrt(i) * 35
      const jitter = random() * 40 - 20
      const x = centerX + Math.cos(angle) * (radius + jitter)
      const y = centerY + Math.sin(angle) * (radius + jitter)
      
      const count = connectionCount[thought.id] || 0
      const nodeRadius = Math.max(3, Math.min(7, 3 + count * 0.4))
      
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
  
  // Animation loop - runs continuously but uses refs for state
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
          
          if (dist < 250) {
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
        
        const force = (dist - 70) * ATTRACTION
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
        if (node.x < margin) node.vx += (margin - node.x) * 0.05
        if (node.x > width - margin) node.vx += (width - margin - node.x) * 0.05
        if (node.y < margin) node.vy += (margin - node.y) * 0.05
        if (node.y > height - margin) node.vy += (height - margin - node.y) * 0.05
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
      
      // Draw edges
      ctx.lineWidth = 1
      edges.forEach(edge => {
        const isHighlighted = 
          (connectedToHovered.has(edge.source.id) && connectedToHovered.has(edge.target.id)) ||
          (connectedToSelected.has(edge.source.id) && connectedToSelected.has(edge.target.id))
        
        ctx.beginPath()
        ctx.moveTo(edge.source.x, edge.source.y)
        ctx.lineTo(edge.target.x, edge.target.y)
        ctx.strokeStyle = isHighlighted ? EDGE_HOVER_COLOR : hasHighlight ? 'rgba(251, 146, 60, 0.04)' : EDGE_COLOR
        ctx.stroke()
      })
      
      // Draw nodes
      nodes.forEach(node => {
        const isHovered = node.id === hoveredId
        const isSelected = node.id === selectedId
        const isConnected = connectedToHovered.has(node.id) || connectedToSelected.has(node.id)
        const isDimmed = hasHighlight && !isConnected
        
        const color = NODE_COLORS[node.thought.color]
        const radius = node.radius * (isHovered || isSelected ? 1.4 : 1)
        
        // Glow
        if (isHovered || isSelected) {
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 3.5)
          gradient.addColorStop(0, hexToRgba(color, 0.25))
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(node.x, node.y, radius * 3.5, 0, Math.PI * 2)
          ctx.fill()
        }
        
        // Node
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = isDimmed ? hexToRgba(color, 0.15) : color
        ctx.fill()
        
        // Label
        if (isHovered || isSelected) {
          ctx.font = '11px Inter, system-ui, sans-serif'
          ctx.fillStyle = '#fafafa'
          ctx.textAlign = 'center'
          ctx.fillText(node.thought.title, node.x, node.y - radius - 8)
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
  }, []) // Empty deps - uses refs for all state
  
  // Mouse handlers
  const getMousePos = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    const t = transformRef.current
    return {
      x: (e.clientX - rect.left - t.x) / t.scale,
      y: (e.clientY - rect.top - t.y) / t.scale,
    }
  }, [])
  
  const findNodeAt = useCallback((x: number, y: number) => {
    const nodes = nodesRef.current
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      const dx = x - node.x
      const dy = y - node.y
      if (dx * dx + dy * dy < (node.radius + 6) ** 2) return node
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
    } else if (drag.isDragging) {
      transformRef.current.x = e.clientX - drag.dragStart.x
      transformRef.current.y = e.clientY - drag.dragStart.y
    } else {
      const node = findNodeAt(pos.x, pos.y)
      hoverThought(node?.id || null)
    }
  }, [getMousePos, findNodeAt, hoverThought])
  
  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false
    dragStateRef.current.draggedNode = null
  }, [])
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    const pos = getMousePos(e)
    const node = findNodeAt(pos.x, pos.y)
    selectThought(node?.id || null)
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
  
  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />
    </div>
  )
}
