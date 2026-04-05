'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useThoughtStore, type Thought, type Edge } from '@/lib/thought-store'

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  thought: Thought
}

interface SimulationEdge {
  source: Node
  target: Node
  edge: Edge
}

const NODE_RADIUS = 8
const HOVER_RADIUS = 12

export function ForceGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<SimulationEdge[]>([])
  
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNode, setDraggedNode] = useState<Node | null>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 })
  
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
  
  // Initialize nodes from thoughts
  useEffect(() => {
    const existingNodes = new Map(nodesRef.current.map(n => [n.id, n]))
    
    nodesRef.current = thoughts.map(thought => {
      const existing = existingNodes.get(thought.id)
      if (existing) {
        return { ...existing, thought }
      }
      return {
        id: thought.id,
        x: thought.x,
        y: thought.y,
        vx: 0,
        vy: 0,
        thought,
      }
    })
  }, [thoughts])
  
  // Initialize edges
  useEffect(() => {
    edgesRef.current = edges.map(edge => {
      const source = nodesRef.current.find(n => n.id === edge.source)
      const target = nodesRef.current.find(n => n.id === edge.target)
      return { source: source!, target: target!, edge }
    }).filter(e => e.source && e.target)
  }, [edges, thoughts])
  
  // Force simulation
  const simulate = useCallback(() => {
    const nodes = nodesRef.current
    const simEdges = edgesRef.current
    
    const centerX = (containerRef.current?.clientWidth || 800) / 2
    const centerY = (containerRef.current?.clientHeight || 600) / 2
    
    // Apply forces
    nodes.forEach((node, i) => {
      if (draggedNode?.id === node.id) return
      
      // Repulsion between nodes
      nodes.forEach((other, j) => {
        if (i === j) return
        const dx = node.x - other.x
        const dy = node.y - other.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = 2000 / (dist * dist)
        node.vx += (dx / dist) * force
        node.vy += (dy / dist) * force
      })
      
      // Attraction along edges
      simEdges.forEach(({ source, target }) => {
        if (source.id !== node.id && target.id !== node.id) return
        const other = source.id === node.id ? target : source
        const dx = other.x - node.x
        const dy = other.y - node.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const idealDist = 150
        const force = (dist - idealDist) * 0.01
        node.vx += (dx / dist) * force
        node.vy += (dy / dist) * force
      })
      
      // Gentle centering force
      node.vx += (centerX - node.x) * 0.0005
      node.vy += (centerY - node.y) * 0.0005
      
      // Apply velocity with damping
      node.vx *= 0.9
      node.vy *= 0.9
      node.x += node.vx
      node.y += node.vy
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
    
    // Clear
    ctx.fillStyle = '#08080c'
    ctx.fillRect(0, 0, rect.width, rect.height)
    
    // Draw subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)'
    ctx.lineWidth = 1
    const gridSize = 50 * transform.scale
    const offsetX = transform.x % gridSize
    const offsetY = transform.y % gridSize
    
    for (let x = offsetX; x < rect.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, rect.height)
      ctx.stroke()
    }
    for (let y = offsetY; y < rect.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(rect.width, y)
      ctx.stroke()
    }
    
    ctx.save()
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.scale, transform.scale)
    
    const nodes = nodesRef.current
    const simEdges = edgesRef.current
    
    // Draw edges
    simEdges.forEach(({ source, target, edge }) => {
      const isConnected = 
        hoveredNodeId === source.id || 
        hoveredNodeId === target.id ||
        selectedThoughtId === source.id ||
        selectedThoughtId === target.id
      
      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      
      let color = 'rgba(255, 255, 255, 0.08)'
      if (isConnected) {
        switch (edge.type) {
          case 'supports':
            color = 'rgba(74, 222, 128, 0.5)'
            break
          case 'contradicts':
            color = 'rgba(248, 113, 113, 0.5)'
            break
          case 'causes':
            color = 'rgba(251, 146, 60, 0.5)'
            break
          default:
            color = 'rgba(96, 165, 250, 0.5)'
        }
      }
      
      ctx.strokeStyle = color
      ctx.lineWidth = isConnected ? 2 : 1
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
      
      const radius = isHovered || isSelected ? HOVER_RADIUS : NODE_RADIUS
      const alpha = (hoveredNodeId || selectedThoughtId) && !isHovered && !isSelected && !isConnectedToHovered && !isConnectedToSelected ? 0.3 : 1
      
      // Glow effect
      if (isHovered || isSelected) {
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, radius * 3
        )
        const color = node.thought.color.includes('blue') ? '96, 165, 250' :
                      node.thought.color.includes('purple') ? '167, 139, 250' :
                      node.thought.color.includes('orange') ? '251, 146, 60' :
                      node.thought.color.includes('cyan') ? '34, 211, 238' :
                      '74, 222, 128'
        gradient.addColorStop(0, `rgba(${color}, 0.4)`)
        gradient.addColorStop(1, `rgba(${color}, 0)`)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      
      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
      
      // Color mapping
      let fillColor = 'rgba(96, 165, 250, ' + alpha + ')'
      if (node.thought.color.includes('purple')) {
        fillColor = 'rgba(167, 139, 250, ' + alpha + ')'
      } else if (node.thought.color.includes('orange')) {
        fillColor = 'rgba(251, 146, 60, ' + alpha + ')'
      } else if (node.thought.color.includes('cyan')) {
        fillColor = 'rgba(34, 211, 238, ' + alpha + ')'
      } else if (node.thought.color.includes('green')) {
        fillColor = 'rgba(74, 222, 128, ' + alpha + ')'
      }
      
      ctx.fillStyle = fillColor
      ctx.fill()
      
      // Node title on hover
      if (isHovered || isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '11px JetBrains Mono, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(node.thought.title, node.x, node.y - radius - 8)
      }
    })
    
    ctx.restore()
  }, [transform, hoveredNodeId, selectedThoughtId])
  
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
    const x = (clientX - rect.left - transform.x) / transform.scale
    const y = (clientY - rect.top - transform.y) / transform.scale
    
    for (const node of nodesRef.current) {
      const dx = node.x - x
      const dy = node.y - y
      if (Math.sqrt(dx * dx + dy * dy) < HOVER_RADIUS) {
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
      const x = (e.clientX - rect.left - transform.x) / transform.scale
      const y = (e.clientY - rect.top - transform.y) / transform.scale
      
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
  
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
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
      const x = (e.clientX - rect.left - transform.x) / transform.scale
      const y = (e.clientY - rect.top - transform.y) / transform.scale
      
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
      // Zoom to node
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      setTransform({
        x: centerX - node.x * 1.5,
        y: centerY - node.y * 1.5,
        scale: 1.5,
      })
    }
  }, [getNodeAtPosition, setFocusedCluster])
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.3, Math.min(3, transform.scale * delta))
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    setTransform(t => ({
      scale: newScale,
      x: mouseX - (mouseX - t.x) * (newScale / t.scale),
      y: mouseY - (mouseY - t.y) * (newScale / t.scale),
    }))
  }, [transform.scale])
  
  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 })
    setFocusedCluster(null)
  }, [setFocusedCluster])

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-background">
      {/* Back button */}
      {(focusedClusterId || transform.scale !== 1) && (
        <button
          onClick={resetView}
          className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-md bg-secondary/80 px-3 py-1.5 font-mono text-xs text-secondary-foreground backdrop-blur-sm transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to full graph
        </button>
      )}
      
      {/* Creating mode indicator */}
      {isCreatingThought && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-md bg-primary/20 px-4 py-2 font-mono text-xs text-primary backdrop-blur-sm">
          Click anywhere on the graph to place a new thought
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair"
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
