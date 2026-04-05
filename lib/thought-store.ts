import { create } from 'zustand'

export type RelationshipType = 'supports' | 'contradicts' | 'relates' | 'causes'

export interface Comment {
  id: string
  content: string
  timestamp: Date
}

export interface Thought {
  id: string
  title: string
  content: string
  x: number
  y: number
  color: string
  tags: string[]
  starred: boolean
  isDraft: boolean
  comments: Comment[]
  createdAt: Date
  updatedAt: Date
  group?: string
}

export interface Edge {
  id: string
  source: string
  target: string
  type: RelationshipType
}

interface ThoughtState {
  thoughts: Thought[]
  edges: Edge[]
  selectedThoughtId: string | null
  isCreatingThought: boolean
  focusedClusterId: string | null
  
  // Actions
  addThought: (thought: Omit<Thought, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => string
  updateThought: (id: string, updates: Partial<Thought>) => void
  deleteThought: (id: string) => void
  selectThought: (id: string | null) => void
  
  addEdge: (source: string, target: string, type: RelationshipType) => void
  removeEdge: (id: string) => void
  
  addComment: (thoughtId: string, content: string) => void
  
  setCreatingThought: (creating: boolean) => void
  setFocusedCluster: (id: string | null) => void
  
  toggleStar: (id: string) => void
  updatePosition: (id: string, x: number, y: number) => void
}

// Color palette matching the reference image
export const NODE_COLORS = {
  orange: '#e07a4f',
  coral: '#d4605a',
  pink: '#d175a8',
  purple: '#9b6dcc',
  blue: '#6b8cce',
  lightBlue: '#88b5d4',
  cyan: '#4ec5c1',
  teal: '#45a088',
  green: '#4aba8a',
  lime: '#7ac55f',
  yellow: '#d4b44e',
  white: '#e8e8e8',
}

const COLOR_KEYS = Object.keys(NODE_COLORS) as (keyof typeof NODE_COLORS)[]

// Groups for clustering
const GROUPS = ['core', 'research', 'ideas', 'projects', 'references', 'daily', 'archive']

// Seeded random for consistent generation
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

// Generate dense network of thoughts
function generateDenseNetwork(): { thoughts: Thought[]; edges: Edge[] } {
  const thoughts: Thought[] = []
  const edges: Edge[] = []
  
  const nodeCount = 150
  const centerX = 600
  const centerY = 400
  
  // Create clusters
  const clusters = [
    { x: centerX, y: centerY, radius: 100, count: 40, primaryColor: 'orange' }, // Core cluster
    { x: centerX - 250, y: centerY + 180, radius: 80, count: 25, primaryColor: 'coral' }, // Bottom left
    { x: centerX + 280, y: centerY + 120, radius: 90, count: 30, primaryColor: 'green' }, // Right
    { x: centerX - 150, y: centerY - 200, radius: 70, count: 20, primaryColor: 'blue' }, // Top left
    { x: centerX + 150, y: centerY - 180, radius: 60, count: 15, primaryColor: 'purple' }, // Top right
    { x: centerX + 350, y: centerY - 100, radius: 50, count: 12, primaryColor: 'pink' }, // Far right
    { x: centerX - 320, y: centerY - 50, radius: 45, count: 8, primaryColor: 'white' }, // Far left
  ]
  
  let nodeId = 0
  
  clusters.forEach((cluster, clusterIndex) => {
    for (let i = 0; i < cluster.count; i++) {
      const angle = seededRandom(nodeId * 13) * Math.PI * 2
      const distance = seededRandom(nodeId * 17) * cluster.radius
      
      // Vary colors within cluster but keep primary dominant
      let color: string
      const colorRoll = seededRandom(nodeId * 23)
      if (colorRoll < 0.6) {
        color = NODE_COLORS[cluster.primaryColor as keyof typeof NODE_COLORS]
      } else if (colorRoll < 0.8) {
        // Adjacent colors
        const colorIdx = COLOR_KEYS.indexOf(cluster.primaryColor as keyof typeof NODE_COLORS)
        const adjacent = COLOR_KEYS[(colorIdx + 1) % COLOR_KEYS.length]
        color = NODE_COLORS[adjacent]
      } else {
        // Random accent
        const randomKey = COLOR_KEYS[Math.floor(seededRandom(nodeId * 31) * COLOR_KEYS.length)]
        color = NODE_COLORS[randomKey]
      }
      
      thoughts.push({
        id: `n${nodeId}`,
        title: `Thought ${nodeId}`,
        content: '',
        x: cluster.x + Math.cos(angle) * distance,
        y: cluster.y + Math.sin(angle) * distance,
        color,
        tags: [GROUPS[clusterIndex % GROUPS.length]],
        starred: seededRandom(nodeId * 37) > 0.9,
        isDraft: seededRandom(nodeId * 41) > 0.95,
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        group: GROUPS[clusterIndex % GROUPS.length],
      })
      
      nodeId++
    }
  })
  
  // Add some scattered nodes
  for (let i = 0; i < nodeCount - thoughts.length; i++) {
    const angle = seededRandom(i * 53) * Math.PI * 2
    const distance = 200 + seededRandom(i * 59) * 350
    const colorKey = COLOR_KEYS[Math.floor(seededRandom(i * 61) * COLOR_KEYS.length)]
    
    thoughts.push({
      id: `n${nodeId}`,
      title: `Thought ${nodeId}`,
      content: '',
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
      color: NODE_COLORS[colorKey],
      tags: [GROUPS[Math.floor(seededRandom(i * 67) * GROUPS.length)]],
      starred: false,
      isDraft: false,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      group: GROUPS[Math.floor(seededRandom(i * 67) * GROUPS.length)],
    })
    
    nodeId++
  }
  
  // Generate edges - connect nodes within clusters more densely
  let edgeId = 0
  thoughts.forEach((thought, i) => {
    const connectionCount = Math.floor(seededRandom(i * 71) * 4) + 1
    
    for (let j = 0; j < connectionCount; j++) {
      // Prefer connecting to nearby nodes
      const candidates = thoughts.filter((t, idx) => {
        if (idx === i) return false
        const dx = t.x - thought.x
        const dy = t.y - thought.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        return dist < 200 && seededRandom(i * 73 + j * 79 + idx) > 0.3
      })
      
      if (candidates.length > 0) {
        const target = candidates[Math.floor(seededRandom(i * 83 + j) * candidates.length)]
        const types: RelationshipType[] = ['relates', 'supports', 'causes', 'contradicts']
        
        // Avoid duplicate edges
        const exists = edges.some(
          e => (e.source === thought.id && e.target === target.id) ||
               (e.source === target.id && e.target === thought.id)
        )
        
        if (!exists) {
          edges.push({
            id: `e${edgeId++}`,
            source: thought.id,
            target: target.id,
            type: types[Math.floor(seededRandom(i * 89 + j) * types.length)],
          })
        }
      }
    }
  })
  
  // Add some long-range connections
  for (let i = 0; i < 30; i++) {
    const source = thoughts[Math.floor(seededRandom(i * 97) * thoughts.length)]
    const target = thoughts[Math.floor(seededRandom(i * 101) * thoughts.length)]
    
    if (source.id !== target.id) {
      const exists = edges.some(
        e => (e.source === source.id && e.target === target.id) ||
             (e.source === target.id && e.target === source.id)
      )
      
      if (!exists) {
        edges.push({
          id: `e${edgeId++}`,
          source: source.id,
          target: target.id,
          type: 'relates',
        })
      }
    }
  }
  
  return { thoughts, edges }
}

const { thoughts: initialThoughts, edges: initialEdges } = generateDenseNetwork()

export const useThoughtStore = create<ThoughtState>((set, get) => ({
  thoughts: initialThoughts,
  edges: initialEdges,
  selectedThoughtId: null,
  isCreatingThought: false,
  focusedClusterId: null,
  
  addThought: (thoughtData) => {
    const id = `thought-${Date.now()}`
    const now = new Date()
    const colorKeys = Object.values(NODE_COLORS)
    const newThought: Thought = {
      ...thoughtData,
      id,
      comments: [],
      createdAt: now,
      updatedAt: now,
      color: thoughtData.color || colorKeys[Math.floor(Math.random() * colorKeys.length)],
    }
    set((state) => ({
      thoughts: [...state.thoughts, newThought],
      selectedThoughtId: id,
      isCreatingThought: false,
    }))
    return id
  },
  
  updateThought: (id, updates) => {
    set((state) => ({
      thoughts: state.thoughts.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      ),
    }))
  },
  
  deleteThought: (id) => {
    set((state) => ({
      thoughts: state.thoughts.filter((t) => t.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedThoughtId: state.selectedThoughtId === id ? null : state.selectedThoughtId,
    }))
  },
  
  selectThought: (id) => {
    set({ selectedThoughtId: id })
  },
  
  addEdge: (source, target, type) => {
    const id = `edge-${Date.now()}`
    set((state) => ({
      edges: [...state.edges, { id, source, target, type }],
    }))
  },
  
  removeEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
    }))
  },
  
  addComment: (thoughtId, content) => {
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      content,
      timestamp: new Date(),
    }
    set((state) => ({
      thoughts: state.thoughts.map((t) =>
        t.id === thoughtId
          ? { ...t, comments: [...t.comments, comment], updatedAt: new Date() }
          : t
      ),
    }))
  },
  
  setCreatingThought: (creating) => {
    set({ isCreatingThought: creating })
  },
  
  setFocusedCluster: (id) => {
    set({ focusedClusterId: id })
  },
  
  toggleStar: (id) => {
    set((state) => ({
      thoughts: state.thoughts.map((t) =>
        t.id === id ? { ...t, starred: !t.starred } : t
      ),
    }))
  },
  
  updatePosition: (id, x, y) => {
    set((state) => ({
      thoughts: state.thoughts.map((t) =>
        t.id === id ? { ...t, x, y } : t
      ),
    }))
  },
}))
