import { create } from 'zustand'

export type RelationshipType = 'supports' | 'contradicts' | 'relates' | 'causes'

export interface GlobalCommit {
  id: string
  content: string
  nodeId?: string
  nodeTitle?: string
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
  createdAt: Date
  updatedAt: Date
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
  globalCommits: GlobalCommit[]
  selectedThoughtId: string | null
  isCreatingThought: boolean
  focusedClusterId: string | null
  
  // Actions
  addThought: (thought: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateThought: (id: string, updates: Partial<Thought>) => void
  deleteThought: (id: string) => void
  selectThought: (id: string | null) => void
  
  addEdge: (source: string, target: string, type: RelationshipType) => void
  removeEdge: (id: string) => void
  
  addGlobalCommit: (content: string, nodeId?: string) => void
  
  setCreatingThought: (creating: boolean) => void
  setFocusedCluster: (id: string | null) => void
  
  toggleStar: (id: string) => void
  updatePosition: (id: string, x: number, y: number) => void
}

// Muted color palette
export const NODE_COLORS = {
  blue: '#7AA2F7',
  purple: '#9D7CD8',
  orange: '#E0AF68',
  green: '#9ECE6A',
  pink: '#F7768E',
  cyan: '#7DCFFF',
  white: '#C0CAF5',
}

const COLOR_VALUES = Object.values(NODE_COLORS)

// Seeded random for consistent generation
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

// Generate 40-80 nodes distributed organically
function generateNetwork(): { thoughts: Thought[]; edges: Edge[]; globalCommits: GlobalCommit[] } {
  const thoughts: Thought[] = []
  const edges: Edge[] = []
  const globalCommits: GlobalCommit[] = []
  
  const nodeCount = 60
  const centerX = 500
  const centerY = 350
  
  // Create organically distributed clusters (no central bias)
  const clusters = [
    { x: centerX - 200, y: centerY - 150, radius: 120, count: 12 },
    { x: centerX + 180, y: centerY - 100, radius: 100, count: 10 },
    { x: centerX - 150, y: centerY + 150, radius: 110, count: 11 },
    { x: centerX + 200, y: centerY + 120, radius: 90, count: 9 },
    { x: centerX, y: centerY, radius: 80, count: 8 },
    { x: centerX - 300, y: centerY, radius: 70, count: 5 },
    { x: centerX + 320, y: centerY - 50, radius: 60, count: 5 },
  ]
  
  let nodeId = 0
  
  clusters.forEach((cluster, clusterIndex) => {
    for (let i = 0; i < cluster.count; i++) {
      const angle = seededRandom(nodeId * 13 + 7) * Math.PI * 2
      const distance = seededRandom(nodeId * 17 + 11) * cluster.radius * 0.9
      
      const color = COLOR_VALUES[Math.floor(seededRandom(nodeId * 23 + 5) * COLOR_VALUES.length)]
      
      thoughts.push({
        id: `n${nodeId}`,
        title: `Note ${nodeId + 1}`,
        content: '',
        x: cluster.x + Math.cos(angle) * distance,
        y: cluster.y + Math.sin(angle) * distance,
        color,
        tags: [],
        starred: seededRandom(nodeId * 37) > 0.92,
        isDraft: false,
        createdAt: new Date(Date.now() - Math.floor(seededRandom(nodeId * 41) * 7 * 24 * 60 * 60 * 1000)),
        updatedAt: new Date(Date.now() - Math.floor(seededRandom(nodeId * 43) * 24 * 60 * 60 * 1000)),
      })
      
      nodeId++
    }
  })
  
  // Generate edges - connect nodes within proximity
  let edgeId = 0
  thoughts.forEach((thought, i) => {
    const connectionCount = Math.floor(seededRandom(i * 71 + 3) * 3) + 1
    
    for (let j = 0; j < connectionCount; j++) {
      const candidates = thoughts.filter((t, idx) => {
        if (idx === i) return false
        const dx = t.x - thought.x
        const dy = t.y - thought.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        return dist < 150 && seededRandom(i * 73 + j * 79 + idx) > 0.5
      })
      
      if (candidates.length > 0) {
        const target = candidates[Math.floor(seededRandom(i * 83 + j) * candidates.length)]
        const types: RelationshipType[] = ['relates', 'supports', 'causes', 'contradicts']
        
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
  
  // Sample global commits
  const sampleCommits = [
    'Added connection between concepts',
    'Refined understanding of core idea',
    'Linked research notes',
    'Updated hypothesis',
    'Expanded on previous thought',
    'Connected to existing framework',
    'Clarified relationship',
    'Added supporting evidence',
  ]
  
  for (let i = 0; i < 8; i++) {
    const linkedNode = thoughts[Math.floor(seededRandom(i * 97) * thoughts.length)]
    globalCommits.push({
      id: `gc${i}`,
      content: sampleCommits[i],
      nodeId: linkedNode?.id,
      nodeTitle: linkedNode?.title,
      timestamp: new Date(Date.now() - i * 3600000 - Math.floor(seededRandom(i * 101) * 3600000)),
    })
  }
  
  return { thoughts, edges, globalCommits }
}

const { thoughts: initialThoughts, edges: initialEdges, globalCommits: initialCommits } = generateNetwork()

export const useThoughtStore = create<ThoughtState>((set, get) => ({
  thoughts: initialThoughts,
  edges: initialEdges,
  globalCommits: initialCommits,
  selectedThoughtId: null,
  isCreatingThought: false,
  focusedClusterId: null,
  
  addThought: (thoughtData) => {
    const id = `thought-${Date.now()}`
    const now = new Date()
    const newThought: Thought = {
      ...thoughtData,
      id,
      createdAt: now,
      updatedAt: now,
      color: thoughtData.color || COLOR_VALUES[Math.floor(Math.random() * COLOR_VALUES.length)],
    }
    set((state) => ({
      thoughts: [...state.thoughts, newThought],
      selectedThoughtId: id,
      isCreatingThought: false,
      globalCommits: [
        {
          id: `gc-${Date.now()}`,
          content: `Created new note: ${newThought.title}`,
          nodeId: id,
          nodeTitle: newThought.title,
          timestamp: now,
        },
        ...state.globalCommits,
      ],
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
    const thought = get().thoughts.find(t => t.id === id)
    set((state) => ({
      thoughts: state.thoughts.filter((t) => t.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedThoughtId: state.selectedThoughtId === id ? null : state.selectedThoughtId,
      globalCommits: thought ? [
        {
          id: `gc-${Date.now()}`,
          content: `Deleted note: ${thought.title}`,
          timestamp: new Date(),
        },
        ...state.globalCommits,
      ] : state.globalCommits,
    }))
  },
  
  selectThought: (id) => {
    set({ selectedThoughtId: id })
  },
  
  addEdge: (source, target, type) => {
    const id = `edge-${Date.now()}`
    const sourceThought = get().thoughts.find(t => t.id === source)
    const targetThought = get().thoughts.find(t => t.id === target)
    set((state) => ({
      edges: [...state.edges, { id, source, target, type }],
      globalCommits: [
        {
          id: `gc-${Date.now()}`,
          content: `Connected "${sourceThought?.title}" to "${targetThought?.title}"`,
          nodeId: source,
          nodeTitle: sourceThought?.title,
          timestamp: new Date(),
        },
        ...state.globalCommits,
      ],
    }))
  },
  
  removeEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
    }))
  },
  
  addGlobalCommit: (content, nodeId) => {
    const thought = nodeId ? get().thoughts.find(t => t.id === nodeId) : undefined
    set((state) => ({
      globalCommits: [
        {
          id: `gc-${Date.now()}`,
          content,
          nodeId,
          nodeTitle: thought?.title,
          timestamp: new Date(),
        },
        ...state.globalCommits,
      ],
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
