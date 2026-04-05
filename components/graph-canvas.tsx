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
const REPULSION = 800
const ATTRACTION = 0.008
const DAMPING = 0.92
const CENTER_GRAVITY = 0.01
const MIN_DISTANCE = 30

// Colors
const EDGE_COLOR = 'rgba(251, 146, 60, 0.18)'
const EDGE_HOVER_COLOR = 'rgba(251, 146, 60, 0.5)'
const BG_COLOR = '#09090b'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function GraphCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<GraphNode[]>([])
  const edgesRef = useRef<GraphEdge[]>([])
  const animationRef = useRef<number | null>(null)
  
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null)
  
  const thoughts = useStore(s => s.thoughts)
  const connections = useStore(s => s.connections)
  const selectedId = useStore(s => s.selectedThoughtId)
  const hoveredId = useStore(s => s.hoveredThoughtId)
  const selectThought = useStore(s => s.selectThought)
  const hoverThought = useStore(s => s.hoverThought)
  
  // Initialize graph data
  useEffect(() => {
    if (!containerRef.current) return
    
    const { width, height } = containerRef.current.getBoundingClientRect()
    const centerX = width / 2
    const centerY = height / 2
    
    // Count connections per thought
    const connectionCount: Record<string, number> = {}
    connections.forEach(c => {
      connectionCount[c.source] = (connectionCount[c.source] || 0) + 1
      connectionCount[c.target] = (connectionCount[c.target] || 0) + 1
    })
    
    // Create nodes with organic distribution
    const nodes: GraphNode[] = thoughts.map((thought, i) => {
      // Distribute in a spiral pattern with randomness
      const angle = i * 0.5 + Math.random() * 0.5
      const radius = 80 + i * 3 + Math.random() * 100
      const x = centerX + Math.cos(angle) * radius * (0.8 + Math.random() * 0.4)
      const y = centerY + Math.sin(angle) * radius * (0.8 + Math.random() * 0.4)
      
      // Size based on connections
      const count = connectionCount[thought.id] || 0
      const nodeRadius = Math.max(3, Math.min(8, 3 + count * 0.5))
      
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
  
  // Physics simulation
  const simulate = useCallback(() => {
    const nodes = nodesRef.current
    const edges = edgesRef.current
    if (!containerRef.current || nodes.length === 0) return
    
    const { width, height } = containerRef.current.getBoundingClientRect()
    const centerX = width / 2
    const centerY = height / 2
    
    // Apply forces
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i]
      
      // Skip dragged node
      if (draggedNode && nodeA.id === draggedNode.id) continue
      
      // Center gravity
      nodeA.vx += (centerX - nodeA.x) * CENTER_GRAVITY
      nodeA.vy += (centerY - nodeA.y) * CENTER_GRAVITY
      
      // Repulsion between nodes
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeB = nodes[j]
        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        
        if (dist < 300) {
          const force = REPULSION / (dist * dist)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          
          nodeA.vx -= fx
          nodeA.vy -= fy
          if (!draggedNode || nodeB.id !== draggedNode.id) {
            nodeB.vx += fx
            nodeB.vy += fy
          }
        }
      }
    }
    
    // Attraction along edges
    edges.forEach(edge => {
      const dx = edge.target.x - edge.source.x
      const dy = edge.target.y - edge.source.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      
      const force = (dist - 80) * ATTRACTION
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      
      if (!draggedNode || edge.source.id !== draggedNode.id) {
        edge.source.vx += fx
        edge.source.vy += fy
      }
      if (!draggedNode || edge.target.id !== draggedNode.id) {
        edge.target.vx -= fx
        edge.target.vy -= fy
      }
    })
    
    // Update positions
    nodes.forEach(node => {
      if (draggedNode && node.id === draggedNode.id) return
      
      node.vx *= DAMPING
      node.vy *= DAMPING
      node.x += node.vx
      node.y += node.vy
      
      // Keep in bounds with soft edges
      const margin = 50
      if (node.x < margin) node.vx += (margin - node.x) * 0.1
      if (node.x > width - margin) node.vx += (width - margin - node.x) * 0.1
      if (node.y < margin) node.vy += (margin - node.y) * 0.1
      if (node.y > height - margin) node.vy += (height - margin - node.y) * 0.1
    })
  }, [draggedNode])
  
  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const { width, height } = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    
    // Set canvas size
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)
    }
    
    // Clear
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, width, height)
    
    ctx.save()
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.scale, transform.scale)
    
    const nodes = nodesRef.current
    const edges = edgesRef.current
    
    // Get connected nodes for highlighting
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
    edges.forEach(edge => {
      const isHighlighted = 
        connectedToHovered.has(edge.source.id) && connectedToHovered.has(edge.target.id) ||
        connectedToSelected.has(edge.source.id) && connectedToSelected.has(edge.target.id)
      
      ctx.beginPath()
      ctx.moveTo(edge.source.x, edge.source.y)
      ctx.lineTo(edge.target.x, edge.target.y)
      ctx.strokeStyle = isHighlighted ? EDGE_HOVER_COLOR : hasHighlight ? 'rgba(251, 146, 60, 0.06)' : EDGE_COLOR
      ctx.lineWidth = isHighlighted ? 1.5 : 1
      ctx.stroke()
    })
    
    // Draw nodes
    nodes.forEach(node => {
      const isHovered = node.id === hoveredId
      const isSelected = node.id === selectedId
      const isConnected = connectedToHovered.has(node.id) || connectedToSelected.has(node.id)
      const isDimmed = hasHighlight && !isConnected
      
      const color = NODE_COLORS[node.thought.color]
      const radius = node.radius * (isHovered || isSelected ? 1.5 : 1)
      
      // Glow for highlighted nodes
      if (isHovered || isSelected) {
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, radius * 4
        )
        gradient.addColorStop(0, hexToRgba(color, 0.3))
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius * 4, 0, Math.PI * 2)
        ctx.fill()
      }
      
      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = isDimmed ? hexToRgba(color, 0.2) : color
      ctx.fill()
      
      // Label for hovered/selected
      if (isHovered || isSelected) {
        ctx.font = '11px Inter, system-ui, sans-serif'
        ctx.fillStyle = '#fafafa'
        ctx.textAlign = 'center'
        ctx.fillText(node.thought.title, node.x, node.y - radius - 8)
      }
    })
    
    ctx.restore()
  }, [transform, hoveredId, selectedId])
  
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
  
  // Mouse handlers
  const getMousePos = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (e.clientX - rect.left - transform.x) / transform.scale,
      y: (e.clientY - rect.top - transform.y) / transform.scale,
    }
  }, [transform])
  
  const findNodeAt = useCallback((x: number, y: number) => {
    const nodes = nodesRef.current
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      const dx = x - node.x
      const dy = y - node.y
      if (dx * dx + dy * dy < (node.radius + 5) ** 2) {
        return node
      }
    }
    return null
  }, [])
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getMousePos(e)
    const node = findNodeAt(pos.x, pos.y)
    
    if (node) {
      setDraggedNode(node)
    } else {
      setIsDragging(true)
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
    }
  }, [getMousePos, findNodeAt, transform])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getMousePos(e)
    
    if (draggedNode) {
      draggedNode.x = pos.x
      draggedNode.y = pos.y
      draggedNode.vx = 0
      draggedNode.vy = 0
    } else if (isDragging) {
      setTransform(t => ({
        ...t,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }))
    } else {
      const node = findNodeAt(pos.x, pos.y)
      hoverThought(node?.id || null)
    }
  }, [getMousePos, draggedNode, isDragging, dragStart, findNodeAt, hoverThought])
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedNode(null)
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
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.3, Math.min(3, transform.scale * delta))
    
    // Zoom toward mouse position
    const scaleChange = newScale / transform.scale
    setTransform(t => ({
      x: mouseX - (mouseX - t.x) * scaleChange,
      y: mouseY - (mouseY - t.y) * scaleChange,
      scale: newScale,
    }))
  }, [transform.scale])
  
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
      
      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 px-2 py-1 rounded bg-[#18181b]/80 text-xs text-muted-foreground font-mono">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  )
}
