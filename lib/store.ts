import { create } from 'zustand'

// Seeded random number generator for consistent SSR/client hydration
function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

// Muted node colors - grayscale with subtle variation
export const NODE_COLORS = {
  gray: '#9ca3af',
  slate: '#94a3b8',
  zinc: '#a1a1aa',
  neutral: '#a3a3a3',
  stone: '#a8a29e',
} as const

export type NodeColor = keyof typeof NODE_COLORS

export interface Folder {
  id: string
  name: string
  icon: string
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

// Activity data for contribution graph (52 weeks x 7 days)
export interface ActivityDay {
  date: Date
  count: number
}

interface Store {
  folders: Folder[]
  thoughts: Thought[]
  connections: Connection[]
  commits: Commit[]
  activity: ActivityDay[]
  selectedThoughtId: string | null
  hoveredThoughtId: string | null
  selectedFolderId: string | null
  
  selectThought: (id: string | null) => void
  hoverThought: (id: string | null) => void
  selectFolder: (id: string | null) => void
  toggleFolder: (id: string) => void
  addThought: (thought: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateThought: (id: string, updates: Partial<Thought>) => void
  deleteThought: (id: string) => void
  addConnection: (source: string, target: string, type: Connection['type']) => void
  addCommit: (message: string, thoughtId?: string | null, type?: Commit['type']) => void
  toggleStar: (id: string) => void
}

function generateSampleData() {
  const random = createSeededRandom(42)
  const colorKeys = Object.keys(NODE_COLORS) as NodeColor[]
  
  const folders: Folder[] = [
    { id: 'folder-ml', name: 'Machine Learning', icon: 'brain', isExpanded: true },
    { id: 'folder-philosophy', name: 'Philosophy', icon: 'scroll', isExpanded: false },
    { id: 'folder-design', name: 'Design Systems', icon: 'palette', isExpanded: false },
    { id: 'folder-productivity', name: 'Productivity', icon: 'zap', isExpanded: false },
    { id: 'folder-writing', name: 'Writing', icon: 'pen', isExpanded: false },
    { id: 'folder-music', name: 'Music Theory', icon: 'music', isExpanded: false },
    { id: 'folder-misc', name: 'Miscellaneous', icon: 'box', isExpanded: false },
  ]
  
  const thoughtData: Record<string, string[]> = {
    'folder-ml': [
      'Neural network intuitions', 'Transformer architecture', 'Attention mechanisms',
      'Gradient descent visualization', 'Loss functions', 'Backpropagation',
      'Embeddings and vector spaces', 'Feature engineering', 'Model compression',
      'Transfer learning patterns', 'Few-shot learning', 'Reinforcement learning basics',
      'GANs and generative models', 'Diffusion models', 'LLM prompting strategies',
      'Fine-tuning approaches', 'RAG architectures', 'Agent systems'
    ],
    'folder-philosophy': [
      'Consciousness theories', 'Free will paradox', 'Ethics of AI',
      'Epistemology notes', 'Phenomenology intro', 'Mind-body problem',
      'Determinism vs chaos', 'Emergence patterns', 'Systems thinking',
      'Complexity and simplicity', 'Reductionism limits', 'Holistic approaches',
      'Eastern philosophy', 'Stoic principles'
    ],
    'folder-design': [
      'Color theory fundamentals', 'Typography scales', 'Spacing systems',
      'Component architecture', 'Design tokens', 'Accessibility patterns',
      'Motion design principles', 'Dark mode strategies', 'Responsive patterns',
      'Icon design rules', 'Grid systems', 'Visual hierarchy',
      'Brand consistency', 'Design documentation', 'Figma workflows', 'CSS architecture'
    ],
    'folder-productivity': [
      'Deep work strategies', 'Time blocking', 'Energy management',
      'Note-taking systems', 'Spaced repetition', 'Second brain concepts',
      'GTD methodology', 'Pomodoro variations', 'Focus environments',
      'Digital minimalism', 'Attention economy', 'Flow states'
    ],
    'folder-writing': [
      'Show dont tell', 'Voice and tone', 'Narrative structures',
      'Editing techniques', 'Research methods', 'Outline strategies',
      'Writing rituals', 'Feedback loops', 'Publishing workflows',
      'Technical writing', 'Storytelling patterns', 'Audience analysis',
      'Content strategy', 'SEO for writers', 'Newsletter growth'
    ],
    'folder-music': [
      'Chord progressions', 'Modal interchange', 'Voice leading',
      'Rhythm patterns', 'Harmonic analysis', 'Melodic contour',
      'Song structure', 'Production techniques', 'Sound design basics', 'Mixing fundamentals'
    ],
    'folder-misc': [
      'Coffee brewing methods', 'Book recommendations', 'Travel notes',
      'Recipe ideas', 'Fitness tracking', 'Language learning',
      'Meditation practice', 'Sleep optimization', 'Reading strategies',
      'Journaling prompts', 'Gift ideas', 'Home organization',
      'Plant care', 'Photography tips', 'Podcast notes'
    ]
  }
  
  const thoughts: Thought[] = []
  const connections: Connection[] = []
  const commits: Commit[] = []
  
  let thoughtIndex = 0
  const thoughtsByFolder: Record<string, string[]> = {}
  const baseDate = new Date('2026-04-01T12:00:00Z').getTime()
  
  // Create thoughts
  Object.entries(thoughtData).forEach(([folderId, titles]) => {
    thoughtsByFolder[folderId] = []
    
    titles.forEach((title) => {
      const id = `thought-${thoughtIndex++}`
      thoughtsByFolder[folderId].push(id)
      
      const color = colorKeys[Math.floor(random() * colorKeys.length)]
      const createdOffset = Math.floor(random() * 60) * 24 * 60 * 60 * 1000
      const updatedOffset = Math.floor(random() * 14) * 24 * 60 * 60 * 1000
      
      thoughts.push({
        id,
        folderId,
        title,
        content: `Exploring ${title.toLowerCase()}. This thought connects various concepts and ideas worth developing further.`,
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
    const numCross = Math.floor(folderThoughts.length * 0.2)
    
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
  
  // Generate activity data (last 52 weeks)
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
  
  selectThought: (id) => set({ selectedThoughtId: id }),
  hoverThought: (id) => set({ hoveredThoughtId: id }),
  selectFolder: (id) => set({ selectedFolderId: id }),
  toggleFolder: (id) => set(state => ({
    folders: state.folders.map(f => f.id === id ? { ...f, isExpanded: !f.isExpanded } : f)
  })),
  
  addThought: (thought) => {
    const id = `thought-${Date.now()}`
    const now = new Date()
    set(state => ({
      thoughts: [...state.thoughts, { ...thought, id, createdAt: now, updatedAt: now }],
      activity: state.activity.map((a, i) => 
        i === state.activity.length - 1 ? { ...a, count: a.count + 1 } : a
      ),
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
    if (thought) get().addCommit(`Updated "${thought.title}"`, id, 'update')
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
      get().addCommit(`Connected "${sourceThought.title}" to "${targetThought.title}"`, source, 'connect')
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
