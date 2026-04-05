import { create } from 'zustand'

// Seeded random for consistent SSR/client hydration
function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

// Warm, techy node colors
export const NODE_COLORS = {
  amber: '#f59e0b',
  orange: '#f97316',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  blue: '#3b82f6',
  emerald: '#10b981',
  slate: '#64748b',
} as const

export type NodeColor = keyof typeof NODE_COLORS

export interface Folder {
  id: string
  name: string
  icon: string
  color: NodeColor
  isExpanded: boolean
}

export interface Thought {
  id: string
  folderId: string
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
  thoughtId: string | null
  message: string
  timestamp: Date
  type: 'create' | 'update' | 'connect' | 'insight'
}

export interface ActivityDay {
  date: Date
  count: number
}

type ViewMode = 'graph' | 'editor'

interface Store {
  folders: Folder[]
  thoughts: Thought[]
  connections: Connection[]
  commits: Commit[]
  activity: ActivityDay[]
  selectedThoughtId: string | null
  hoveredThoughtId: string | null
  selectedFolderId: string | null
  viewMode: ViewMode
  isCreating: boolean
  
  selectThought: (id: string | null) => void
  hoverThought: (id: string | null) => void
  selectFolder: (id: string | null) => void
  toggleFolder: (id: string) => void
  setViewMode: (mode: ViewMode) => void
  setIsCreating: (creating: boolean) => void
  addThought: (thought: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateThought: (id: string, updates: Partial<Thought>) => void
  deleteThought: (id: string) => void
  addConnection: (source: string, target: string, type: Connection['type']) => void
  addCommit: (message: string, thoughtId?: string | null, type?: Commit['type']) => void
  toggleStar: (id: string) => void
}

function generateSampleData() {
  const random = createSeededRandom(42)
  
  const folders: Folder[] = [
    { id: 'folder-ml', name: 'Machine Learning', icon: 'brain', color: 'orange', isExpanded: true },
    { id: 'folder-philosophy', name: 'Philosophy', icon: 'scroll', color: 'violet', isExpanded: false },
    { id: 'folder-design', name: 'Design Systems', icon: 'palette', color: 'rose', isExpanded: false },
    { id: 'folder-productivity', name: 'Productivity', icon: 'zap', color: 'amber', isExpanded: false },
    { id: 'folder-writing', name: 'Writing', icon: 'pen', color: 'blue', isExpanded: false },
    { id: 'folder-music', name: 'Music Theory', icon: 'music', color: 'emerald', isExpanded: false },
    { id: 'folder-misc', name: 'Miscellaneous', icon: 'box', color: 'slate', isExpanded: false },
  ]
  
  const thoughtData: Record<string, { titles: string[], color: NodeColor }> = {
    'folder-ml': {
      color: 'orange',
      titles: [
        'Neural network intuitions', 'Transformer architecture', 'Attention mechanisms',
        'Gradient descent visualization', 'Loss functions', 'Backpropagation',
        'Embeddings and vector spaces', 'Feature engineering', 'Model compression',
        'Transfer learning patterns', 'Few-shot learning', 'Reinforcement learning basics',
        'GANs and generative models', 'Diffusion models', 'LLM prompting strategies',
      ]
    },
    'folder-philosophy': {
      color: 'violet',
      titles: [
        'Consciousness theories', 'Free will paradox', 'Ethics of AI',
        'Epistemology notes', 'Phenomenology intro', 'Mind-body problem',
        'Determinism vs chaos', 'Emergence patterns', 'Systems thinking',
        'Complexity and simplicity', 'Reductionism limits', 'Holistic approaches',
      ]
    },
    'folder-design': {
      color: 'rose',
      titles: [
        'Color theory fundamentals', 'Typography scales', 'Spacing systems',
        'Component architecture', 'Design tokens', 'Accessibility patterns',
        'Motion design principles', 'Dark mode strategies', 'Responsive patterns',
        'Icon design rules', 'Grid systems', 'Visual hierarchy',
      ]
    },
    'folder-productivity': {
      color: 'amber',
      titles: [
        'Deep work strategies', 'Time blocking', 'Energy management',
        'Note-taking systems', 'Spaced repetition', 'Second brain concepts',
        'GTD methodology', 'Pomodoro variations', 'Focus environments',
      ]
    },
    'folder-writing': {
      color: 'blue',
      titles: [
        'Show dont tell', 'Voice and tone', 'Narrative structures',
        'Editing techniques', 'Research methods', 'Outline strategies',
        'Writing rituals', 'Feedback loops', 'Publishing workflows',
      ]
    },
    'folder-music': {
      color: 'emerald',
      titles: [
        'Chord progressions', 'Modal interchange', 'Voice leading',
        'Rhythm patterns', 'Harmonic analysis', 'Melodic contour',
        'Song structure', 'Production techniques',
      ]
    },
    'folder-misc': {
      color: 'slate',
      titles: [
        'Coffee brewing methods', 'Book recommendations', 'Travel notes',
        'Recipe ideas', 'Fitness tracking', 'Language learning',
        'Meditation practice', 'Sleep optimization',
      ]
    }
  }
  
  const thoughts: Thought[] = []
  const connections: Connection[] = []
  const commits: Commit[] = []
  
  let thoughtIndex = 0
  const thoughtsByFolder: Record<string, string[]> = {}
  const baseDate = new Date('2026-04-01T12:00:00Z').getTime()
  
  // Create thoughts
  Object.entries(thoughtData).forEach(([folderId, data]) => {
    thoughtsByFolder[folderId] = []
    
    data.titles.forEach((title) => {
      const id = `thought-${thoughtIndex++}`
      thoughtsByFolder[folderId].push(id)
      
      // Use folder color with occasional variation
      const useMainColor = random() > 0.2
      const colorKeys = Object.keys(NODE_COLORS) as NodeColor[]
      const color = useMainColor ? data.color : colorKeys[Math.floor(random() * colorKeys.length)]
      
      const createdOffset = Math.floor(random() * 60) * 24 * 60 * 60 * 1000
      const updatedOffset = Math.floor(random() * 14) * 24 * 60 * 60 * 1000
      
      thoughts.push({
        id,
        folderId,
        title,
        content: `# ${title}\n\nExploring ${title.toLowerCase()}. This thought connects various concepts and ideas worth developing further.\n\n## Key Ideas\n\n- First insight about this topic\n- Connection to related concepts\n- Questions to explore further\n\n## Notes\n\nAdd your detailed notes here...`,
        color,
        createdAt: new Date(baseDate - createdOffset),
        updatedAt: new Date(baseDate - updatedOffset),
        tags: [folderId.replace('folder-', '')],
        starred: random() > 0.88,
      })
    })
  })
  
  // Create connections
  const folderIds = Object.keys(thoughtsByFolder)
  
  folderIds.forEach(folderId => {
    const folderThoughts = thoughtsByFolder[folderId]
    
    // Intra-folder connections
    folderThoughts.forEach((thoughtId, idx) => {
      const numConnections = 2 + Math.floor(random() * 3)
      const targets = new Set<string>()
      
      for (let i = 0; i < numConnections; i++) {
        const targetIdx = Math.floor(random() * folderThoughts.length)
        if (targetIdx !== idx) targets.add(folderThoughts[targetIdx])
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
    
    // Cross-folder connections
    const otherFolders = folderIds.filter(f => f !== folderId)
    const numCross = Math.floor(folderThoughts.length * 0.25)
    
    for (let i = 0; i < numCross; i++) {
      const sourceIdx = Math.floor(random() * folderThoughts.length)
      const targetFolder = otherFolders[Math.floor(random() * otherFolders.length)]
      const targetThoughts = thoughtsByFolder[targetFolder]
      const targetIdx = Math.floor(random() * targetThoughts.length)
      
      connections.push({
        id: `conn-${connections.length}`,
        source: folderThoughts[sourceIdx],
        target: targetThoughts[targetIdx],
        type: random() > 0.5 ? 'relates' : 'evolves',
      })
    }
  })
  
  // Create commits
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
  
  // Generate activity data
  const activity: ActivityDay[] = []
  const activityRandom = createSeededRandom(99)
  const today = new Date('2026-04-05')
  
  for (let week = 51; week >= 0; week--) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(today)
      date.setDate(date.getDate() - (week * 7 + (6 - day)))
      
      let count = 0
      const chance = activityRandom()
      if (chance > 0.4) count = Math.floor(activityRandom() * 3) + 1
      if (chance > 0.75) count = Math.floor(activityRandom() * 4) + 3
      if (chance > 0.92) count = Math.floor(activityRandom() * 5) + 6
      
      if (day >= 1 && day <= 5 && activityRandom() > 0.3) {
        count = Math.min(count + 1, 10)
      }
      
      activity.push({ date, count })
    }
  }
  
  return { folders, thoughts, connections, commits, activity }
}

const sampleData = generateSampleData()

export const useStore = create<Store>((set, get) => ({
  folders: sampleData.folders,
  thoughts: sampleData.thoughts,
  connections: sampleData.connections,
  commits: sampleData.commits,
  activity: sampleData.activity,
  selectedThoughtId: null,
  hoveredThoughtId: null,
  selectedFolderId: null,
  viewMode: 'graph',
  isCreating: false,
  
  selectThought: (id) => set({ selectedThoughtId: id, viewMode: id ? 'editor' : 'graph' }),
  hoverThought: (id) => set({ hoveredThoughtId: id }),
  selectFolder: (id) => set({ selectedFolderId: id }),
  toggleFolder: (id) => set(state => ({
    folders: state.folders.map(f => f.id === id ? { ...f, isExpanded: !f.isExpanded } : f)
  })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setIsCreating: (creating) => set({ isCreating: creating }),
  
  addThought: (thought) => {
    const id = `thought-${Date.now()}`
    const now = new Date()
    set(state => ({
      thoughts: [...state.thoughts, { ...thought, id, createdAt: now, updatedAt: now }],
      activity: state.activity.map((a, i) => 
        i === state.activity.length - 1 ? { ...a, count: a.count + 1 } : a
      ),
      selectedThoughtId: id,
      viewMode: 'editor',
      isCreating: false,
    }))
    get().addCommit(`Created "${thought.title}"`, id, 'create')
    return id
  },
  
  updateThought: (id, updates) => {
    set(state => ({
      thoughts: state.thoughts.map(t => 
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      ),
    }))
  },
  
  deleteThought: (id) => {
    const thought = get().thoughts.find(t => t.id === id)
    set(state => ({
      thoughts: state.thoughts.filter(t => t.id !== id),
      connections: state.connections.filter(c => c.source !== id && c.target !== id),
      selectedThoughtId: state.selectedThoughtId === id ? null : state.selectedThoughtId,
      viewMode: state.selectedThoughtId === id ? 'graph' : state.viewMode,
    }))
    if (thought) get().addCommit(`Deleted "${thought.title}"`, null, 'update')
  },
  
  addConnection: (source, target, type) => {
    const id = `conn-${Date.now()}`
    set(state => ({
      connections: [...state.connections, { id, source, target, type }],
    }))
    const sourceThought = get().thoughts.find(t => t.id === source)
    const targetThought = get().thoughts.find(t => t.id === target)
    if (sourceThought && targetThought) {
      get().addCommit(`Connected "${sourceThought.title}" → "${targetThought.title}"`, source, 'connect')
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
      thoughts: state.thoughts.map(t => t.id === id ? { ...t, starred: !t.starred } : t),
    }))
  },
}))
