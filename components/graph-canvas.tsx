'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useStore, NODE_COLORS, type Thought, type Connection } from '@/lib/store'

interface GraphNode {
  id: string
  thought: Thought
  x: number
  y: number
  targetX: number
  targetY: number
  vx: number
  vy: number
  radius: number
  opacity: number
  appearDelay: number
}

interface GraphEdge {
  source: GraphNode
  target: GraphNode
  connection: Connection
}

// Animation constants
const ANIMATION_DURATION = 2500 // Total animation time in ms
const STAGGER_DELAY = 30 // Delay between each node appearing

// Theme colors - UI-matching amber/warm palette
const THEME_COLORS: Record<string, string> = {
  amber: '#f59e0b',
  orange: '#f97316',
  rose: '#fb7185', 
  violet: '#a78bfa',
  blue: '#60a5fa',
  emerald: '#34d399',
  slate: '#94a3b8',
}

// Edge colors - grey lines
const EDGE_COLOR = 'rgba(255, 255, 255, 0.12)'
const EDGE_HOVER_COLOR = 'rgba(255, 255, 255, 0.4)'
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
  const startTimeRef = useRef(0)
  
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
    startTimeRef.current = performance.now()
    
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
    
    // Bold radial hub-and-spoke layout
    // Sort thoughts by connection count descending — most connected = hubs
    const sorted = [...thoughts].sort(
      (a, b) => (connectionCount[b.id] || 0) - (connectionCount[a.id] || 0)
    )

    const total = sorted.length
    // Number of hub nodes placed in the first ring
    const hubCount = Math.min(6, Math.max(3, Math.floor(total * 0.25)))
    const nodes: GraphNode[] = []

    // Place hub nodes in a wide first ring
    const hubRingRadius = Math.min(width, height) * 0.28
    sorted.slice(0, hubCount).forEach((thought, i) => {
      const angle = (i / hubCount) * Math.PI * 2 - Math.PI / 2
      const count = connectionCount[thought.id] || 0
      nodes.push({
        id: thought.id,
        thought,
        x: centerX,
        y: centerY,
        targetX: centerX + Math.cos(angle) * hubRingRadius,
        targetY: centerY + Math.sin(angle) * hubRingRadius,
        vx: 0, vy: 0,
        radius: Math.max(4, Math.min(7, 3.5 + count * 0.35)),
        opacity: 0,
        appearDelay: i * STAGGER_DELAY,
      })
    })

    // Place remaining nodes in an outer ring, each anchored near its closest hub
    const outerRingRadius = Math.min(width, height) * 0.44
    const outerNodes = sorted.slice(hubCount)
    outerNodes.forEach((thought, i) => {
      const angle = (i / outerNodes.length) * Math.PI * 2 - Math.PI / 2 + (Math.PI / outerNodes.length)
      // Alternate radius slightly to avoid grid feel
      const r = outerRingRadius + (i % 3 === 0 ? 18 : i % 3 === 1 ? -18 : 0)
      const count = connectionCount[thought.id] || 0
      nodes.push({
        id: thought.id,
        thought,
        x: centerX,
        y: centerY,
        targetX: centerX + Math.cos(angle) * r,
        targetY: centerY + Math.sin(angle) * r,
        vx: 0, vy: 0,
        radius: Math.max(2.5, Math.min(4.5, 2.5 + count * 0.2)),
        opacity: 0,
        appearDelay: (hubCount + i) * STAGGER_DELAY,
      })
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
      const elapsed = performance.now() - startTimeRef.current
      
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
      
      // Update node positions with smooth eased animation (no physics)
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        
        // Skip if being dragged or animation is complete
        if (dragState.draggedNode?.id === node.id) continue
        
        const timeSinceAppear = elapsed - node.appearDelay
        const animDuration = 800 // Each node takes 800ms to reach position
        
        if (timeSinceAppear > 0 && timeSinceAppear < animDuration) {
          // Smooth ease-out animation to target position
          const progress = timeSinceAppear / animDuration
          
          // Ease out quart for smooth deceleration
          const ease = 1 - Math.pow(1 - progress, 4)
          
          node.opacity = Math.min(1, timeSinceAppear / 200)
          node.x = centerX + (node.targetX - centerX) * ease
          node.y = centerY + (node.targetY - centerY) * ease
        } else if (timeSinceAppear >= animDuration && node.opacity < 1) {
          // Ensure final state is set
          node.opacity = 1
          node.x = node.targetX
          node.y = node.targetY
        }
      }
      
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
      
      // Draw edges - visible connecting lines
      edges.forEach(edge => {
        const minOpacity = Math.min(edge.source.opacity, edge.target.opacity)
        if (minOpacity < 0.1) return
        
        const isHighlighted = 
          (connectedToHovered.has(edge.source.id) && connectedToHovered.has(edge.target.id)) ||
          (connectedToSelected.has(edge.source.id) && connectedToSelected.has(edge.target.id))
        
        ctx.globalAlpha = minOpacity
        ctx.beginPath()
        ctx.moveTo(edge.source.x, edge.source.y)
        ctx.lineTo(edge.target.x, edge.target.y)
        ctx.strokeStyle = isHighlighted ? EDGE_HOVER_COLOR : hasHighlight ? 'rgba(255, 255, 255, 0.04)' : EDGE_COLOR
        ctx.lineWidth = isHighlighted ? 1 : 0.5
        ctx.stroke()
      })
      
      ctx.globalAlpha = 1
      
      // Draw nodes - small circles, stroke by default, fill on hover
      nodes.forEach(node => {
        if (node.opacity < 0.05) return
        
        const isHovered = node.id === hoveredId
        const isSelected = node.id === selectedId
        const isConnected = connectedToHovered.has(node.id) || connectedToSelected.has(node.id)
        const isDimmed = hasHighlight && !isConnected
        const isActive = isHovered || isSelected
        
        const themeColor = THEME_COLORS[node.thought.color] || THEME_COLORS.slate
        const radius = node.radius * (isActive ? 2 : 1.2)
        
        ctx.globalAlpha = node.opacity
        
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        
        if (isActive) {
          // Fill on hover/select
          ctx.fillStyle = hexToRgba(themeColor, 0.9)
          ctx.fill()
        } else {
          // Stroke only by default
          ctx.strokeStyle = isDimmed ? hexToRgba(themeColor, 0.15) : hexToRgba(themeColor, 0.7)
          ctx.lineWidth = 1
          ctx.stroke()
        }
      })
      
      ctx.globalAlpha = 1
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
      if (node.opacity < 0.5) continue
      const dx = x - node.x
      const dy = y - node.y
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

  // Touch state
  const touchStateRef = useRef({
    lastTouches: null as TouchList | null,
    lastPinchDist: 0,
  })

  const getTouchPos = useCallback((touch: Touch) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    const t = transformRef.current
    return {
      x: (touch.clientX - rect.left - t.x) / t.scale,
      y: (touch.clientY - rect.top - t.y) / t.scale,
    }
  }, [])

  // Track tap for showing tooltip on mobile
  const tapStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    touchStateRef.current.lastTouches = e.touches

    if (e.touches.length === 1) {
      const pos = getTouchPos(e.touches[0])
      const node = findNodeAt(pos.x, pos.y)
      
      // Track tap start position and time
      tapStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      }
      
      if (node) {
        dragStateRef.current.draggedNode = node
      } else {
        dragStateRef.current.isDragging = true
        dragStateRef.current.dragStart = {
          x: e.touches[0].clientX - transformRef.current.x,
          y: e.touches[0].clientY - transformRef.current.y,
        }
      }
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      touchStateRef.current.lastPinchDist = Math.sqrt(dx * dx + dy * dy)
      dragStateRef.current.isDragging = false
      dragStateRef.current.draggedNode = null
      tapStartRef.current = null
    }
  }, [getTouchPos, findNodeAt])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()

    if (e.touches.length === 1) {
      const drag = dragStateRef.current
      if (drag.draggedNode) {
        const pos = getTouchPos(e.touches[0])
        drag.draggedNode.x = pos.x
        drag.draggedNode.y = pos.y
        drag.draggedNode.vx = 0
        drag.draggedNode.vy = 0
      } else if (drag.isDragging) {
        transformRef.current.x = e.touches[0].clientX - drag.dragStart.x
        transformRef.current.y = e.touches[0].clientY - drag.dragStart.y
      }
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const prevDist = touchStateRef.current.lastPinchDist

      if (prevDist > 0) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
          const t = transformRef.current
          const scaleChange = dist / prevDist
          const newScale = Math.max(0.3, Math.min(3, t.scale * scaleChange))
          const actualScale = newScale / t.scale
          transformRef.current = {
            x: midX - (midX - t.x) * actualScale,
            y: midY - (midY - t.y) * actualScale,
            scale: newScale,
          }
        }
      }
      touchStateRef.current.lastPinchDist = dist
    }
  }, [getTouchPos])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.changedTouches.length === 1 && e.touches.length === 0) {
      const touch = e.changedTouches[0]
      const tapStart = tapStartRef.current
      const drag = dragStateRef.current
      
      // Check if this was a tap (short duration, minimal movement)
      const isTap = tapStart && 
        Date.now() - tapStart.time < 300 &&
        Math.abs(touch.clientX - tapStart.x) < 10 &&
        Math.abs(touch.clientY - tapStart.y) < 10
      
      if (isTap) {
        const pos = getTouchPos(touch)
        const node = findNodeAt(pos.x, pos.y)
        
        if (node) {
          // Show tooltip on first tap, navigate on second tap
          const folder = folders.find(f => f.id === node.thought.folderId)
          const connections = connectionCountRef.current[node.id] || 0
          const rect = canvasRef.current?.getBoundingClientRect()
          
          if (rect) {
            const t = transformRef.current
            const screenX = node.x * t.scale + t.x
            const screenY = node.y * t.scale + t.y
            
            // If tooltip is already showing for this node, navigate to it
            if (tooltip?.title === node.thought.title) {
              selectThought(node.id)
              setTooltip(null)
            } else {
              // Show tooltip
              setTooltip({
                x: screenX,
                y: screenY,
                title: node.thought.title,
                folder: folder?.name || 'Uncategorized',
                connections,
              })
              hoverThought(node.id)
            }
          }
        } else {
          // Tapped on empty space - hide tooltip
          setTooltip(null)
          hoverThought(null)
        }
      } else if (!drag.isDragging && drag.draggedNode) {
        // Was dragging a node - just release it
      }
    }
    
    dragStateRef.current.isDragging = false
    dragStateRef.current.draggedNode = null
    touchStateRef.current.lastPinchDist = 0
    tapStartRef.current = null
  }, [getTouchPos, findNodeAt, selectThought, folders, tooltip, hoverThought])
  
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const container = containerRef.current
    if (!container) return
    
    const { width, height } = container.getBoundingClientRect()
    const centerX = width / 2
    const centerY = height / 2
    const t = transformRef.current
    
    const delta = direction === 'in' ? 1.2 : 0.8
    const newScale = Math.max(0.3, Math.min(3, t.scale * delta))
    const scaleChange = newScale / t.scale
    
    transformRef.current = {
      x: centerX - (centerX - t.x) * scaleChange,
      y: centerY - (centerY - t.y) * scaleChange,
      scale: newScale,
    }
  }, [])
  
  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      
      {/* Tooltip overlay - techy HUD style */}
      {tooltip && (
        <div 
          className="absolute pointer-events-none z-50"
          style={{
            left: tooltip.x + 20,
            top: tooltip.y,
            transform: 'translateY(-50%)',
          }}
        >
          {/* Connector line */}
          <div className="absolute -left-3 top-1/2 w-3 h-px bg-amber-500/50" />
          <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border border-amber-500/50 rotate-45" />
          
          {/* Main tooltip */}
          <div className="relative">
            {/* Corner accents */}
            <div className="absolute -top-px -left-px w-2 h-px bg-amber-500/70" />
            <div className="absolute -top-px -left-px w-px h-2 bg-amber-500/70" />
            <div className="absolute -top-px -right-px w-2 h-px bg-amber-500/70" />
            <div className="absolute -top-px -right-px w-px h-2 bg-amber-500/70" />
            <div className="absolute -bottom-px -left-px w-2 h-px bg-amber-500/40" />
            <div className="absolute -bottom-px -left-px w-px h-2 bg-amber-500/40" />
            <div className="absolute -bottom-px -right-px w-2 h-px bg-amber-500/40" />
            <div className="absolute -bottom-px -right-px w-px h-2 bg-amber-500/40" />
            
            <div className="bg-[#0f0f11]/95 backdrop-blur-sm border border-white/8 px-3 py-2 min-w-[140px]">
              <div className="text-[11px] font-mono text-amber-500/80 mb-1 tracking-wider uppercase">
                node.thought
              </div>
              <div className="text-[13px] font-medium text-white/90 mb-2">
                {tooltip.title}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                <span className="text-white/25">//</span>
                <span>{tooltip.folder}</span>
                <span className="text-amber-500/50">|</span>
                <span>{tooltip.connections} links</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Top bar with graph indicator and zoom controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        {/* Graph view indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f0f11]/80 border border-white/8">
          <div className="w-1.5 h-1.5 bg-amber-500/80" />
          <span className="text-[11px] text-white/50">Graph View</span>
        </div>
        
        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-[#0f0f11]/80 border border-white/8">
          <button
            onClick={() => handleZoom('out')}
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-150 active:scale-90"
            title="Zoom out"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <div className="w-px h-4 bg-white/10" />
          <button
            onClick={() => handleZoom('in')}
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-150 active:scale-90"
            title="Zoom in"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-[10px] text-white/30 hidden md:block">
        Drag to pan · Scroll to zoom · Click node to view
      </div>
      <div className="absolute bottom-4 left-4 text-[10px] text-white/30 md:hidden">
        Drag to pan · Pinch to zoom · Tap node to view
      </div>
    </div>
  )
}
