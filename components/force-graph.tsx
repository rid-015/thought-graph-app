'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useThoughtStore, type Thought, type Edge } from '@/lib/thought-store'

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

// Convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

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
    setFocusedCluster,
    updatePosition,
  } = useThoughtStore()
  
  // Calculate connection counts for node sizing
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
      // Slight size variation based on connections (3-7px range)
      const baseRadius = Math.max(3, Math.min(7, 3 + connectionCount * 0.4))
      
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
  }, [thoughts])
  
  // Initialize edges
  useEffect(() => {
    edgesRef.current = edges.map(edge => {
      const source = nodesRef.current.find(n => n.id === edge.source)
      const target = nodesRef.current.find(n => n.id === edge.target)
      return { source: source!, target: target!, edge }
    }).filter(e => e.source && e.target)
  }, [edges, thoughts])
  
  // Gentle force simulation for natural settling
  const simulate = useCallback(() => {
    const nodes = nodesRef.current
    const simEdges = edgesRef.current
    
    const centerX = 500
    const centerY = 350
    
    nodes.forEach((node, i) => {
      if (draggedNode?.id === node.id) return
      
      // Weak repulsion between close nodes
      nodes.forEach((other, j) => {
        if (i === j) return
        const dx = node.x - other.x
        const dy = node.y - other.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        if (dist < 40) {
          const force = 50 / (dist * dist)
          node.vx += (dx / dist) * force * 0.05
          node.vy += (dy / dist) * force * 0.05
        }
      })
      
      // Weak edge attraction
      simEdges.forEach(({ source, target }) => {
        if (source.id !== node.id && target.id !== node.id) return
        const other = source.id === node.id ? target : source
        const dx = other.x - node.x
        const dy = other.y - node.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const idealDist = 60
        if (dist > idealDist * 1.2) {
          const force = (dist - idealDist) * 0.0005
          node.vx += (dx / dist) * force
          node.vy += (dy / dist) * force
        }
      })
      
      // Very gentle centering
      node.vx += (centerX - node.x) * 0.00002
      node.vy += (centerY - node.y) * 0.00002
      
      // High damping for smooth settling
      node.vx *= 0.9
      node.vy *= 0.9
      
      // Only move if velocity is significant
      if (Math.abs(node.vx) > 0.01 || Math.abs(node.vy) > 0.01) {
        node.x += node.vx
        node.y += node.vy
      }
    })
  }, [draggedNode])
  
  // Render the graph
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    
    // Clear with Obsidian background color
    ctx.fillStyle = '#1E1E1E'
    ctx.fillRect(0, 0, rect.width, rect.height)
    
    ctx.save()
    ctx.translate(transform.x + rect.width / 2, transform.y + rect.height / 2)
    ctx.scale(transform.scale, transform.scale)
    ctx.translate(-500, -350)
    
    const nodes = nodesRef.current
    const simEdges = edgesRef.current
    
    // Draw edges - thin lines with low opacity (~0.3)
    simEdges.forEach(({ source, target }) => {
      const isConnected = 
        hoveredNodeId === source.id || 
        hoveredNodeId === target.id ||
        selectedThoughtId === source.id ||
        selectedThoughtId === target.id
      
      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      
      ctx.strokeStyle = isConnected ? 'rgba(180, 180, 180, 0.5)' : 'rgba(120, 120, 120, 0.3)'
      ctx.lineWidth = isConnected ? 1 : 0.5
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
      
      const radius = node.radius * (isHovered || isSelected ? 1.4 : 1)
      const dimmed = (hoveredNodeId || selectedThoughtId) && !isHovered && !isSelected && !isConnectedToHovered && !isConnectedToSelected
      const alpha = dimmed ? 0.25 : 1
      
      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(node.thought.color, alpha)
      ctx.fill()
      
      // Subtle border on hover/select
      if (isHovered || isSelected) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      
      // Show label on hover/select
      if (isHovered || isSelected) {
        ctx.fillStyle = '#EAEAEA'
        ctx.font = '11px system-ui, -apple-system, sans-serif'
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
    const canvasX = clientX - rect.left
    const canvasY = clientY - rect.top
    
    // Reverse transform
    const x = (canvasX - rect.width / 2 - transform.x) / transform.scale + 500
    const y = (canvasY - rect.height / 2 - transform.y) / transform.scale + 350
    
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
      
      const x = (canvasX - rect.width / 2 - transform.x) / transform.scale + 500
      const y = (canvasY - rect.height / 2 - transform.y) / transform.scale + 350
      
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
      
      const x = (canvasX - rect.width / 2 - transform.x) / transform.scale + 500
      const y = (canvasY - rect.height / 2 - transform.y) / transform.scale + 350
      
      addThought({
        title: 'New Note',
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
        x: -node.x * 1.8 + 500,
        y: -node.y * 1.8 + 350,
        scale: 1.8,
      })
    }
  }, [getNodeAtPosition, setFocusedCluster])
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.3, Math.min(3, transform.scale * delta))
    
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
    setTransform({ x: 0, y: 0, scale: 1 })
    setFocusedCluster(null)
  }, [setFocusedCluster])

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#1E1E1E]">
      {/* Reset View button - top left, subtle */}
      <button
        onClick={resetView}
        className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-md bg-[#2A2A2A] px-3 py-1.5 text-sm text-[#B0B0B0] transition-colors hover:bg-[#323232] hover:text-[#EAEAEA]"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset View
      </button>
      
      {/* Creating mode indicator */}
      {isCreatingThought && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-md bg-[#2A2A2A] px-4 py-2 text-sm text-[#B0B0B0]">
          Click anywhere on the graph to place a new note
        </div>
      )}
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
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
