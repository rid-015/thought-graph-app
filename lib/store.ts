import { create } from 'zustand'

// Seeded random number generator for consistent SSR/client hydration
function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

// Node colors matching our design system
export const NODE_COLORS = {
  orange: '#fb923c',
  coral: '#fb7185',
  green: '#4ade80',
  blue: '#60a5fa',
  purple: '#c084fc',
  cyan: '#22d3ee',
  yellow: '#fbbf24',
  pink: '#f472b6',
  white: '#e4e4e7',
} as const

export type NodeColor = keyof typeof NODE_COLORS

export interface Thought {
  id: string
  title: string
  content: string
  color: NodeColor
  createdAt: Date
  updatedAt: Date
  tags: string[]
  starred: boolean
}

export interface Connection {
  id: string
  source: string
  target: string
  type: 'relates' | 'supports' | 'contradicts' | 'evolves'
}

export interface Commit {
  id: string
  thoughtId: string | null // null = global commit
  message: string
  timestamp: Date
  type: 'create' | 'update' | 'connect' | 'insight'
}

interface Store {
  thoughts: Thought[]
  connections: Connection[]
  commits: Commit[]
  selectedThoughtId: string | null
  hoveredThoughtId: string | null
  
  // Actions
  selectThought: (id: string | null) => void
  hoverThought: (id: string | null) => void
  addThought: (thought: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateThought: (id: string, updates: Partial<Thought>) => void
  deleteThought: (id: string) => void
  addConnection: (source: string, target: string, type: Connection['type']) => void
  addCommit: (message: string, thoughtId?: string | null, type?: Commit['type']) => void
  toggleStar: (id: string) => void
}

// Generate sample data for a dense, organic graph
function generateSampleData() {
  const random = createSeededRandom(42) // Fixed seed for consistent hydration
  const colorKeys = Object.keys(NODE_COLORS) as NodeColor[]
  const thoughts: Thought[] = []
  const connections: Connection[] = []
  const commits: Commit[] = []
  
  // Cluster definitions for organic grouping
  const clusters = [
    { name: 'Machine Learning', color: 'orange' as NodeColor, count: 18 },
    { name: 'Philosophy', color: 'purple' as NodeColor, count: 14 },
    { name: 'Design Systems', color: 'cyan' as NodeColor, count: 16 },
    { name: 'Productivity', color: 'green' as NodeColor, count: 12 },
    { name: 'Writing', color: 'coral' as NodeColor, count: 15 },
    { name: 'Music Theory', color: 'yellow' as NodeColor, count: 10 },
    { name: 'Random', color: 'white' as NodeColor, count: 15 },
  ]
  
  const thoughtTitles: Record<string, string[]> = {
    'Machine Learning': [
      'Neural network intuitions', 'Transformer architecture', 'Attention mechanisms',
      'Gradient descent visualization', 'Loss functions', 'Backpropagation',
      'Embeddings and vector spaces', 'Feature engineering', 'Model compression',
      'Transfer learning patterns', 'Few-shot learning', 'Reinforcement learning basics',
      'GANs and generative models', 'Diffusion models', 'LLM prompting strategies',
      'Fine-tuning approaches', 'RAG architectures', 'Agent systems'
    ],
    'Philosophy': [
      'Consciousness theories', 'Free will paradox', 'Ethics of AI',
      'Epistemology notes', 'Phenomenology intro', 'Mind-body problem',
      'Determinism vs chaos', 'Emergence patterns', 'Systems thinking',
      'Complexity and simplicity', 'Reductionism limits', 'Holistic approaches',
      'Eastern philosophy', 'Stoic principles'
    ],
    'Design Systems': [
      'Color theory fundamentals', 'Typography scales', 'Spacing systems',
      'Component architecture', 'Design tokens', 'Accessibility patterns',
      'Motion design principles', 'Dark mode strategies', 'Responsive patterns',
      'Icon design rules', 'Grid systems', 'Visual hierarchy',
      'Brand consistency', 'Design documentation', 'Figma workflows', 'CSS architecture'
    ],
    'Productivity': [
      'Deep work strategies', 'Time blocking', 'Energy management',
      'Note-taking systems', 'Spaced repetition', 'Second brain concepts',
      'GTD methodology', 'Pomodoro variations', 'Focus environments',
      'Digital minimalism', 'Attention economy', 'Flow states'
    ],
    'Writing': [
      'Show dont tell', 'Voice and tone', 'Narrative structures',
      'Editing techniques', 'Research methods', 'Outline strategies',
      'Writing rituals', 'Feedback loops', 'Publishing workflows',
      'Technical writing', 'Storytelling patterns', 'Audience analysis',
      'Content strategy', 'SEO for writers', 'Newsletter growth'
    ],
    'Music Theory': [
      'Chord progressions', 'Modal interchange', 'Voice leading',
      'Rhythm patterns', 'Harmonic analysis', 'Melodic contour',
      'Song structure', 'Production techniques', 'Sound design basics', 'Mixing fundamentals'
    ],
    'Random': [
      'Coffee brewing methods', 'Book recommendations', 'Travel notes',
      'Recipe ideas', 'Fitness tracking', 'Language learning',
      'Meditation practice', 'Sleep optimization', 'Reading strategies',
      'Journaling prompts', 'Gift ideas', 'Home organization',
      'Plant care', 'Photography tips', 'Podcast notes'
    ]
  }
  
  let thoughtIndex = 0
  const thoughtsByCluster: Record<string, string[]> = {}
  
  // Create thoughts
  clusters.forEach(cluster => {
    thoughtsByCluster[cluster.name] = []
    const titles = thoughtTitles[cluster.name]
    
    for (let i = 0; i < cluster.count && i < titles.length; i++) {
      const id = `thought-${thoughtIndex++}`
      thoughtsByCluster[cluster.name].push(id)
      
      // Occasionally use a different color for variety
      const useClusterColor = random() > 0.15
      const color = useClusterColor ? cluster.color : colorKeys[Math.floor(random() * colorKeys.length)]
      
      // Use fixed dates for consistent hydration
      const baseDate = new Date('2026-04-01T12:00:00Z').getTime()
      const createdOffset = Math.floor(random() * 30) * 24 * 60 * 60 * 1000
      const updatedOffset = Math.floor(random() * 7) * 24 * 60 * 60 * 1000
      
      thoughts.push({
        id,
        title: titles[i],
        content: `Exploring ${titles[i].toLowerCase()}. This thought connects various concepts and ideas worth developing further.`,
        color,
        createdAt: new Date(baseDate - createdOffset),
        updatedAt: new Date(baseDate - updatedOffset),
        tags: [cluster.name.toLowerCase().replace(' ', '-')],
        starred: random() > 0.85,
      })
    }
  })
  
  // Create connections - dense within clusters, sparse across
  const clusterNames = Object.keys(thoughtsByCluster)
  
  clusterNames.forEach(clusterName => {
    const clusterThoughts = thoughtsByCluster[clusterName]
    
    // Dense intra-cluster connections
    clusterThoughts.forEach((thoughtId, idx) => {
      // Connect to 2-4 other thoughts in same cluster
      const numConnections = 2 + Math.floor(random() * 3)
      const targets = new Set<string>()
      
      for (let i = 0; i < numConnections; i++) {
        const targetIdx = Math.floor(random() * clusterThoughts.length)
        if (targetIdx !== idx) {
          targets.add(clusterThoughts[targetIdx])
        }
      }
      
      targets.forEach(target => {
        connections.push({
          id: `conn-${connections.length}`,
          source: thoughtId,
          target,
          type: random() > 0.7 ? 'supports' : 'relates',
        })
      })
    })
    
    // Sparse cross-cluster connections
    const otherClusters = clusterNames.filter(c => c !== clusterName)
    const numCrossConnections = Math.floor(clusterThoughts.length * 0.2)
    
    for (let i = 0; i < numCrossConnections; i++) {
      const sourceIdx = Math.floor(random() * clusterThoughts.length)
      const targetCluster = otherClusters[Math.floor(random() * otherClusters.length)]
      const targetThoughts = thoughtsByCluster[targetCluster]
      const targetIdx = Math.floor(random() * targetThoughts.length)
      
      connections.push({
        id: `conn-${connections.length}`,
        source: clusterThoughts[sourceIdx],
        target: targetThoughts[targetIdx],
        type: random() > 0.5 ? 'relates' : 'evolves',
      })
    }
  })
  
  // Create sample commits
  const commitMessages = [
    'Initial exploration of transformer architectures',
    'Connected attention mechanisms to consciousness theories',
    'Refined color theory fundamentals',
    'Added cross-reference to productivity systems',
    'Expanded notes on modal interchange',
    'Linked writing techniques to design documentation',
    'Deep dive into gradient descent',
    'Connected stoic principles to deep work',
    'Explored relationship between GANs and diffusion',
    'Updated typography scales with new insights',
    'Connected neural network intuitions to emergence patterns',
    'Added new perspective on free will',
  ]
  
  const commitBaseDate = new Date('2026-04-05T10:00:00Z').getTime()
  commitMessages.forEach((message, idx) => {
    commits.push({
      id: `commit-${idx}`,
      thoughtId: idx < 8 ? thoughts[idx % thoughts.length].id : null,
      message,
      timestamp: new Date(commitBaseDate - (commitMessages.length - idx) * 2 * 60 * 60 * 1000),
      type: idx % 4 === 0 ? 'create' : idx % 4 === 1 ? 'update' : idx % 4 === 2 ? 'connect' : 'insight',
    })
  })
  
  return { thoughts, connections, commits }
}

const sampleData = generateSampleData()

export const useStore = create<Store>((set, get) => ({
  thoughts: sampleData.thoughts,
  connections: sampleData.connections,
  commits: sampleData.commits,
  selectedThoughtId: null,
  hoveredThoughtId: null,
  
  selectThought: (id) => set({ selectedThoughtId: id }),
  hoverThought: (id) => set({ hoveredThoughtId: id }),
  
  addThought: (thought) => {
    const id = `thought-${Date.now()}`
    const now = new Date()
    set(state => ({
      thoughts: [...state.thoughts, { ...thought, id, createdAt: now, updatedAt: now }],
    }))
    get().addCommit(`Created "${thought.title}"`, id, 'create')
  },
  
  updateThought: (id, updates) => {
    set(state => ({
      thoughts: state.thoughts.map(t => 
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      ),
    }))
    const thought = get().thoughts.find(t => t.id === id)
    if (thought) {
      get().addCommit(`Updated "${thought.title}"`, id, 'update')
    }
  },
  
  deleteThought: (id) => {
    set(state => ({
      thoughts: state.thoughts.filter(t => t.id !== id),
      connections: state.connections.filter(c => c.source !== id && c.target !== id),
      selectedThoughtId: state.selectedThoughtId === id ? null : state.selectedThoughtId,
    }))
  },
  
  addConnection: (source, target, type) => {
    const id = `conn-${Date.now()}`
    set(state => ({
      connections: [...state.connections, { id, source, target, type }],
    }))
    const sourceThought = get().thoughts.find(t => t.id === source)
    const targetThought = get().thoughts.find(t => t.id === target)
    if (sourceThought && targetThought) {
      get().addCommit(
        `Connected "${sourceThought.title}" to "${targetThought.title}"`,
        source,
        'connect'
      )
    }
  },
  
  addCommit: (message, thoughtId = null, type = 'insight') => {
    const id = `commit-${Date.now()}`
    set(state => ({
      commits: [{ id, thoughtId, message, timestamp: new Date(), type }, ...state.commits],
    }))
  },
  
  toggleStar: (id) => {
    set(state => ({
      thoughts: state.thoughts.map(t =>
        t.id === id ? { ...t, starred: !t.starred } : t
      ),
    }))
  },
}))
