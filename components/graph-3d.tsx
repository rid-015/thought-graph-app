'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore, NODE_COLORS, type Thought, type Connection } from '@/lib/store'

// Seeded random for consistent positions
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

// Theme-oriented muted colors (warm tones matching UI)
const THEME_COLORS = {
  amber: '#d97706',
  orange: '#ea580c',
  rose: '#e11d48',
  violet: '#7c3aed',
  blue: '#2563eb',
  emerald: '#059669',
  slate: '#475569',
} as const

interface GraphNode {
  id: string
  thought: Thought
  position: THREE.Vector3
  velocity: THREE.Vector3
  connections: number
}

interface NodeProps {
  node: GraphNode
  isSelected: boolean
  isHovered: boolean
  isConnected: boolean
  hasHighlight: boolean
  onHover: (id: string | null) => void
  onClick: (id: string) => void
}

function Node({ node, isSelected, isHovered, isConnected, hasHighlight, onHover, onClick }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [localHover, setLocalHover] = useState(false)
  
  // Size based on connections - smaller overall
  const baseSize = 0.08 + Math.min(node.connections * 0.015, 0.08)
  const size = (isHovered || isSelected) ? baseSize * 1.4 : baseSize
  
  const color = THEME_COLORS[node.thought.color as keyof typeof THEME_COLORS] || THEME_COLORS.slate
  const opacity = hasHighlight ? (isConnected ? 0.9 : 0.15) : 0.85
  
  useFrame(() => {
    if (meshRef.current) {
      // Subtle pulse for selected
      if (isSelected) {
        const scale = 1 + Math.sin(Date.now() * 0.003) * 0.08
        meshRef.current.scale.setScalar(scale)
      } else {
        meshRef.current.scale.setScalar(1)
      }
    }
  })
  
  return (
    <group position={node.position}>
      {/* Glow for hovered/selected */}
      {(isHovered || isSelected) && (
        <mesh>
          <sphereGeometry args={[size * 3, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.12}
            depthWrite={false}
          />
        </mesh>
      )}
      
      {/* Main node */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setLocalHover(true)
          onHover(node.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setLocalHover(false)
          onHover(null)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation()
          onClick(node.id)
        }}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={isHovered || isSelected ? 0.5 : 0.15}
        />
      </mesh>
      
      {/* Tooltip on hover */}
      {(localHover || isSelected) && (
        <Html
          position={[0, size + 0.3, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="glass px-3 py-2 rounded-lg shadow-xl min-w-[160px] max-w-[220px]">
            <div className="text-[11px] text-white/90 font-medium leading-tight mb-1.5">
              {node.thought.title}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-white/50">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                {node.thought.folderId.replace('folder-', '')}
              </span>
              <span>{node.connections} links</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

interface EdgeProps {
  start: THREE.Vector3
  end: THREE.Vector3
  isHighlighted: boolean
  hasHighlight: boolean
}

function Edge({ start, end, isHighlighted, hasHighlight }: EdgeProps) {
  const lineRef = useRef<THREE.Line>(null)
  
  const points = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([start, end])
  }, [start, end])
  
  const opacity = hasHighlight ? (isHighlighted ? 0.5 : 0.04) : 0.12
  const color = isHighlighted ? '#f59e0b' : '#ffffff'
  
  return (
    <line ref={lineRef} geometry={points}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </line>
  )
}

function GraphScene() {
  const thoughts = useStore(s => s.thoughts)
  const connections = useStore(s => s.connections)
  const selectedId = useStore(s => s.selectedThoughtId)
  const hoveredId = useStore(s => s.hoveredThoughtId)
  const selectThought = useStore(s => s.selectThought)
  const hoverThought = useStore(s => s.hoverThought)
  
  const nodesRef = useRef<GraphNode[]>([])
  const [, forceUpdate] = useState(0)
  
  // Initialize nodes
  const nodes = useMemo(() => {
    const random = seededRandom(456)
    
    // Count connections per thought
    const connectionCount: Record<string, number> = {}
    connections.forEach(c => {
      connectionCount[c.source] = (connectionCount[c.source] || 0) + 1
      connectionCount[c.target] = (connectionCount[c.target] || 0) + 1
    })
    
    // Create nodes in a sphere with clusters
    const result: GraphNode[] = thoughts.map((thought, i) => {
      // Spherical distribution with golden angle
      const phi = Math.acos(1 - 2 * (i + 0.5) / thoughts.length)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      
      const radius = 4 + random() * 2
      const x = radius * Math.sin(phi) * Math.cos(theta) + (random() - 0.5) * 1.5
      const y = radius * Math.sin(phi) * Math.sin(theta) + (random() - 0.5) * 1.5
      const z = radius * Math.cos(phi) + (random() - 0.5) * 1.5
      
      return {
        id: thought.id,
        thought,
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(0, 0, 0),
        connections: connectionCount[thought.id] || 0,
      }
    })
    
    nodesRef.current = result
    return result
  }, [thoughts, connections])
  
  // Create edges
  const edges = useMemo(() => {
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    return connections
      .map(conn => {
        const source = nodeMap.get(conn.source)
        const target = nodeMap.get(conn.target)
        if (source && target) {
          return { source, target, connection: conn }
        }
        return null
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
  }, [nodes, connections])
  
  // Physics simulation
  useFrame(() => {
    const nodes = nodesRef.current
    if (nodes.length === 0) return
    
    const REPULSION = 0.8
    const ATTRACTION = 0.003
    const DAMPING = 0.92
    const CENTER_GRAVITY = 0.002
    
    // Apply forces
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i]
      
      // Center gravity
      nodeA.velocity.add(
        nodeA.position.clone().multiplyScalar(-CENTER_GRAVITY)
      )
      
      // Repulsion
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeB = nodes[j]
        const diff = nodeA.position.clone().sub(nodeB.position)
        const dist = diff.length() || 0.1
        
        if (dist < 3) {
          const force = diff.normalize().multiplyScalar(REPULSION / (dist * dist))
          nodeA.velocity.add(force)
          nodeB.velocity.sub(force)
        }
      }
    }
    
    // Edge attraction
    edges.forEach(edge => {
      const diff = edge.target.position.clone().sub(edge.source.position)
      const dist = diff.length() || 0.1
      const force = diff.normalize().multiplyScalar((dist - 1.5) * ATTRACTION)
      
      edge.source.velocity.add(force)
      edge.target.velocity.sub(force)
    })
    
    // Update positions
    nodes.forEach(node => {
      node.velocity.multiplyScalar(DAMPING)
      node.position.add(node.velocity)
    })
    
    forceUpdate(n => n + 1)
  })
  
  // Get highlighted connections
  const connectedToHovered = useMemo(() => {
    const set = new Set<string>()
    if (hoveredId) {
      set.add(hoveredId)
      edges.forEach(e => {
        if (e.source.id === hoveredId) set.add(e.target.id)
        if (e.target.id === hoveredId) set.add(e.source.id)
      })
    }
    return set
  }, [hoveredId, edges])
  
  const connectedToSelected = useMemo(() => {
    const set = new Set<string>()
    if (selectedId) {
      set.add(selectedId)
      edges.forEach(e => {
        if (e.source.id === selectedId) set.add(e.target.id)
        if (e.target.id === selectedId) set.add(e.source.id)
      })
    }
    return set
  }, [selectedId, edges])
  
  const hasHighlight = Boolean(hoveredId || selectedId)
  
  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />
      
      {/* Edges */}
      {edges.map((edge, i) => {
        const isHighlighted = 
          (connectedToHovered.has(edge.source.id) && connectedToHovered.has(edge.target.id)) ||
          (connectedToSelected.has(edge.source.id) && connectedToSelected.has(edge.target.id))
        
        return (
          <Edge
            key={`edge-${i}`}
            start={edge.source.position}
            end={edge.target.position}
            isHighlighted={isHighlighted}
            hasHighlight={hasHighlight}
          />
        )
      })}
      
      {/* Nodes */}
      {nodes.map(node => {
        const isConnected = connectedToHovered.has(node.id) || connectedToSelected.has(node.id)
        
        return (
          <Node
            key={node.id}
            node={node}
            isSelected={node.id === selectedId}
            isHovered={node.id === hoveredId}
            isConnected={isConnected}
            hasHighlight={hasHighlight}
            onHover={hoverThought}
            onClick={selectThought}
          />
        )
      })}
      
      {/* Orbit controls for 3D rotation */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
        autoRotate={false}
        autoRotateSpeed={0.3}
        dampingFactor={0.05}
        enableDamping={true}
      />
    </>
  )
}

export function Graph3D() {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: '#0c0c0e' }}
      >
        <GraphScene />
      </Canvas>
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-[10px] text-white/30 font-mono">
        drag to rotate / scroll to zoom / click node to select
      </div>
    </div>
  )
}
