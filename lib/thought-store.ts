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

const NODE_COLORS = [
  'var(--node-blue)',
  'var(--node-purple)',
  'var(--node-orange)',
  'var(--node-cyan)',
  'var(--node-green)',
]

const getRandomColor = () => NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)]

// Initial demo data
const initialThoughts: Thought[] = [
  {
    id: '1',
    title: 'Graph-based thinking',
    content: 'Traditional note-taking is linear. But thoughts are connected in networks. A graph-based approach mirrors how we actually think.',
    x: 400,
    y: 300,
    color: 'var(--node-blue)',
    tags: ['concept', 'core'],
    starred: true,
    isDraft: false,
    comments: [
      { id: 'c1', content: 'This is the foundational concept', timestamp: new Date('2024-01-15') }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'Knowledge connections',
    content: 'Every idea exists in relation to others. Explicit connections help surface unexpected relationships.',
    x: 600,
    y: 200,
    color: 'var(--node-purple)',
    tags: ['concept'],
    starred: false,
    isDraft: false,
    comments: [],
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: '3',
    title: 'Thread-based history',
    content: 'Like git commits for thoughts. Track how an idea evolves over time with a thread of comments.',
    x: 250,
    y: 180,
    color: 'var(--node-orange)',
    tags: ['feature'],
    starred: false,
    isDraft: false,
    comments: [
      { id: 'c2', content: 'Inspired by GitHub issues', timestamp: new Date('2024-01-17') },
      { id: 'c3', content: 'Could also support reactions', timestamp: new Date('2024-01-18') }
    ],
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '4',
    title: 'Visual exploration',
    content: 'The graph view allows for serendipitous discovery. Zoom, pan, and explore the constellation of your thoughts.',
    x: 500,
    y: 450,
    color: 'var(--node-cyan)',
    tags: ['feature', 'ux'],
    starred: true,
    isDraft: false,
    comments: [],
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: '5',
    title: 'Relationship types',
    content: 'Not all connections are equal. Support, contradiction, causation - each type adds semantic meaning.',
    x: 700,
    y: 400,
    color: 'var(--node-green)',
    tags: ['feature'],
    starred: false,
    isDraft: true,
    comments: [],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
]

const initialEdges: Edge[] = [
  { id: 'e1', source: '1', target: '2', type: 'relates' },
  { id: 'e2', source: '1', target: '3', type: 'supports' },
  { id: 'e3', source: '2', target: '5', type: 'causes' },
  { id: 'e4', source: '1', target: '4', type: 'relates' },
  { id: 'e5', source: '4', target: '5', type: 'relates' },
]

export const useThoughtStore = create<ThoughtState>((set, get) => ({
  thoughts: initialThoughts,
  edges: initialEdges,
  selectedThoughtId: null,
  isCreatingThought: false,
  focusedClusterId: null,
  
  addThought: (thoughtData) => {
    const id = `thought-${Date.now()}`
    const now = new Date()
    const newThought: Thought = {
      ...thoughtData,
      id,
      comments: [],
      createdAt: now,
      updatedAt: now,
      color: thoughtData.color || getRandomColor(),
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
